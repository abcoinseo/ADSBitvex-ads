import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AppService, PublisherApp } from '../../../services/app.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop'; // Import toObservable
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service'; // Import DataService
import { filter, map, switchMap } from 'rxjs/operators'; // Import RxJS operators

@Component({
  selector: 'app-publisher-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './publisher-dashboard.component.html',
  styleUrl: './publisher-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublisherDashboardComponent {
  authService = inject(AuthService);
  appService = inject(AppService);
  private dataService = inject(DataService); // Inject DataService

  // Fix: Directly assign authService signals instead of using `toSignal` on already existing signals.
  userProfile = this.authService.userProfile;

  publisherApps = signal<PublisherApp[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Dynamic publisher balance, fetched from Firebase
  publisherBalance = toSignal(
    toObservable(this.authService.userProfile).pipe(
      filter(profile => !!profile?.uid),
      switchMap(profile => this.dataService.listen<number>(`users/${profile!.uid}/balance`)),
      map(balance => balance ?? 0) // Default to 0 if balance doesn't exist yet
    ),
    { initialValue: 0 }
  );

  constructor() {
    this.loadPublisherApps();
  }

  loadPublisherApps(): void {
    // Fix: Access `uid` using optional chaining, type is correctly inferred now.
    const userId = this.userProfile()?.uid;
    if (userId) {
      this.appService.getPublisherApps(userId).subscribe({
        next: (apps) => {
          this.publisherApps.set(apps);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load apps.');
          this.loading.set(false);
          console.error(err);
        },
      });
    } else {
      this.error.set('User not logged in or profile not found.');
      this.loading.set(false);
    }
  }

  getAdScript(appId: string): string {
    // IMPORTANT: This assumes the Angular app is hosted at the root of the domain.
    // If hosted in a subdirectory (e.g., example.com/ads-app/), you'd need to adjust adAppBaseUrl.
    // For the Applet environment, window.location.origin represents the base URL where this applet runs.
    const adAppBaseUrl = window.location.origin;
    const containerId = `adsbitvex-ad-container-${appId}`;

    // The generated script for the publisher's page
    return `
    <!-- AdsBitvex Ad Container for App ID: ${appId} -->
    <!-- Place this div anywhere on your page where you want the ad to appear. -->
    <!-- You can adjust width/height/styles as needed. The iframe will fill this container. -->
    <div id="${containerId}" style="width: 300px; height: 250px; border: 1px solid #e0e0e0; margin: 0 auto; overflow: hidden; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; font-family: sans-serif; color: #666; font-size: 14px;">
      Loading AdsBitvex Ad...
    </div>

    <!-- AdsBitvex Ad Loader Script -->
    <script>
      (function() {
        // Initialize global AdsBitvex object if it doesn't exist
        window.adsbitvex = window.adsbitvex || {};

        /**
         * Dynamically displays an ad in the specified container for a given app ID.
         * @param {string} targetAppId The ID of the publisher's app.
         * @param {string} [targetContainerId] Optional: The ID of the HTML element where the ad iframe should be inserted.
         *                                       If not provided, it defaults to 'adsbitvex-ad-container-{targetAppId}'.
         * @returns {Promise<any>} A promise that resolves with ad details when the ad is loaded, or rejects on error.
         */
        window.adsbitvex.showAd = function(targetAppId, targetContainerId) {
          return new Promise((resolve, reject) => {
            const containerElementId = targetContainerId || 'adsbitvex-ad-container-' + targetAppId;
            const container = document.getElementById(containerElementId);
            if (!container) {
              console.error('AdsBitvex: Ad container not found:', containerElementId);
              return reject(new Error('Ad container with ID "' + containerElementId + '" not found.'));
            }

            container.innerHTML = ''; // Clear existing content (e.g., "Loading Ad...")

            const iframe = document.createElement('iframe');
            // Construct the iframe src using the ad network's base URL and the hash fragment route
            // Also pass the publisher's page origin to the iframe for secure postMessage targetOrigin.
            const publisherOrigin = window.location.origin;
            // Fix: Escape JavaScript template literal variables so they are evaluated at runtime by the browser's JS.
            iframe.src = \`${adAppBaseUrl}/#/ads/\${targetAppId}?parentOrigin=\${encodeURIComponent(publisherOrigin)}\`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.scrolling = 'no'; // Prevent scrollbars
            // Sandbox attributes for security: allow scripts, same origin access for iframe content, popups, forms
            // No 'allow-top-navigation' to prevent iframe from navigating the parent window.
            iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";

            container.appendChild(iframe);

            const messageListener = (event) => {
              // Ensure messages are from the expected AdsBitvex ad origin
              // The iframe will post messages from adAppBaseUrl.
              if (event.origin === '${adAppBaseUrl}' && event.source === iframe.contentWindow) {
                if (event.data && event.data.type === 'adsbitvex-ad-loaded') {
                  console.log('AdsBitvex: Ad loaded successfully for App ID:', targetAppId, 'Campaign ID:', event.data.campaignId);
                  window.removeEventListener('message', messageListener); // Remove listener after resolution
                  resolve(event.data);
                } else if (event.data && event.data.type === 'adsbitvex-ad-error') {
                  console.error('AdsBitvex: Ad failed for App ID:', targetAppId, 'Error:', event.data.error);
                  window.removeEventListener('message', messageListener); // Remove listener after rejection
                  reject(new Error(event.data.error || 'Ad failed to load.'));
                } else if (event.data && event.data.type === 'adsbitvex-ad-click') {
                  console.log('AdsBitvex: Ad clicked for App ID:', targetAppId, 'Campaign ID:', event.data.campaignId);
                  // This message is for tracking clicks, not for resolving the initial promise.
                  // You might want a separate listener or callback for click tracking.
                }
              }
            };
            window.addEventListener('message', messageListener);

            // Optional: Timeout for ad loading
            setTimeout(() => {
                if (!iframe.contentWindow) { // If it hasn't loaded and sent a message yet
                    window.removeEventListener('message', messageListener);
                    reject(new Error('Ad loading timed out for App ID: ' + targetAppId));
                }
            }, 15000); // 15 seconds timeout
          });
        };
      })();
    </script>
    `;
  }

  copyScript(appId: string): void {
    const script = this.getAdScript(appId);
    navigator.clipboard.writeText(script).then(() => {
      alert('Ad script copied to clipboard! Paste it into your website/app HTML.');
    }).catch(err => {
      console.error('Failed to copy script: ', err);
      alert('Failed to copy script. Please try again or copy manually.');
    });
  }
}