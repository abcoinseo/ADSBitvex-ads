import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
// Fix: Corrected the import path for AdminService
import { AdminService, PendingWithdrawal } from '../../shared/navbar/admin.service';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service'; // Import DataService

@Component({
  selector: 'app-manage-withdrawals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-withdrawals.component.html',
  styleUrl: './manage-withdrawals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageWithdrawalsComponent {
  private adminService = inject(AdminService);
  private dataService = inject(DataService); // Inject DataService
  allWithdrawals = signal<PendingWithdrawal[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Computed signals for counts, fixing template parser error
  pendingWithdrawalsCount = computed(() => this.allWithdrawals().filter(wd => wd.status === 'pending').length);
  approvedWithdrawalsCount = computed(() => this.allWithdrawals().filter(wd => wd.status === 'approved').length);
  rejectedWithdrawalsCount = computed(() => this.allWithdrawals().filter(wd => wd.status === 'rejected').length);
  allWithdrawalsCount = computed(() => this.allWithdrawals().length);

  // Filtered withdrawals based on selectedFilter
  filteredWithdrawals = computed(() => {
    const filter = this.selectedFilter();
    if (filter === 'all') {
      return this.allWithdrawals();
    } else {
      return this.allWithdrawals().filter(wd => wd.status === filter);
    }
  });

  constructor() {
    // Fix: Ensured adminService is typed correctly by fixing AdminService import
    this.adminService.getAllWithdrawals().subscribe({
      next: (withdrawals) => {
        this.allWithdrawals.set(withdrawals);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load withdrawals.');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  applyFilter(filter: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.selectedFilter.set(filter);
  }

  async approveWithdrawal(withdrawal: PendingWithdrawal): Promise<void> { // Accept full withdrawal object
    if (confirm(`Are you sure you want to approve this withdrawal of $${withdrawal.amount} to ${withdrawal.userAddressOrId}?`)) {
      try {
        // Fix: Ensured adminService is typed correctly by fixing AdminService import
        await this.adminService.updateWithdrawalStatus(withdrawal.id!, 'approved');

        // Deduct from publisher's balance
        const currentBalance = await this.dataService.get<number>(`users/${withdrawal.userId}/balance`);
        const newBalance = (currentBalance ?? 0) - withdrawal.amount;
        if (newBalance < 0) {
          console.warn(`Attempted to withdraw more than available for user ${withdrawal.userId}. Balance would be negative. Funds might have been previously withdrawn manually.`);
          // This scenario might occur if admin manually sends funds before updating status,
          // or if balance was low. For safety, we allow it to go negative here,
          // but a real-world system might block or alert.
        }
        await this.dataService.set(`users/${withdrawal.userId}/balance`, newBalance);

        console.log('Withdrawal approved:', withdrawal.id);
      } catch (error: any) {
        this.error.set(error.message || 'Failed to approve withdrawal.');
        console.error(error);
      }
    }
  }

  async rejectWithdrawal(withdrawalId: string): Promise<void> {
    if (confirm('Are you sure you want to reject this withdrawal?')) {
      try {
        // Fix: Ensured adminService is typed correctly by fixing AdminService import
        await this.adminService.updateWithdrawalStatus(withdrawalId, 'rejected');
        // TODO: If a pre-deduction mechanism is added, this section would need logic to refund the deducted amount if rejected.
        console.log('Withdrawal rejected:', withdrawalId);
      } catch (error: any) {
        this.error.set(error.message || 'Failed to reject withdrawal.');
        console.error(error);
      }
    }
  }
}