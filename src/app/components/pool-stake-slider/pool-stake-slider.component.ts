import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {UserPoolData} from "../../models/classes/UserPoolData";
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {ModalType} from "../../models/enums/ModalType";
import {ModalService} from "../../services/modal/modal.service";
import {StakingAction} from "../../models/classes/StakingAction";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {Utils} from "../../common/utils";
import {NotificationService} from "../../services/notification/notification.service";
import {ModalAction} from "../../models/classes/ModalAction";
import log from "loglevel";
import BigNumber from "bignumber.js";

declare var noUiSlider: any;

@Component({
  selector: 'app-pool-stake-slider',
  templateUrl: './pool-stake-slider.component.html'
})
export class PoolStakeSliderComponent extends BaseClass implements OnInit, AfterViewInit {

  sliderEl: any;
  @ViewChild("slider")set a(a: ElementRef) {this.sliderEl = a.nativeElement; }
  adjustStateEl: any;
  @ViewChild("adjustEl")set b(b: ElementRef) {this.adjustStateEl = b.nativeElement; }
  restStateEl: any;
  @ViewChild("restEl")set c(c: ElementRef) {this.restStateEl = c.nativeElement; }
  inputStakedEl: any;
  @ViewChild("inputEl")set d(d: ElementRef) {this.inputStakedEl = d.nativeElement; }

  @Output() sliderValueUpdate = new EventEmitter<{value: BigNumber, poolData: UserPoolData | undefined}>();
  @Output() cancelClicked = new EventEmitter<void>();

  poolData: UserPoolData | undefined;

  poolId!: BigNumber;

  adjustActive = false;

  @Input() set poolIdSet(id: BigNumber) {
    this.poolId = id;
    this.poolData = this.persistenceService.userPoolsDataMap.get(id.toString());
  }

  constructor(public persistenceService: PersistenceService,
              private modalService: ModalService,
              private stateChangeService: StateChangeService,
              private notificationService: NotificationService,
              private cd: ChangeDetectorRef) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.registerSubscriptions();
  }

  ngAfterViewInit(): void {
    this.poolData = this.persistenceService.userPoolsDataMap.get(this.poolId.toString());
    this.initSlider();
    this.setCurrentStaked();

    // call cd after to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.cd.detectChanges();
  }

  onConfirmClick(): void {
    const before = this.persistenceService.getUserPoolStakedBalance(this.poolId).dp(2);
    const after = new BigNumber(this.inputStakedEl.value);
    const diff = Utils.subtract(after, before);

    // if before and after equal show notification
    if (before.isEqualTo(after)) {
      this.notificationService.showNewNotification("No change in staked value.");
      return;
    }

    const isMax = after.isGreaterThanOrEqualTo(this.sliderMaxValue());
    const isMin = after.isLessThanOrEqualTo(Utils.ZERO);
    const stakingAction = new StakingAction(before, after, diff.abs(), {poolId: this.poolId, max: isMax, min: isMin});

    if (diff.isGreaterThan(Utils.ZERO)) {
      this.modalService.showNewModal(ModalType.POOL_STAKE, undefined, stakingAction);
    } else {
      this.modalService.showNewModal(ModalType.POOL_UNSTAKE, undefined, stakingAction);
    }
  }

  registerSubscriptions(): void {
    this.subscribeToUserPoolsChange();
    this.subscribeToUserModalActionChange();
    this.subscribeToPoolClick();
  }

  private subscribeToPoolClick(): void {
    this.stateChangeService.onPoolClick$.subscribe(pool => {
      this.onCancelClick();
    });
  }

  private subscribeToUserModalActionChange(): void {
    // User confirmed the modal action
    this.stateChangeService.userModalActionChange.subscribe((modalAction?: ModalAction) => {
      this.onCancelClick();
    });
  }

  subscribeToUserPoolsChange(): void {
    this.stateChangeService.userPoolsDataChange$.subscribe(() => {
      log.debug("Pool " + this.poolData?.prettyName + "userPoolsDataChange$ userPoolsDataMap: ",
        this.persistenceService.userPoolsDataMap);
      this.poolData = this.persistenceService.userPoolsDataMap.get(this.poolId.toString());
      this.initSlider();
      this.setCurrentStaked();
    });
  }

  onInputStakeLostFocus(): void {
    this.delay(() => {
      const value = this.getInputStakedValue();

      if (value.isGreaterThan(this.getStakeMax())) {
        this.inputStakedEl.classList.add("red-border");
      } else {
        // reset border color if it passes the check
        this.inputStakedEl.classList.remove("red-border");
        // set slider value
        this.setStakeSliderValue(value);
      }
    }, 500 );
  }

  setCurrentStaked(value?: BigNumber): void {
    value = value ? value : (this.persistenceService.userPoolsDataMap.get(this.poolId.toString())?.userStakedBalance
      ?? new BigNumber("0")).dp(2);

    // update slider value
    if (this.sliderEl?.noUiSlider) {
      this.setStakeSliderValue(value);
    } else {
      this.inputStakedEl.value = value;
    }
  }

  private setStakeSliderValue(value: BigNumber): void {
    const res = value.dp(2);

    // if value is greater than slider max, update the sliders max and set the value
    if (res.isGreaterThan(this.sliderMaxValue())) {
      this.sliderEl.noUiSlider?.updateOptions({range: { min: 0, max: res.dp(2).toNumber() }});
    }

    this.sliderEl.noUiSlider.set(res.dp(2).toNumber());
  }

  initSlider(): void {
    const max = this.getStakeMax();

    // Stake slider
    if (!this.sliderEl.noUiSlider) {
      noUiSlider.create(this.sliderEl, {
        start: [this.poolData?.userStakedBalance ?? 0],
        padding: [0],
        connect: 'lower',
        range: {
          min: [0],
          max: [max.isZero() ? 1 : max.toNumber()]
        },
      });
    }

    // On stake slider update
    this.sliderEl?.noUiSlider.on('update', (values: any, handle: any) => {
      const bigNumValue = (new BigNumber(values[handle])).dp(2);
      this.inputStakedEl.value = bigNumValue.toNumber();
      this.sliderValueUpdate.emit({
        value: bigNumValue,
        poolData: this.poolData
      });
    });
  }

  onAdjustClick(): void {
    this.adjustActive = true;
    this.sliderEl?.removeAttribute("disabled");
    this.addClass(this.restStateEl, "hide");
    this.removeClass(this.adjustStateEl, "hide");
  }

  onCancelClick(): void {
    this.adjustActive = false;

    // reset values
    this.setCurrentStaked();

    this.sliderEl?.setAttribute("disabled", "");
    this.addClass(this.adjustStateEl, "hide");
    this.removeClass(this.restStateEl, "hide");

    // emit cancel clicked event to parent components
    this.cancelClicked.emit();
  }

  sliderMaxValue(): BigNumber {
    return new BigNumber(this.sliderEl?.noUiSlider?.options.range.max ?? 1).dp(2);
  }

  getStakeMax(): BigNumber {
    // sliders max is sum of staked + available balance
    return Utils.add(this.persistenceService.getUserPoolStakedBalance(this.poolId),
      this.persistenceService.getUserPoolStakedAvailableBalance(this.poolId)).dp(2);
  }

  getInputStakedValue(): BigNumber {
    return (new BigNumber(this.inputStakedEl?.value ?? new BigNumber("0"))).dp(2);
  }
}
