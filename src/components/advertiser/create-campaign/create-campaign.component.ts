
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CampaignService } from '../../../services/campaign.service';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-campaign.component.html',
  styleUrl: './create-campaign.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCampaignComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private campaignService = inject(CampaignService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userProfile;

  campaignForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    totalImpressions: [1000, [Validators.required, Validators.min(1000)]], // Minimum impressions for $1 CPM
    adBannerUrl: ['https://picsum.photos/400/200', [Validators.required, Validators.pattern('^(http|https)://[^ "]+$')]], // Default banner
    buttonText: ['Learn More', Validators.required],
    buttonUrl: ['', [Validators.required, Validators.pattern('^(http|https)://[^ "]+$')]],
    cpcBid: [0.05, [Validators.required, Validators.min(0.01)]], // New: CPC bid
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.campaignForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    const advertiserId = this.userProfile()?.uid;
    if (!advertiserId) {
      this.errorMessage.set('User not authenticated. Please log in.');
      return;
    }

    this.loading.set(true);
    try {
      const newCampaignId = await this.campaignService.createCampaign(this.campaignForm.value, advertiserId);
      if (newCampaignId) {
        this.successMessage.set('Campaign created successfully!');
        this.campaignForm.reset({
          title: '',
          description: '',
          totalImpressions: 1000,
          adBannerUrl: 'https://picsum.photos/400/200',
          buttonText: 'Learn More',
          buttonUrl: '',
          cpcBid: 0.05,
        });
        setTimeout(() => this.router.navigate(['/advertiser']), 2000);
      } else {
        this.errorMessage.set('Failed to create campaign. Please try again.');
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An unexpected error occurred.');
    } finally {
      this.loading.set(false);
    }
  }
}