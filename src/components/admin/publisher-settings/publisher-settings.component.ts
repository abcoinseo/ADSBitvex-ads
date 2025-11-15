
import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, PublisherSettings } from '../../shared/navbar/admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publisher-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './publisher-settings.component.html',
  styleUrl: './publisher-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublisherSettingsComponent implements OnInit {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);

  publisherSettingsForm = this.fb.group({
    cpmRate: [0, [Validators.required, Validators.min(0.01)]],
    cpcRate: [0, [Validators.required, Validators.min(0)]], // CPC can be 0 if not implemented
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loading.set(true);
    // Fix: Ensured adminService is typed correctly by fixing AdminService import
    this.adminService.getPublisherSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.publisherSettingsForm.patchValue(settings);
        } else {
          // Default values if no settings found
          this.publisherSettingsForm.patchValue({ cpmRate: 1, cpcRate: 0.05 });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load publisher settings.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.publisherSettingsForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    this.loading.set(true);
    try {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      await this.adminService.updatePublisherSettings(this.publisherSettingsForm.value as PublisherSettings);
      this.successMessage.set('Publisher earnings settings updated successfully!');
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to update settings.');
    } finally {
      this.loading.set(false);
    }
  }
}