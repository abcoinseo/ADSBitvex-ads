import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private authService = inject(AuthService); // Fix: Added missing AuthService injection

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  async onSubmit() {
    this.errorMessage.set(null);
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }
    this.loading.set(true);
    try {
      await this.authService.login(this.loginForm.value.email!, this.loginForm.value.password!);
      // Navigation handled by auth service
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Login failed. Please check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}