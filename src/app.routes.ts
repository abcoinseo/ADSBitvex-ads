import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

// Auth guard function
const authGuard = () => {
  const authService = inject(AuthService);
  return toObservable(authService.currentUser).pipe(
    map(user => !!user || authService.redirectToLogin())
  );
};

// Role guard function
const roleGuard = (requiredRole: 'advertiser' | 'publisher' | 'admin') => {
  const authService = inject(AuthService);
  return toObservable(authService.userRole).pipe(
    map(role => {
      if (role === requiredRole) {
        return true;
      }
      authService.redirectToDashboard(role); // Redirect to appropriate dashboard or login
      return false;
    })
  );
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/landing-page/landing-page.component').then(m => m.LandingPageComponent) },
  { path: 'login', loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'ads/:appId', loadComponent: () => import('./components/ads-display/ads-display.component').then(m => m.AdsDisplayComponent) },

  // Advertiser Routes
  {
    path: 'advertiser',
    canActivate: [authGuard, () => roleGuard('advertiser')],
    loadComponent: () => import('./components/advertiser/advertiser-dashboard/advertiser-dashboard.component').then(m => m.AdvertiserDashboardComponent),
  },
  {
    path: 'advertiser/create-campaign',
    canActivate: [authGuard, () => roleGuard('advertiser')],
    loadComponent: () => import('./components/advertiser/create-campaign/create-campaign.component').then(m => m.CreateCampaignComponent),
  },
  {
    path: 'advertiser/deposit',
    canActivate: [authGuard, () => roleGuard('advertiser')],
    loadComponent: () => import('./components/advertiser/deposit-funds/deposit-funds.component').then(m => m.DepositFundsComponent),
  },

  // Publisher Routes
  {
    path: 'publisher',
    canActivate: [authGuard, () => roleGuard('publisher')],
    loadComponent: () => import('./components/publisher/publisher-dashboard/publisher-dashboard.component').then(m => m.PublisherDashboardComponent),
  },
  {
    path: 'publisher/add-app',
    canActivate: [authGuard, () => roleGuard('publisher')],
    loadComponent: () => import('./components/publisher/add-app/add-app.component').then(m => m.AddAppComponent),
  },
  {
    path: 'publisher/withdraw',
    canActivate: [authGuard, () => roleGuard('publisher')],
    loadComponent: () => import('./components/publisher/withdraw-funds/withdraw-funds.component').then(m => m.WithdrawFundsComponent),
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard, () => roleGuard('admin')],
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    children: [
      { path: '', redirectTo: 'deposits', pathMatch: 'full' },
      {
        path: 'deposit-options',
        loadComponent: () => import('./components/admin/deposit-options/deposit-options.component').then(m => m.DepositOptionsComponent),
      },
      {
        path: 'withdrawal-options',
        loadComponent: () => import('./components/admin/withdrawal-options/withdrawal-options.component').then(m => m.WithdrawalOptionsComponent),
      },
      {
        path: 'manage-deposits',
        loadComponent: () => import('./components/admin/manage-deposits/manage-deposits.component').then(m => m.ManageDepositsComponent),
      },
      {
        path: 'manage-withdrawals',
        loadComponent: () => import('./components/admin/manage-withdrawals/manage-withdrawals.component').then(m => m.ManageWithdrawalsComponent),
      },
      {
        path: 'publisher-settings',
        loadComponent: () => import('./components/admin/publisher-settings/publisher-settings.component').then(m => m.PublisherSettingsComponent),
      },
      {
        path: 'seo-settings',
        loadComponent: () => import('./components/admin/seo-settings/seo-settings.component').then(m => m.SeoSettingsComponent),
      },
    ]
  },

  { path: '**', redirectTo: '' } // Redirect unknown paths to home
];