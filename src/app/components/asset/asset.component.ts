import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnDestroy,
  OnInit,
  Output, SimpleChanges,
  ViewChild
} from '@angular/core';
import {SlidersService} from "../../services/sliders/sliders.service";
import {
  assetFormat,
  ommPrefixFormat,
  percentageFormat,
  usLocale
} from "../../common/formats";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {Asset, AssetTag, assetToCollateralAssetTag, CollateralAssetTag} from "../../models/classes/Asset";
import log from "loglevel";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {UserReserveData} from "../../models/classes/UserReserveData";
import {ModalService} from "../../services/modal/modal.service";
import {ModalType} from "../../models/enums/ModalType";
import {BaseClass} from "../base-class";
import {AssetAction} from "../../models/classes/AssetAction";
import {NotificationService} from "../../services/notification/notification.service";
import {UserAction} from "../../models/enums/UserAction";
import {Utils} from "../../common/utils";
import {ActiveViews} from "../../models/enums/ActiveViews";
import {DEFAULT_SLIDER_MAX, ICX_SUPPLY_BUFFER} from "../../common/constants";
import BigNumber from "bignumber.js";
import {ChartService} from "../../services/chart/chart.service";
import { Subscription } from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
})
export class AssetComponent extends BaseClass implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input() asset!: Asset;
  assetIsIcx = this.asset?.tag === AssetTag.ICX;
  @Input() ommApyChecked!: boolean;
  @Input() riskSlider!: any;
  @Input() index!: number;
  @Input() activeMarketView!: ActiveViews;

  /** Bind html elements to variables using template referencing */
  sliderSupply: any;
  @ViewChild("sliderSupply")set a(sliderSupply: ElementRef) {this.sliderSupply = sliderSupply.nativeElement; }
  sliderBorrow: any;
  @ViewChild("sliderBorrow") set b(sliderBorrow: ElementRef) {this.sliderBorrow = sliderBorrow.nativeElement; }
  supplyEl: any;
  @ViewChild("supply")set c(supplyEl: ElementRef) {this.supplyEl = supplyEl.nativeElement; }
  borrowEl: any;
  @ViewChild("borrow")set d(borrowEl: ElementRef) {this.borrowEl = borrowEl.nativeElement; }
  assetYourEl: any;
  @ViewChild("assetYour")set e(assetEl: ElementRef) { this.assetYourEl = assetEl.nativeElement; }
  marketExpandedEl: any;
  @ViewChild("marketExpandedEl")set f(marketExpandedEl: ElementRef) {this.marketExpandedEl = marketExpandedEl.nativeElement; }
  inputSupplyEl: any;
  @ViewChild("inputSupply")set g(inputSupply: ElementRef) { this.inputSupplyEl = inputSupply.nativeElement; }
  inputBorrowEl: any;
  @ViewChild("inputBorrow")set h(inputBorrow: ElementRef) { this.inputBorrowEl = inputBorrow.nativeElement; }
  inputSupplyAvailable: any;
  @ViewChild("inpSuppAvail")set i(inputSupplyAvailable: ElementRef) { this.inputSupplyAvailable = inputSupplyAvailable.nativeElement; }
  inputBorrowAvailable: any;
  @ViewChild("inpBorrAvail")set j(inputBorrowAvailable: ElementRef) { this.inputBorrowAvailable = inputBorrowAvailable.nativeElement; }
  supplyAction1El: any;
  @ViewChild("suppAct1") set k(suppAct1El: ElementRef) { this.supplyAction1El = suppAct1El.nativeElement; }
  borrowAction1El: any;
  @ViewChild("borrAct1") set l(borrAct1El: ElementRef) { this.borrowAction1El = borrAct1El.nativeElement; }
  supplyAction2El: any;
  @ViewChild("suppAct2") set m(suppAct2El: ElementRef) { this.supplyAction2El = suppAct2El.nativeElement; }
  borrowAction2El: any;
  @ViewChild("borrAct2") set n(borrAct2El: ElementRef) { this.borrowAction2El = borrAct2El.nativeElement; }
  suppInterestEl: any;
  @ViewChild("suppInterest") set o(suppInterest: ElementRef) { this.suppInterestEl = suppInterest.nativeElement; }
  borrInterestEl: any;
  @ViewChild("borrInterest") set p(borrInterest: ElementRef) { this.borrInterestEl = borrInterest.nativeElement; }
  suppRewardsEl: any;
  @ViewChild("suppRewards") set r(suppRewards: ElementRef) { this.suppRewardsEl = suppRewards.nativeElement; }
  borrRewardsEl: any;
  @ViewChild("borrRewards") set s(borrRewards: ElementRef) { this.borrRewardsEl = borrRewards.nativeElement; }
  supplyChartEl: any;
  @ViewChild("suppHistChart") set t(supplyChart: ElementRef) { this.supplyChartEl = supplyChart.nativeElement; }
  borrowChartEl: any;
  @ViewChild("borrHistChart") set u(borrowChart: ElementRef) { this.borrowChartEl = borrowChart.nativeElement; }
  supplyApyEl: any;
  @ViewChild("suppApyEl") set v(supplyApyEl: ElementRef) { this.supplyApyEl = supplyApyEl.nativeElement; }
  borrowAprEl: any;
  @ViewChild("borrowAprEl") set z(borrowAprEl: ElementRef) { this.borrowAprEl = borrowAprEl.nativeElement; }
  borrChartWrapperEl: any;
  @ViewChild("borrChartWrapper") set bcw(bcw: ElementRef) { this.borrChartWrapperEl = bcw.nativeElement; }
  suppChartWrapperEl: any;
  @ViewChild("suppChartWrapper") set scw(scw: ElementRef) { this.suppChartWrapperEl = scw.nativeElement; }

  @Output() collOtherAssetTables = new EventEmitter<AssetTag>();

  totalRisk = new BigNumber("0");

  // flag for icx / sICX toggle handling
  sIcxSelected = false;

  // flag for supply and borrow input state
  inputSupplyActive = false;
  inputBorrowActive = false;

  prevBorrowSliderSetValue?: number;
  prevSupplySliderSetValue?: number;

  supplySliderMax = 0;
  borrowSliderMax = 0;

  supplyChart: any;
  borrowChart: any;

  allMarketsSupplyApy = Utils.ZERO;
  allMarketsBorrowApy = Utils.ZERO;
  allMarketsSupplyApyPlusOmmApy = Utils.ZERO;
  allMarketsBorrowApyPlusOmmApy = Utils.ZERO;

  userMarketsSupplyApy = Utils.ZERO;
  userMarketsBorrowApy = Utils.ZERO;
  userMarketsSupplyApyPlusOmmApy = Utils.ZERO;
  userMarketsBorrowApyPlusOmmApy = Utils.ZERO;
  userBorrowedAssetBalanceUSD = Utils.ZERO;
  userBorrowedAssetBalance = Utils.ZERO;

  afterCoreDataReloadSub?: Subscription;
  afterUserDataReloadSub?: Subscription;
  collapseMarketAssetsSub?: Subscription;
  collapseOtherAssetsTableSub?: Subscription;
  removeAdjustClassSub?: Subscription;
  showDefaultActionsSub?: Subscription;
  disableAssetsInputsSub?: Subscription;
  userTotalRiskChangeSub?: Subscription;

  dynamicSupplyApy = Utils.ZERO;
  dynamicSupplyApyActive = false;
  dynamicBorrowApy = Utils.ZERO;
  dynamicBorrowApyActive = false;

  constructor(private slidersService: SlidersService,
              public calculationService: CalculationsService,
              private stateChangeService: StateChangeService,
              public persistenceService: PersistenceService,
              private modalService: ModalService,
              private notificationService: NotificationService,
              private cdRef: ChangeDetectorRef,
              private chartService: ChartService) {
    super(persistenceService);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.asset) {
      this.assetIsIcx = this.asset.tag === AssetTag.ICX;
    }
  }

  ngOnInit(): void {
    this.registerSubscriptions();

    this.initCoreValues();
    this.initUserValues();
  }

  ngOnDestroy(): void {
    this.sliderBorrow?.noUiSlider?.destroy();
    this.sliderSupply?.noUiSlider?.destroy();
    this.supplyChart?.remove();
    this.borrowChart?.remove();

    // clear subscriptions
    this.afterCoreDataReloadSub?.unsubscribe();
    this.afterUserDataReloadSub?.unsubscribe();
    this.collapseMarketAssetsSub?.unsubscribe();
    this.collapseOtherAssetsTableSub?.unsubscribe();
    this.removeAdjustClassSub?.unsubscribe();
    this.showDefaultActionsSub?.unsubscribe();
    this.disableAssetsInputsSub?.unsubscribe();
    this.userTotalRiskChangeSub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // init sliders
    this.initSliders();
    this.initSupplySliderlogic();
    this.initBorrowSliderLogic();

    this.initSupplyAndBorrowValues();

    this.initInterestHistoryCharts();

    this.cdRef.detectChanges();
  }

  initInterestHistoryCharts(): void {
    const charts = this.chartService.createBorrowAndSupplyInterestHistoryChart(this.supplyChartEl, this.borrowChartEl, this.asset.tag,
      this.supplyChart, this.borrowChart);
    this.supplyChart = charts.supplyChart;
    this.borrowChart = charts.borrowChart;

    this.resetChartsView();

    this.supplyChart?.subscribeCrosshairMove((param: any) => {
      if (!param?.point) {
        this.dynamicSupplyApyActive = false;
        return;
      }

      const supplyApy = param.seriesPrices.entries().next().value;
      if (supplyApy && supplyApy.length > 1) {
        this.dynamicSupplyApy = new BigNumber(supplyApy[1]).dividedBy(100);
        this.dynamicSupplyApyActive = true;
      }
    });

    this.borrowChart?.subscribeCrosshairMove((param: any) => {
      if (!param?.point) {
        this.dynamicBorrowApyActive = false;
        return;
      }

      const borrowApr = param?.seriesPrices?.entries()?.next()?.value;

      if (borrowApr && borrowApr.length > 1) {
        this.dynamicBorrowApy = new BigNumber(borrowApr[1]).dividedBy(100).negated();
        this.dynamicBorrowApyActive = true;
      }

    });
  }

  private resetChartsView(): void {
    this.supplyChart?.timeScale().fitContent();
    this.borrowChart?.timeScale().fitContent();
  }

  initSupplyAndBorrowValues(): void {
    if (this.userLoggedIn()) {
      // init user supply and borrow values
      this.updateSupplyData();
      this.updateBorrowData();
      this.updateSupplySlider(this.persistenceService.getUserAssetReserve(this.asset.tag));
      this.updateBorrowSlider();

    }
  }

  // update supply and borrow charts widths
  // @notice should only be used in resize event
  updateApyCharts(): void {
    const borrWidth = this.borrChartWrapperEl?.offsetWidth ?? 0;
    const suppWidth = this.suppChartWrapperEl?.offsetWidth ?? 0;

    if (suppWidth && suppWidth > 0) {
      this.chartService.resize(this.supplyChart, suppWidth);
    }

    if (borrWidth && borrWidth > 0) {
      this.chartService.resize(this.borrowChart, borrWidth);
    }
  }

  onSuppChartResize(): void {
    // update apy history charts when supp chart wrapper is resized
    this.updateApyCharts();
  }


  /**
   * Supply / Borrow sliders
   */
  initSliders(): void {
    // create and set supply slider
    const supplied = this.getUserSuppliedAssetBalance();
    const suppliedMax = this.calculationService.calculateAssetSupplySliderMax(this.asset.tag);
    this.slidersService.createNoUiSlider(this.sliderSupply, supplied,
      undefined, undefined, undefined, {min: [0], max: [this.deriveSupplySliderMaxValue(suppliedMax.dp(2))]});

    // create and set borrow slider
    const userBorrowed = this.userBorrowedAssetBalance;
    const borrowAvailable = this.calculationService.calculateAvailableBorrowForAsset(this.asset.tag);

    // borrow max is either borrowed + available OR borrowed in case borrowAvailable is negative (risk > 76)
    const borrowMax = borrowAvailable.isGreaterThan(Utils.ZERO) ? Utils.add(userBorrowed, borrowAvailable) : userBorrowed;
    this.slidersService.createNoUiSlider(this.sliderBorrow, userBorrowed, undefined, undefined, undefined,
      {min: [0], max: [this.deriveBorrowSliderMaxValue(borrowMax.dp(2))]});
  }

  /**
   * Handle variable/state changes for subscribed assets
   */
  registerSubscriptions(): void {
    this.subscribeToCoreDataReload();
    this.subscribeToUserDataReload();

    // handle sIcxSelected change
    this.subscribeTosIcxSelectedChange();

    // handle total risk change
    this.subscribeToTotalRiskChange();

    // event based triggers
    this.subscribeToCollapseTable();
    this.subscribeToDisableAssetsInputs();
    this.subscribeToShowDefaultActionsUpdate();
    this.subscribeToRemoveAdjustClass();
    this.subscribeToCollapseOtherAssetsTableUpdate();
    this.subscribeToInterestHistoryChange();
  }

  public subscribeToUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {

      this.initCoreValues();
      this.initUserValues();
    });
  }

  public subscribeToCoreDataReload(): void {
    this.stateChangeService.afterCoreDataReload$.subscribe(() => {
      this.initCoreValues();
      this.initUserValues();
    });
  }


  initUserValues(): void {
    if (this.userLoggedIn()) {
      const userLiquidityApy = this.persistenceService.getUserAssetReserveLiquidityRate(this.asset.tag);
      const userBorrowApy = this.persistenceService.getUserAssetReserveBorrowRate(this.asset.tag);

      this.userMarketsSupplyApy = userLiquidityApy;
      this.userMarketsBorrowApy = userBorrowApy;
      this.userMarketsSupplyApyPlusOmmApy = userLiquidityApy.plus(this.calculationService.calculateUserSupplyOmmRewardsApy(this.asset.tag));
      this.userMarketsBorrowApyPlusOmmApy = this.calculationService.calculateUserBorrowOmmRewardsApy(this.asset.tag).minus(userBorrowApy);
      this.userBorrowedAssetBalanceUSD = this.getUserBorrowedAssetBalanceUSD();
      this.userBorrowedAssetBalance = this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag).dp(2);

      this.disableActiveStates();
    }
  }

  disableActiveStates(): void {
    this.dynamicSupplyApyActive = false;
    this.dynamicBorrowApyActive = false;
    this.inputSupplyActive = false;
    this.inputBorrowActive = false;
  }

  initCoreValues(): void {
    const liquidityApy = this.persistenceService.getAssetReserveLiquidityRate(this.asset.tag);
    const borrowApy = this.persistenceService.getAssetReserveBorrowRate(this.asset.tag);

    this.allMarketsSupplyApy = liquidityApy;
    this.allMarketsBorrowApy = borrowApy;
    this.allMarketsSupplyApyPlusOmmApy = liquidityApy.plus(this.calculationService.calculateSupplyOmmRewardsApy(this.asset.tag));
    this.allMarketsBorrowApyPlusOmmApy = this.calculationService.calculateBorrowOmmRewardsApy(this.asset.tag).minus(borrowApy);
  }

  private subscribeToInterestHistoryChange(): void {
    this.stateChangeService.interestHistoryChange$.subscribe(() => {
      this.initInterestHistoryCharts();
      // trigger resize
      this.updateApyCharts();
    });
  }

  private subscribeToCollapseTable(): void {
    this.collapseMarketAssetsSub = this.stateChangeService.collapseMarketAssets$.subscribe(() => {
      this.collapseAssetTable();
    });
  }

  private subscribeToCollapseOtherAssetsTableUpdate(): void {
    this.collapseOtherAssetsTableSub = this.stateChangeService.collapseOtherAssetsTable$.subscribe(assetTag => {
      if (this.asset.tag !== assetTag) {
        this.collapseAssetTableSlideUp();
      }
    });
  }

  private subscribeToRemoveAdjustClass(): void {
    this.removeAdjustClassSub = this.stateChangeService.removeAdjustClass$.subscribe(() => this.removeAdjustClass());
  }

  private subscribeToShowDefaultActionsUpdate(): void {
    this.showDefaultActionsSub = this.stateChangeService.showDefaultActions$.subscribe(() => this.showDefaultActions());
  }

  private subscribeToDisableAssetsInputs(): void {
    this.disableAssetsInputsSub = this.stateChangeService.disableAssetsInputs$.subscribe(() => this.disableInputs());
  }

  private subscribeTosIcxSelectedChange(): void {
    if (this.assetIsIcx) {
      this.stateChangeService.sIcxSelectedChange$.subscribe(sIcxSelected => {
        this.sIcxSelected = sIcxSelected;
        this.updateSupplySlider(this.persistenceService.getUserAssetReserve(this.asset.tag));
      });
    }
  }

  private subscribeToTotalRiskChange(): void {
    // subscribe to total risk changes
    this.userTotalRiskChangeSub = this.stateChangeService.userTotalRiskChange.subscribe(totalRisk => {
      this.totalRisk = totalRisk;
    });
  }

  // update supply data (daily rewards, etc..) values
  updateSupplyData(): void {
    const bigNumValue = Utils.convertIfSICXToICX(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag),
      this.persistenceService.sIcxToIcxRate(), this.asset.tag).dp(2);

    // Update asset-user's supply interest
    this.updateDailySupplyInterest(bigNumValue);

    // convert ICX to sICX if needed
    const convertedValue = this.convertSuppliedValue(bigNumValue);

    // Update asset-user's supply omm rewards
    this.updateUserDailySupplyOmmReward(convertedValue);

    // handle risk calculation
    this.handleSupplyTotalRisk(convertedValue);
  }

  // update borrow data (daily rewards, etc..) values
  updateBorrowData(borrowed: BigNumber = this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag)): void {
    // Update asset-user's borrow interest
    this.setText(this.borrInterestEl, assetFormat(assetToCollateralAssetTag(this.asset.tag)).to(
      this.getDailyBorrowInterest(borrowed).dp(2).toNumber()));

    // Update asset-user's borrow omm rewards TODO refactor
    let userDailyBorrowOmmReward;
    if (!this.inputBorrowActive) {
      userDailyBorrowOmmReward = this.persistenceService.userDailyOmmRewards?.getBorrowRewardForAsset(this.asset.tag) ?? new BigNumber(0);
    } else {
      userDailyBorrowOmmReward = this.calculationService.calculateUserDailyBorrowOmmReward(this.asset.tag, borrowed);
    }
    this.setText(this.borrRewardsEl, ommPrefixFormat.to(userDailyBorrowOmmReward.dp(2).toNumber()));

    // update risk data
    this.handleBorrowTotalRisk(borrowed);
  }

  // Update asset-user's borrow omm rewards TODO refactor
  updateUserDailyBorrowOmmReward(borrowed: BigNumber): BigNumber {
    let userDailyBorrowOmmReward;
    if (!this.inputBorrowActive) {
      userDailyBorrowOmmReward = this.persistenceService.userDailyOmmRewards?.getBorrowRewardForAsset(this.asset.tag) ?? new BigNumber(0);
    } else {
      userDailyBorrowOmmReward = this.calculationService.calculateUserDailyBorrowOmmReward(this.asset.tag, borrowed);
    }
    const roundedDownReward = userDailyBorrowOmmReward.dp(2).toNumber();
    // Update asset-user's borrow omm rewards
    this.setText(this.borrRewardsEl, ommPrefixFormat.to(roundedDownReward));
    return userDailyBorrowOmmReward;
  }

  updateBorrowSlider(reserve?: UserReserveData): void {
    let max;

    if (!reserve) {
      // set borrowed available value
      const borrowAvailable = this.calculationService.calculateAvailableBorrowForAsset(this.asset.tag);
      this.setBorrowAvailableInput(borrowAvailable.isNegative() ? new BigNumber("0") : borrowAvailable);

      // update asset borrow slider max value to  -> borrowed + borrow available
      max = this.userBorrowedAssetBalance.plus(borrowAvailable).dp(2);
    } else {
      // set borrowed available value
      const borrowAvailable = this.calculationService.calculateAvailableBorrowForAsset(this.asset.tag);
      this.setBorrowAvailableInput(borrowAvailable.isNegative() ? new BigNumber("0") : borrowAvailable);

      // update asset borrow slider max value to  -> borrowed + borrow available
      max = borrowAvailable.isNegative() ? borrowAvailable : this.userBorrowedAssetBalance.plus(borrowAvailable);
    }

    this.sliderBorrow?.noUiSlider?.updateOptions({
      range: {
        min: 0,
        max: this.deriveBorrowSliderMaxValue(max.dp(2)) // min and max must not equal
      }
    });

    if (reserve) {
      // set borrow slider value
      this.setBorrowSliderValue(reserve.currentBorrowBalance);
    }
  }

  private updateSupplySlider(reserve?: UserReserveData): void {
    if (!reserve) {
      return;
    }

    // update input supply available value to new users asset reserve balance
    let supplyAvailable;

    if (this.sIcxSelected) {
      supplyAvailable = this.persistenceService.getUserAssetCollateralBalance(assetToCollateralAssetTag(this.asset.tag)).dp(2);
    } else {
      supplyAvailable = this.persistenceService.getUserAssetBalance(this.asset.tag).dp(2);
    }

    this.inputSupplyAvailable.value = Utils.formatNumberToUSLocaleString(supplyAvailable);

    // update asset supply slider max value to  -> supplied + supplied available
    const currentOTokenBalance = reserve.currentOTokenBalance.dp(2);
    const oTokenBalance = this.sIcxSelected ? currentOTokenBalance :
      this.SICXToICXIfAssetIsICX(reserve.currentOTokenBalance).dp(2);
    const max = oTokenBalance.plus(supplyAvailable);

    this.sliderSupply?.noUiSlider?.updateOptions({
      range: {
        min: 0,
        max: this.deriveSupplySliderMaxValue(max.dp(2)) // min and max must not equal
      }
    });


    // update supply slider value
    this.setSupplySliderValue(reserve.currentOTokenBalance, !this.sIcxSelected);
  }

  /**
   * Supply slider logic
   */
  initSupplySliderlogic(): void {
    // On asset-user supply slider update (Your markets)
    this.sliderSupply.noUiSlider.on('update', (values: any, handle: any) => {
      let value = +usLocale.from(values[handle]);

      // if the value is same as previous return
      if (this.prevSupplySliderSetValue && value === this.prevSupplySliderSetValue) {
        return;
      } else {
        this.prevSupplySliderSetValue = value;
      }

      // in case of ICX leave 2 ICX for the fees if slider max is greater than 2x the buffer
      if (this.supplySliderMaxValue().gt(ICX_SUPPLY_BUFFER * 2)) {
        const sliderMinusBuffer = this.supplySliderMaxValue().minus(ICX_SUPPLY_BUFFER).dp(2).toNumber();
        if (!this.sIcxSelected && this.assetIsIcx && value > sliderMinusBuffer) {
          value = sliderMinusBuffer;
        }
      }

      // BigNumber value used in calculations
      const bigNumValue = new BigNumber(value);

      // Update supplied text box
      this.inputSupplyEl.value = Utils.formatNumberToUSLocaleString(bigNumValue);

      // Update asset-user available text box
      this.inputSupplyAvailable.value = Utils.formatNumberToUSLocaleString(this.supplySliderMaxValue().minus(bigNumValue).dp(2));

      // Update asset-user's supply interest
      this.updateDailySupplyInterest(bigNumValue);

      // convert ICX to sICX if needed
      const convertedValue = this.convertSuppliedValue(bigNumValue);

      // Update asset-user's supply omm rewards
      const userDailySupplyOmmReward = this.updateUserDailySupplyOmmReward(convertedValue);

      // update dynamic APY
      this.updateUserDynamicSupplyApy(convertedValue, userDailySupplyOmmReward);

      // handle risk calculation
      this.handleSupplyTotalRisk(convertedValue);
    });
  }

  updateUserDynamicSupplyApy(convertedValue: BigNumber, userDailySupplyOmmReward: BigNumber): void {
    if (this.ommApyChecked) {
      this.dynamicSupplyApy = this.userMarketsSupplyApy.plus(this.calculationService.calculateUserDynamicSupplyApy(userDailySupplyOmmReward,
        convertedValue, this.asset.tag));
    }
  }

  updateUserDailySupplyOmmReward(convertedValue: BigNumber): BigNumber {
    let userDailySupplyOmmReward;
    if (!this.inputSupplyActive) {
      userDailySupplyOmmReward = this.persistenceService.userDailyOmmRewards?.getSupplyRewardForAsset(this.asset.tag) ?? new BigNumber(0);
    } else {
      userDailySupplyOmmReward = this.calculationService.calculateUserDailySupplyOmmReward(this.asset.tag, convertedValue);
    }

    const roundedDownReward = userDailySupplyOmmReward.dp(2).toNumber();
    this.setText(this.suppRewardsEl, ommPrefixFormat.to(roundedDownReward));
    return userDailySupplyOmmReward;
  }

  convertSuppliedValue(bigNumValue: BigNumber): BigNumber {
    if (this.sIcxSelected) {
      let sIcx;
      if (bigNumValue.toFixed(0) === this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag).toFixed(0)) {
        sIcx = this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag);
      } else {
        sIcx = bigNumValue;
      }
      return sIcx;
    } else if (!this.sIcxSelected && this.assetIsIcx) {
      return this.convertFromICXTosICX(bigNumValue);
    } else {
      return bigNumValue;
    }
  }

  updateDailySupplyInterest(supplyValue: BigNumber): void {
    const assetTag = this.sIcxSelected ? CollateralAssetTag.sICX : this.asset.tag;
    // Update asset-user's supply interest
    this.setText(this.suppInterestEl, assetFormat(assetTag).to(this.calculateDynamicDailySupplyInterest(assetTag, supplyValue)
      .dp(2).toNumber()));
  }

  handleSupplyTotalRisk(suppliedValue: BigNumber): void {
    const supplyDiff = suppliedValue.minus(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag));

    // update risk data
    let totalRisk;
    if (supplyDiff.isGreaterThan(Utils.ZERO)) {
      totalRisk = this.updateRiskData(this.asset.tag, supplyDiff , UserAction.SUPPLY, false);
    } else if (supplyDiff.isLessThan(Utils.ZERO)) {
      totalRisk = this.updateRiskData(this.asset.tag, supplyDiff.abs() , UserAction.REDEEM, false, this.getInputSupplyValue().isZero());
    } else {
      totalRisk = this.updateRiskData();
    }

    this.setTmpRiskAndColor(totalRisk);

    // if total risk over 100%
    if (totalRisk.isGreaterThan(new BigNumber("0.99"))) {
      this.addClass(this.supplyAction2El, "hide");
      $('.value-risk-total').text("Max");
      $('.supply-risk-warning').css("display", "flex");
    } else {
      if ($(this.supplyEl).hasClass("adjust")) {
        this.addClass(this.supplyAction1El, "hide");
        this.removeClass(this.supplyAction2El, "hide");
        $('.supply-risk-warning').css("display", "none");
      } else {
        this.removeClass(this.supplyAction1El, "hide");
        this.addClass(this.supplyAction2El, "hide");
        $('.supply-risk-warning').css("display", "none");
      }
    }
  }

  /**
   * Borrow slider logic
   */
  initBorrowSliderLogic(): void {
    // On asset-user borrow slider update (Your markets)
    this.sliderBorrow.noUiSlider.on('update', (values: any, handle: any) => {
      const deformatedValue = +usLocale.from(values[handle]);

      // if the value is same as previous return
      if (this.prevBorrowSliderSetValue && deformatedValue === this.prevBorrowSliderSetValue) {
        return;
      } else {
        this.prevBorrowSliderSetValue = deformatedValue;
      }

      // BigNumber value used in calculations
      const bigNumValue = new BigNumber(deformatedValue);

      // stop slider on min (do not allow to go below "Used" repayment a.k.a user available balance of asset)
      const borrowUsed = this.getBorrowUsed();

      if (!borrowUsed.isZero() && bigNumValue.isLessThan(borrowUsed)) {
        const newBorrowedVal = borrowUsed.dp(2, BigNumber.ROUND_UP);
        // Update asset-user borrowed text box
        this.inputBorrowEl.value = Utils.formatNumberToUSLocaleString(newBorrowedVal);

        // Update asset-user available text box
        this.setBorrowAvailableInput(Utils.subtract(this.borrowSliderMaxValue(), newBorrowedVal).dp(2));
        return this.sliderBorrow.noUiSlider.set(newBorrowedVal.toNumber());
      }

      // Update asset-user borrowed text box
      this.inputBorrowEl.value = Utils.formatNumberToUSLocaleString(bigNumValue);

      // Update asset-user available text box
      this.setBorrowAvailableInput(Utils.subtract(this.borrowSliderMaxValue(), bigNumValue).dp(2));

      this.updateBorrowData(bigNumValue);
      // Update asset-user's borrow interest
      this.setText(this.borrInterestEl, assetFormat(assetToCollateralAssetTag(this.asset.tag)).to(
        this.getDailyBorrowInterest(bigNumValue).dp(2).toNumber()));

      // Update asset-user's borrow omm rewards
      const userDailyBorrowOmmReward = this.updateUserDailyBorrowOmmReward(bigNumValue);

      this.updateUserDynamicBorrowApy(bigNumValue, userDailyBorrowOmmReward);

      // update risk data
      this.handleBorrowTotalRisk(bigNumValue);
    });
  }

  updateUserDynamicBorrowApy(borrowed: BigNumber, userDailyBorrowOmmReward: BigNumber): void {
    if (this.ommApyChecked) {
      this.dynamicBorrowApy = this.userMarketsBorrowApy.plus(this.calculationService.calculateUserDynamicBorrowApy(userDailyBorrowOmmReward,
        borrowed, this.asset.tag));
    }
  }

  private handleBorrowTotalRisk(newBorrowBalance: BigNumber): void {
    if (newBorrowBalance.gt(Utils.ZERO)) {
      // show risk data
      $('.risk-container').css("display", "block");

      // Hide risk message
      $('.risk-message-noassets').css("display", "none");
    }

    const borrowDiff = Utils.subtract(this.userBorrowedAssetBalance, newBorrowBalance);

    let totalRisk;
    if (borrowDiff.isGreaterThan(Utils.ZERO)) {
      totalRisk = this.updateRiskData(this.asset.tag, borrowDiff , UserAction.REPAY, false);
    } else if (borrowDiff.isLessThan(Utils.ZERO)) {
      totalRisk = this.updateRiskData(this.asset.tag, borrowDiff.abs() , UserAction.BORROW, false);
    } else {
      totalRisk = this.updateRiskData();
    }

    this.setTmpRiskAndColor(totalRisk);

    // if total risk over 100%
    if (totalRisk.isGreaterThan(new BigNumber("0.99"))) {
      this.addClass(this.borrowAction2El, "hide");
      $('.value-risk-total').text("Max");
      $('.borrow-risk-warning').css("display", "flex");
    } else if (totalRisk.isGreaterThan(new BigNumber("0.78"))) {
      // if user is trying to borrow more hide buttons
      if (borrowDiff.isNegative()) {
        this.addClass(this.borrowAction2El, "hide");
      } else {
        if ($(this.borrowEl).hasClass("adjust")) {
          this.removeClass(this.borrowAction2El, "hide");
        }
      }
      $('.borrow-risk-warning').css("display", "flex");
      $('.value-risk-total').text(percentageFormat.to(totalRisk.multipliedBy(new BigNumber("100")).dp(2).toNumber()));
    } else {
      if ($(this.borrowEl).hasClass("adjust")) {
        this.addClass(this.borrowAction1El, "hide");
        this.removeClass(this.borrowAction2El, "hide");
        $('.borrow-risk-warning').css("display", "none");
      } else {
        this.removeClass(this.borrowAction1El, "hide");
        this.addClass(this.borrowAction2El, "hide");
        $('.borrow-risk-warning').css("display", "none");
      }

      $('.value-risk-total').text(percentageFormat.to(totalRisk.multipliedBy(new BigNumber("100")).dp(2).toNumber()));
    }
  }

  setTmpRiskAndColor(totalRisk: BigNumber): void {
    const valueRiskTotal = $('.value-risk-total');

    valueRiskTotal.text(percentageFormat.to(totalRisk.multipliedBy(new BigNumber("100")).dp(2).toNumber()));

    // Change text to purple if over 50
    if (totalRisk.isGreaterThan(new BigNumber("0.50"))) {
      valueRiskTotal.addClass("alert-purple");
    }

    // Remove purple if below 50
    if (totalRisk.isLessThan(new BigNumber("0.50"))) {
      valueRiskTotal.removeClass("alert-purple");
    }

    // Change text to red if over 75
    if (totalRisk.isGreaterThan(new BigNumber("0.78"))) {
      valueRiskTotal.addClass("alert");
    }

    // Change text to normal if under 75
    if (totalRisk.isLessThan(new BigNumber("0.78"))) {
      valueRiskTotal.removeClass("alert");
    }
  }

  getCurrentDynamicRisk(): BigNumber {
    return new BigNumber(percentageFormat.from($('.value-risk-total').text()));
  }

  private SICXToICXIfAssetIsICX(value: BigNumber): BigNumber {
    if (!value || value.isZero()) {
      return new BigNumber("0");
    }
    return this.assetIsIcx ? this.convertSICXToICX(value) : value;
  }

  private setSupplySliderValue(value: BigNumber, convert = false): void {
    if (this.userLoggedIn() && this.sliderSupply?.noUiSlider) {
      let res: BigNumber;
      // if asset is ICX, convert sICX -> ICX if convert flag is true
      if (convert && this.assetIsIcx) {
        res = this.convertSICXToICX(value).dp(2);
      } else {
        res = value.dp(2);
      }

      // if value is greater than slider max, update the sliders max and set the value
      if (!res.isZero() && res.isGreaterThan(this.supplySliderMaxValue())) {
        this.sliderSupply.noUiSlider?.updateOptions({range: { min: 0, max: this.deriveSupplySliderMaxValue(res) }});
      }

      this.sliderSupply.noUiSlider.set(res.toNumber());
    }
  }

  private setBorrowSliderValue(value: BigNumber): void {
    if (this.userLoggedIn()) {
      const res = value.dp(2);

      // if value is greater than slider max, update the sliders max and set the value
      if (!res.isZero() && res.isGreaterThan(this.borrowSliderMaxValue())) {
        this.sliderBorrow.noUiSlider?.updateOptions({range: { min: 0, max: this.deriveBorrowSliderMaxValue(res) }});
      }

      this.sliderBorrow?.noUiSlider?.set(res.toNumber());
    }
  }

  deriveSupplySliderMaxValue(max: BigNumber): number {
    const res = this.slidersService.deriveSliderMaxValue(max);
    this.supplySliderMax = res;

    return res;
  }

  deriveBorrowSliderMaxValue(max: BigNumber): number {
    const res = this.slidersService.deriveSliderMaxValue(max);
    this.borrowSliderMax = res;

    return res;
  }

  setBorrowAvailableInput(value: BigNumber): void {
    if (value.isNegative()) {
      value = new BigNumber("0");
    }

    this.inputBorrowAvailable.value =  Utils.formatNumberToUSLocaleString(value);
  }

  getUserSuppliedAssetBalance(assetTag?: AssetTag | CollateralAssetTag): BigNumber {
    if (!assetTag) {
      assetTag = this.asset.tag;
    }

    let res = this.persistenceService.getUserSuppliedAssetBalance(assetTag);

    if (!this.sIcxSelected && this.isAssetIcx(assetTag)) {
      res = this.convertSICXToICX(res);
    }

    return res.dp(2);
  }

  private getUserBorrowedAssetBalanceUSD(): BigNumber {
    const reserve = this.persistenceService.getUserAssetReserve(this.asset.tag);
    const borrowBalanceUSD = reserve?.currentBorrowBalanceUSD ?? new BigNumber("0");
    const originationFeeUSD = reserve?.originationFee.multipliedBy(reserve?.exchangeRate) ?? new BigNumber("0");
    return borrowBalanceUSD.plus(originationFeeUSD);
  }

  getUserSuppliableBalanceUSD(): BigNumber {
    if (this.sIcxSelected) {
      const balance =  this.persistenceService.getUserAssetCollateralBalance(CollateralAssetTag.sICX);
      const exchangePrice = this.persistenceService.getAssetExchangePrice(CollateralAssetTag.sICX);
      return balance.multipliedBy(exchangePrice);
    }
    return this.persistenceService.getUserAssetUSDBalance(this.asset.tag);
  }

  getUserSuppliableBalance(): BigNumber {
    if (this.sIcxSelected) {
      return this.persistenceService.getUserAssetCollateralBalance(CollateralAssetTag.sICX);
    }
    return this.persistenceService.getUserAssetBalance(this.asset.tag);
  }

  // show user asset if is either supplied, available to supply, borrowed or available to borrow
  shouldBeShown(): boolean {
    if (this.isAllMarketViewActive()) {
      return true;
    } else {
      return !this.persistenceService.userAssetSuppliedIsZero(this.asset.tag)
        || this.persistenceService.isAssetAvailableToSupply(this.asset.tag)
        || !this.persistenceService.userAssetBorrowedIsZero(this.asset.tag)
        || (this.calculationService.calculateAvailableBorrowForAsset(this.asset.tag).isGreaterThan(Utils.ZERO));
    }
  }

  getSupplyRateForActiveMarket(): BigNumber {
    if (this.dynamicSupplyApyActive) {
      return this.dynamicSupplyApy;
    }
    return this.getUserSupplyApy();
  }

  getBorrowRateForActiveMarket(): BigNumber {
    if (this.dynamicBorrowApyActive) {
      return this.dynamicBorrowApy;
    }
    return this.isAllMarketViewActive() ? this.getMarketBorrowRate() : this.getUserBorrowApy();
  }

  shouldHideSupplyContent(): boolean {
    return this.userAssetBalanceIsZero() && this.userAssetSuppliedBalanceIsZero() || !this.userLoggedIn();
  }

  shouldHideBorrowContent(): boolean {
    return this.persistenceService.userHasNotSuppliedAnyAsset() || this.shouldHideBorrowSlider() || this.isAssetOmm();
  }

  calculateDynamicDailySupplyInterest(assetTag: AssetTag | CollateralAssetTag, amountBeingSupplied?: BigNumber): BigNumber {
    return this.calculationService.calculateUsersDailySupplyInterestForAsset(assetTag, amountBeingSupplied);
  }

  getDailyBorrowInterest(amountBeingBorrowed?: BigNumber): BigNumber {
    return this.calculationService.calculateUsersDailyBorrowInterestForAsset(this.asset.tag, amountBeingBorrowed);
  }

  userAssetBalanceIsZero(): boolean {
    return this.persistenceService.userAssetBalanceIsZero(this.asset.tag);
  }

  userAssetSuppliedBalanceIsZero(): boolean {
    return this.persistenceService.userAssetSuppliedIsZero(this.asset.tag);
  }

  userAssetBorrowedBalanceIsZero(): boolean {
    return this.persistenceService.userAssetBorrowedIsZero(this.asset.tag);
  }

  collapseAssetTableSlideUp(): void {
    // Collapse asset-user table`
    this.assetYourEl.classList.remove('active');
    $(this.marketExpandedEl).slideUp();
  }

  collapseAssetTable(): void {
    // Collapse asset-user table`
    this.assetYourEl.classList.remove('active');
    $(this.marketExpandedEl).slideUp();
  }

  removeAdjustClass(): void {
    // Remove adjust class
    this.removeClass(this.supplyEl, "adjust");
    this.removeClass(this.borrowEl, "adjust");
  }

  showDefaultActions(): void {
    // Show default actions
    this.removeClass(this.supplyAction1El, "hide");
    this.removeClass(this.borrowAction1El, "hide");

    this.addClass(this.supplyAction2El, "hide");
    this.addClass(this.borrowAction2El, "hide");
  }

  resetBorrowSliders(): void {
    this.setBorrowSliderValue(this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag));
    this.sliderBorrow.setAttribute("disabled", "");
  }

  resetBorrowInputs(): void {
    this.inputBorrowEl.setAttribute("disabled", "");
    this.inputBorrowAvailable.setAttribute("disabled", "");
  }

  resetSupplyInputs(): void {
    this.inputSupplyEl.setAttribute("disabled", "");
    this.inputSupplyAvailable.setAttribute("disabled", "");
  }

  disableAndResetSupplySlider(): void {
    // Disable asset-user supply sliders (Your markets)
    this.setSupplySliderValue(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag), !this.sIcxSelected);
    this.sliderSupply.setAttribute("disabled", "");
  }

  disableAndResetBorrowSlider(): void {
    // Disable asset-user borrow sliders (Your markets)
    this.setBorrowSliderValue(this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag));
    this.sliderBorrow.setAttribute("disabled", "");
  }


  disableInputs(): void {
    // Disable asset-user inputs (Your markets)
    this.inputSupplyEl.setAttribute("disabled", "");
    this.inputSupplyAvailable.setAttribute("disabled", "");
    this.inputBorrowEl.setAttribute("disabled", "");
    this.inputBorrowAvailable.setAttribute("disabled", "");
  }

  enableAssetBorrow(): void {
    this.inputBorrowEl.removeAttribute("disabled");
    this.sliderBorrow.removeAttribute("disabled");
    this.setBorrowSliderValue(this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag));
  }

  isAssetOmm(): boolean {
    return this.asset.tag === AssetTag.OMM;
  }

  shouldShowBorrowDeny(): boolean {
    return this.persistenceService.userHasNotSuppliedAnyAsset() || this.shouldHideBorrowSlider();
  }

  supplySliderMaxValue(): BigNumber {
    return new BigNumber(this.sliderSupply?.noUiSlider?.options.range.max ?? "0");
  }

  borrowSliderMaxValue(): BigNumber {
    const res = new BigNumber(this.sliderBorrow?.noUiSlider?.options.range.max ?? "0");
    return res.isNegative() ? new BigNumber("0") : res;
  }

  removeInputRedBorderClass(): void {
    // Remove red border class on input
    this.removeClass(this.inputSupplyEl, "red-border");
    this.removeClass(this.inputBorrowEl, "red-border");
  }

  updateRiskData(assetTag?: AssetTag, diff?: BigNumber, userAction?: UserAction, updateState = true, fullRedeem = false): BigNumber {
    const totalRisk = this.calculationService.calculateTotalRisk(assetTag, diff, userAction, updateState, fullRedeem);
    // Update the risk slider
    this.riskSlider?.noUiSlider.set(totalRisk.multipliedBy(new BigNumber("100")).dp(2).toNumber());

    return totalRisk;
  }

  isAssetAvailable(): boolean {
    return this.persistenceService.isAssetAvailableToSupply(this.asset.tag);
  }

  getAssetClass(): string {
    if (this.activeMarketView === ActiveViews.USER_MARKET) {
      return this.isAssetAvailable() ? 'asset-available' : 'your';
    } else {
      return "all";
    }
  }

  getTotalAssetBorrows(): BigNumber {
    return this.persistenceService.getTotalAssetBorrows(this.asset.tag).dp(0, BigNumber.ROUND_HALF_CEIL);
  }

  getTotalLiquidity(): BigNumber {
    const res = this.persistenceService.getAssetReserveData(this.asset.tag)?.totalLiquidity ?? new BigNumber("0");
    if (this.assetIsIcx && !this.sIcxSelected) {
      return this.convertSICXToICX(res).dp(0, BigNumber.ROUND_HALF_CEIL);
    } else {
      return res.dp(0, BigNumber.ROUND_HALF_CEIL);
    }
  }

  getTotalLiquidityUsd(): BigNumber {
    return this.persistenceService.getAssetReserveData(this.asset.tag)?.totalLiquidityUSD ?? new BigNumber(0);
  }

  getTotalBorrowUsd(): BigNumber {
    return this.persistenceService.getAssetReserveData(this.asset.tag)?.totalBorrowsUSD.dp(0, BigNumber.ROUND_HALF_CEIL)
      ?? new BigNumber(0);
  }

  assetRepayUsedPercentage(): BigNumber {
    if (this.userBorrowedAssetBalance.isLessThanOrEqualTo(Utils.ZERO)){
      return new BigNumber("0");
    }

    // return in percentage how much is "used", i.e. how much in percentage user still has to repay
    // user can not scroll below this percentage on repayment / borrow slider
    const borrowUsed = this.getBorrowUsed();
    return borrowUsed.isZero() ? new BigNumber("0") : borrowUsed.dividedBy(this.borrowSliderMaxValue()).multipliedBy(new BigNumber("100"));
  }

  getBorrowUsed(): BigNumber {
    const userCollateralAssetBalance = this.persistenceService.getUserAssetCollateralBalance(assetToCollateralAssetTag(this.asset.tag));
    const userAssetDebt = this.persistenceService.getUserAssetDebt(this.asset.tag);

    // if user has balance of collateral asset greater than the debt he has to repay return 0
    // else return the amount that is outstanding (debt - balance)
    return userCollateralAssetBalance.gte(userAssetDebt) ? new BigNumber("0") : userAssetDebt.minus(userCollateralAssetBalance);
  }

  // check if users balance is less than amount he has to repay
  isAssetBorrowUsed(): boolean {
    if (this.userBorrowedAssetBalance.eq(Utils.ZERO)){
      return false;
    }

    return this.persistenceService.getUserAssetCollateralBalance(assetToCollateralAssetTag(this.asset.tag)).isLessThan(
      this.persistenceService.getUserAssetDebt(this.asset.tag));
  }

  isAllMarketViewActive(): boolean {
    return this.activeMarketView === ActiveViews.ALL_MARKET;
  }

  getInputBorrowValue(): BigNumber {
    return new BigNumber(usLocale.from(this.inputBorrowEl?.value ?? "0"));
  }

  getInputSupplyValue(): BigNumber {
    return new BigNumber(usLocale.from(this.inputSupplyEl.value));
  }

  getMarketBorrowRate(): BigNumber {
    return this.ommApyChecked ? this.allMarketsBorrowApyPlusOmmApy : Utils.toNegative(this.allMarketsBorrowApy);
  }

  getMarketSupplyRate(): BigNumber {
    return this.ommApyChecked ? this.allMarketsSupplyApyPlusOmmApy : this.allMarketsSupplyApy;
  }

  getUserBorrowApy(): BigNumber {
    return this.ommApyChecked ? this.userMarketsBorrowApyPlusOmmApy : Utils.toNegative(this.userMarketsBorrowApy);
  }

  getUserSupplyApy(): BigNumber {
    return this.ommApyChecked ? this.userMarketsSupplyApyPlusOmmApy : this.userMarketsSupplyApy;
  }

  getUserTotalUnstakeAmount(): BigNumber {
    return this.persistenceService.getUserTotalUnstakeAmount();
  }

  getUserClaimableIcxAmount(): BigNumber {
    return this.persistenceService.userClaimableIcx ?? new BigNumber("0");
  }

  getAssetTagAdjusted(): string {
    return this.assetIsIcx ? "ICX / sICX" : this.asset.tag.toString();
  }

  getBorrowAssetTagAdjusted(): string {
    return this.assetIsIcx ? "sICX" : this.asset.tag.toString();
  }

  getInputPadding(inputSupply: boolean, tag?: string, el?: any): string {
    if (!tag || !el) {
      return "45px";
    }

    const decimals = Utils.countDecimals(el?.value);
    const unit = 5;
    const base = inputSupply ? (this.isAssetOmm() ? 50 : 40) : 35;

    const res =  base + (tag.length * unit + (tag.length > 3 ? 10 : -10));

    if (tag === "sICX") {
      return "55px";
    }

    return decimals > 0 ? res + 5 + "px" : res + 3 + "px";
  }

  isAssetIcx(assetTag?: AssetTag | CollateralAssetTag): boolean {
    return assetTag ? assetTag === AssetTag.ICX : this.asset.tag === AssetTag.ICX;
  }

  onClaimIcxClick(): void {
    const currentIcxBalance = this.persistenceService.getUserAssetBalance(AssetTag.ICX);
    const claimableIcx = this.getUserClaimableIcxAmount();
    const after = Utils.add(currentIcxBalance, claimableIcx);
    this.modalService.showNewModal(ModalType.CLAIM_ICX, new AssetAction(this.asset, currentIcxBalance, after, claimableIcx));
  }

  onIcxToggleClick(): void {
    this.stateChangeService.sIcxSelectedUpdate(false);

  }

  onSIcxToggleClick(): void {
    this.stateChangeService.sIcxSelectedUpdate(true);
  }

  shouldHideSupplySlider(): boolean {
    return DEFAULT_SLIDER_MAX === this.supplySliderMax;
  }

  shouldHideBorrowSlider(): boolean {
    return DEFAULT_SLIDER_MAX === this.borrowSliderMax;
  }

  supplyAssetTag(): AssetTag | CollateralAssetTag {
    return this.sIcxSelected ? CollateralAssetTag.sICX : this.asset.tag;
  }

  /**
   * Click handlers
   */

  /**
   * On sign in to supply click
   */
  onSignInClick(): void {
    this.collapseAssetTableSlideUp();
    this.modalService.showNewModal(ModalType.SIGN_IN);
  }

  /**
   * On Adjust cancel click
   */
  onAdjustCancelClick(): void {
    this.inputSupplyActive = false;
    this.inputBorrowActive = false;


    this.dynamicSupplyApyActive = false;
    this.dynamicSupplyApy = this.getUserSupplyApy();
    this.dynamicBorrowApyActive = false;
    this.dynamicBorrowApy = this.getUserBorrowApy();

    // Reset actions
    this.showDefaultActions();

    // Remove adjust
    this.removeAdjustClass();

    // Remove red border class on input
    this.removeInputRedBorderClass();

    // Reset user asset sliders
    this.setSupplySliderValue(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag), !this.sIcxSelected);
    this.setBorrowSliderValue(this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag));

    this.sliderSupply.setAttribute("disabled", "");
    this.sliderBorrow.setAttribute("disabled", "");

    // Disable asset-user inputs
    this.disableInputs();
  }

  /**
   * Borrow adjust
   */
  onBorrowAdjustClick(): void {
    this.inputSupplyActive = false;
    this.inputBorrowActive = true;

    this.dynamicSupplyApy = this.getUserSupplyApy();
    this.dynamicBorrowApy = this.getUserBorrowApy();
    this.dynamicSupplyApyActive = false;
    this.dynamicBorrowApyActive = true;

    /** Setup actions */
    this.addClass(this.borrowEl, "adjust");
    this.removeClass(this.supplyEl, "adjust");
    this.removeClass(this.supplyAction1El, "hide");
    this.addClass(this.supplyAction2El, "hide");
    this.addClass(this.borrowAction1El, "hide");
    this.removeClass(this.borrowAction2El, "hide");

    /** Reset Supply sliders */
    this.disableAndResetSupplySlider();

    /** Reset Supply inputs */
    this.resetSupplyInputs();

    /** Enable Borrow of asset-user */
    this.enableAssetBorrow();
  }

  /**
   * Supply adjust
   */
  onSupplyAdjustClick(): void {
    this.inputSupplyActive = true;
    this.inputBorrowActive = false;

    this.dynamicSupplyApy = this.getUserSupplyApy();
    this.dynamicBorrowApy = this.getUserBorrowApy();
    this.dynamicSupplyApyActive = true;
    this.dynamicBorrowApyActive = false;

    /** Setup actions */
    this.addClass(this.supplyEl, "adjust");
    this.removeClass(this.borrowEl, "adjust");
    this.addClass(this.supplyAction1El, "hide");
    this.removeClass(this.supplyAction2El, "hide");
    this.removeClass(this.borrowAction1El, "hide");
    this.addClass(this.borrowAction2El, "hide");

    /** Reset Borrow sliders */
    this.resetBorrowSliders();

    /** Reset Borrow inputs */
    this.resetBorrowInputs();

    /** Enable Supply inputs of asset-user */
    this.inputSupplyEl.removeAttribute("disabled");
    this.sliderSupply.removeAttribute("disabled");

    // set supply slider value
    this.setSupplySliderValue(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag), !this.sIcxSelected);
  }


  /**
   * Asset expand logic
   */
  onAssetClick(): void {
    // trigger resize
    this.updateApyCharts();

    this.inputSupplyActive = false;
    this.inputBorrowActive = false;

    // reset sliders
    this.disableAndResetSupplySlider();
    this.disableAndResetBorrowSlider();

    /** Layout */

    if (this.index === 0) {
      // Expand asset-user table
      this.assetYourEl.classList.toggle('active');
      $(this.marketExpandedEl).slideToggle();
    }

    // Collapse other assets table
    this.collOtherAssetTables.emit(this.asset.tag);

    if (this.index !== 0) {
      this.assetYourEl.classList.toggle('active');
      $(this.marketExpandedEl).slideToggle();
    }

    /** Set everything to default */

    // Show default actions
    this.showDefaultActions();

    // Remove adjust class
    this.removeAdjustClass();

    // Remove red border class on input
    this.removeInputRedBorderClass();

    // Reset user asset sliders
    this.setSupplySliderValue(this.persistenceService.getUserSuppliedAssetBalance(this.asset.tag), !this.sIcxSelected);
    this.setBorrowSliderValue(this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(this.asset.tag));

    // disable inputs
    this.disableInputs();

    this.resetChartsView();
  }



  /**
   * Logic to trigger on supply amount change after 1 sec of user keyup
   */
  onInputSupplyLostFocus(): void {
    this.delay(() => {
      const value = this.getInputSupplyValue();

      if (value.isGreaterThan(this.supplySliderMaxValue())) {
        this.inputSupplyEl.classList.add("red-border");
      } else {
        // reset border color if it passes the check
        this.inputSupplyEl.classList.remove("red-border");
        // set slider value
        this.setSupplySliderValue(value);
      }
    }, 1250 );
  }

  /**
   * Logic to trigger on borrow amount change after 1 sec of user keyup
   */
  onInputBorrowLostFocus(): void {
    this.delay(() => {
      const value = this.getInputBorrowValue();

      // stop slider on min (do not allow to go below "Used" repayment a.k.a user available balance of asset)
      const borrowUsed = this.getBorrowUsed();
      if (!borrowUsed.isZero()) {
        if (value.isLessThan(borrowUsed)) {
          const newValue = borrowUsed.dp(2);
          this.inputBorrowEl.value = Utils.formatNumberToUSLocaleString(borrowUsed);
          this.sliderBorrow.noUiSlider.set(newValue.toNumber());
          return;
        }
      }

      if (value.isGreaterThan(this.borrowSliderMaxValue())) {
        this.inputBorrowEl.classList.add("red-border");
      } else {
        // reset border color if it passes the check
        this.inputBorrowEl.classList.remove("red-border");
        // set slider value
        this.setBorrowSliderValue(value);
      }
    }, 1250 );
  }


  /**
   * Logic to trigger when user clicks confirm of asset-user supply
   */
  onAssetSupplyConfirmClick(): void {
    let value = this.getInputSupplyValue().dp(2);

    // check that supplied value is not greater than max
    const max = this.supplySliderMaxValue();
    if (value.isGreaterThan(max)) {
      value = max;
      this.setSupplySliderValue(value);
      return;
    }

    const currentlySupplied = this.getUserSuppliedAssetBalance();

    // calculate the difference
    const supplyAmountDiff = Utils.subtract(value, currentlySupplied);

    const after = value;
    const amount = supplyAmountDiff.abs();
    const risk = this.getCurrentDynamicRisk();

    const asset = this.sIcxSelected ? Asset.getAdjustedAsset(CollateralAssetTag.sICX, this.asset) : this.asset;
    if (supplyAmountDiff.isGreaterThan(Utils.ZERO)) {
      this.modalService.showNewModal(ModalType.SUPPLY, new AssetAction(asset, currentlySupplied, after, amount, risk));
    } else if (supplyAmountDiff.isLessThan(Utils.ZERO)) {
      this.modalService.showNewModal(ModalType.WITHDRAW, new AssetAction(asset, currentlySupplied, after, amount, risk));
    } else {
      this.notificationService.showNewNotification("No change in supplied value.");
      return;
    }
  }

  /**
   * Logic to trigger when user clicks confirm of asset-user borrow
   */
  onAssetBorrowConfirmClick(): void {
    let value = this.getInputBorrowValue().dp(2);

    // check that borrowed value is not greater than max
    const max = this.borrowSliderMaxValue();
    if (value.isGreaterThan(max)) {
      value = max;
      this.setBorrowSliderValue(value);
      return;
    }

    const currentlyBorrowed = this.userBorrowedAssetBalance;

    // calculate the difference and fix to 2 decimals
    const borrowAmountDiff = Utils.subtract(value, currentlyBorrowed);
    const after = value;
    let amount = borrowAmountDiff.abs();
    const risk = this.getCurrentDynamicRisk();

    if (borrowAmountDiff.isGreaterThan(Utils.ZERO)) {
      this.modalService.showNewModal(ModalType.BORROW, new AssetAction(this.asset, currentlyBorrowed , after, amount, risk));
    } else if (borrowAmountDiff.isLessThan(Utils.ZERO)) {
      // full repayment
      if (after.isZero()) {
        amount = currentlyBorrowed;
        log.debug("FULL REPAYMENT currentlyBorrowed = " + currentlyBorrowed.toString());
      }

      this.modalService.showNewModal(ModalType.REPAY, new AssetAction(this.asset, currentlyBorrowed , after, amount, risk));
    }  else {
      this.notificationService.showNewNotification("No change in borrowed value.");
      return;
    }
  }

}
