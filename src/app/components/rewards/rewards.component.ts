import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {ActiveLiquidityOverview, ActiveLiquidityPoolsView} from "../../models/enums/ActiveViews";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {Utils} from "../../common/utils";
import {ModalType} from "../../models/enums/ModalType";
import {AssetAction, ClaimOmmDetails} from "../../models/classes/AssetAction";
import {Asset, AssetClass, AssetName, AssetTag, supportedAssetsMap} from "../../models/classes/Asset";
import {ModalService} from "../../services/modal/modal.service";
import {PoolData} from "../../models/classes/PoolData";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {UserPoolData} from "../../models/classes/UserPoolData";
import {ModalAction} from "../../models/classes/ModalAction";
import {OmmTokenBalanceDetails} from "../../models/classes/OmmTokenBalanceDetails";
import BigNumber from "bignumber.js";
import {LockDate} from "../../models/enums/LockDate";
import {OmmLockingComponent} from "../omm-locking/omm-locking.component";
import {IMarketBoosterData} from "../../models/Interfaces/IMarketBoosterData";
import {ILiquidityBoosterData} from "../../models/Interfaces/ILiquidityBoosterData";
import log from "loglevel";
import {OmmLockingCmpType} from "../../models/enums/OmmLockingComponent";
import {AllPoolsComponent} from "../all-pools/all-pools.component";
import {YourPoolsComponent} from "../your-pools/your-pools.component";
import {Times} from "../../common/constants";
import {ManageStakedIcxAction} from "../../models/classes/ManageStakedIcxAction";


