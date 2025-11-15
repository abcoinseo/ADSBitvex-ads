import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, DepositOption } from '../../shared/navbar/admin.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deposit-options',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './deposit-options.component.html',
  styleUrl: './deposit-options.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositOptionsComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);

  depositOptions = toSignal(this.adminService.getDepositOptions(), { initialValue: [] });

  depositOptionForm = this.fb.group({
    id: [''], // Hidden field for editing
    name: ['', Validators.required],
    description: ['', Validators.required], // Added
    minAmount: [0, [Validators.required, Validators.min(0.01)]],
    maxAmount: [0, [Validators.required, Validators.min(0.01)]],
    address: ['', Validators.required],
    hasReward: [false], // Added
    rewardPercentage: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(100)]], // Added, disabled by default
    requiresTrxId: [false], // Added
  }, { nonNullable: true });

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  constructor() {
    // Enable/disable rewardPercentage based on hasReward
    this.depositOptionForm.controls.hasReward.valueChanges.subscribe(hasReward => {
      if (hasReward) {
        this.depositOptionForm.controls.rewardPercentage.enable();
        this.depositOptionForm.controls.rewardPercentage.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(100)
        ]);
        // Set a default value if enabling to avoid empty input validation issues immediately
        if (this.depositOptionForm.controls.rewardPercentage.value === 0) {
          this.depositOptionForm.controls.rewardPercentage.setValue(5);
        }
      } else {
        this.depositOptionForm.controls.rewardPercentage.disable();
        this.depositOptionForm.controls.rewardPercentage.clearValidators();
        this.depositOptionForm.controls.rewardPercentage.setValue(0); // Reset value when disabled
      }
      this.depositOptionForm.controls.rewardPercentage.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Manually mark all controls as touched to display validation errors
    this.depositOptionForm.markAllAsTouched();

    if (this.depositOptionForm.invalid) {
      this.errorMessage.set('Please fill out all fields correctly.');
      return;
    }

    this.loading.set(true);
    // Ensure disabled fields are included in value for update operation
    const formValue = this.depositOptionForm.getRawValue();
    const { id, ...optionData } = formValue;

    if (this.isEditing() && id) {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.updateDepositOption(id, optionData as Partial<DepositOption>).then(() => {
        this.successMessage.set('Deposit option updated successfully!');
        this.resetForm();
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to update option.');
      }).finally(() => {
        this.loading.set(false);
      });
    } else {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.addDepositOption(optionData as Omit<DepositOption, 'id'>).then(() => {
        this.successMessage.set('Deposit option added successfully!');
        this.resetForm();
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to add option.');
      }).finally(() => {
        this.loading.set(false);
      });
    }
  }

  editOption(option: DepositOption): void {
    this.isEditing.set(true);
    // Use patchValue to ensure only defined properties are set and avoid issues with disabled state if not explicitly managed
    this.depositOptionForm.patchValue(option);
    if (option.hasReward) {
      this.depositOptionForm.controls.rewardPercentage.enable();
    } else {
      this.depositOptionForm.controls.rewardPercentage.disable();
    }
  }

  deleteOption(id: string): void {
    if (confirm('Are you sure you want to delete this deposit option? This action cannot be undone.')) {
      // Fix: Ensured adminService is typed correctly by fixing AdminService import
      this.adminService.deleteDepositOption(id).then(() => {
        this.successMessage.set('Deposit option deleted successfully!');
      }).catch(error => {
        this.errorMessage.set(error.message || 'Failed to delete option.');
      });
    }
  }

  resetForm(): void {
    this.depositOptionForm.reset({
      id: '',
      name: '',
      description: '',
      minAmount: 0,
      maxAmount: 0,
      address: '',
      hasReward: false,
      rewardPercentage: 0,
      requiresTrxId: false
    });
    this.depositOptionForm.controls.rewardPercentage.disable(); // Ensure it's disabled on reset
    this.isEditing.set(false);
    this.loading.set(false);
  }
}