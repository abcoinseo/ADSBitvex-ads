import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
// Fix: Corrected the import path for AdminService
import { AdminService, PendingDeposit } from '../../shared/navbar/admin.service';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service'; // Import DataService

@Component({
  selector: 'app-manage-deposits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-deposits.component.html',
  styleUrl: './manage-deposits.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageDepositsComponent {
  private adminService = inject(AdminService);
  private dataService = inject(DataService); // Inject DataService
  allDeposits = signal<PendingDeposit[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Computed signals for counts, fixing template parser error
  pendingDepositsCount = computed(() => this.allDeposits().filter(dep => dep.status === 'pending').length);
  approvedDepositsCount = computed(() => this.allDeposits().filter(dep => dep.status === 'approved').length);
  rejectedDepositsCount = computed(() => this.allDeposits().filter(dep => dep.status === 'rejected').length);
  allDepositsCount = computed(() => this.allDeposits().length);

  // Filtered deposits based on selectedFilter
  filteredDeposits = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'all') {
      return this.allDeposits();
    } else {
      return this.allDeposits().filter(dep => dep.status === filter);
    }
  });

  constructor() {
    // Fix: Ensured adminService is typed correctly by fixing AdminService import
    this.adminService.getAllDeposits().subscribe({
      next: (deposits) => {
        this.allDeposits.set(deposits);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load deposits.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  applyFilter(filter: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.selectedFilter.set(filter);
  }

  async approveDeposit(deposit: PendingDeposit): Promise<void> { // Accept full deposit object
    if (confirm(`Are you sure you want to approve this deposit of $${deposit.amount}?`)) {
      try {
        // Fix: Ensured adminService is typed correctly by fixing AdminService import
        await this.adminService.updateDepositStatus(deposit.id!, 'approved');

        // Update advertiser's balance (amount + rewardAmount)
        const currentBalance = await this.dataService.get<number>(`users/${deposit.userId}/balance`);
        const newBalance = (currentBalance ?? 0) + deposit.amount + deposit.rewardAmount;
        await this.dataService.set(`users/${deposit.userId}/balance`, newBalance);

        console.log('Deposit approved:', deposit.id, `Amount: ${deposit.amount}, Reward: ${deposit.rewardAmount}`);
      } catch (error: any) {
        this.error.set(error.message || 'Failed to approve deposit.');
        console.error(error);
      }
    }
  }

  async rejectDeposit(depositId: string): Promise<void> {
    if (confirm('Are you sure you want to reject this deposit?')) {
      try {
        // Fix: Ensured adminService is typed correctly by fixing AdminService import
        await this.adminService.updateDepositStatus(depositId, 'rejected');
        console.log('Deposit rejected:', depositId);
      } catch (error: any) {
        this.error.set(error.message || 'Failed to reject deposit.');
        console.error(error);
      }
    }
  }
}