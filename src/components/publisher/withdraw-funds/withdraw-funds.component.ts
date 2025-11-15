import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, WithdrawalOption, PendingWithdrawal } from '../../shared/navbar/admin.service';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop'; // Import toObservable
import { CommonModule } from '@angular/common';
import { filter, map, switchMap } from 'rxjs/operators'; // Import RxJS operators

@Component({
  selector: 'app-withdraw-funds',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './withdraw-funds.component.html',
  styleUrl: './withdraw-funds.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawFundsComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private dataService = inject(DataService);

  userProfile = this.authService.userProfile;
  withdrawalOptions = toSignal(this.adminService.getWithdrawalOptions(), { initialValue: [] });

  selectedOption = signal<WithdrawalOption | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  // Dynamic publisher balance, fetched from Firebase
  publisherBalance = toSignal(
    toObservable(this.authService.userProfile).pipe(
      filter(profile => !!profile?.uid),
      switchMap(profile => this.dataService.listen<number>(`users/${profile!.uid}/balance`)),
      map(balance => balance ?? 0) // Default to 0 if balance doesn't exist yet
    ),
    { initialValue: 0 }
  );

  // Publisher's withdrawal history
  publisherWithdrawalHistory = toSignal(
    toObservable(this.authService.userProfile).pipe(
      filter(profile => !!profile?.uid),
      switchMap(profile => this.adminService.getUserWithdrawals(profile!.uid))
    ),
    { initialValue: [] }
  );

  withdrawalForm = this.fb.group({
    optionId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    userAddressOrId: ['', Validators.required], // New field for recipient address/ID
  }, { nonNullable: true });

  constructor() {
    this.withdrawalForm.controls.optionId.valueChanges.subscribe(optionId => {
      // Fix: Ensured withdrawalOptions() is typed correctly by fixing AdminService import
      const option = this.withdrawalOptions().find(opt => opt.id === optionId);
      this.selectedOption.set(option || null);
      if (option) {
        this.withdrawalForm.controls.amount.setValidators([
          Validators.required,
          Validators.min(option.minAmount),
          Validators.max(option.maxAmount)
        ]);
        this.withdrawalForm.controls.amount.updateValueAndValidity();
      } else {
        this.withdrawalForm.controls.amount.clearValidators();
        this.withdrawalForm.controls.amount.updateValueAndValidity();
      }
    });
  }

  onWithdrawClick() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.withdrawalForm.markAllAsTouched(); // Trigger validation feedback

    if (this.withdrawalForm.invalid || !this.selectedOption()) {
      this.errorMessage.set('Please select a withdrawal option and fill out all fields correctly.');
      return;
    }

    const requestedAmount = this.withdrawalForm.value.amount!;
    if (requestedAmount > this.publisherBalance()) {
      this.errorMessage.set('Requested amount exceeds your available balance.');
      return;
    }

    const userId = this.userProfile()?.uid;
    const userEmail = this.userProfile()?.email;
    const selectedOption = this.selectedOption()!;

    if (!userId || !userEmail) {
      this.errorMessage.set('User not authenticated. Please log in.');
      return;
    }

    this.loading.set(true);
    const newWithdrawal: Omit<PendingWithdrawal, 'id'> = {
      userId: userId,
      userEmail: userEmail,
      withdrawalOptionName: selectedOption.name,
      amount: requestedAmount,
      userAddressOrId: this.withdrawalForm.value.userAddressOrId,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.dataService.push('withdrawals', newWithdrawal).then(() => {
      this.successMessage.set('Withdrawal request submitted successfully! It will be reviewed by admin.');
      this.withdrawalForm.reset({
        optionId: '',
        amount: 0,
        userAddressOrId: ''
      });
      // Ensure dropdown reverts to default state and validators reset
      this.withdrawalForm.controls.optionId.setValue('');
      this.selectedOption.set(null);
    }).catch(error => {
      this.errorMessage.set(error.message || 'Failed to submit withdrawal request.');
      console.error('Withdrawal submission error:', error);
    }).finally(() => {
      this.loading.set(false);
    });
  }
}