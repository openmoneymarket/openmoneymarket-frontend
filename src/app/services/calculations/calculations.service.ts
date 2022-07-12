import {Injectable} from '@angular/core';
import {PersistenceService} from "../persistence/persistence.service";
import {Asset, AssetTag, CollateralAssetTag, supportedAssetsMap} from "../../models/classes/Asset";
import {UserAction} from "../../models/enums/UserAction";
import {ReserveData} from "../../models/classes/AllReservesData";
import {StateChangeService} from "../state-change/state-change.service";
import {Utils} from "../../common/utils";
import {Prep, PrepList} from "../../models/classes/Preps";
import {UserReserveData} from "../../models/classes/UserReserveData";
import log from "loglevel";
import {PoolData} from "../../models/classes/PoolData";
import {UserPoolData} from "../../models/classes/UserPoolData";
import BigNumber from "bignumber.js";
import {Times} from "../../common/constants";
import {IMarketBoosterData} from "../../models/Interfaces/IMarketBoosterData";
import {ILiquidityBoosterData} from "../../models/Interfaces/ILiquidityBoosterData";

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {

  constructor(private persistenceService: PersistenceService,
              private stateChangeService: StateChangeService) { }

  public calculateNewbOmmBalance(newLockedOmmAmount: BigNumber, selectedLockTime: BigNumber): BigNumber {
    const currentUnlockTime = this.persistenceService.userCurrentLockedOmmEndInMilliseconds();
    const now = Utils.timestampNowMilliseconds();

    let newUnlockTime;
    if (currentUnlockTime.isZero()) {
      // user has no locked OMM
      newUnlockTime = this.recalculateLockPeriodEnd(now.plus(selectedLockTime));
    } else {
      const difference = now.plus(selectedLockTime).minus(currentUnlockTime);
      newUnlockTime = this.recalculateLockPeriodEnd(currentUnlockTime.plus(difference));
    }

    const slope = this.calculatebOmmSlope(newLockedOmmAmount);

    return this.calculatebOmmValue(slope, newUnlockTime, now);
  }

  // (Given expiration timestamp in milliseconds // 1 week in milliseconds ) * 1 week in milliseconds
  public recalculateLockPeriodEnd(lockPeriod: BigNumber): BigNumber {
    return lockPeriod.dividedBy(Times.WEEK_IN_MILLISECONDS).dp(0, BigNumber.ROUND_DOWN)
      .multipliedBy(Times.WEEK_IN_MILLISECONDS);
  }

  // slope = locked OMM / four years in milliseconds
  public calculatebOmmSlope(lockedOmm: BigNumber): BigNumber {
    return lockedOmm.dividedBy(Times.FOUR_YEARS_IN_MILLISECONDS);
  }

  // bOMM value at any timestamp = slope * (unlockTime timestamp - current timestamp)
  public calculatebOmmValue(slope: BigNumber, unlockTime: BigNumber, currentTimestamp: BigNumber): BigNumber {
    return slope.multipliedBy(unlockTime.minus(currentTimestamp));
  }

  public calculateDynamicMarketRewardsSupplyMultiplier(assetTag: AssetTag, userbOMMBalance: BigNumber): BigNumber {
    const userAssetSupply = this.persistenceService.getUserSuppliedAssetBalance(assetTag);
    const totalAssetSupply = this.persistenceService.getReserveTotalLiquidity(assetTag);
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOMMBalance.minus(
      this.persistenceService.userbOmmBalance));

    return this.bOmmRewardsMultiplier(userAssetSupply, totalAssetSupply, userbOMMBalance, totalbOmmBalance);
  }

  public calculateDynamicMarketRewardsSupplyMultiplierForSupplied(assetTag: AssetTag, supplied?: BigNumber): BigNumber {
    const userAssetSupply = supplied ? supplied : this.persistenceService.getUserSuppliedAssetBalance(assetTag);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    let totalAssetSupply = this.persistenceService.getReserveTotalLiquidity(assetTag);
    totalAssetSupply = supplied ? supplied.minus(this.persistenceService.getUserSuppliedAssetBalance(assetTag)).plus(totalAssetSupply)
      : totalAssetSupply;
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOMMBalance.minus(
      this.persistenceService.userbOmmBalance));

    return this.bOmmRewardsMultiplier(userAssetSupply, totalAssetSupply, userbOMMBalance, totalbOmmBalance);
  }

  public calculateDynamicMarketRewardsBorrowMultiplierForBorrowed(assetTag: AssetTag, borrowed?: BigNumber): BigNumber {
    const userAssetBorrow = borrowed ? borrowed : this.persistenceService.getUserBorrAssetBalance(assetTag);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    let totalAssetBorrow = this.persistenceService.getReserveTotalBorrows(assetTag);
    totalAssetBorrow = borrowed ? borrowed.minus(this.persistenceService.getUserBorrAssetBalance(assetTag)).plus(totalAssetBorrow)
      : totalAssetBorrow;
    const totalbOMMBalance = this.persistenceService.bOmmTotalSupply;

    return this.bOmmRewardsMultiplier(userAssetBorrow, totalAssetBorrow, userbOMMBalance, totalbOMMBalance);
  }

  public calculateMarketRewardsSupplyMultiplier(assetTag: AssetTag): BigNumber {
    const userAssetSupply = this.persistenceService.getUserSuppliedAssetBalance(assetTag);
    const totalAssetSupply = this.persistenceService.getReserveTotalLiquidity(assetTag);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    const totalbOMMBalance = this.persistenceService.bOmmTotalSupply;

    return this.bOmmRewardsMultiplier(userAssetSupply, totalAssetSupply, userbOMMBalance, totalbOMMBalance);
  }

  public calculateDynamicMarketRewardsBorrowMultiplier(assetTag: AssetTag, userbOMMBalance: BigNumber): BigNumber {
    const userAssetBorrow = this.persistenceService.getUserBorrAssetBalance(assetTag);
    const totalAssetBorrow = this.persistenceService.getReserveTotalBorrows(assetTag);
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOMMBalance.minus(
      this.persistenceService.userbOmmBalance));

    return this.bOmmRewardsMultiplier(userAssetBorrow, totalAssetBorrow, userbOMMBalance, totalbOmmBalance);
  }

  public calculateMarketRewardsBorrowMultiplier(assetTag: AssetTag): BigNumber {
    const userAssetBorrow = this.persistenceService.getUserBorrAssetBalance(assetTag);
    const totalAssetBorrow = this.persistenceService.getReserveTotalBorrows(assetTag);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    const totalbOMMBalance = this.persistenceService.bOmmTotalSupply;

    return this.bOmmRewardsMultiplier(userAssetBorrow, totalAssetBorrow, userbOMMBalance, totalbOMMBalance);
  }

  public calculateDynamicLiquidityRewardsMultiplier(poolId: BigNumber, userbOMMBalance: BigNumber): BigNumber {
    const userStakedLp = this.persistenceService.getUserPoolStakedBalance(poolId);
    const totalStakedLp = this.persistenceService.getPoolTotalStakedLp(poolId);
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOMMBalance.minus(
      this.persistenceService.userbOmmBalance));

    return this.bOmmRewardsMultiplier(userStakedLp, totalStakedLp, userbOMMBalance, totalbOmmBalance);
  }

  public calculateDynamicLiquidityRewardsMultiplierForStakedLp(poolId: BigNumber, userStakedLp: BigNumber): BigNumber {
    // diff between new and old staked lp
    const userStakedLpDiff = userStakedLp.minus(this.persistenceService.getUserPoolStakedBalance(poolId));
    const totalStakedLp = this.persistenceService.getPoolTotalStakedLp(poolId).plus(userStakedLpDiff);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply;

    return this.bOmmRewardsMultiplier(userStakedLp, totalStakedLp, userbOMMBalance, totalbOmmBalance);
  }

  public calculateLiquidityRewardsMultiplier(poolId: BigNumber): BigNumber {
    const userStakedLp = this.persistenceService.getUserPoolStakedBalance(poolId);
    const totalStakedLp = this.persistenceService.getPoolTotalStakedLp(poolId);
    const userbOMMBalance = this.persistenceService.userbOmmBalance;
    const totalbOMMBalance = this.persistenceService.bOmmTotalSupply;

    return this.bOmmRewardsMultiplier(userStakedLp, totalStakedLp, userbOMMBalance, totalbOMMBalance);
  }

  /**
   * @description
   * Equation:
   * Example for supply market:
   * min(((user's supply * 40 / 100) + (totalsupply * user's bOMM balance/total bOMM balance * (100 - 40) / 100))/user's supply, 1) * 2.5
   */
  public bOmmRewardsMultiplier(userAssetAmount: BigNumber, totalAssetAmount: BigNumber, userbOMMBalance: BigNumber,
                               totalbOMMBalance: BigNumber): BigNumber {
    // (user's supply * 40 / 100)
    const r1 = userAssetAmount.multipliedBy(new BigNumber("0.4"));

    // (totalsupply * user's bOMM balance/total bOMM balance * (100 - 40) / 100)
    const r2 = totalAssetAmount.multipliedBy(userbOMMBalance).dividedBy(totalbOMMBalance).multipliedBy(new BigNumber("0.6"));

    const multiplier = (r1.plus(r2)).dividedBy(userAssetAmount);

    return (BigNumber.min(multiplier, 1)).multipliedBy(new BigNumber("2.5"));
  }

  public calculateBorrowOmmRewardsApy(assetTag: AssetTag): BigNumber {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      const dailyBorrowRewards = this.persistenceService.dailyRewardsAllPoolsReserves?.reserve.getDailyBorrowRewardsForReserve(assetTag)
        ?? new BigNumber("0");
      return this.borrowOmmApyFormula(dailyBorrowRewards, this.persistenceService.ommPriceUSD, reserveData, assetTag);
    } else {
      return new BigNumber("0");
    }
  }

  // Borrow OMM rewards APY: Token Distribution for that day (1M) * OMM Token Price * reserve portion * reserve borrowing * 365
  // / (reserve supplied * reserve price from Oracle)
  public borrowOmmApyFormula(dailyReserveBorrowRewards: BigNumber, ommPriceUSD: BigNumber, reserveData: ReserveData,
                             assetTag: AssetTag): BigNumber {
    // if reserve is ICX, convert ICX exchange price to sICX
    const exchangePrice = assetTag === AssetTag.ICX ? Utils.convertICXToSICXPrice(reserveData.exchangePrice, reserveData.sICXRate)
      : reserveData.exchangePrice;

    return (dailyReserveBorrowRewards.multipliedBy(ommPriceUSD).multipliedBy(365)).dividedBy((reserveData.totalBorrows
      .multipliedBy(exchangePrice)));
  }

  public calculateSupplyOmmRewardsApy(assetTag: AssetTag): BigNumber {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      const dailySupplyRewards = this.persistenceService.dailyRewardsAllPoolsReserves?.reserve.getDailySupplyRewardsForReserve(assetTag)
        ?? new BigNumber("0");
      return this.supplyOmmApyFormula(dailySupplyRewards, this.persistenceService.ommPriceUSD, reserveData, assetTag);
    } else {
      return new BigNumber("0");
    }
  }

  public supplyOmmApyFormula(dailySupplyRewards: BigNumber, ommPriceUSD: BigNumber, reserveData: ReserveData,
                             assetTag: AssetTag): BigNumber {
    // if reserve is ICX, convert ICX exchange price to sICX
    const exchangePrice = assetTag === AssetTag.ICX ? Utils.convertICXToSICXPrice(reserveData.exchangePrice, reserveData.sICXRate)
      : reserveData.exchangePrice;

    return (dailySupplyRewards.multipliedBy(ommPriceUSD).multipliedBy(new BigNumber("365"))).dividedBy(reserveData.totalLiquidity
      .multipliedBy(exchangePrice));
  }

  /** Formulae: Omm's Voting Power/Total staked OMM tokens */
  public votingPower(userNewbOmmBalance: BigNumber = new BigNumber(0)): BigNumber {
    log.debug(`calculation service votingPower():`);
    const ommVotingPower = this.ommVotingPower();
    const userbOmmDiff = userNewbOmmBalance.isZero() ? Utils.ZERO : userNewbOmmBalance.minus(
      this.persistenceService.userbOmmBalance);
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOmmDiff);
    log.debug(`ommVotingPower = ${ommVotingPower}`);
    log.debug(`totalbOmmBalance = ${totalbOmmBalance}`);
    log.debug(`userNewbOmmBalance = ${userNewbOmmBalance}`);
    log.debug(`this.persistenceService.userbOmmBalance = ${this.persistenceService.userbOmmBalance}`);

    if (ommVotingPower.isZero() || totalbOmmBalance.isZero()) {
      return new BigNumber("0");
    }

    return Utils.divide(ommVotingPower, totalbOmmBalance).dp(2);
  }

  /** (totalLiquidity of sICX - totalborrow of sICX) * (sICX/ICX ratio) */
  public ommVotingPower(): BigNumber {
    log.debug("ommVotingPower():");
    const totalLiquiditySicx = this.persistenceService.getAssetReserveData(AssetTag.ICX)?.totalLiquidity ?? new BigNumber("0");
    const totalborrowSicx = this.persistenceService.getAssetReserveData(AssetTag.ICX)?.totalBorrows ?? new BigNumber("0");
    const sIcxIcxRatio = this.persistenceService.sIcxToIcxRate();
    log.debug(`totalLiquiditySicx = ${totalLiquiditySicx}`);
    log.debug(`totalborrowSicx = ${totalborrowSicx}`);
    log.debug(`totalborrowSicx = ${totalborrowSicx}`);

    return ((totalLiquiditySicx.minus(totalborrowSicx)).multipliedBy(sIcxIcxRatio)).dp(2);
  }

  /** Formulae: Omm's Voting Power/Total bOMM balance * user’s bOMM balance */
  public usersVotingPower(userbOmmBalance?: BigNumber): BigNumber {
    const ommVotingPower = this.ommVotingPower();
    userbOmmBalance = userbOmmBalance ? userbOmmBalance : this.persistenceService.userbOmmBalance;
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply.plus(userbOmmBalance.minus(
      this.persistenceService.userbOmmBalance));

    return (ommVotingPower.dividedBy(totalbOmmBalance).multipliedBy(userbOmmBalance)).dp(2);
  }

  public calculateAssetSupplySliderMax(assetTag: AssetTag): BigNumber {
    let suppliedAssetBalance = this.persistenceService.getUserSuppliedAssetBalance(assetTag);

    if (assetTag === AssetTag.ICX) {
      suppliedAssetBalance = Utils.convertSICXToICX(suppliedAssetBalance, this.persistenceService.sIcxToIcxRate());
    }

    return Utils.add(suppliedAssetBalance, this.persistenceService.getUserAssetBalance(assetTag));
  }

  // calculate the total risk percentage based on the user health factor or user action
  public calculateTotalRisk(assetTag?: AssetTag, diff?: BigNumber, userAction?: UserAction, updateState = true,
                            fullRedeem = false): BigNumber {

    let res: BigNumber;
    if (assetTag && diff && userAction != null) {
      res = this.calculateTotalRiskDynamic(assetTag, diff, userAction, fullRedeem);
    } else {
      res = this.calculateTotalRiskBasedOnHF();
    }

    if (updateState) {
      // update persistence user total risk
      this.stateChangeService.updateUserTotalRisk(res);
    }

    return res;
  }

  private calculateTotalRiskBasedOnHF(): BigNumber {
    // if user has not borrowed any asset return 0
    if (this.persistenceService.userHasNotBorrowedAnyAsset()) {
      return new BigNumber("0");
    } else {
      const healthFactor = this.persistenceService.userAccountData?.healthFactor ?? new BigNumber("1");

      // check for negative health factor
      if (healthFactor.isLessThanOrEqualTo(Utils.ZERO)) {
        return new BigNumber("0");
      }

      return new BigNumber("1").dividedBy(healthFactor);
    }
  }

  /**
   * @description Calculate the total risk based on the user action (supply, redeem, ..)
   * @param assetTag - Asset based on which we are calculating the risk
   * @param amount - Amount being considered in dynamic risk calculation
   * @param userAction - Action that user is making
   * * @param fullRedeem - Boolean indicating whether full redeem of supplied is being made
   * @return total user risk as a number (multiply by 100 to get percentage)
   */
  private calculateTotalRiskDynamic(assetTag: AssetTag, amount: BigNumber, userAction: UserAction, fullRedeem = false): BigNumber {
    if (fullRedeem) {
      return new BigNumber("0");
    }

    const userAccountData = this.persistenceService.userAccountData;
    // if user account data not yet initialised return 0
    if (!userAccountData) {
      return new BigNumber("0");
    }

    // init base values
    let totalFeeUSD = userAccountData.totalFeesUSD;
    let totalBorrowBalanceUSD = userAccountData.totalBorrowBalanceUSD;


    const assetReserve = this.persistenceService.getAssetReserveData(assetTag);
    let assetExchangePrice = assetReserve?.exchangePrice ?? new BigNumber("0");

    if (assetTag === AssetTag.ICX) {
      assetExchangePrice = Utils.convertICXToSICXPrice(assetExchangePrice, this.persistenceService.sIcxToIcxRate());
    }

    let totalCollateralUSD = new BigNumber("0");
    this.persistenceService.userReserves.reserveMap.forEach((reserve, tag) => {
      if (this.persistenceService.reserveIsUsedAsCollateral(tag)) {
        const reserveCollateralUSD = reserve?.currentOTokenBalanceUSD ?? new BigNumber("0");
        totalCollateralUSD = totalCollateralUSD.plus(reserveCollateralUSD.multipliedBy(
          this.persistenceService.getReserveLiquidationThreshold(tag)));
      }
    });

    switch (userAction) {
      case UserAction.SUPPLY:
        // if user add more collateral, add USD value of amount to the total collateral balance USD
        if (assetReserve?.usageAsCollateralEnabled) {
          totalCollateralUSD = totalCollateralUSD.plus(amount.multipliedBy(assetExchangePrice)
            .multipliedBy(this.persistenceService.getReserveLiquidationThreshold(assetTag)));
        }
        break;
      case UserAction.REDEEM:
        // if user takes out collateral, subtract USD value of amount from the total collateral balance USD
        if (assetReserve?.usageAsCollateralEnabled) {
          totalCollateralUSD = totalCollateralUSD.minus(amount.multipliedBy(assetExchangePrice)
            .multipliedBy(this.persistenceService.getReserveLiquidationThreshold(assetTag)));
        }
        break;
      case UserAction.BORROW:
        // if user takes out the loan (borrow) update the origination fee and add amount to the total borrow balance
        const originationFeePercentage = this.persistenceService.loanOriginationFeePercentage ?? new BigNumber("0.001");
        totalFeeUSD = totalFeeUSD.plus(amount.multipliedBy(assetExchangePrice).multipliedBy(originationFeePercentage));
        totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(amount.multipliedBy(assetExchangePrice));
        break;
      case UserAction.REPAY:
        // if user repays the loan, subtract the USD value of amount from the total borrow balance USD
        totalBorrowBalanceUSD = totalBorrowBalanceUSD.minus(amount.multipliedBy(assetExchangePrice));
    }

    let res = (new BigNumber("1")).dividedBy(this.calculateHealthFactor(totalCollateralUSD.minus(totalFeeUSD), totalBorrowBalanceUSD));

    if (!res.isFinite() || res.isLessThan(Utils.ZERO)) {
      res = new BigNumber("0");
    }

    return res;
  }

  public calculateHealthFactor(totalCollateralUSD: BigNumber, totalBorrowUSD: BigNumber)
    : BigNumber {
    return totalCollateralUSD.isNegative() ? new BigNumber("1") : totalCollateralUSD.dividedBy(totalBorrowUSD);
  }

  /**
   * @description Calculate the available borrow for specific asset (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @return asset available borrow amount
   */
  public calculateAvailableBorrowForAsset(assetTag: AssetTag): BigNumber {
    // Formulae: borrowsAllowedUSD = Sum((CollateralBalanceUSD per reserve - totalFeesUSD per reserve) * LTV per reserve)
    let borrowsAllowedUSD = new BigNumber("0");

    this.persistenceService.userReserves.reserveMap.forEach((userReserveData, tag) => {
      if (userReserveData) {
        const collateralBalanceUSD = userReserveData.currentOTokenBalanceUSD;
        const originationFee = userReserveData.originationFee;
        const ltv = this.persistenceService.getReserveLtv(tag);

        let assetExchangePrice = userReserveData?.exchangeRate;
        if (tag === AssetTag.ICX) {
          assetExchangePrice = Utils.convertICXToSICXPrice(assetExchangePrice, this.persistenceService.sIcxToIcxRate());
        }

        const totalReserveFeesUSD = originationFee.multipliedBy(assetExchangePrice);

        borrowsAllowedUSD = borrowsAllowedUSD.plus((collateralBalanceUSD.minus(totalReserveFeesUSD)).multipliedBy(ltv));
      }
    });

    // previous borrow balance of user across all collaterals in USD
    const totalBorrowBalanceUSD = this.persistenceService.userAccountData?.totalBorrowBalanceUSD ?? new BigNumber("0");

    // the amount user can borrow in USD across all the collaterals
    const availableBorrowUSD = borrowsAllowedUSD.minus(totalBorrowBalanceUSD);

    // exchange price of the asset (reserve) extracted from the ReserveData
    let exchangePrice = this.persistenceService.getAssetReserveData(assetTag)?.exchangePrice ?? new BigNumber("-1");
    if (assetTag === AssetTag.ICX) {
      exchangePrice = Utils.convertICXToSICXPrice(exchangePrice, this.persistenceService.sIcxToIcxRate());
    }

    const buffer = new BigNumber("0.9996");
    const suggestedBorrowAvailable =  (availableBorrowUSD.dividedBy(exchangePrice)).multipliedBy(buffer).dp(2);

    // adjust borrow available if the reserve borrow available is less than calculated one
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);
    const totalLiquidity = reserveData?.totalLiquidity ?? new BigNumber("0");
    const totalBorrows = reserveData?.totalBorrows ?? new BigNumber("0");
    const borrowThreshold = reserveData?.borrowThreshold ?? new BigNumber("0");
    const reserveAvailableBorrows = (totalLiquidity.multipliedBy(borrowThreshold)).minus(totalBorrows);

    return BigNumber.min(suggestedBorrowAvailable, reserveAvailableBorrows).dp(2);
  }

  /**
   * @description Calculate users daily supply interest for specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param supplied - optional parameter to provide current supplied value (e.g. for dynamic slider changes)
   * @return users asset supply interest (in USD) for a day
   */
  public calculateUsersDailySupplyInterestForAsset(assetTag: AssetTag | CollateralAssetTag, supplied?: BigNumber): BigNumber {
    let currentOTokenBalanceUSD = this.persistenceService.getUserSuppliedAssetUSDBalance(assetTag);

    const exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);

    if (supplied) {
      currentOTokenBalanceUSD = supplied.multipliedBy(exchangePrice);
    }

    const liquidityRate = this.persistenceService.getUserAssetReserveLiquidityRate(assetTag);

    // "easy route" formula
    const res = currentOTokenBalanceUSD.multipliedBy(liquidityRate).multipliedBy(new BigNumber("1").dividedBy(new BigNumber("365")));

    // convert to asset
    return res.dividedBy(exchangePrice);
  }

  calculateUsersSupplyInterestPerDayUSD(): BigNumber {
    let total = new BigNumber("0");
    let exchangePrice = new BigNumber("0");

    Object.values(AssetTag).forEach(assetTag => {
      exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
      total = total.plus(this.calculateUsersDailySupplyInterestForAsset(assetTag).multipliedBy(exchangePrice));
    });

    return total;
  }

  /**
   * @description Calculate users daily borrow interest for specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param borrowed - optional parameter to provide current borrowed value (e.g. for dynamic slider changes)
   * @return users asset borrow interest (in USD) for a day
   */
  public calculateUsersDailyBorrowInterestForAsset(assetTag: AssetTag, borrowed?: BigNumber): BigNumber {
    let currentBorrowBalanceUSD = this.persistenceService.getUserBorrowedAssetUSDBalance(assetTag);
    const exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);

    if (borrowed) {
      currentBorrowBalanceUSD = borrowed.multipliedBy(exchangePrice);
    }

    const borrowRate = this.persistenceService.getUserAssetReserve(assetTag)?.borrowRate ?? 0;

    // "easy route" formula
    const res = currentBorrowBalanceUSD.multipliedBy(borrowRate).multipliedBy(new BigNumber("1").dividedBy(new BigNumber("365")));

    // convert to asset
    return res.dividedBy(exchangePrice);
  }

  calculateUsersBorrowInterestPerDayUSD(): BigNumber {
    let total = new BigNumber("0");
    let exchangePrice = new BigNumber("0");

    Object.values(AssetTag).forEach(assetTag => {
      exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
      total = total.plus(this.calculateUsersDailyBorrowInterestForAsset(assetTag).multipliedBy(exchangePrice));
    });

    return total;
  }

  public calculateUserTotalOmmRewards(): BigNumber {
    let res = new BigNumber("0");
    Object.values(AssetTag).forEach(assetTag => {
      const supplyOmmReward = this.calculateUserDailySupplyOmmReward(assetTag);
      const borrowOmmReward = this.calculateUserDailyBorrowOmmReward(assetTag);
      res = res.plus(supplyOmmReward.plus(borrowOmmReward));
    });
    return res;
  }

  /**
   * @description Calculate users OMM rewards for supply of specific asset - reserve (e.g. USDS, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param newSupplyValue - Optional parameter for dynamic calculations based on supplied change (slider)
   */
  public calculateUserDailySupplyOmmReward(assetTag: AssetTag | CollateralAssetTag, newSupplyValue?: BigNumber): BigNumber {
    const oldSupplyValue = this.persistenceService.getUserSuppliedAssetBalance(assetTag);

    // if old supply value is zero and new supply value is undefined or zero, return 0
    if (oldSupplyValue.isZero() && (!newSupplyValue || newSupplyValue.isZero())) { return new BigNumber(0); }

    const currentUserDailySupplyRewards = this.persistenceService.userDailyOmmRewards?.getSupplyRewardForAsset(assetTag)
      ?? new BigNumber(0);
    newSupplyValue = newSupplyValue ? newSupplyValue : oldSupplyValue;

    const oldSupplyMultiplier = this.persistenceService.userMarketSupplyMultiplierMap.get(assetTag) ?? new BigNumber(0);
    const newSupplyMultiplier = this.calculateDynamicMarketRewardsSupplyMultiplierForSupplied(assetTag, newSupplyValue);
    const ommRewardsForSupply = this.persistenceService.dailyRewardsAllPoolsReserves?.reserve.getDailySupplyRewardsForReserve(assetTag)
      ?? new BigNumber(0);


    log.debug("**** calculateUserDailySupplyOmmReward ****");
    log.debug(`assetTag = ${assetTag}`);
    log.debug(`${newSupplyValue ? "Dynamic" : "Static"} calculation!`);
    log.debug(`newSupplyValue = ${newSupplyValue}`);
    log.debug(`oldSupplyValue = ${oldSupplyValue}`);
    log.debug(`newSupplyMultiplier = ${newSupplyMultiplier}`);
    log.debug(`oldSupplyMultiplier = ${oldSupplyMultiplier}`);
    log.debug(`ommRewardsForAssetSupply = ${ommRewardsForSupply}`);
    log.debug(`currentUserDailySupplyRewards = ${currentUserDailySupplyRewards}`);

    let res;
    let oldRes;

    if (newSupplyValue.isZero() || oldSupplyValue.isZero() || newSupplyMultiplier.isZero() || oldSupplyMultiplier.isZero()
      || currentUserDailySupplyRewards.isZero()) {
      res = new BigNumber(0);
      oldRes = new BigNumber(0);
    } else {
      // (new usds supply value* new multiplier for usds supply * current user daily rewards for usds supply * OMM Rewards for USDS Supply)
      const r1 = newSupplyValue.multipliedBy(newSupplyMultiplier).multipliedBy(currentUserDailySupplyRewards)
        .multipliedBy(ommRewardsForSupply);

      log.debug(`r1 = ${r1}`);

      // old USDS supply value * old multiplier for USDS supply * OMM Rewards for USDS Supply - r3
      const r2 = oldSupplyValue.multipliedBy(oldSupplyMultiplier).multipliedBy(ommRewardsForSupply);

      log.debug(`r2 = ${r2}`);

      // current user daily rewards for usds supply *(old USDS supply value * old multiplier for USDS supply - new USDS supply value
      // * new multiplier for USDS supply))
      const r3 = currentUserDailySupplyRewards.multipliedBy((oldSupplyValue.multipliedBy(oldSupplyMultiplier).minus(
        newSupplyValue.multipliedBy(newSupplyMultiplier))));

      log.debug(`r3 = ${r3}`);

      res = r1.dividedBy(r2.minus(r3));

      oldRes = (newSupplyValue.dividedBy(oldSupplyValue)).multipliedBy(newSupplyMultiplier.dividedBy(oldSupplyMultiplier))
        .multipliedBy(currentUserDailySupplyRewards);
    }

    log.debug(`new result = ${res}`);
    log.debug(`old result = ${oldRes}`);

    return res;
  }

  // Lending/Borrowing Portion (0.1) * Token Distribution for that day (1M) * reserve portion (0.4)
  // * reserve Lending (0.5) * User's reserve supplied balance/Total reserve supplied balance)
  public userSupplyOmmRewardsFormula(dailySupplyRewards: BigNumber, reserveData: ReserveData, userReserveData: UserReserveData,
                                     supplied?: BigNumber): BigNumber {
    // check if is dynamic supply value or not
    const amountBeingSupplied = supplied ? supplied : userReserveData.currentOTokenBalance;

    // if it is a dynamic supply amount add it to the total liquidity and subtract the current supplied
    const totalReserveLiquidity = supplied ? supplied.plus(reserveData.totalLiquidity).minus(userReserveData.currentOTokenBalance)
      : reserveData.totalLiquidity;

    if (dailySupplyRewards.isZero() || amountBeingSupplied.isZero() || totalReserveLiquidity.isZero()) {
      return new BigNumber("0");
    }

    return dailySupplyRewards.multipliedBy(amountBeingSupplied).dividedBy(totalReserveLiquidity);
  }

  /**
   * @description Calculate users OMM rewards for borrow of specific asset - reserve (e.g. USDS, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param newBorrowValue - Optional parameter for dynamic calculations based on borrow change (slider)
   */
  public calculateUserDailyBorrowOmmReward(assetTag: AssetTag, newBorrowValue?: BigNumber): BigNumber {
    const oldBorrowValue = this.persistenceService.getUserBorrowedAssetBalancePlusOrigFee(assetTag);

    // if old borrow value is zero and new borrow value is undefined or zero, return 0
    if (oldBorrowValue.isZero() && (!newBorrowValue || newBorrowValue.isZero())) { return new BigNumber(0); }

    const currentUserDailyBorrowRewards: any = this.persistenceService.userDailyOmmRewards?.getBorrowRewardForAsset(assetTag)
      ?? new BigNumber(0);
    newBorrowValue = newBorrowValue ? newBorrowValue : oldBorrowValue;

    const oldBorrowMultiplier = this.persistenceService.userMarketBorrowMultiplierMap.get(assetTag) ?? new BigNumber(0);
    const newBorrowMultiplier = this.calculateDynamicMarketRewardsBorrowMultiplierForBorrowed(assetTag, newBorrowValue);
    const ommRewardsForBorrow = this.persistenceService.dailyRewardsAllPoolsReserves?.reserve.getDailyBorrowRewardsForReserve(assetTag)
      ?? new BigNumber(0);

    log.debug("**** calculateUserDailyBorrowOmmReward ****");
    log.debug(`assetTag = ${assetTag}`);
    log.debug(`${newBorrowValue ? "Dynamic" : "Static"} calculation!`);
    log.debug(`newBorrowValue = ${newBorrowValue}`);
    log.debug(`oldBorrowValue = ${oldBorrowValue}`);
    log.debug(`newBorrowMultiplier = ${newBorrowMultiplier}`);
    log.debug(`oldBorrowMultiplier = ${oldBorrowMultiplier}`);
    log.debug(`ommRewardsForAssetBorrow = ${ommRewardsForBorrow}`);
    log.debug(`currentUserDailyBorrowRewards = ${currentUserDailyBorrowRewards}`);

    let res;
    let oldRes;
    if (newBorrowValue.isZero() || oldBorrowValue.isZero() || newBorrowMultiplier.isZero() || oldBorrowMultiplier.isZero()
      || currentUserDailyBorrowRewards.isZero() || ommRewardsForBorrow.isZero()) {
      res = new BigNumber(0);
      oldRes = new BigNumber(0);
    } else {
      const r1 = newBorrowValue.multipliedBy(newBorrowMultiplier).multipliedBy(currentUserDailyBorrowRewards)
        .multipliedBy(ommRewardsForBorrow);

      log.debug(`r1 = ${r1}`);

      const r2 = oldBorrowValue.multipliedBy(oldBorrowMultiplier).multipliedBy(ommRewardsForBorrow);

      log.debug(`r2 = ${r2}`);

      // current user daily rewards for usds supply *(old USDS supply value * old multiplier for USDS supply - new USDS supply value
      // * new multiplier for USDS supply))
      const r3 = currentUserDailyBorrowRewards.multipliedBy((oldBorrowValue.multipliedBy(oldBorrowMultiplier).minus(
        newBorrowValue.multipliedBy(newBorrowMultiplier))));

      log.debug(`r3 = ${r3}`);

      res = r1.dividedBy(r2.minus(r3));

      oldRes = (newBorrowValue.dividedBy(oldBorrowValue)).multipliedBy(newBorrowMultiplier.dividedBy(oldBorrowMultiplier))
        .multipliedBy(currentUserDailyBorrowRewards);
    }

    log.debug(`new result = ${res}`);
    log.debug(`old result = ${oldRes}`);

    return res;
  }

  public getTotalAvgSupplyApy(ommApyIncluded = false): BigNumber {
    let totalLiquidityUSDsum = new BigNumber("0");
    let totalLiquidityUSDsupplyApySum = new BigNumber("0");

    if (!this.persistenceService.allReserves) {
      return new BigNumber("0");
    }

    let reserve: ReserveData | undefined;
    Object.values(AssetTag).forEach((assetTag: AssetTag) => {
      reserve = this.persistenceService.allReserves!.getReserveData(assetTag);
      totalLiquidityUSDsum = totalLiquidityUSDsum.plus(reserve.totalLiquidityUSD);

      const liquidityRate = reserve.liquidityRate;
      const rate = ommApyIncluded ? liquidityRate.plus(this.calculateSupplyOmmRewardsApy(assetTag)) : liquidityRate;
      totalLiquidityUSDsupplyApySum = totalLiquidityUSDsupplyApySum.plus(reserve.totalLiquidityUSD.multipliedBy(rate));
    });

    return totalLiquidityUSDsupplyApySum.dividedBy(totalLiquidityUSDsum);
  }

  public getTotalAvgBorrowApy(ommApyIncluded = false): BigNumber {
    // log.debug("getTotalAvgBorrowApy");
    let totalBorrowUSDsum = new BigNumber("0");
    let totalBorrowUSDBorrowApySum = new BigNumber("0");

    if (!this.persistenceService.allReserves) {
      return new BigNumber("0");
    }

    let reserve: ReserveData | undefined;
    Object.values(AssetTag).forEach((assetTag: AssetTag) => {
      reserve = this.persistenceService.allReserves!.getReserveData(assetTag);
      if (!reserve.borrowRate.isNaN() && reserve.borrowRate.gt(0)) {
        totalBorrowUSDsum = totalBorrowUSDsum.plus(reserve.totalBorrowsUSD);

        const borrowRate = reserve.borrowRate;
        const rate = ommApyIncluded ? this.calculateBorrowOmmRewardsApy(assetTag).minus(borrowRate) : Utils.toNegative(borrowRate);

        totalBorrowUSDBorrowApySum = totalBorrowUSDBorrowApySum.plus(reserve.totalBorrowsUSD.multipliedBy(rate));
      }
    });

    return totalBorrowUSDBorrowApySum.dividedBy(totalBorrowUSDsum);
  }

  // New asset supply daily rewards prediction for a user * OMM Token Price * 365/(new asset supply $ value)
  public calculateUserDynamicSupplyApy(newDailyRewardsPrediction: BigNumber, newSupplyValue: BigNumber, assetTag: AssetTag): BigNumber {
    const ommPrice = this.persistenceService.ommPriceUSD;
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    // undefined check
    if (!reserveData) { return Utils.ZERO; }

    const exchangePrice = assetTag === AssetTag.ICX ? Utils.convertICXToSICXPrice(reserveData.exchangePrice, reserveData.sICXRate)
      : reserveData.exchangePrice;

    return (newDailyRewardsPrediction.multipliedBy(ommPrice).multipliedBy(365)).dividedBy(newSupplyValue.multipliedBy(exchangePrice));
  }

  public calculateUserDynamicBorrowApy(newDailyRewardsPrediction: BigNumber, newBorrowValue: BigNumber, assetTag: AssetTag): BigNumber {
    const ommPrice = this.persistenceService.ommPriceUSD;
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    // undefined check
    if (!reserveData) { return Utils.ZERO; }

    const exchangePrice = assetTag === AssetTag.ICX ? Utils.convertICXToSICXPrice(reserveData.exchangePrice, reserveData.sICXRate)
      : reserveData.exchangePrice;

    return (newDailyRewardsPrediction.multipliedBy(ommPrice).multipliedBy(365)).dividedBy(newBorrowValue.multipliedBy(exchangePrice));
  }

  public getYourSupplyApy(ommApyIncluded = false): BigNumber {
    let supplyApySum = new BigNumber("0");
    let supplySum = new BigNumber("0");
    let supplied;
    let supplyApy;

    // Sum(My supply amount for each asset * Supply APY for each asset)
    this.persistenceService.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined, assetTag: AssetTag) => {
      supplied = reserve?.currentOTokenBalanceUSD ?? new BigNumber("0");
      supplyApy = reserve?.liquidityRate ?? new BigNumber("0");
      const rate = ommApyIncluded ? supplyApy.plus(this.calculateSupplyOmmRewardsApy(assetTag)) : supplyApy;
      supplyApySum = supplyApySum.plus(supplied.multipliedBy(rate));
      supplySum = supplySum.plus(supplied);
    });

    return supplyApySum.dividedBy(supplySum);
  }

  // Sum(User Borrows Amount in USD * (OMM reward Borrow APY - Borrow APY))/Sum(User Borrows in USD)
  public getYourBorrowApy(ommApyIncluded = false): BigNumber {
    // log.debug("****** User total borrow APY calculation ******");
    let borrowApySum = new BigNumber("0");
    let userBorrowsInUsdSum = new BigNumber("0");
    let borrowedInUSD;
    let borrowApy;

    // log.debug("Calculating sums:");
    // Sum(My borrow amount for each asset * Borrow APY for each asset)
    this.persistenceService.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined, assetTag: AssetTag) => {
      if (reserve && !reserve.borrowRate.isNaN() && reserve.borrowRate.gt(0)) {
        borrowedInUSD = reserve?.currentBorrowBalanceUSD ?? new BigNumber("0");
        borrowApy = reserve?.borrowRate ?? new BigNumber("0");
        const rate = ommApyIncluded ?  this.calculateBorrowOmmRewardsApy(assetTag).minus(borrowApy) : Utils.toNegative(borrowApy);
        borrowApySum = borrowApySum.plus(borrowedInUSD.multipliedBy(rate));
        userBorrowsInUsdSum = userBorrowsInUsdSum.plus(borrowedInUSD);

        // log.debug(`${assetTag}`);
        // log.debug(`User Borrows amount in USD = ${borrowedInUSD}`);
        // log.debug(`Borrow APY = ${borrowApy}`);
        // log.debug(ommApyIncluded ? `(OMM reward Borrow APY - Borrow APY) = ${borrowApy}` : ``);
      }
    });

    // log.debug("Sums results:");
    // log.debug(`borrowApySum = ${borrowApySum}`);
    // log.debug(`userBorrowsInUsdSum = ${userBorrowsInUsdSum}`);

    return borrowApySum.dividedBy(userBorrowsInUsdSum);
  }

  public calculateBorrowFee(amount?: BigNumber): BigNumber {

    if (!amount) {
      return new BigNumber("0");
    }

    const loanOriginationFeePercentage = this.persistenceService.loanOriginationFeePercentage ?? new BigNumber("0.001");

    return amount.multipliedBy(loanOriginationFeePercentage);
  }

  public calculatePrepsIcxReward(prep: Prep, prepList: PrepList, index: number): BigNumber {
    const blockValidationRewards = prepList.avgIRep.dividedBy(new BigNumber("2"));

    const delegationRate = prep.delegated.dividedBy(prepList.totalDelegated);

    const representativeRewards = blockValidationRewards.multipliedBy(new BigNumber("100")).multipliedBy(delegationRate);

    return (index < 22 ? blockValidationRewards.plus(representativeRewards) : representativeRewards).dividedBy(30);
  }


  /** calculate total supplied both for base and quote token
   * Formula: totalStakedBalance / Total LP tokens in the Balanced pool (i.e. poolStats -> total_supply) * getPoolTotal (Balanced API #23)
   * do it twice for base token/quote token (getPoolData dynamic)
   */
  public calculatePoolTotalSupplied(poolData: PoolData, base: boolean = true): BigNumber {
    const totalStakedBalance = poolData.totalStakedBalance;
    const totalLpTokenInPool = poolData.poolStats.totalSupply;

    return totalStakedBalance.dividedBy(totalLpTokenInPool).multipliedBy((base ? poolData.poolStats.base : poolData.poolStats.quote));
  }

  /** calculate total supplied both for base and quote token
   * Formula: userStakedBalance / Total LP tokens in the Balanced pool (i.e. poolStats -> total_supply) * getPoolTotal (Balanced API #23)
   * do it twice for base token/quote token (getPoolData dynamic)
   */
  public calculateUserPoolSupplied(poolData: UserPoolData, base: boolean = true): BigNumber {
    const userStakedBalance = poolData.userStakedBalance;
    const totalLpTokenInPool = poolData.poolStats.totalSupply;

    return userStakedBalance.dividedBy(totalLpTokenInPool).multipliedBy((base ? poolData.poolStats.base : poolData.poolStats.quote));
  }

  public calculateUserPoolSuppliedForNewStaked(newUserStakedBalance: BigNumber, poolData: UserPoolData, base: boolean = true): BigNumber {
    const totalLpTokenInPool = poolData.poolStats.totalSupply;

    return newUserStakedBalance.dividedBy(totalLpTokenInPool).multipliedBy((base ? poolData.poolStats.base : poolData.poolStats.quote));
  }

  /** Formula: Daily OMM distribution (1M) * Pool pair portion (0.05), same across all 3 pools (OMM/USDS, OMM/iUSDC, OMM/sICX) */
  public calculateDailyRewardsForPool(poolData: PoolData): BigNumber {
    return this.persistenceService.tokenDistributionPerDay.multipliedBy(this.persistenceService.getDistPercentageOfPool(poolData.poolId));
  }

  /** Formula: Daily rewards * OMM price * 365/Total supplied in $ value */
  public calculatePoolLiquidityApr(poolData?: PoolData): BigNumber {
    if (!poolData) { return new BigNumber(0); }
    const dailyRewards = this.calculateDailyRewardsForPool(poolData);
    const ommPrice = this.persistenceService.ommPriceUSD;
    const totalSuppliedUSD = this.calculatePoolTotalSuppliedInUSD(poolData);

    if (Utils.isUndefinedOrZero(dailyRewards) || Utils.isUndefinedOrZero(totalSuppliedUSD) || Utils.isUndefinedOrZero(ommPrice)) {
      return new BigNumber("0");
    }

    return dailyRewards.multipliedBy(ommPrice).multipliedBy(new BigNumber("365")).dividedBy(totalSuppliedUSD);
  }

  /** Formula: getUserDailyReward(Address user) * OMM Token price * 365/($ value of user's staked LP token value) */
  public calculateUserPoolLiquidityApr(poolData: UserPoolData): BigNumber {
    // log.debug("******* calculateUserPoolLiquidityApr for pool " + poolData.getCleanPoolName() + " *******");
    const userDailyRewards: any = this.persistenceService.userDailyOmmRewards;

    if (!userDailyRewards) { return new BigNumber(0); }

    const userPoolDailyOmmRewards = userDailyRewards[poolData.cleanPoolName];
    if (!userPoolDailyOmmRewards) { log.error("ERROR in calculateUserPoolLiquidityApr.."); return new BigNumber(0); }
    const ommTokenPrice = this.persistenceService.ommPriceUSD;
    const stakedLpUsdValue = this.calculateUserPoolSupplied(poolData).multipliedBy(ommTokenPrice).multipliedBy(2);

    // log.debug(`userPoolDailyOmmRewards = ${userPoolDailyOmmRewards}`);
    // log.debug(`ommTokenPrice = ${ommTokenPrice}`);
    // log.debug(`stakedLpUsdValue = ${stakedLpUsdValue}`);

    return (userPoolDailyOmmRewards.multipliedBy(ommTokenPrice).multipliedBy(365)).dividedBy(stakedLpUsdValue);
  }

  /**
   * @description Calculate users supply Omm rewards APY (APY derived from OMM rewards earned from supply of specific asset)
   * Formula: getUserDailyReward(Address user) * OMM Token price * 365/($ value of user's supplied or borrowed asset)
   */
  public calculateUserSupplyOmmRewardsApy(assetTag: AssetTag): BigNumber {
    // log.debug("calculateUserSupplyOmmRewardsApy for asset " + assetTag);
    const userDailySupplyRewards: any = this.persistenceService.userDailyOmmRewards?.getSupplyRewardForAsset(assetTag);

    if (!userDailySupplyRewards) { return new BigNumber(0); }

    if (!userDailySupplyRewards) { log.error("ERROR in calculateUserSupplyOmmRewardsApy.."); return new BigNumber(0); }
    const ommTokenPrice = this.persistenceService.ommPriceUSD;
    const suppliedUsdValue = this.persistenceService.getUserAssetReserve(assetTag)?.currentOTokenBalanceUSD ?? new BigNumber(0);

    if (suppliedUsdValue.isZero()) { return new BigNumber(0); }

    // log.debug(`userDailySupplyRewards = ${userDailySupplyRewards}`);
    // log.debug(`ommTokenPrice = ${ommTokenPrice}`);
    // log.debug(`suppliedUsdValue = ${suppliedUsdValue}`);

    return (userDailySupplyRewards.multipliedBy(ommTokenPrice).multipliedBy(365)).dividedBy(suppliedUsdValue);
  }

  /**
   * @description Calculate users borrow Omm rewards APY (APY derived from OMM rewards earned from borrow of specific asset)
   * Formula: getUserDailyReward(Address user) * OMM Token price * 365/($ value of user's supplied or borrowed asset)
   */
  public calculateUserBorrowOmmRewardsApy(assetTag: AssetTag): BigNumber {
    // log.debug("calculateUserBorrowOmmRewardsApy for asset " + assetTag);
    const userDailyBorrowRewards: any = this.persistenceService.userDailyOmmRewards?.getBorrowRewardForAsset(assetTag);

    if (!userDailyBorrowRewards) { return new BigNumber(0); }

    if (!userDailyBorrowRewards) { log.error("ERROR in calculateUserBorrowOmmRewardsApy.."); return new BigNumber(0); }
    const ommTokenPrice = this.persistenceService.ommPriceUSD;
    const borrowedUsdValue = this.persistenceService.getUserAssetReserve(assetTag)?.currentBorrowBalanceUSD ?? new BigNumber(0);

    if (borrowedUsdValue.isZero()) { return new BigNumber(0); }

    // log.debug(`userDailyBorrowRewards = ${userDailyBorrowRewards}`);
    // log.debug(`ommTokenPrice = ${ommTokenPrice}`);
    // log.debug(`borrowedUsdValue = ${borrowedUsdValue}`);

    return (userDailyBorrowRewards.multipliedBy(ommTokenPrice).multipliedBy(365)).dividedBy(borrowedUsdValue);
  }

  public calculateDailyOmmLockingRewards(): BigNumber {
    const dailyOmmDistribution = this.persistenceService.tokenDistributionPerDay;
    const lockingOmmDistPercentage = this.persistenceService.allAssetDistPercentages?.OMMLocking.bOMM ?? new BigNumber("0");

    return dailyOmmDistribution.multipliedBy(lockingOmmDistPercentage);
  }

  /** Formulae: Daily OMM locking rewards * 365/ total bOMM supply */
  public calculateLockingAprTo(): BigNumber {
    const dailyOmmLockingRewards = this.calculateDailyOmmLockingRewards();
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply;

    if (dailyOmmLockingRewards.isZero() || totalbOmmBalance.isZero()) {
      return new BigNumber("0");
    }

    return (dailyOmmLockingRewards.multipliedBy(new BigNumber("365"))).dividedBy(totalbOmmBalance);
  }

  /** Formulae: Daily OMM locking rewards * 365*0.0048 /Total bOMM Balance */
  public calculateLockingAprFrom(): BigNumber {
    const dailyOmmLockingRewards = this.calculateDailyOmmLockingRewards();
    const totalbOmmBalance = this.persistenceService.bOmmTotalSupply;

    if (dailyOmmLockingRewards.isZero() || totalbOmmBalance.isZero()) {
      return new BigNumber("0");
    }

    return (dailyOmmLockingRewards.multipliedBy(new BigNumber("365").multipliedBy(new BigNumber("0.0048")))).dividedBy(totalbOmmBalance);
  }

  /** Formulae: Daily user OMM locking rewards * 365 / user locked OMM balance */
  public calculateUserLockingApr(userbOmmBalance: BigNumber, userLockedOmmBalance?: BigNumber): BigNumber {
    const dailyUserOmmLockingRewards = this.calculateUserDailyLockingOmmRewards(userbOmmBalance);
    userLockedOmmBalance = userLockedOmmBalance ? userLockedOmmBalance : this.persistenceService.getUsersLockedOmmBalance();

    if (dailyUserOmmLockingRewards.isZero() || userLockedOmmBalance.isZero()) {
      return new BigNumber("0");
    }

    return (dailyUserOmmLockingRewards.multipliedBy(new BigNumber("365"))).dividedBy(userLockedOmmBalance);
  }

  /** Formulae: Daily OMM locking rewards * User's bOMM balance /total bOMM balance */
  public calculateUserDailyLockingOmmRewards(userbOmmBalance?: BigNumber): BigNumber {
    const dailyOmmLockingRewards = this.calculateDailyOmmLockingRewards();
    const usersbOmmBalance = userbOmmBalance ? userbOmmBalance : this.persistenceService.userbOmmBalance;
    const bOmmTotalSupply = userbOmmBalance ? userbOmmBalance.plus(this.persistenceService.bOmmTotalSupply)
        .minus(this.persistenceService.userbOmmBalance) : this.persistenceService.bOmmTotalSupply;

    if (dailyOmmLockingRewards.lte(Utils.ZERO) || usersbOmmBalance.lte(Utils.ZERO) || bOmmTotalSupply.lte(Utils.ZERO)) {
      return new BigNumber("0");
    }

    return dailyOmmLockingRewards.multipliedBy(usersbOmmBalance.dividedBy(bOmmTotalSupply));
  }

  /** Formula: # of quote token balance from Total Supplied (sICX, USDS, iUSDC) * respective token price *2 */
  public calculatePoolTotalSuppliedInUSD(poolData: PoolData): BigNumber {
    return this.calculatePoolTotalSupplied(poolData).multipliedBy(this.persistenceService.ommPriceUSD).multipliedBy(2);
  }

  calculateUserbOmmMarketBoosters(): IMarketBoosterData {
    log.debug("calculateUserbOmmMarketBoosters...");
    if (!this.persistenceService.userLoggedIn()) {
      return { from: new BigNumber(0), to: new BigNumber(0), supplyBoosterMap: new Map(), borrowBoosterMap: new Map()};
    }

    let min = new BigNumber(-1);
    let max = new BigNumber(-1);
    const supplyBoosterMap = new Map<AssetTag, BigNumber>();
    const borrowBoosterMap = new Map<AssetTag, BigNumber>();

    supportedAssetsMap.forEach((value: Asset, assetTag: AssetTag) => {
      log.debug(`***** Asset = ${assetTag} *******`);

      if (!this.persistenceService.getUserSuppliedAssetBalance(assetTag).isZero()) {
        const supplyOmmRewardsApy = this.calculateSupplyOmmRewardsApy(assetTag);
        const userSupplyOmmRewardsApy = this.calculateUserSupplyOmmRewardsApy(assetTag);
        const supplyBooster = userSupplyOmmRewardsApy.dividedBy(supplyOmmRewardsApy);
        supplyBoosterMap.set(assetTag, supplyBooster);
        log.debug(`supplyBooster = ${supplyBooster.toNumber()}`);

        if (supplyBooster.lt(min) || min.eq(-1)) {
          min = supplyBooster;
        }
        if (supplyBooster.gt(max) || max.eq(-1)) {
          max = supplyBooster;
        }
      }

      if (!this.persistenceService.getUserBorrAssetBalance(assetTag).isZero()) {
        const borrowOmmRewardsApy = this.calculateBorrowOmmRewardsApy(assetTag);
        const userBorrowOmmRewardsApy = this.calculateUserBorrowOmmRewardsApy(assetTag);
        const borrowBooster = userBorrowOmmRewardsApy.dividedBy(borrowOmmRewardsApy);
        borrowBoosterMap.set(assetTag, borrowBooster);
        log.debug(`borrowBooster = ${borrowBooster.toNumber()}`);

        if (borrowBooster.lt(min) || min.eq(-1)) {
          min = borrowBooster;
        }
        if (borrowBooster.gt(max) || max.eq(-1)) {
          max = borrowBooster;
        }
      }

    });

    if (min.eq(-1) || max.eq(-1)) {
      return { from: new BigNumber(0), to: new BigNumber(0), supplyBoosterMap, borrowBoosterMap};
    }

    return { from: min, to: max, supplyBoosterMap, borrowBoosterMap};
  }

  calculateUserbOmmLiquidityBoosters(): ILiquidityBoosterData {
    if (!this.persistenceService.userLoggedIn()) {
      return { from: new BigNumber(0), to: new BigNumber(0), liquidityBoosterMap: new Map()};
    }

    let min = new BigNumber(-1);
    let max = new BigNumber(-1);
    const liquidityBoosterMap = new Map<string, BigNumber>();

    this.persistenceService.userPoolsDataMap.forEach((value: UserPoolData, poolId: string) => {
      if (!value.userStakedBalance.isZero()) {
        log.debug(`***** Pool = ${value.cleanPoolName} *******`);

        const userPoolLiquidityApr = this.calculateUserPoolLiquidityApr(value);
        const poolLiquidityApr = this.calculatePoolLiquidityApr(this.persistenceService.allPoolsDataMap.get(poolId));
        const liquidityBooster = userPoolLiquidityApr.dividedBy(poolLiquidityApr);
        liquidityBoosterMap.set(poolId, liquidityBooster);
        log.debug(`liquidityBooster = ${liquidityBooster.toNumber()}`);

        if (liquidityBooster.lt(min) || min.eq(-1)) {
          min = liquidityBooster;
        }

        if (liquidityBooster.gt(max) || max.eq(-1)) {
          max = liquidityBooster;
        }
      }
    });

    if (min.eq(-1) || max.eq(-1)) {
      return { from: new BigNumber(0), to: new BigNumber(0), liquidityBoosterMap};
    }

    return { from: min, to: max, liquidityBoosterMap};
  }

  // New LP Daily rewards prediction = new LP value/old LP value * new multiplier for LP/old multiplier for LP * current user daily
  //                                   rewards for a specific LP staking
  calculateDynamicUserPoolDailyReward(newStakedLpValue: BigNumber, poolData: UserPoolData, currentUserDailyRewardsForLp: BigNumber)
    : BigNumber {
    const oldLpValue = poolData.userStakedBalance;
    const newLpMultiplier = this.calculateDynamicLiquidityRewardsMultiplierForStakedLp(poolData.poolId, newStakedLpValue);
    const oldLpMultiplier = this.persistenceService.userLiquidityPoolMultiplierMap.get(poolData.poolId.toString())!;
    const currentUserDailyRewards = this.persistenceService.getCurrentUserLpDailyRewards(poolData);
    console.log(this.persistenceService.dailyRewardsAllPoolsReserves);
    const ommRewardsForLp = this.persistenceService.dailyRewardsAllPoolsReserves?.liquidity?.getDailyRewardsForLp(poolData.cleanPoolName)
      ?? new BigNumber(0);

    log.debug("********* calculateDynamicUserPoolDailyReward *********");
    log.debug(`new LP value = ${newStakedLpValue}`);
    log.debug(`old LP value = ${oldLpValue}`);
    log.debug(`new multiplier for LP = ${newLpMultiplier}`);
    log.debug(`old multiplier for LP = ${oldLpMultiplier}`);
    log.debug(`ommRewardsForLp = ${ommRewardsForLp}`);
    log.debug(`currentUserDailyRewards = ${currentUserDailyRewards}`);
    log.debug(`current user daily for ${poolData.prettyName} LP staking = ${currentUserDailyRewardsForLp}`);
    log.debug("*******************************************************");

    // (new LP value* new multiplier for LP * current user daily rewards for LP staked * OMM Rewards for specific LP pair) / r2 - r3
    const r1 = newStakedLpValue.multipliedBy(newLpMultiplier).multipliedBy(currentUserDailyRewards).multipliedBy(ommRewardsForLp);

    // r2 = old LP value * old multiplier for LP * OMM Rewards for specific LP pair - r3
    const r2 = oldLpValue.multipliedBy(oldLpMultiplier).multipliedBy(ommRewardsForLp);

    // current user daily rewards for LP staked *(old LP value * old multiplier for LP - new LP value * new multiplier for LP)
    const r3 = currentUserDailyRewards.multipliedBy((oldLpValue.multipliedBy(oldLpMultiplier))
      .minus(newStakedLpValue.multipliedBy(newLpMultiplier)));

    const res = r1.dividedBy(r2.minus(r3));
    const oldValue = (newStakedLpValue.div(oldLpValue)).multipliedBy(newLpMultiplier.div(oldLpMultiplier))
      .multipliedBy(currentUserDailyRewardsForLp);

    log.debug(`new res = ${res}`);
    log.debug(`old res = ${oldValue}`);

    return res;
  }

  // New LP APR Prediction = New LP Daily rewards prediction * OMM Token Price * 365/ ( new $ value of user's LP staked)
  calculateDynamicUserPoolApr(newStakedLpValue: BigNumber, poolData: UserPoolData, newLpDailyRewards: BigNumber)
    : BigNumber {
    const ommTokenPrice = this.persistenceService.ommPriceUSD;
    const stakedLpUsdValue = this.calculateUserPoolSuppliedForNewStaked(newStakedLpValue, poolData).multipliedBy(ommTokenPrice)
      .multipliedBy(2);
    log.debug("********* calculateDynamicUserPoolApr *********");
    log.debug(`newStakedLpValue = ${newStakedLpValue}`);
    log.debug(`newLpDailyRewards = ${newLpDailyRewards}`);
    log.debug(`new $ value of user's LP staked = ${stakedLpUsdValue}`);

    return (newLpDailyRewards.multipliedBy(ommTokenPrice).multipliedBy(365)).dividedBy(stakedLpUsdValue);
  }

}
