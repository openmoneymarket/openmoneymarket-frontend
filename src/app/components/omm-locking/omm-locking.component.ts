import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import BigNumber from "bignumber.js";
import {Utils} from "../../common/utils";
import {BoostedOmmSliderComponent} from "../boosted-omm-slider/boosted-omm-slider.component";
import log from "loglevel";
import {LockingAction} from "../../models/classes/LockingAction";
import {ModalType} from "../../models/enums/ModalType";
import {normalFormat} from "../../common/formats";
import {LockDate} from "../../models/enums/LockDate";
import {getLockDateFromMilliseconds, lockedDatesToMilliseconds, lockedUntilDateOptions, Times} from "../../common/constants";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {NotificationService} from "../../services/notification/notification.service";
import {ModalService} from "../../services/modal/modal.service";
import {OmmTokenBalanceDetails} from "../../models/classes/OmmTokenBalanceDetails";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {OmmLockingCmpType} from "../../models/enums/OmmLockingComponent";
import {ManageStakedIcxAction} from "../../models/classes/ManageStakedIcxAction";
import {AssetAction} from "../../models/classes/AssetAction";
import {Asset, AssetClass, AssetName, AssetTag} from "../../models/classes/Asset";

@Component({
  selector: 'app-omm-locking',
  templateUrl: './omm-locking.component.html',
})
export class OmmLockingComponent extends BaseClass implements OnInit, AfterViewInit {

  @Input() type!: OmmLockingCmpType;
  @Output() sliderValueUpdate = new EventEmitter<number>();
  @Output() lockAdjustClicked = new EventEmitter<void>();
  @Output() lockAdjustCancelClicked = new EventEmitter<void>();
  @Output() lockUntilDateClicked = new EventEmitter<LockDate>();

  @ViewChild(BoostedOmmSliderComponent) lockOmmSliderCmp!: BoostedOmmSliderComponent;
  private inputLockOmmEl!: any; @ViewChild("lockInput")set a(a: ElementRef) {this.inputLockOmmEl = a.nativeElement; }
  private dropdownLockedEl!: any; @ViewChild("drpdwnLocked")set b(b: ElementRef) {this.dropdownLockedEl = b.nativeElement; }
  private userbOmmBalanceEl?: any; @ViewChild("bommBaln")set c(c: ElementRef) {this.userbOmmBalanceEl = c?.nativeElement; }

  userOmmTokenBalanceDetails?: OmmTokenBalanceDetails;
  userbOmmBalance = Utils.ZERO;
  userLockedOmmBalance = Utils.ZERO;

  public dynamicLockedOmmAmount: BigNumber = new BigNumber(0); // dynamic user locked Omm amount

  // default to 1 week
  public selectedLockTimeInMillisec = lockedDatesToMilliseconds.get(this.currentLockPeriodDate()) ?? Times.WEEK_IN_MILLISECONDS;
  public selectedLockTime = this.currentLockPeriodDate();
  userHasSelectedLockTime = false;

  private lockAdjustActive = false; // flag that indicates whether the locked adjust is active (confirm and cancel shown)


  constructor(public persistenceService: PersistenceService,
              private calculationService: CalculationsService,
              private notificationService: NotificationService,
              private modalService: ModalService,
              private stateChangeService: StateChangeService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initCoreValues();
    this.registerSubscriptions();
  }

  ngAfterViewInit(): void {
    this.initLockSlider();
  }

  initCoreValues(): void {
    if (this.userLoggedIn()) {
      this.dynamicLockedOmmAmount = this.persistenceService.getUsersLockedOmmBalance();
      this.selectedLockTimeInMillisec = lockedDatesToMilliseconds.get(this.currentLockPeriodDate())!;
      this.selectedLockTime = this.currentLockPeriodDate();
      this.userbOmmBalance = this.persistenceService.userbOmmBalance;
      this.userOmmTokenBalanceDetails = this.persistenceService.userOmmTokenBalanceDetails?.getClone();
      this.userLockedOmmBalance = this.persistenceService.getUsersLockedOmmBalance();
    }
  }

  private registerSubscriptions(): void {
    this.subscribeToAfterUserDataReload();
  }

