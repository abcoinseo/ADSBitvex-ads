import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSnapshot } from 'firebase/database';

export interface Campaign {
  id?: string;
  advertiserId: string;
  title: string;
  description: string;
  totalImpressions: number;
  currentImpressions: number;
  currentClicks: number; // New: Track clicks
  adBannerUrl: string; // URL to the ad image
  buttonText: string;
  buttonUrl: string;
  cpm: number; // Cost Per 1000 Impressions, e.g., $1
  cpcBid: number; // New: Cost Per Click (Advertiser's bid)
  status: 'active' | 'paused' | 'completed';
  createdAt: number;
}

// Define a type for the data expected from the campaign creation form
type CampaignFormData = Pick<
  Campaign,
  'title' | 'description' | 'totalImpressions' | 'adBannerUrl' | 'buttonText' | 'buttonUrl' | 'cpcBid'
>;

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private dataService = inject(DataService);

  async createCampaign(campaignData: CampaignFormData, advertiserId: string): Promise<string | null> {
    const newCampaign: Campaign = {
      ...campaignData,
      advertiserId: advertiserId,
      currentImpressions: 0,
      currentClicks: 0, // Initialize clicks
      status: 'active',
      createdAt: Date.now(),
      // Fix: Set cpm to a default value as it's not provided by the form data.
      cpm: 1, // Default CPM, as it's not part of CampaignFormData
      // cpcBid is already present from campaignData
    };
    return this.dataService.push('campaigns', newCampaign);
  }

  getAdvertiserCampaigns(advertiserId: string): Observable<Campaign[]> {
    return this.dataService.listen('campaigns').pipe(
      map(snapshot => {
        const allCampaigns = this.dataService.snapshotToArray<Campaign>(snapshot as DataSnapshot);
        return allCampaigns.filter(c => c.advertiserId === advertiserId);
      })
    );
  }

  getCampaignById(campaignId: string): Observable<Campaign | null> {
    return this.dataService.listen(`campaigns/${campaignId}`);
  }

  async updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<void> {
    await this.dataService.update(`campaigns/${campaignId}`, data);
  }

  async incrementCampaignImpressions(campaignId: string): Promise<void> {
    const campaign = await this.dataService.get<Campaign>(`campaigns/${campaignId}`);
    if (campaign) {
      const newImpressions = (campaign.currentImpressions || 0) + 1;
      await this.dataService.update(`campaigns/${campaignId}`, { currentImpressions: newImpressions });
    }
  }

  async processAdClick(
    campaignId: string,
    advertiserId: string,
    publisherId: string,
    cpcBid: number, // Cost advertiser pays
    publisherCpcRate: number // Amount publisher earns
  ): Promise<void> {
    try {
      // 1. Increment campaign clicks
      const campaign = await this.dataService.get<Campaign>(`campaigns/${campaignId}`);
      if (campaign) {
        const newClicks = (campaign.currentClicks || 0) + 1;
        await this.dataService.update(`campaigns/${campaignId}`, { currentClicks: newClicks });
      }

      // 2. Deduct from advertiser's balance
      const advertiserBalance = await this.dataService.get<number>(`users/${advertiserId}/balance`);
      const newAdvertiserBalance = (advertiserBalance ?? 0) - cpcBid;
      await this.dataService.set(`users/${advertiserId}/balance`, newAdvertiserBalance);

      // 3. Add to publisher's balance
      const publisherBalance = await this.dataService.get<number>(`users/${publisherId}/balance`);
      const newPublisherBalance = (publisherBalance ?? 0) + publisherCpcRate;
      await this.dataService.set(`users/${publisherId}/balance`, newPublisherBalance);

      console.log(`Ad click processed: Campaign ${campaignId}, Advertiser ${advertiserId} paid $${cpcBid}, Publisher ${publisherId} earned $${publisherCpcRate}`);
    } catch (error) {
      console.error('Error processing ad click:', error);
      throw error; // Re-throw to be handled by the component
    }
  }

  // This would be for the ad display component to fetch active campaigns for a given app
  getCampaignsForAdDisplay(): Observable<Campaign[]> {
    return this.dataService.listen('campaigns').pipe(
      map(snapshot => {
        const allCampaigns = this.dataService.snapshotToArray<Campaign>(snapshot as DataSnapshot);
        // Filter for active campaigns that still have impressions or clicks left
        // A campaign is eligible if it's active AND (has remaining impressions OR has a CPC bid greater than 0)
        return allCampaigns.filter(c =>
          c.status === 'active' && ((c.currentImpressions < c.totalImpressions && c.cpm > 0) || c.cpcBid > 0)
        );
      })
    );
  }
}