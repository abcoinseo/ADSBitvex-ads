import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Campaign, CampaignService } from '../../services/campaign.service';
import { AppService, PublisherApp } from '../../services/app.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
// Correct import for operators
import { filter, map, take } from 'rxjs/operators'; // Add take here
import { firstValueFrom, of } from 'rxjs'; // Import firstValueFrom
import { AdminService } from '../../components/shared/navbar/admin.service'; // Import AdminService
import { DataService } from '../../services/data.service'; // Import DataService

@Component({
  selector: 'app-ads-display',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './ads-display.component.html',
  styleUrl: './ads-display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsDisplayComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private campaignService = inject(CampaignService);
  private appService = inject(AppService);
  private adminService = inject(AdminService); // Inject AdminService
  private dataService = inject(DataService); // Inject DataService

  appId = toSignal(this.route.paramMap.pipe(
    filter(params => params.has('appId')),
    map(params => params.get('appId') as string)
  ));

  publisherApp = signal<PublisherApp | null>(null);
  currentAd = signal<Campaign | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  parentOrigin = signal<string | null>(null); // New signal to store parent's origin

  // State for reward countdown
  isButtonDisabled = signal<boolean>(true);
  countdown = signal<number>(15);
  showRewardMessage = signal<boolean>(false);
  private countdownInterval: any;

  private allActiveCampaigns = toSignal(this.campaignService.getCampaignsForAdDisplay(), { initialValue: [] });
  publisherSettings = toSignal(this.adminService.getPublisherSettings(), { initialValue: null }); // Fetch global publisher settings

  constructor() {
    effect(() => {
      const currentAppId = this.appId();
      if (currentAppId) {
        this.loadAd(currentAppId);
      } else {
        const errorMessage = 'No App ID provided for ad display.';
        this.error.set(errorMessage);
        this.loading.set(false);
        this.postMessageToParent('adsbitvex-ad-error', { appId: currentAppId, error: errorMessage });
      }
    });

    // Extract parentOrigin from query params
    this.route.queryParamMap.pipe(
      filter(params => params.has('parentOrigin')),
      map(params => params.get('parentOrigin') as string),
      take(1) // Only need the first value
    ).subscribe(origin => {
      this.parentOrigin.set(decodeURIComponent(origin));
    });
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private postMessageToParent(type: string, payload: any): void {
    if (window.parent && this.parentOrigin()) {
      window.parent.postMessage({ type, ...payload }, this.parentOrigin()!);
    } else if (window.parent) {
      // Fallback if parentOrigin is not available (shouldn't happen with correct script embed)
      console.warn('AdsDisplayComponent: parentOrigin not set. Using "*" for postMessage targetOrigin. This is less secure.');
      window.parent.postMessage({ type, ...payload }, '*');
    }
  }

  private startCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.isButtonDisabled.set(true);
    this.countdown.set(15);
    this.showRewardMessage.set(true);

    this.countdownInterval = setInterval(() => {
      this.countdown.update(val => val - 1);
      if (this.countdown() <= 0) {
        clearInterval(this.countdownInterval);
        this.isButtonDisabled.set(false);
        // this.showRewardMessage.set(false); // Keep showing "Click to get the reward!"
      }
    }, 1000);
  }

  async loadAd(appId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.currentAd.set(null);
    this.isButtonDisabled.set(true); // Ensure button starts disabled

    try {
      const app = await firstValueFrom(this.appService.getAppById(appId).pipe(take(1)));
      if (!app) {
        const errorMessage = 'Publisher app not found for this ID.';
        this.error.set(errorMessage);
        this.loading.set(false);
        this.postMessageToParent('adsbitvex-ad-error', { appId: appId, error: errorMessage });
        return;
      }
      this.publisherApp.set(app);

      const allCampaigns = this.allActiveCampaigns();
      if (allCampaigns.length === 0) {
        const errorMessage = 'No active campaigns available for display.';
        this.error.set(errorMessage);
        this.loading.set(false);
        this.postMessageToParent('adsbitvex-ad-error', { appId: appId, error: errorMessage });
        return;
      }

      const eligibleCampaignsWithWeights: Array<{ campaign: Campaign; weight: number }> = [];

      for (const campaign of allCampaigns) {
        // Fetch advertiser balance for each campaign.
        const advertiserBalance = await firstValueFrom(this.dataService.listen<number>(`users/${campaign.advertiserId}/balance`).pipe(take(1)));
        const currentBalance = advertiserBalance ?? 0;

        // A campaign is eligible if it has a CPC bid and the advertiser can afford it.
        const isCpcAffordable = campaign.cpcBid > 0 && currentBalance >= campaign.cpcBid;

        if (isCpcAffordable) {
          // Use the CPC bid as the weight directly, prioritizing higher bids.
          const weight = campaign.cpcBid;
          eligibleCampaignsWithWeights.push({ campaign, weight });
        }
        // Campaigns without an affordable CPC bid are not considered for display under this weighted selection logic.
      }

      if (eligibleCampaignsWithWeights.length === 0) {
        const errorMessage = 'No campaigns found that meet CPC bid and budget criteria.';
        this.error.set(errorMessage);
        this.loading.set(false);
        this.postMessageToParent('adsbitvex-ad-error', { appId: appId, error: errorMessage });
        return;
      }

      // Perform weighted random selection
      const totalWeight = eligibleCampaignsWithWeights.reduce((sum, item) => sum + item.weight, 0);
      let rand = Math.random() * totalWeight;
      let selectedAd: Campaign | null = null;

      for (const item of eligibleCampaignsWithWeights) {
        rand -= item.weight;
        if (rand <= 0) {
          selectedAd = item.campaign;
          break;
        }
      }

      if (selectedAd) {
        this.currentAd.set(selectedAd);
        this.startCountdown();

        // Increment impression count for selected ad if it's a CPM-based campaign and not exhausted.
        // This is primarily for tracking campaign goals; actual billing occurs on click.
        if (selectedAd.cpm > 0 && selectedAd.currentImpressions < selectedAd.totalImpressions) {
          await this.campaignService.incrementCampaignImpressions(selectedAd.id!);
        }
        this.postMessageToParent('adsbitvex-ad-loaded', { appId: appId, campaignId: selectedAd.id });
      } else {
        // This case should ideally not be reached if eligibleCampaignsWithWeights is not empty
        const errorMessage = 'Internal error: No ad selected despite eligible campaigns.';
        this.error.set(errorMessage);
        this.postMessageToParent('adsbitvex-ad-error', { appId: appId, error: errorMessage });
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load ad.';
      this.error.set(errorMessage);
      console.error('Ad load error:', err);
      this.postMessageToParent('adsbitvex-ad-error', { appId: appId, error: errorMessage });
    } finally {
      this.loading.set(false);
    }
  }

  async onAdClick(): Promise<void> {
    const ad = this.currentAd();
    const app = this.publisherApp();
    // Use optional chaining for publisherSettings and default to 0 if null
    const publisherCpcRate = this.publisherSettings()?.cpcRate ?? 0;

    if (this.isButtonDisabled()) {
      return; // Prevent click if button is disabled
    }

    if (ad && ad.buttonUrl && ad.id && app && app.publisherId) {
      window.open(ad.buttonUrl, '_blank');
      console.log('Ad clicked:', ad.id);

      try {
        await this.campaignService.processAdClick(
          ad.id,
          ad.advertiserId,
          app.publisherId,
          ad.cpcBid,
          publisherCpcRate
        );
        this.postMessageToParent('adsbitvex-ad-click', { appId: this.appId(), campaignId: ad.id });
      } catch (error) {
        console.error('Error processing ad click transaction:', error);
        this.error.set('Failed to process ad click.');
        this.postMessageToParent('adsbitvex-ad-error', { appId: this.appId(), campaignId: ad.id, error: 'Failed to process click transaction' });
      }
    }
  }
}