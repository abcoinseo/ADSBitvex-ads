import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// Fix: Corrected the import path for AdminService
import { AdminService, DepositOption, PendingDeposit } from '../../shared/navbar/admin.service';
import { AuthService } from '../../../services/auth.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service';
import { filter, switchMap } from 'rxjs'; // For toObservable pipe

@Component({
  selector: 'app-deposit-funds',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './deposit-funds.component.html',
  styleUrl: './deposit-funds.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFundsComponent {
  // Fix: Explicitly type FormBuilder to resolve 'unknown' type inference
  private fb: FormBuilder = inject(FormBuilder);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private dataService = inject(DataService);

  userProfile = this.authService.userProfile;
  depositOptions = toSignal(this.adminService.getDepositOptions(), { initialValue: [] });

  selectedOption = signal<DepositOption | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  // Advertister's deposit history
  advertiserDepositHistory = toSignal(
    toObservable(this.authService.userProfile).pipe(
      filter(profile => !!profile?.uid),
      switchMap(profile => this.adminService.getUserDeposits(profile!.uid))
    ),
    { initialValue: [] }
  );

  depositForm = this.fb.group({
    optionId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    trxId: [''], // Made optional initially, validated based on option
  }, { nonNullable: true });

  // Computed signal for total amount including potential reward (though reward is *added* after deposit, not part of payable amount)
  // This is purely for display to make user aware of the *value* they'll get.
  totalPayableAmount = computed(() => this.depositForm.controls.amount.value);
  expectedRewardAmount = computed(() => {
    const amount = this.depositForm.controls.amount.value;
    const option = this.selectedOption();
    if (option?.hasReward && option.rewardPercentage !== undefined) {
      return amount * (option.rewardPercentage / 100);
    }
    return 0;
  });

  constructor() {
    this.depositForm.controls.optionId.valueChanges.subscribe(optionId => {
      // Fix: Ensured depositOptions() is typed correctly by fixing AdminService import
      const option = this.depositOptions().find(opt => opt.id === optionId);
      this.selectedOption.set(option || null);
      if (option) {
        // Update amount validators
        this.depositForm.controls.amount.setValidators([
          Validators.required,
          Validators.min(option.minAmount),
          Validators.max(option.maxAmount)
        ]);
        this.depositForm.controls.amount.updateValueAndValidity();

        // Update trxId validators based on requiresTrxId
        if (option.requiresTrxId) {
          this.depositForm.controls.trxId.setValidators(Validators.required);
        } else {
          this.depositForm.controls.trxId.clearValidators();
          this.depositForm.controls.trxId.setValue(''); // Clear if not required
        }
        this.depositForm.controls.trxId.updateValueAndValidity();
      } else {
        // Clear amount validators if no option selected
        this.depositForm.controls.amount.clearValidators();
        this.depositForm.controls.amount.updateValueAndValidity();
        this.depositForm.controls.trxId.clearValidators();
        this.depositForm.controls.trxId.updateValueAndValidity();
      }
    });
  }

  onDepositClick() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.depositForm.markAllAsTouched(); // Trigger validation feedback

    if (this.depositForm.invalid || !this.selectedOption()) {
      this.errorMessage.set('Please select a deposit option and fill out all fields correctly.');
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

    const calculatedRewardAmount = selectedOption.hasReward && selectedOption.rewardPercentage !== undefined
      ? this.depositForm.value.amount * (selectedOption.rewardPercentage / 100)
      : 0;

    const newDeposit: Omit<PendingDeposit, 'id'> = {
      userId: userId,
      userEmail: userEmail,
      depositOptionName: selectedOption.name,
      amount: this.depositForm.value.amount!,
      rewardAmount: calculatedRewardAmount,
      trxId: selectedOption.requiresTrxId ? this.depositForm.value.trxId! : undefined,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.dataService.push('deposits', newDeposit).then(() => {
      this.successMessage.set('Deposit request submitted successfully! It will be reviewed by admin.');
      this.depositForm.reset({
        optionId: '',
        amount: 0,
        trxId: ''
      });
      // Ensure dropdown reverts to default state and validators reset
      this.depositForm.controls.optionId.setValue('');
      this.selectedOption.set(null);
    }).catch(error => {
      this.errorMessage.set(error.message || 'Failed to submit deposit request.');
      console.error('Deposit submission error:', error);
    }).finally(() => {
      this.loading.set(false);
    });
  }
}