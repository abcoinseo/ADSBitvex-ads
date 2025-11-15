import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  authService = inject(AuthService);
  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  currentUser = this.authService.currentUser;
  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  userRole = this.authService.userRole;

  getDashboardLink(): string {
    const role = this.userRole();
    if (role === 'admin') return '/admin';
    if (role === 'advertiser') return '/advertiser';
    if (role === 'publisher') return '/publisher';
    return '/login'; // Default if not logged in or role not set
  }
}