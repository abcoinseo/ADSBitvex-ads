import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, WithdrawalOption } from '../../shared/navbar/admin.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-withdrawal-options',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './withdrawal-options.component.html',
  styleUrl: './withdrawal-options.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawalOptionsComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);

  withdrawalOptions = toSignal(this.adminService.getWithdrawalOptions(), { initialValue: [] });

  withdrawalOptionForm = this.fb.group({
    id: [''], // Hidden field for editing
    name: ['', Validators.required],
    description: ['', Validators.required], // Added
    minAmount: [0, [Validators.required, Validators.min(0.01)]],
    maxAmount: [0, [Validators.required, Validators.min(0.01)]],
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.withdrawalOptionForm.markAllAsTouched(); // Mark all touched for immediate validation feedback

    if (this.withdrawalOptionForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    this.loading.set(true);
    const { id, ...optionData } = this.withdrawalOptionForm.value;

    if (this.isEditing() && id) {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.updateWithdrawalOption(id, optionData as Partial<WithdrawalOption>).then(() => {
        this.successMessage.set('Withdrawal option updated successfully!');
        this.resetForm();
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to update option.');
      }).finally(() => {
        this.loading.set(false);
      });
    } else {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.addWithdrawalOption(optionData as Omit<WithdrawalOption, 'id'>).then(() => {
        this.successMessage.set('Withdrawal option added successfully!');
        this.resetForm();
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to add option.');
      }).finally(() => {
        this.loading.set(false);
      });
    }
  }

  editOption(option: WithdrawalOption): void {
    this.isEditing.set(true);
    this.withdrawalOptionForm.patchValue(option);
  }

  deleteOption(id: string): void {
    if (confirm('Are you sure you want to delete this withdrawal option? This action cannot be undone.')) {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.deleteWithdrawalOption(id).then(() => {
        this.successMessage.set('Withdrawal option deleted successfully!');
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to delete option.');
      });
    }
  }

  resetForm(): void {
    this.withdrawalOptionForm.reset({ id: '', name: '', description: '', minAmount: 0, maxAmount: 0 });
    this.isEditing.set(false);
    this.loading.set(false);
  }
}