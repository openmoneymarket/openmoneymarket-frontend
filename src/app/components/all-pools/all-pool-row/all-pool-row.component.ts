import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Utils} from "../../../common/utils";
import {PoolData} from "../../../models/classes/PoolData";
import BigNumber from "bignumber.js";
import {environment} from "../../../../environments/environment";
import {StateChangeService} from "../../../services/state-change/state-change.service";
import {CalculationsService} from "../../../services/calculations/calculations.service";
import {PersistenceService} from "../../../services/persistence/persistence.service";
import {BaseClass} from "../../base-class";
import {Subscription} from "rxjs";
import log from "loglevel";

declare var $: any;

@Component({
  selector: 'app-all-pool-row',
  templateUrl: './all-pool-row.component.html'
})
export class AllPoolRowComponent extends BaseClass implements OnInit, OnDestroy {

  poolEl: any; @ViewChild("pool")set c(c: ElementRef) {this.poolEl = c.nativeElement; }

  @Input() poolData!: PoolData;

  @Output() poolClickUpdate = new EventEmitter<PoolData>();

  /**
   * Template values
   */
  poolPairClassName = "";
  poolPrettyName = "";
  poolQuoteAssetName = "";
  totalSuppliedBase = new BigNumber(0);
  totalSuppliedQuote = new BigNumber(0);
  totalLpTokens = new BigNumber(0);
  dailyRewards = new BigNumber(0);
  dailyRewardsUSD = new BigNumber(0);
  poolLiquidityApr = new BigNumber(0);
  userHasLpTokenAvailableOrHasStaked = false;

  collapseAllPoolsTablesSub?: Subscription;

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
    this.collapseAllPoolsTablesSub?.unsubscribe();
  }

  subscribeToCollapseOtherPoolTablesChange(): void {
    this.collapseAllPoolsTablesSub = this.stateChangeService.collapseAllPoolsTablesChange$.subscribe(activePool => {
      if (activePool && activePool.poolId.isEqualTo(this.poolData.poolId)) {
        this.poolEl.classList.toggle("active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideToggle();
      } else {
        this.removeClass(this.poolEl, "active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideUp();
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
    log.debug("All pool row init:");
    this.totalSuppliedBase = this.getTotalSuppliedBase(this.poolData);
    this.totalSuppliedQuote = this.getTotalSuppliedQuote(this.poolData);
    this.totalLpTokens = this.getTotalLpTokens(this.poolData);
    this.dailyRewards = this.getDailyRewards(this.poolData);
    this.dailyRewardsUSD = this.getDailyRewardsUSD(this.poolData);
    this.poolLiquidityApr = this.getPoolLiquidityApr(this.poolData);
  }

  initUserValues(): void {
    if (this.userLoggedIn()) {
      this.userHasLpTokenAvailableOrHasStaked = this.persistenceService.getUserPoolStakedAvailableBalance(this.poolData.poolId)
        .isGreaterThan(Utils.ZERO) || this.persistenceService.getUserPoolStakedBalance(this.poolData.poolId).isGreaterThan(Utils.ZERO);
    }
  }

  onPoolClick(poolData: PoolData): void {
    this.poolClickUpdate.emit(poolData);
  }

  getTotalSuppliedBase(poolData: PoolData): BigNumber {
    const res = this.calculationService.calculatePoolTotalSupplied(poolData);
    log.debug(`${this.poolData.prettyName} total supplied base token = ${res}`);
    return res.dp(0, BigNumber.ROUND_HALF_CEIL);
  }

  getTotalSuppliedQuote(poolData: PoolData): BigNumber {
    const res = this.calculationService.calculatePoolTotalSupplied(poolData, false);
    log.debug(`${this.poolData.prettyName} total supplied quote token = ${res}`);
    return this.calculationService.calculatePoolTotalSupplied(poolData, false).dp(0, BigNumber.ROUND_HALF_CEIL);
  }

  getTotalLpTokens(poolData: PoolData): BigNumber {
    return poolData.totalStakedBalance.dp(0, BigNumber.ROUND_HALF_CEIL);
  }

  getDailyRewards(poolData: PoolData): BigNumber {
    return this.calculationService.calculateDailyRewardsForPool(poolData);
  }

  getDailyRewardsUSD(poolData: PoolData): BigNumber {
    return this.calculationService.calculateDailyRewardsForPool(poolData).multipliedBy(this.persistenceService.ommPriceUSD);
  }

  getPoolLiquidityApr(poolData: PoolData): BigNumber {
    return this.calculationService.calculatePoolLiquidityApr(poolData);
  }

  isProduction(): boolean {
    return environment.production;
  }
}
