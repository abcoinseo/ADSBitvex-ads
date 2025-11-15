
import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSnapshot } from 'firebase/database';

export interface PublisherApp {
  id?: string;
  publisherId: string;
  name: string;
  url: string; // App/website URL where ads will be shown
  botLink?: string; // Telegram bot link, if applicable
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class AppService {
  private dataService = inject(DataService);

  async addApp(app: Omit<PublisherApp, 'id' | 'createdAt'>, publisherId: string): Promise<string | null> {
    const newApp: PublisherApp = {
      ...app,
      publisherId: publisherId,
      createdAt: Date.now()
    };
    return this.dataService.push('publisherApps', newApp);
  }

  getPublisherApps(publisherId: string): Observable<PublisherApp[]> {
    return this.dataService.listen('publisherApps').pipe(
      map(snapshot => {
        const allApps = this.dataService.snapshotToArray<PublisherApp>(snapshot as DataSnapshot);
        return allApps.filter(app => app.publisherId === publisherId);
      })
    );
  }

  getAppById(appId: string): Observable<PublisherApp | null> {
    return this.dataService.listen(`publisherApps/${appId}`);
  }

  async updateApp(appId: string, data: Partial<PublisherApp>): Promise<void> {
    await this.dataService.update(`publisherApps/${appId}`, data);
  }

  async deleteApp(appId: string): Promise<void> {
    await this.dataService.remove(`publisherApps/${appId}`);
  }
}
