import { Injectable, inject } from '@angular/core';
// Fix: Corrected the import path for DataService
import { DataService } from '../../../services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSnapshot } from 'firebase/database';

export interface DepositOption {
  id?: string;
  name: string;
  description: string; // Added description
  minAmount: number;
  maxAmount: number;
  address: string; // Can be a crypto address, bank info, etc.
  hasReward: boolean; // Added reward flag
  rewardPercentage?: number; // Added reward percentage, optional if hasReward is false
  requiresTrxId: boolean; // Added flag for TRX ID requirement
}

export interface WithdrawalOption {
  id?: string;
  name: string;
  description: string; // Added description
  minAmount: number;
  maxAmount: number;
}

export interface PublisherSettings {
  cpmRate: number; // Cost Per 1000 Impressions
  cpcRate: number; // Cost Per Click (if applicable)
}

export interface SeoSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageUrl: string;
}

export interface PendingDeposit {
  id?: string;
  userId: string;
  userEmail: string;
  depositOptionName: string;
  amount: number;
  rewardAmount: number; // Calculated reward for this deposit
  trxId?: string; // Made optional
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

export interface PendingWithdrawal {
  id?: string;
  userId: string;
  userEmail: string;
  withdrawalOptionName: string;
  amount: number;
  userAddressOrId: string; // New: Address or ID where funds should be sent
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}


@Injectable({ providedIn: 'root' })
export class AdminService {
  private dataService = inject(DataService);

  // Deposit Options
  async addDepositOption(option: Omit<DepositOption, 'id'>): Promise<string | null> {
    return this.dataService.push('admin/depositOptions', option);
  }

  async updateDepositOption(id: string, option: Partial<DepositOption>): Promise<void> {
    await this.dataService.update(`admin/depositOptions/${id}`, option);
  }

  async deleteDepositOption(id: string): Promise<void> {
    await this.dataService.remove(`admin/depositOptions/${id}`);
  }

  getDepositOptions(): Observable<DepositOption[]> {
    return this.dataService.listen('admin/depositOptions').pipe(
      map(snapshot => this.dataService.snapshotToArray<DepositOption>(snapshot as DataSnapshot))
    );
  }

  // Withdrawal Options
  async addWithdrawalOption(option: Omit<WithdrawalOption, 'id'>): Promise<string | null> {
    return this.dataService.push('admin/withdrawalOptions', option);
  }

  async updateWithdrawalOption(id: string, option: Partial<WithdrawalOption>): Promise<void> {
    await this.dataService.update(`admin/withdrawalOptions/${id}`, option);
  }

  async deleteWithdrawalOption(id: string): Promise<void> {
    await this.dataService.remove(`admin/withdrawalOptions/${id}`);
  }

  getWithdrawalOptions(): Observable<WithdrawalOption[]> {
    return this.dataService.listen('admin/withdrawalOptions').pipe(
      map(snapshot => this.dataService.snapshotToArray<WithdrawalOption>(snapshot as DataSnapshot))
    );
  }

  // Publisher Settings
  async updatePublisherSettings(settings: PublisherSettings): Promise<void> {
    await this.dataService.set('admin/publisherSettings', settings);
  }

  getPublisherSettings(): Observable<PublisherSettings | null> {
    return this.dataService.listen('admin/publisherSettings');
  }

  // SEO Settings
  async updateSeoSettings(settings: SeoSettings): Promise<void> {
    await this.dataService.set('admin/seoSettings', settings);
  }

  getSeoSettings(): Observable<SeoSettings | null> {
    return this.dataService.listen('admin/seoSettings');
  }

  // Manage Deposits (Admin View)
  // Renamed from getPendingDeposits to getAllDeposits to allow filtering in component
  getAllDeposits(): Observable<PendingDeposit[]> {
    return this.dataService.listen('deposits').pipe(
      map(snapshot => this.dataService.snapshotToArray<PendingDeposit>(snapshot as DataSnapshot))
    );
  }

  // User-specific Deposit History (Advertiser View)
  getUserDeposits(userId: string): Observable<PendingDeposit[]> {
    return this.dataService.listen('deposits').pipe(
      map(snapshot => {
        const allDeposits = this.dataService.snapshotToArray<PendingDeposit>(snapshot as DataSnapshot);
        return allDeposits.filter(dep => dep.userId === userId);
      })
    );
  }

  async updateDepositStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await this.dataService.update(`deposits/${id}`, { status });
  }

  // Manage Withdrawals (Admin View)
  // Renamed from getPendingWithdrawals to getAllWithdrawals to allow filtering in component
  getAllWithdrawals(): Observable<PendingWithdrawal[]> {
    return this.dataService.listen('withdrawals').pipe(
      map(snapshot => this.dataService.snapshotToArray<PendingWithdrawal>(snapshot as DataSnapshot))
    );
  }

  // User-specific Withdrawal History (Publisher View)
  getUserWithdrawals(userId: string): Observable<PendingWithdrawal[]> {
    return this.dataService.listen('withdrawals').pipe(
      map(snapshot => {
        const allWithdrawals = this.dataService.snapshotToArray<PendingWithdrawal>(snapshot as DataSnapshot);
        return allWithdrawals.filter(wd => wd.userId === userId);
      })
    );
  }

  async updateWithdrawalStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await this.dataService.update(`withdrawals/${id}`, { status });
  }
}