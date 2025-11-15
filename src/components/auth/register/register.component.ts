import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['advertiser', [Validators.required]], // Default role
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['role'] === 'advertiser' || params['role'] === 'publisher') {
        this.registerForm.controls.role.setValue(params['role']);
      }
    });
  }

  async onSubmit() {
    this.errorMessage.set(null);
    if (this.registerForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }
    this.loading.set(true);
    try {
      await this.authService.register(
        this.registerForm.value.email!,
        this.registerForm.value.password!,
        this.registerForm.value.role as 'advertiser' | 'publisher'
      );
      // Navigation handled by auth service
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}