@Component({
  selector: 'app-liquidity',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent extends BaseClass implements OnInit, OnDestroy, AfterViewInit {

  TAG = "[RewardsComponent]";

  toggleYourPoolsEl: any; @ViewChild("toggYourPools")set a(a: ElementRef) {this.toggleYourPoolsEl = a.nativeElement; }
  toggleAllPoolsEl: any; @ViewChild("toggAllPools") set b(b: ElementRef) {this.toggleAllPoolsEl = b.nativeElement; }
  lockDailyRewardsEl: any; @ViewChild("lockDailyRew") set e(e: ElementRef) {this.lockDailyRewardsEl = e?.nativeElement; }
  lockAprEl: any; @ViewChild("lockApr") set f(f: ElementRef) {this.lockAprEl = f?.nativeElement; }
  marketBoosterFromEl?: any; @ViewChild("mrktBoosterFrom") set g(g: ElementRef) {this.marketBoosterFromEl = g?.nativeElement; }
  marketBoosterToEl?: any; @ViewChild("mrktBoosterTo") set h(h: ElementRef) {this.marketBoosterToEl = h?.nativeElement; }
  liquidityBoosterFromEl?: any; @ViewChild("liqBoosterFrom") set i(i: ElementRef) {this.liquidityBoosterFromEl = i?.nativeElement; }
  liquidityBoosterToEl?: any; @ViewChild("liqBoosterTo") set j(j: ElementRef) {this.liquidityBoosterToEl = j?.nativeElement; }

  @ViewChild(OmmLockingComponent) ommLockingComponent?: OmmLockingComponent;
  @ViewChild(AllPoolsComponent) allPoolsComponent?: AllPoolsComponent;
  @ViewChild(YourPoolsComponent) yourPoolsComponent?: YourPoolsComponent;

  public activeLiquidityOverview: ActiveLiquidityOverview = this.userLoggedIn() ? ActiveLiquidityOverview.YOUR_LIQUIDITY :
    ActiveLiquidityOverview.ALL_LIQUIDITY;
  public activeLiquidityPoolView: ActiveLiquidityPoolsView = this.userLoggedIn() ? ActiveLiquidityPoolsView.YOUR_POOLS :
    ActiveLiquidityPoolsView.ALL_POOLS;

  userOmmTokenBalanceDetails?: OmmTokenBalanceDetails;

  marketBoosterData?: IMarketBoosterData;
  liquidityBoosterData?: ILiquidityBoosterData;

  lockingAprFrom = new BigNumber(0);
  lockingAprTo = new BigNumber(0);

  userLockingApr = new BigNumber(0);
  userDailyLockingOmmRewards = new BigNumber(0);

  lockAdjustActive = false;

  constructor(public persistenceService: PersistenceService,
              private stateChangeService: StateChangeService,
              private modalService: ModalService,
              private calculationService: CalculationsService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initCoreStaticValues();
    this.initUserStaticValues();

    this.registerSubscriptions();

    // pop up manage staked omm
    this.popupStakedMigrationModal();
  }

  ngOnDestroy(): void {
  }

  ngAfterViewInit(): void {

  }

  initCoreStaticValues(): void {
    this.lockingAprFrom = this.calculationService.calculateLockingAprFrom();
    this.lockingAprTo = this.calculationService.calculateLockingAprTo();
  }

  initUserStaticValues(): void {
    if (this.userLoggedIn()) {
      this.marketBoosterData = this.calculationService.calculateUserbOmmMarketBoosters();
      this.liquidityBoosterData = this.calculationService.calculateUserbOmmLiquidityBoosters();
      this.userLockingApr = this.calculationService.calculateUserLockingApr(this.persistenceService.userbOmmBalance);
      this.userOmmTokenBalanceDetails = this.persistenceService.userOmmTokenBalanceDetails?.getClone();
      this.userDailyLockingOmmRewards = this.calculationService.calculateUserDailyLockingOmmRewards();

      this.ommLockingComponent?.onLockAdjustCancelClick();
    }
  }


  popupStakedMigrationModal(): void {
    // pop up manage staked omm
    if (this.userLoggedIn() && this.persistenceService.getUserStakedOmmBalance().gt(0)) {
      // default migration locking period is 1 week
      const lockTime = this.calculationService.recalculateLockPeriodEnd(Utils.timestampNowMilliseconds().plus(Times.WEEK_IN_MILLISECONDS));
      const amount = this.persistenceService.getUserStakedOmmBalance();
      this.modalService.showNewModal(ModalType.MANAGE_STAKED_OMM, undefined, undefined, undefined,
        undefined, undefined, new ManageStakedIcxAction(amount, lockTime));
    }
  }


  /**
   * Click event handlers
   */

  onClaimOmmRewardsClick(): void {
    this.ommLockingComponent?.onLockAdjustCancelClick();

    const rewards = (this.persistenceService.userAccumulatedOmmRewards?.total ?? new BigNumber("0")).dp(2);

    if (rewards.isLessThanOrEqualTo(Utils.ZERO)) {
      return;
    }

    const before = (this.persistenceService.userOmmTokenBalanceDetails?.totalBalance ?? new BigNumber("0")).dp(2);
    const after = Utils.add(before, rewards);
    this.modalService.showNewModal(ModalType.CLAIM_OMM_REWARDS, new AssetAction(new Asset(AssetClass.USDS, AssetName.USDS, AssetTag.USDS),
      before, after, rewards, undefined, new ClaimOmmDetails(this.persistenceService.userAccumulatedOmmRewards)));
  }

  // On "Lock up OMM" or "Adjust" click
  onLockAdjustClick(): void {
    this.lockAdjustActive = true;
    this.collapseAllPoolTables();
  }

  handleLockAdjustCancelClicked(): void {
    this.lockAdjustActive = false;
    this.resetUserDailyRewards();
    this.resetUserLockApr();
    this.resetMarketAndLiquidityBoosters();
  }

  onYourLiquidityClick(): void {
    this.activeLiquidityOverview = ActiveLiquidityOverview.YOUR_LIQUIDITY;
  }

  onAllLiquidityClick(): void {
    this.activeLiquidityOverview = ActiveLiquidityOverview.ALL_LIQUIDITY;
  }

  onYourPoolsClick(): void {
    this.ommLockingComponent?.onLockAdjustCancelClick();
    this.collapseAllPoolTables();
    this.activeLiquidityPoolView = ActiveLiquidityPoolsView.YOUR_POOLS;
  }

  onAllPoolsClick(): void {
    this.ommLockingComponent?.onLockAdjustCancelClick();
    this.collapseAllPoolTables();
    this.activeLiquidityPoolView = ActiveLiquidityPoolsView.ALL_POOLS;
  }

  collapseAllPoolTables(): void {
    console.log("collapseAllPoolTables...");
    console.log(this.yourPoolsComponent);

    // collapse all pools tables
    this.stateChangeService.collapseOtherPoolTablesUpdate(undefined);
    this.stateChangeService.collapseYourPoolTablesUpdate(undefined);
  }

  onPoolClick(poolData: UserPoolData | PoolData): void {
    console.log("Rewards onPoolClick..");
    // collapse other pools expanded up
    if (poolData instanceof PoolData) {
      this.stateChangeService.collapseOtherPoolTablesUpdate(poolData);
    } else {
      this.stateChangeService.collapseYourPoolTablesUpdate(poolData);
    }


    this.ommLockingComponent?.onLockAdjustCancelClick();
  }

  /**
   * Subscriptions
   */

  private registerSubscriptions(): void {
    this.subscribeToAfterUserDataReload();
    this.subscribeToAfterCoreDataReload();
    this.subscribeToLoginChange();
    this.subscribeToUserModalActionChange();
  }

  public subscribeToAfterCoreDataReload(): void {
    this.stateChangeService.afterCoreDataReload$.subscribe(() => {
      this.initCoreStaticValues();
    });
  }

  public subscribeToAfterUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      this.initUserStaticValues();
    });
  }

  private subscribeToUserModalActionChange(): void {
    // User confirmed the modal action
    this.stateChangeService.userModalActionChange.subscribe((modalAction?: ModalAction) => {
      this.ommLockingComponent?.onLockAdjustCancelClick();
      this.collapseAllPoolTables();
    });
  }

  private subscribeToLoginChange(): void {
    this.stateChangeService.loginChange.subscribe(wallet => {
      if (wallet) {
        // pop up manage staked omm
        this.popupStakedMigrationModal();

        // user login
        this.onYourLiquidityClick();
        this.onYourPoolsClick();
      } else {
        // user logout
        this.onAllLiquidityClick();
        this.onAllPoolsClick();
      }
    });
  }

  /**
   * Getters, setters and checks
   */

  handleLockSliderValueUpdate(value: number): void {
    const bigNumValue = new BigNumber(value);

    if (this.userLoggedIn() && !this.userLockedOmmBalance().eq(bigNumValue.dp(0))) {
      // Update dynamic User daily Omm rewards
      if (this.lockDailyRewardsEl) {
        this.updateUserDailyRewards(bigNumValue);
      }

      // Update dynamic User lock APR
      if (this.lockAprEl) {
        this.updateUserLockApr(bigNumValue);
      }

      this.updateLiquidityAndMarketBoosters(bigNumValue);
    }
  }

  shouldHideClaimBtn(): boolean {
    const userOmmRewardsTotal = this.persistenceService.userAccumulatedOmmRewards?.total ?? new BigNumber("0");
    return userOmmRewardsTotal.isLessThanOrEqualTo(Utils.ZERO) || !this.persistenceService.userOmmTokenBalanceDetails;
  }

  getUserMarketRewards(): BigNumber {
    return this.persistenceService.userAccumulatedOmmRewards?.reserve.total ?? new BigNumber("0");
  }

  getUserLockingRewards(): BigNumber {
    return this.persistenceService.userAccumulatedOmmRewards?.OMMLocking?.total ?? new BigNumber("0");
  }

  getUserLiquidityRewards(): BigNumber {
    return this.persistenceService.userAccumulatedOmmRewards?.liquidity?.total ?? new BigNumber("0");
  }

  getAllPoolsData(): PoolData[] {
    return this.persistenceService.allPools ?? [];
  }

  getUserPoolsData(): UserPoolData[] {
    return this.persistenceService.userPools ?? [];
  }

  // check if user has Omm that has been unlocked
  userHasOmmUnlocked(): boolean {
    // if user locked Omm is greater than zero and end timestamp has passed return true
    return this.persistenceService.userLockedOmm ? this.persistenceService.userLockedOmm.amount.gt(0) &&
      this.persistenceService.userLockedOmm.end.lt(Utils.timestampNowMicroseconds()) : false;
  }

  getOmmLckCmpType(): OmmLockingCmpType {
    return OmmLockingCmpType.REWARDS;
  }

  userHasStakedOrAvailableToAnyPool(): boolean {
    for (const poolData of this.getUserPoolsData()) {
      if (poolData.userStakedBalance.isGreaterThan(Utils.ZERO) || poolData.userAvailableBalance.isGreaterThan(Utils.ZERO)) {
        return true;
      }
    }

    return false;
  }

  getDailyRewards(poolData: PoolData): BigNumber {
    return this.calculationService.calculateDailyRewardsForPool(poolData);
  }

  getTotalDailyRewards(): BigNumber {
    return this.persistenceService.dailyRewardsAllPoolsReserves?.total ?? new BigNumber("0");
  }

  getDailyMarketRewards(): BigNumber {
    return this.persistenceService.dailyRewardsAllPoolsReserves?.reserve.total ?? new BigNumber("0");
  }

  getDailyOmmLockingRewards(): BigNumber {
    return this.persistenceService.dailyRewardsAllPoolsReserves?.OMMLocking?.total ?? new BigNumber("0");
  }

  getDailyLiquidityRewards(): BigNumber {
    return this.persistenceService.dailyRewardsAllPoolsReserves?.liquidity?.total ?? new BigNumber("0");
  }

  isAllPoolsActive(): boolean {
    return this.activeLiquidityPoolView === ActiveLiquidityPoolsView.ALL_POOLS;
  }

  isAllLiquidityOverviewActive(): boolean {
    return this.activeLiquidityOverview === ActiveLiquidityOverview.ALL_LIQUIDITY;
  }

  getUserOmmRewardsBalance(): BigNumber {
    return this.persistenceService.getUserOmmRewardsBalance();
  }

  /**
   * BOOSTED OMM
   */

  lockingApr(): string {
    let lockingAprFrom = this.lockingAprFrom;
    let lockingAprTo = this.lockingAprTo;
    lockingAprFrom = lockingAprFrom.gt(1) ? lockingAprFrom.dp(2) : lockingAprFrom;
    lockingAprTo = lockingAprTo.gt(1) ? lockingAprTo.dp(2) : lockingAprTo;

    if (!lockingAprTo.isZero()) {
      return `${this.to2DecimalRndOffPercString(lockingAprFrom)} - ${this.to2DecimalRndOffPercString(lockingAprTo)} APR`;
    } else {
      return "-";
    }
  }

  getUserLockingApr(): BigNumber {
    return this.userLockingApr.gt(1) ? this.userLockingApr.dp(2) : this.userLockingApr;
  }

  showBoostedOmmDailyRewardsOmmAmount(): boolean {
    return this.userLoggedIn() && (this.userHasLockedOmm() || (this.ommLockingComponent?.isLockAdjustActive() ?? false));
  }

  userHasLockedOmm(): boolean {
    return this.persistenceService.getUsersLockedOmmBalance().gt(0);
  }

  userLockedOmmBalance(): BigNumber {
    return this.persistenceService.getUsersLockedOmmBalance();
  }

  liquidityMultipliersAreEqual(): boolean {
    return this.liquidityBoosterData ?  this.liquidityBoosterData.from.eq(this.liquidityBoosterData.to) : false;
  }

  marketMultipliersAreEqual(): boolean {
    return this.marketBoosterData?.from.eq(this.marketBoosterData?.to) ?? false;
  }

  updateLiquidityAndMarketBoosters(newLockedOmmAmount: BigNumber): void {
    this.updateDynamicMarketBoosters(newLockedOmmAmount);
    this.updateDynamicLiquidityBoosters(newLockedOmmAmount);
  }

  calculateDynamicBorrowMarketMultiplier(newLockedOmmAmount: BigNumber, assetTag: AssetTag): BigNumber {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(newLockedOmmAmount,
      this.ommLockingComponent!.selectedLockTimeInMillisec);
    return this.calculationService.calculateDynamicMarketRewardsBorrowMultiplier(assetTag, newUserbOmmBalance);
  }

  calculateDynamicSupplyMarketMultiplier(newLockedOmmAmount: BigNumber, assetTag: AssetTag): BigNumber {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(newLockedOmmAmount,
      this.ommLockingComponent!.selectedLockTimeInMillisec);
    return this.calculationService.calculateDynamicMarketRewardsSupplyMultiplier(assetTag, newUserbOmmBalance);
  }

  calculateDynamicLiquidityMultiplier(newLockedOmmAmount: BigNumber, poolId: string): BigNumber {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(newLockedOmmAmount,
      this.ommLockingComponent!.selectedLockTimeInMillisec);
    return this.calculationService.calculateDynamicLiquidityRewardsMultiplier(new BigNumber(poolId), newUserbOmmBalance);
  }

  fromToIsEmpty(fromTo?: { from: BigNumber, to: BigNumber}): boolean {
    if (!fromTo || !this.userLoggedIn()) {
      return true;
    }

    return (fromTo.from.isZero() && fromTo.to.isZero()) || fromTo.from.isNaN() || fromTo.to.isNaN();
  }

  onLockUntilDateClick(date: LockDate): void {
    // update dynamic daily OMM rewards based on the newly selected lock date
    this.updateUserDailyRewards(this.ommLockingComponent!.dynamicLockedOmmAmount);

    // update dynamic liquidity and market boosters
    this.updateLiquidityAndMarketBoosters(this.ommLockingComponent!.dynamicLockedOmmAmount);

    // update user lock APR
    this.updateUserLockApr(this.ommLockingComponent!.dynamicLockedOmmAmount);
  }

  updateUserDailyRewards(lockedOmm: BigNumber): void {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(lockedOmm,
      this.ommLockingComponent!.selectedLockTimeInMillisec);
    log.debug(`newUserbOmmBalance = ${newUserbOmmBalance}`);
    const dailyUsersOmmLockingRewards = this.calculationService.calculateUserDailyLockingOmmRewards(newUserbOmmBalance);

    // set daily rewards text to dynamic value by replacing inner HTML
    this.setText(this.lockDailyRewardsEl, this.tooUSLocaleString(dailyUsersOmmLockingRewards.dp(2))
      + (dailyUsersOmmLockingRewards.isGreaterThan(Utils.ZERO) ? " OMM " : ""));
  }

  resetUserDailyRewards(): void {
    const dailyUserOmmLockingRewards = this.userDailyLockingOmmRewards;
    this.setText(this.lockDailyRewardsEl, this.tooUSLocaleString(dailyUserOmmLockingRewards.dp(2))
      + (dailyUserOmmLockingRewards.isGreaterThan(Utils.ZERO) ? " OMM " : ""));
  }

  resetUserLockApr(): void {
    const userLockApr = this.getUserLockingApr();
    this.setText(this.lockAprEl, this.to2DecimalRndOffPercString(userLockApr)
      + (userLockApr.isGreaterThan(Utils.ZERO) ? " APR" : ""));
  }

  updateUserLockApr(lockedOmm: BigNumber): void {
    const newUserbOmmBalance = this.calculationService.calculateNewbOmmBalance(lockedOmm,
      this.ommLockingComponent!.selectedLockTimeInMillisec);
    let userLockApr = this.calculationService.calculateUserLockingApr(newUserbOmmBalance, lockedOmm);
    userLockApr = userLockApr.gt(1) ? userLockApr.dp(2) : userLockApr;

    // set user lock apr text to dynamic value by replacing inner HTML
    this.setText(this.lockAprEl, this.to2DecimalRndOffPercString(userLockApr)
      + (userLockApr.isGreaterThan(Utils.ZERO) ? " APR" : ""));
  }

  resetMarketAndLiquidityBoosters(): void {
    const marketBoosterDataFrom = this.marketBoosterData?.from.dp(2, BigNumber.ROUND_HALF_CEIL) ?? new BigNumber(0);
    const marketBoosterDataTo = this.marketBoosterData?.to.dp(2, BigNumber.ROUND_HALF_CEIL) ?? new BigNumber(0);
    this.setText(this.liquidityBoosterFromEl, this.tooUSLocaleString(marketBoosterDataFrom) + " x");
    this.setText(this.liquidityBoosterToEl, this.tooUSLocaleString(marketBoosterDataTo) + " x");

    const liquidityBoosterDataFrom = this.liquidityBoosterData?.from.dp(2, BigNumber.ROUND_HALF_CEIL) ?? new BigNumber(0);
    const liquidityBoosterDataTo = this.liquidityBoosterData?.to.dp(2, BigNumber.ROUND_HALF_CEIL) ?? new BigNumber(0);
    this.setText(this.liquidityBoosterFromEl, this.tooUSLocaleString(liquidityBoosterDataFrom) + " x");
    this.setText(this.liquidityBoosterToEl, this.tooUSLocaleString(liquidityBoosterDataTo) + " x");
  }

  updateDynamicLiquidityBoosters(newLockedOmmAmount: BigNumber): void {
    // log.debug("####### updateDynamicLiquidityBoosters.... #######");
    let min = new BigNumber(-1);
    let max = new BigNumber(-1);

    this.persistenceService.userPoolsDataMap.forEach((value: UserPoolData, poolId: string) => {
      if (!value.userStakedBalance.isZero()) {
        const newLiquidityMultiplier = this.calculateDynamicLiquidityMultiplier(newLockedOmmAmount, poolId);
        const oldLiquidityMultiplier = this.persistenceService.userLiquidityPoolMultiplierMap.get(poolId)!;
        const oldBooster = this.liquidityBoosterData?.liquidityBoosterMap.get(poolId) ?? new BigNumber(0);
        const newLiquidityBooster = newLiquidityMultiplier.dividedBy(oldLiquidityMultiplier).multipliedBy(oldBooster);

        // log.debug("--------------------------------------------------");
        // log.debug(`Pool = ${value.getCleanPoolName()}`);
        // log.debug(`newLiquidityMultiplier = ${newLiquidityMultiplier}`);
        // log.debug(`oldLiquidityMultiplier = ${oldLiquidityMultiplier}`);
        // log.debug(`oldBooster = ${oldBooster}`);
        // log.debug(`newLiquidityBooster = ${newLiquidityBooster}`);

        if (newLiquidityBooster.lt(min) || min.eq(-1)) {
          min = newLiquidityBooster;
        }
        if (newLiquidityBooster.gt(max) || max.eq(-1)) {
          max = newLiquidityBooster;
        }
      }
    });

    this.setText(this.liquidityBoosterFromEl, this.tooUSLocaleString(min.dp(2, BigNumber.ROUND_HALF_CEIL)) + " x");
    this.setText(this.liquidityBoosterToEl, this.tooUSLocaleString(max.dp(2, BigNumber.ROUND_HALF_CEIL)) + " x");
  }

  updateDynamicMarketBoosters(newLockedOmmAmount: BigNumber): void {
    // log.debug("#######  updateDynamicMarketBoosters.... #######");
    let min = new BigNumber(-1);
    let max = new BigNumber(-1);

    supportedAssetsMap.forEach((value: Asset, assetTag: AssetTag) => {
      if (!this.persistenceService.getUserSuppliedAssetBalance(assetTag).isZero()) {
        const newSupplyMultiplier = this.calculateDynamicSupplyMarketMultiplier(newLockedOmmAmount, assetTag);
        const oldSupplyMultiplier = this.persistenceService.userMarketSupplyMultiplierMap.get(assetTag)!;
        const oldBooster = this.marketBoosterData?.supplyBoosterMap.get(assetTag) ?? new BigNumber(0);
        const newSupplyBooster = newSupplyMultiplier.dividedBy(oldSupplyMultiplier).multipliedBy(oldBooster);

        // log.debug("--------------------------------------------------");
        // log.debug(`Asset = ${assetTag}`);
        // log.debug(`newSupplyMultiplier = ${newSupplyMultiplier}`);
        // log.debug(`oldSupplyMultiplier = ${oldSupplyMultiplier}`);
        // log.debug(`oldBooster = ${oldBooster}`);
        // log.debug(`newSupplyBooster = ${newSupplyBooster}`);

        if (newSupplyBooster.lt(min) || min.eq(-1)) {
          min = newSupplyBooster;
        }
        if (newSupplyBooster.gt(max) || max.eq(-1)) {
          max = newSupplyBooster;
        }
      }

      if (!this.persistenceService.getUserBorrAssetBalance(assetTag).isZero()) {
        const newBorrowMultiplier = this.calculateDynamicBorrowMarketMultiplier(newLockedOmmAmount, assetTag);
        const oldBorrowMultiplier = this.persistenceService.userMarketBorrowMultiplierMap.get(assetTag)!;
        const oldBooster = this.marketBoosterData?.borrowBoosterMap.get(assetTag) ?? new BigNumber(0);
        const newBorrowBooster = newBorrowMultiplier.dividedBy(oldBorrowMultiplier).multipliedBy(oldBooster);

        // log.debug("--------------------------------------------------");
        // log.debug(`Asset = ${assetTag}`);
        // log.debug(`newBorrowMultiplier = ${newBorrowMultiplier}`);
        // log.debug(`oldBorrowMultiplier = ${oldBorrowMultiplier}`);
        // log.debug(`oldBooster = ${oldBooster}`);
        // log.debug(`newBorrowBooster = ${newBorrowBooster}`);

        if (newBorrowBooster.lt(min) || min.eq(-1)) {
          min = newBorrowBooster;
        }
        if (newBorrowBooster.gt(max) || max.eq(-1)) {
          max = newBorrowBooster;
        }
      }
    });

    this.setText(this.marketBoosterFromEl, this.tooUSLocaleString(min.dp(2, BigNumber.ROUND_HALF_CEIL)) + " x");
    this.setText(this.marketBoosterToEl, this.tooUSLocaleString(max.dp(2, BigNumber.ROUND_HALF_CEIL)) + " x");
  }
}
