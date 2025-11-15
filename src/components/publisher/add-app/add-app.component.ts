import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppService } from '../../../services/app.service';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-app',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-app.component.html',
  styleUrl: './add-app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAppComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private appService = inject(AppService);
  private authService = inject(AuthService);
  private router = inject(Router);

  userProfile = this.authService.userProfile;

  appForm = this.fb.group({
    name: ['', Validators.required],
    url: ['', [Validators.required, Validators.pattern('^(http|https)://[^ "]+$')]],
    botLink: ['', [Validators.pattern('^(http|https)://[^ "]+$')]], // Optional
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  async onSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    if (this.appForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    const publisherId = this.userProfile()?.uid;
    if (!publisherId) {
      this.errorMessage.set('User not authenticated. Please log in.');
      return;
    }

    this.loading.set(true);
    try {
      const newAppId = await this.appService.addApp(this.appForm.value, publisherId);
      if (newAppId) {
        this.successMessage.set('App added successfully!');
        this.appForm.reset({ name: '', url: '', botLink: '' });
        setTimeout(() => this.router.navigate(['/publisher']), 2000);
      } else {
        this.errorMessage.set('Failed to add app. Please try again.');
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An unexpected error occurred.');
    } finally {
      this.loading.set(false);
    }
  }
}