import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  authService = inject(AuthService);
  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  currentUser = this.authService.currentUser;
  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  userRole = this.authService.userRole;

  onLogout(): void {
    this.authService.logout();
  }
}