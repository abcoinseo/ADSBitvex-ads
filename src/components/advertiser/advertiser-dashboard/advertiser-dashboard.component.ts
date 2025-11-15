import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Campaign, CampaignService } from '../../../services/campaign.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop'; // Import toObservable
import { CommonModule } from '@angular/common'; // For date pipes
import { DataService } from '../../../services/data.service'; // Import DataService
import { filter, map, switchMap } from 'rxjs/operators'; // Import RxJS operators


@Component({
  selector: 'app-advertiser-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './advertiser-dashboard.component.html',
  styleUrl: './advertiser-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertiserDashboardComponent {
  authService = inject(AuthService);
  campaignService = inject(CampaignService);
  private dataService = inject(DataService); // Inject DataService
  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  userProfile = this.authService.userProfile;

  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Dynamic advertiser balance, fetched from Firebase
  advertiserBalance = toSignal(
    toObservable(this.authService.userProfile).pipe(
      filter(profile => !!profile?.uid),
      switchMap(profile => this.dataService.listen<number>(`users/${profile!.uid}/balance`)),
      map(balance => balance ?? 0) // Default to 0 if balance doesn't exist yet
    ),
    { initialValue: 0 }
  );

  constructor() {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    // Fix: Access `uid` using optional chaining, type is correctly inferred now.
    const userId = this.userProfile()?.uid;
    if (userId) {
      this.campaignService.getAdvertiserCampaigns(userId).subscribe({
        next: (campaigns) => {
          this.campaigns.set(campaigns);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load campaigns.');
          this.loading.set(false);
          console.error(err);
        },
      });
    } else {
      this.error.set('User not logged in or profile not found.');
      this.loading.set(false);
    }
  }

  getProgressBarWidth(campaign: Campaign): string {
    const progress = (campaign.currentImpressions / campaign.totalImpressions) * 100;
    return `${Math.min(progress, 100)}%`;
  }
}