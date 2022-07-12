import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import BigNumber from "bignumber.js";
import {StateChangeService} from "../../../services/state-change/state-change.service";
import {CalculationsService} from "../../../services/calculations/calculations.service";
import {PersistenceService} from "../../../services/persistence/persistence.service";
import {BaseClass} from "../../base-class";
import {Utils} from "../../../common/utils";
import {UserPoolData} from "../../../models/classes/UserPoolData";
import log from "loglevel";
import {Subscription} from "rxjs";

declare var $: any;

@Component({
  selector: 'app-your-pool-row',
  templateUrl: './your-pool-row.component.html'
})
export class YourPoolRowComponent extends BaseClass implements OnInit, OnDestroy {

  dailyRewardEl: any; @ViewChild("dailyRew")set a(a: ElementRef) {this.dailyRewardEl = a.nativeElement; }
  dailyRewardUSDEl: any; @ViewChild("dailyRewUSD")set b(b: ElementRef) {this.dailyRewardUSDEl = b.nativeElement; }
  poolEl: any; @ViewChild("pool")set c(c: ElementRef) {this.poolEl = c.nativeElement; }
  liquidityAprEl: any; @ViewChild("liqApr")set d(d: ElementRef) {this.liquidityAprEl = d.nativeElement; }

  @Input() poolData!: UserPoolData;

  @Output() poolClickUpdate = new EventEmitter<UserPoolData>();

  /**
   * Template values
   */
  poolPairClassName = "";
  poolPrettyName = "";
  poolQuoteAssetName = "";
  userSuppliedBase = new BigNumber(0);
  userSuppliedQuote = new BigNumber(0);
  userStakedBalance = new BigNumber(0);
  userAvailableBalance = new BigNumber(0);
  userDailyRewards = new BigNumber(0);
  userDailyRewardsUSD = new BigNumber(0);
  userPoolLiquidityApr = new BigNumber(0);
  userHasLpTokenAvailableOrHasStaked = false;

  collapseYourPoolsTablesSub?: Subscription;

  constructor(private stateChangeService: StateChangeService,
              private calculationService: CalculationsService,
              public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initCoreValues();
    this.initUserValues();
    this.subscribeToCoreDataChange();
    this.subscribeToUserDataChange();
    this.subscribeToCollapseOtherPoolTablesChange();
  }

  ngOnDestroy(): void {
    this.collapseYourPoolsTablesSub?.unsubscribe();
  }

  subscribeToCollapseOtherPoolTablesChange(): void {
    this.collapseYourPoolsTablesSub = this.stateChangeService.collapseYourPoolsTablesChange$.subscribe(activePool => {
      if (activePool && activePool.poolId.isEqualTo(this.poolData.poolId)) {
        this.poolEl.classList.toggle("active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideToggle();
      } else {
        this.removeClass(this.poolEl, "active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideUp();
        this.resetDynamicValues();
      }
    });
  }

  subscribeToCoreDataChange(): void {
    this.stateChangeService.afterCoreDataReload$.subscribe(() => {
      this.initCoreValues();
      this.initUserValues();
    });
  }

  subscribeToUserDataChange(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      this.initCoreValues();
      this.initUserValues();
    });
  }

  initCoreValues(): void {
    this.poolPairClassName = this.poolData.pairClassName;
    this.poolPrettyName = this.poolData.prettyName;
    this.poolQuoteAssetName = this.poolData.quoteAssetName;
  }

  initUserValues(): void {
    if (this.userLoggedIn()) {
      this.userSuppliedBase = this.getUserSuppliedBase(this.poolData);
      this.userSuppliedQuote = this.getUserSuppliedQuote(this.poolData);
      this.userStakedBalance = this.poolData.userStakedBalance;
      this.userAvailableBalance = this.poolData.userAvailableBalance;
      this.userDailyRewards = this.getUserDailyRewards(this.poolData);
      this.userDailyRewardsUSD = this.getUserDailyRewardsUSD(this.poolData);
      this.userPoolLiquidityApr = this.getUserPoolLiquidityApr(this.poolData);
      this.userHasLpTokenAvailableOrHasStaked = this.persistenceService.getUserPoolStakedAvailableBalance(this.poolData.poolId)
        .isGreaterThan(Utils.ZERO) || this.persistenceService.getUserPoolStakedBalance(this.poolData.poolId).isGreaterThan(Utils.ZERO);
    }
  }

  resetDynamicValues(): void {
    console.log(`${this.poolData.prettyName} resetDynamicValues...`);
    this.setText(this.liquidityAprEl, `${Utils.to2DecimalRndOffPercString(this.userPoolLiquidityApr)}`);
    this.setText(this.dailyRewardEl, `${Utils.tooUSLocaleString(Utils.roundOffTo2Decimals(this.userDailyRewards))} OMM`);
    this.setText(this.dailyRewardUSDEl, `${Utils.toDollarUSLocaleString(Utils.roundOffTo2Decimals(this.userDailyRewardsUSD))}`);
  }

  handlePoolSliderValueUpdate(data: { value: BigNumber, poolData: UserPoolData | undefined}): void {
    if (data.poolData && !data.value.isEqualTo(this.userStakedBalance)) {
      const newLpDailyRewards = this.calculationService.calculateDynamicUserPoolDailyReward(data.value, data.poolData,
        this.getUserDailyRewards(data.poolData));

      const newLpDailyRewardsUSD = newLpDailyRewards.multipliedBy(this.persistenceService.ommPriceUSD);

      const newLpApr = this.calculationService.calculateDynamicUserPoolApr(data.value, data.poolData, newLpDailyRewards);
      log.debug(`newLpApr = ${newLpApr}`);


      this.setText(this.liquidityAprEl, `${Utils.to2DecimalRndOffPercString(newLpApr)}`);
      this.setText(this.dailyRewardEl, `${Utils.tooUSLocaleString(Utils.roundOffTo2Decimals(newLpDailyRewards))} OMM`);
      this.setText(this.dailyRewardUSDEl, `${Utils.toDollarUSLocaleString(Utils.roundOffTo2Decimals(newLpDailyRewardsUSD))}`);
    }
  }

  onPoolClick(poolData: UserPoolData): void {
    this.poolClickUpdate.emit(poolData);
  }

  getUserSuppliedBase(poolData: UserPoolData): BigNumber {
    return this.calculationService.calculateUserPoolSupplied(poolData);
  }

  getUserSuppliedQuote(poolData: UserPoolData): BigNumber {
    return this.calculationService.calculateUserPoolSupplied(poolData, false);
  }

  getUserDailyRewards(poolData: UserPoolData): BigNumber {
    const userDailyOmmRewards: any = this.persistenceService.userDailyOmmRewards;
    if (userDailyOmmRewards) {
      return userDailyOmmRewards[poolData.cleanPoolName] ?? new BigNumber(0);
    } else {
      return new BigNumber(0);
    }
  }

  getUserDailyRewardsUSD(poolData: UserPoolData): BigNumber {
    return this.getUserDailyRewards(poolData).multipliedBy(this.persistenceService.ommPriceUSD);
  }

  getUserPoolLiquidityApr(poolData: UserPoolData): BigNumber {
    return this.calculationService.calculateUserPoolLiquidityApr(poolData);
  }

  onStakeSliderCancelClicked(): void {
    this.resetDynamicValues();
  }
}
