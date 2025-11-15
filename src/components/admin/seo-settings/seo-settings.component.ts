
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, SeoSettings } from '../../shared/navbar/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seo-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './seo-settings.component.html',
  styleUrl: './seo-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoSettingsComponent implements OnInit {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);

  seoSettingsForm = this.fb.group({
    siteTitle: ['', Validators.required],
    metaDescription: ['', Validators.required],
    keywords: ['', Validators.required],
    ogImageUrl: ['', [Validators.required, Validators.pattern('^(http|https)://[^ "]+$')]],
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loading.set(true);
    // Fix: Ensured adminService is typed correctly by fixing AdminService import
    this.adminService.getSeoSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.seoSettingsForm.patchValue(settings);
        } else {
          // Default values if no settings found
          this.seoSettingsForm.patchValue({
            siteTitle: 'AdsBitvex - Ad Network',
            metaDescription: 'AdsBitvex is a leading ad network for Telegram mini-apps and websites. Monetize your content or find new customers.',
            keywords: 'ad network, telegram ads, mini apps, advertising, monetization',
            ogImageUrl: 'https://picsum.photos/1200/630' // Placeholder
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load SEO settings.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.seoSettingsForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    this.loading.set(true);
    try {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      await this.adminService.updateSeoSettings(this.seoSettingsForm.value as SeoSettings);
      this.successMessage.set('SEO settings updated successfully!');
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update settings.');
    } finally {
      this.loading.set(false);
    }
  }
}