  public subscribeToAfterUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      this.initCoreValues();
      this.updateLockSliderValues();
    });
  }

  initLockSlider(): void {
    const userLockedOmmBalance = this.userLockedOmmBalance;
    this.userOmmTokenBalanceDetails = this.persistenceService.userOmmTokenBalanceDetails?.getClone();
    const userOmmAvailableBalance = this.persistenceService.getUsersAvailableOmmBalance();
    const max = userOmmAvailableBalance.plus(userLockedOmmBalance).dp(0).toNumber();

    // create Stake slider
    this.lockOmmSliderCmp.createAndInitSlider(userLockedOmmBalance.toNumber(), userLockedOmmBalance.toNumber(), max);
  }

  private updateLockSliderValues(): void {
    // sliders max is sum of locked + available balance
    const sliderMax = this.persistenceService.getUsersAvailableOmmBalance().plus(this.userLockedOmmBalance);

    this.lockOmmSliderCmp.updateSliderValues(sliderMax.toNumber(), this.userLockedOmmBalance.toNumber());
    this.lockOmmSliderCmp.setSliderValue(this.userLockedOmmBalance.toNumber());
  }

  handleLockSliderValueUpdate(value: number): void {
    this.sliderValueUpdate.emit(value);

    const bigNumValue = new BigNumber(value);
    this.dynamicLockedOmmAmount = bigNumValue;

    // update dynamic values only if user current and dynamic locked OMM amounts are different
    if (this.userLoggedIn() && !this.userLockedOmmBalance.eq(bigNumValue.dp(0)))  {
      if (this.userbOmmBalanceEl) {
        this.updateUserbOmmBalance(bigNumValue);
      }
    }

    // Update Omm stake input text box
    this.inputLockOmmEl.value = normalFormat.to(value);
  }

  onLockAdjustClick(): void {
    // pop up manage staked omm if user has staked OMM
    if (this.userLoggedIn() && this.persistenceService.getUserStakedOmmBalance().gt(0)) {
      // default migration locking period is 1 week
      const lockTime = this.calculationService.recalculateLockPeriodEnd(Utils.timestampNowMilliseconds().plus(Times.WEEK_IN_MILLISECONDS));
      const amount = this.persistenceService.getUserStakedOmmBalance();
      this.modalService.showNewModal(ModalType.MANAGE_STAKED_OMM, undefined, undefined, undefined,
        undefined, undefined, new ManageStakedIcxAction(amount, lockTime));
    } else {
      if (this.userHasOmmUnlocked()) {
        const currentOmmBalance = this.persistenceService.getUsersAvailableOmmBalanceRaw().dp(2);
        const lockedOmm = this.userLockedOmmBalance.dp(2);
        const after = currentOmmBalance.plus(lockedOmm).dp(2);
        this.modalService.showNewModal(ModalType.WITHDRAW_LOCKED_OMM, new AssetAction(new Asset(AssetClass.OMM, AssetName.OMM,
          AssetTag.OMM), currentOmmBalance, after, lockedOmm));
      } else {
        this.lockAdjustActive = true;
        this.lockOmmSliderCmp.enableSlider();

        // emit lockAdjustClicked event
        this.lockAdjustClicked.emit();
      }

    }
  }

  // On "Cancel Lock up OMM" click
  onLockAdjustCancelClick(): void {
    this.lockAdjustActive = false;
    this.userHasSelectedLockTime = false;

    // Set your locked OMM slider to the initial value
    this.lockOmmSliderCmp.disableSlider();
    this.lockOmmSliderCmp.setSliderValue(this.userLockedOmmBalance.toNumber());

    this.initCoreValues();
    this.lockAdjustCancelClicked.emit();

    // reset bOmm balance
    this.setText(this.userbOmmBalanceEl, this.toZeroIfDash(this.tooUSLocaleString(this.userbOmmBalance.dp(2)))
      + (this.userbOmmBalance.isGreaterThan(Utils.ZERO) ? " bOMM" : ""));
  }

  onLockedDateDropdownClick(): void {
    this.dropdownLockedEl?.classList.toggle("active");
  }

  updateUserbOmmBalance(newLockedOmmAmount: BigNumber): void {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(newLockedOmmAmount, this.selectedLockTimeInMillisec);

    this.setText(this.userbOmmBalanceEl, this.toZeroIfDash(this.tooUSLocaleString(newUserbOmmBalance.dp(2)))
      + (newUserbOmmBalance.isGreaterThan(Utils.ZERO) ? " bOMM" : ""));
  }

  /**
   * Logic to trigger on Locked Omm input change after 1 sec of user keyup
   */
  onLockedOmmInputLostFocus(): void {
    this.delay(() => {
      log.debug("onInputLockChange: " + this.inputLockOmmEl.value);
      if (+normalFormat.from(this.inputLockOmmEl.value)) {
        this.lockOmmSliderCmp.setSliderValue(normalFormat.from(this.inputLockOmmEl.value));
      } else {
        this.lockOmmSliderCmp.setSliderValue(0);
      }
    }, 1000 );
  }

  onLockUntilDateClick(date: LockDate): void {
    this.selectedLockTimeInMillisec = lockedDatesToMilliseconds.get(date)!;
    this.selectedLockTime = date;
    this.userHasSelectedLockTime = true;

    // update dynamic daily OMM rewards based on the newly selected lock date
    this.lockUntilDateClicked.emit(date);

    // update user bOMM balance based on newly selected time
    this.updateUserbOmmBalance(this.dynamicLockedOmmAmount);
  }

  onConfirmLockOmmClick(): void {
    log.debug(`onConfirmLockOmmClick Omm locked amount = ${this.dynamicLockedOmmAmount}`);
    const before = this.userLockedOmmBalance;
    const after = this.dynamicLockedOmmAmount;
    const diff = after.minus(before);
    const userCurrentLockedOmmEndInMilliseconds = this.userCurrentLockedOmmEndInMilliseconds();

    // if before and after equal show notification
    if (before.eq(after) && this.lockDate().eq(userCurrentLockedOmmEndInMilliseconds)) {
      this.notificationService.showNewNotification("No change in locked value.");
      return;
    }

    if (!this.selectedLockTimeInMillisec.isFinite() || this.selectedLockTimeInMillisec.lte(0)) {
      this.notificationService.showNewNotification("Please selected locking period.");
      return;
    }

    const unlockPeriod = this.lockDate();
    log.debug("unlockPeriod:", unlockPeriod);

    const lockingAction = new LockingAction(before, after, diff.abs(), unlockPeriod);

    if (diff.gte( 0)) {
      if (this.persistenceService.minOmmLockAmount.isGreaterThan(diff) && !unlockPeriod.gt(userCurrentLockedOmmEndInMilliseconds)) {
        this.notificationService.showNewNotification(`Lock amount must be greater than ${this.persistenceService.minOmmLockAmount}`);
      }
      else if (before.gt(0) && after.gt(before)) {
        if (unlockPeriod.gt(userCurrentLockedOmmEndInMilliseconds)) {
          // increase both locked amount and unlock period if lock amount and unlock period are greater than current
          this.modalService.showNewModal(ModalType.INCREASE_LOCK_TIME_AND_AMOUNT, undefined, undefined, undefined, undefined,
            lockingAction);
        } else if (unlockPeriod.eq(userCurrentLockedOmmEndInMilliseconds)) {
          // increase lock amount only if new one is greater and unlock period is same as current
          this.modalService.showNewModal(ModalType.INCREASE_LOCK_OMM, undefined, undefined, undefined, undefined,
            lockingAction);
        }
      }
      else if (before.eq(after) && unlockPeriod.gt(userCurrentLockedOmmEndInMilliseconds)) {
        this.modalService.showNewModal(ModalType.INCREASE_LOCK_TIME, undefined, undefined, undefined, undefined,
          lockingAction);
      }
      else {
        this.modalService.showNewModal(ModalType.LOCK_OMM, undefined, undefined, undefined, undefined,
          lockingAction);
      }
    } else {
      this.notificationService.showNewNotification("Lock amount can not be lower than locked amount.");
    }
  }

  currentLockPeriodDate(): LockDate {
    const currentLockedDateMilli = this.persistenceService.userCurrentLockedOmmEndInMilliseconds();

    if (currentLockedDateMilli.isZero()) {
      return LockDate.WEEK;
    }

    const lockDateMilli = currentLockedDateMilli.minus(Utils.timestampNowMilliseconds());

    if (this.userHasSelectedLockTime) {
      return getLockDateFromMilliseconds(lockedDatesToMilliseconds.get(this.selectedLockTime)!.plus(lockDateMilli));
    } else {
      return getLockDateFromMilliseconds(lockDateMilli);
    }
  }

  getLockedUntilDateOptions(): LockDate[] {
    if (!this.userHasLockedOmm()) {
      return lockedUntilDateOptions;
    } else {
      return Utils.getAvailableLockPeriods(this.userCurrentLockedOmmEndInMilliseconds()) ?? [LockDate.FOUR_YEARS];
    }
  }

  getLeftLockedThresholdPercentStyle(): any {
    const max = new BigNumber("100");
    const percent = this.calculatePercentLocked();
    const res = max.multipliedBy(percent).dp(2);
    return { left: res.toString() + "%" };
  }

  calculatePercentLocked(): BigNumber {
    return this.userLockedOmmBalance.dividedBy(this.userLockedOmmBalance.plus(this.persistenceService.getUsersAvailableOmmBalance()));
  }

  // check if user has Omm that has been unlocked
  userHasOmmUnlocked(): boolean {
    // if user locked Omm is greater than zero and end timestamp has passed return true
    return this.persistenceService.userLockedOmm ? this.persistenceService.userLockedOmm.amount.gt(0) &&
      this.persistenceService.userLockedOmm.end.lt(Utils.timestampNowMicroseconds()) : false;
  }

  getLockSliderMax(): BigNumber {
    // sliders max is sum of locked + available balance
    return this.userLockedOmmBalance.plus(this.persistenceService.getUsersAvailableOmmBalance());
  }

  lockDate(): BigNumber {
    if (this.userCurrentLockedOmmEndInMilliseconds().gt(0)) {
      if (this.userHasSelectedLockTime) {
        // increase for difference between selected and current end
        const now = Utils.timestampNowMilliseconds();
        const currentEndPeriodDate = this.userCurrentLockedOmmEndInMilliseconds();
        const difference = now.plus(this.selectedLockTimeInMillisec).minus(currentEndPeriodDate);
        return this.calculationService.recalculateLockPeriodEnd(currentEndPeriodDate.plus(difference));
      } else {
        return this.userCurrentLockedOmmEndInMilliseconds();
      }
    } else {
      return this.calculationService.recalculateLockPeriodEnd(Utils.timestampNowMilliseconds().plus(this.selectedLockTimeInMillisec));
    }
  }

  public isLockAdjustActive(): boolean {
    return this.lockAdjustActive;
  }

  userCurrentLockedOmmEndInMilliseconds(): BigNumber {
    return this.persistenceService.userCurrentLockedOmmEndInMilliseconds();
  }

  shouldHideBoostedSlider(): boolean {
    return !this.userLoggedIn() || (!this.userHasMoreThanOneOmmToken() && !this.userHasLockedOmm());
  }

  userHasOmmTokens(): boolean {
    return (this.persistenceService.userOmmTokenBalanceDetails?.totalBalance ?? Utils.ZERO).isGreaterThan(Utils.ZERO);
  }

  userHasMoreThanOneOmmToken(): boolean {
    return (this.persistenceService.userOmmTokenBalanceDetails?.totalBalance ?? new BigNumber("0")).isGreaterThan(new BigNumber("1"));
  }

  userHasLockedOmm(): boolean {
    return this.userLockedOmmBalance.gt(0);
  }

  shouldHideLockedOmmThreshold(): boolean {
    return !this.userLoggedIn() || !this.userHasLockedOmm() || !this.lockAdjustActive;
  }

  shouldShowbOmmBalance(): boolean {
    return this.userLoggedIn() && (this.lockAdjustActive || this.userbOmmBalance.gt(0) || this.userHasOmmUnlocked());
  }

  boostAdjustLabel(): string {
    if (this.userHasOmmUnlocked()) {
      return "Withdraw OMM";
    } else if (this.userHasLockedOmm()) {
      return "Adjust";
    } else {
      return "Lock up OMM";
    }
  }

  boostedOmmPanelMessage(): string {
    if (!this.userLoggedIn()) {
      // signed out / hold no OMM
      return "Earn or buy OMM, then lock it up here to boost your earning potential and voting power.";
    } else if (this.userLoggedIn() && (this.userHasLockedOmm() || this.userHasOmmTokens())) {
      // unlocked OMM (no market or LP participation)
      if (this.type === OmmLockingCmpType.REWARDS) {
        return "Lock up OMM to boost your earning potential.";
      } else {
        return "Lock up OMM to hold voting power on Omm.";
      }
    }

    return "Earn or buy OMM, then lock it up here to boost your earning potential and voting power.";
  }

  bOmmTooltipContent(): string {
    if (this.type === OmmLockingCmpType.VOTE) {
      return "Lock up OMM to hold voting power on Omm. The longer you lock up OMM, the more bOMM (boosted OMM) you'll receive; " +
        "the amount will decrease over time.";
    } else {
      return "Lock up OMM to boost your earning potential by up to 2.5 x. The longer you lock up OMM, the more bOMM (boosted OMM) " +
        "you'll receive; the amount will decrease over time.";
    }
  }

  getTitle(): string {
    if (this.type === OmmLockingCmpType.VOTE) {
      return "Voting power";
    } else {
      return "Earning potential";
    }

  }

}
