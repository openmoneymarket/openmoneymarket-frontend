import {Injectable} from '@angular/core';
import {PersistenceService} from "../persistence/persistence.service";
import {AssetTag} from "../../models/Asset";
import {UserAction} from "../../models/UserAction";
import {ReserveData} from "../../models/AllReservesData";
import {StateChangeService} from "../state-change/state-change.service";
import {Utils} from "../../common/utils";
import {Prep, PrepList} from "../../models/Preps";
import {OmmError} from "../../core/errors/OmmError";
import {UserReserveData} from "../../models/UserReserveData";
import log from "loglevel";
import {PoolData} from "../../models/PoolData";
import {UserPoolData} from "../../models/UserPoolData";

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {
  className = "[CalculationsService]";

  constructor(private persistenceService: PersistenceService,
              private stateChangeService: StateChangeService) { }


  // formulae: Supply APY + OMM reward Supply APY
  calculateUserAndMarketReserveSupplyApy(assetTag: AssetTag): number {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      return reserveData.liquidityRate + this.calculateSupplyApyWithOmmRewards(assetTag);
    } else {
      return 0;
    }
  }

  // formulae: OMM reward Borrow APY - Borrow APY
  calculateUserAndMarketReserveBorrowApy(assetTag: AssetTag): number {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      return this.calculateBorrowApyWithOmmRewards(assetTag) - reserveData.borrowRate;
    } else {
      return 0;
    }
  }

  public calculateBorrowApyWithOmmRewards(assetTag: AssetTag): number {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      const borrowRate = reserveData.borrowRate;
      const tokenDistributionPerDay = this.persistenceService.tokenDistributionPerDay;
      const totalInterestOverAYear = this.borrowTotalInterestOverAYear();
      const lendingBorrowingPortion = this.persistenceService.distributionPercentages?.lendingBorrow ?? 0;

      return this.borrowOmmApyFormula(lendingBorrowingPortion, borrowRate, totalInterestOverAYear, tokenDistributionPerDay,
        this.persistenceService.ommPriceUSD,
        reserveData);
    } else {
      return 0;
    }
  }

  // Borrow OMM rewards APY: Token Distribution for that day (1M) * OMM Token Price * reserve portion * reserve borrowing * 365
  // / (reserve supplied * reserve price from Oracle)
  public borrowOmmApyFormula(lendingBorrowingPortion: number, borrowRate: number, totalInterestOverAYear: number,
                             tokenDistributionPerDay: number, ommPriceUSD: number, reserveData: ReserveData): number {
    return (lendingBorrowingPortion * tokenDistributionPerDay * ommPriceUSD * reserveData.rewardPercentage
      * reserveData.borrowingPercentage * 365) / (reserveData.totalBorrows * reserveData.exchangePrice);
  }

  public calculateSupplyApyWithOmmRewards(assetTag: AssetTag): number {
    const reserveData = this.persistenceService.getAssetReserveData(assetTag);

    if (reserveData) {
      const liquidityRate = this.persistenceService.getAssetReserveData(assetTag)?.liquidityRate ?? 0;
      const totalInterestOverAYear = this.supplyTotalInterestOverAYear();
      const tokenDistributionPerDay = this.persistenceService.tokenDistributionPerDay;
      const lendingBorrowingPortion = this.persistenceService.distributionPercentages?.lendingBorrow ?? 0;

      return this.supplyOmmApyFormula(lendingBorrowingPortion, liquidityRate, totalInterestOverAYear, tokenDistributionPerDay,
        this.persistenceService.ommPriceUSD,
        reserveData);
    } else {
      log.debug("res is ZERO (reserveData not found)");
      return 0;
    }
  }

  public supplyOmmApyFormula(lendingBorrowingPortion: number, liquidityRate: number, totalInterestOverAYear: number,
                             tokenDistributionPerDay: number, ommPriceUSD: number, reserveData: ReserveData): number {
    return (lendingBorrowingPortion * tokenDistributionPerDay * ommPriceUSD * reserveData.rewardPercentage
      * reserveData.lendingPercentage * 365) / (reserveData.totalLiquidity * reserveData.exchangePrice);
  }

  /**
   * @description sum(sum(CollateralBalanceUSD * liquidityRate)) for all users
   * @return Number
   */
  public supplyTotalInterestOverAYear(): number {
    let allUsersCollateralSumRate = 0;

    if (this.persistenceService.allReserves) {
      Object.values(this.persistenceService.allReserves).forEach((reserve: ReserveData) => {
        allUsersCollateralSumRate += reserve.totalLiquidityUSD * reserve.liquidityRate;
      });

      return allUsersCollateralSumRate;
    } else {
      throw new OmmError("getAllUsersCollateralSumRate -> this.persistenceService.allReserves is undefined");
    }
  }

  /**
   * @description formula = sum(sum(BorrowBalanceUSD * borrowRate))
   * @return Number
   */
  borrowTotalInterestOverAYear(): number {
    let allUsersBorrowSumRate = 0;
    if (this.persistenceService.allReserves) {
      Object.values(this.persistenceService.allReserves).forEach((reserve: ReserveData) => {
        allUsersBorrowSumRate += reserve.totalBorrowsUSD * reserve.borrowRate;
      });

      return allUsersBorrowSumRate;
    } else {
      throw new OmmError("getAllUsersBorrowSumRate -> this.persistenceService.allReserves is undefined");
    }
  }

  public votingPower(): number {
    const totalIcxStakedByOMM = this.persistenceService.getAssetReserveData(AssetTag.ICX)?.totalLiquidity ?? 0;
    const totalStakedOmm = this.persistenceService.totalStakedOmm;

    if (totalIcxStakedByOMM === 0 || totalStakedOmm === 0) {
      return 0;
    }

    const res = Utils.divideDecimalsPrecision(totalIcxStakedByOMM, totalStakedOmm);

    return Utils.roundDownTo2Decimals(Utils.convertSICXToICX(res, this.persistenceService.sIcxToIcxRate()));
  }

  public calculateAssetSupplySliderMax(assetTag: AssetTag): number {
    let suppliedAssetBalance = this.persistenceService.getUserSuppliedAssetBalance(assetTag);

    if (assetTag === AssetTag.ICX) {
      suppliedAssetBalance = Utils.convertSICXToICX(suppliedAssetBalance, this.persistenceService.sIcxToIcxRate());
    }

    return Utils.addDecimalsPrecision(suppliedAssetBalance, this.persistenceService.getUserAssetBalance(assetTag));
  }

  // calculate the total risk percentage based on the user health factor or user action
  public calculateTotalRisk(assetTag?: AssetTag, diff?: number, userAction?: UserAction, updateState = true): number {
    let res: number;
    if (assetTag && diff && userAction != null) {
      res = this.calculateTotalRiskDynamic(assetTag, diff, userAction);
    } else {
      res = this.calculateTotalRiskBasedOnHF();
    }

    if (updateState) {
      // update persistence user total risk
      this.stateChangeService.updateUserTotalRisk(res);
    }

    return res;
  }

  private calculateTotalRiskBasedOnHF(): number {
    // if user has not borrowed any asset return 0
    if (this.persistenceService.userHasNotBorrowedAnyAsset()) {
      return 0;
    } else {
      const healthFactor = this.persistenceService.userAccountData?.healthFactor ?? 1;

      // check for negative health factor
      if (healthFactor <= 0) {
        return 0;
      }

      return 1 / healthFactor;
    }
  }

  /**
   * @description Calculate the total risk based on the user action (supply, redeem, ..)
   * @param assetTag - Asset based on which we are calculating the risk
   * @param amount - Amount being considered in dynamic risk calculation
   * @param userAction - Action that user is making
   * @return total user risk as a number (multiply by 100 to get percentage)
   */
  private calculateTotalRiskDynamic(assetTag: AssetTag, amount: number, userAction: UserAction): number {
    const userAccountData = this.persistenceService.userAccountData;
    // if user account data not yet initialised return 0
    if (!userAccountData) {
      return 0;
    }

    // init base values
    let totalFeeUSD = userAccountData.totalFeesUSD;
    let totalBorrowBalanceUSD = userAccountData.totalBorrowBalanceUSD;
    let totalCollateralBalanceUSD = userAccountData.totalCollateralBalanceUSD;
    const liquidationThreshold = this.persistenceService.getAverageLiquidationThreshold();

    const assetReserve = this.persistenceService.getAssetReserveData(assetTag);
    const assetExchangePrice = assetReserve?.exchangePrice ?? 0;

    switch (userAction) {
      case UserAction.SUPPLY:

        // if user add more collateral, add USD value of amount to the total collateral balance USD
        totalCollateralBalanceUSD += amount * assetExchangePrice;
        break;
      case UserAction.REDEEM:
        // if user takes out collateral, subtract USD value of amount from the total collateral balance USD
        totalCollateralBalanceUSD -= amount * assetExchangePrice;
        break;
      case UserAction.BORROW:
        // if user takes out the loan (borrow) update the origination fee and add amount to the total borrow balance
        const originationFee = this.persistenceService.getUserAssetReserve(assetTag)?.originationFee ?? 0;
        const originationFeePercentage = this.persistenceService.loanOriginationFeePercentage ?? 0.001;
        totalFeeUSD += amount * assetExchangePrice * originationFeePercentage + originationFee;
        totalBorrowBalanceUSD += amount * assetExchangePrice;
        break;
      case UserAction.REPAY:
        // if user repays the loan, subtract the USD value of amount from the total borrow balance USD
        totalBorrowBalanceUSD -= amount * assetExchangePrice;
    }

    let res = totalBorrowBalanceUSD / ((totalCollateralBalanceUSD - totalFeeUSD) * liquidationThreshold);

    if (res < 0) {
      res = 1;
    }

    return res;
  }

  /**
   * @description Calculate the available borrow for specific asset (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @return asset available borrow amount
   */
  public calculateAvailableBorrowForAsset(assetTag: AssetTag): number {
    // Formulae: borrowsAllowedUSD = Sum((CollateralBalanceUSD per reserve - totalFeesUSD per reserve) * LTV per reserve)
    let borrowsAllowedUSD = 0;

    this.persistenceService.userReserves.reserveMap.forEach((userReserveData, tag) => {
      if (userReserveData) {
        const collateralBalanceUSD = userReserveData.currentOTokenBalanceUSD;
        const originationFee = userReserveData.originationFee;
        const totalReserveFeesUSD = originationFee * userReserveData?.exchangeRate;
        const reserveLtv = this.persistenceService.getLtvForReserve(tag);

        borrowsAllowedUSD += (collateralBalanceUSD - totalReserveFeesUSD) * reserveLtv;
      }
    });

    // previous borrow balance of user across all collaterals in USD
    const totalBorrowBalanceUSD = this.persistenceService.userAccountData?.totalBorrowBalanceUSD ?? 0;
    // the amount user can borrow in USD across all the collaterals
    const availableBorrowUSD = borrowsAllowedUSD - totalBorrowBalanceUSD;
    // exchange price of the asset (reserve) extracted from the ReserveData
    const exchangePrice = this.persistenceService.getAssetReserveData(assetTag)?.exchangePrice ?? -1;

    return Utils.roundDownTo2Decimals(availableBorrowUSD / exchangePrice);
  }

  /**
   * @description Calculate users daily supply interest for specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param supplied - optional parameter to provide current supplied value (e.g. for dynamic slider changes)
   * @return users asset supply interest (in USD) for a day
   */
  public calculateUsersDailySupplyInterestForAsset(assetTag: AssetTag, supplied?: number): number {
    let currentOTokenBalanceUSD = this.persistenceService.getUserSuppliedAssetUSDBalance(assetTag);

    const exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
    if (supplied) {
      currentOTokenBalanceUSD = supplied * exchangePrice;
    }

    const liquidityRate = this.persistenceService.getUserAssetReserve(assetTag)?.liquidityRate ?? 0;
    // "easy route" formula
    const res = currentOTokenBalanceUSD * liquidityRate * (1 / 365);

    // convert to asset
    return res / exchangePrice;
  }

  calculateUsersSupplyInterestPerDayUSD(): number {
    let total = 0;
    let exchangePrice = 0;

    Object.values(AssetTag).forEach(assetTag => {
      exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
      total += this.calculateUsersDailySupplyInterestForAsset(assetTag) * exchangePrice;
    });

    return total;
  }

  /**
   * @description Calculate users daily borrow interest for specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param borrowed - optional parameter to provide current borrowed value (e.g. for dynamic slider changes)
   * @return users asset borrow interest (in USD) for a day
   */
  public calculateUsersDailyBorrowInterestForAsset(assetTag: AssetTag, borrowed?: number): number {
    let currentBorrowBalanceUSD = this.persistenceService.getUserBorrowedAssetUSDBalance(assetTag);
    const exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);

    if (borrowed) {
      currentBorrowBalanceUSD = borrowed * exchangePrice;
    }

    const borrowRate = this.persistenceService.getUserAssetReserve(assetTag)?.borrowRate ?? 0;

    // "easy route" formula
    const res = currentBorrowBalanceUSD * borrowRate * (1 / 365);

    // convert to asset
    const valueInAsset = res / exchangePrice;

    return valueInAsset;
  }

  calculateUsersBorrowInterestPerDayUSD(): number {
    let total = 0;
    let exchangePrice = 0;

    Object.values(AssetTag).forEach(assetTag => {
      exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
      total += this.calculateUsersDailyBorrowInterestForAsset(assetTag) * exchangePrice;
    });

    return total;
  }

  public calculateUserTotalOmmRewards(): number {
    return this.calculateUsersOmmRewardsForDeposit() + this.calculateUsersOmmRewardsForBorrow();
  }

  /**
   * @description Calculate users OMM rewards for deposit of specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param supplied - Optional parameter for dynamic calculations based on supply change (slider)
   * @return users Omm reward for deposit amount
   */
  public calculateUsersOmmRewardsForDeposit(assetTag?: AssetTag, supplied?: number): number {
    let userSum = 0;

    this.persistenceService.userReserves.reserveMap.forEach((reserve, tag) => {
      let collateralBalanceUSD = reserve?.currentOTokenBalanceUSD ?? 0;

      // dynamic calculation
      if (assetTag && supplied && assetTag === tag) {
        collateralBalanceUSD =  supplied * this.persistenceService.getAssetExchangePrice(assetTag);
      }

      const liquidityRate = reserve?.liquidityRate ?? 0;
      userSum += collateralBalanceUSD * liquidityRate;
    });

    if (!this.persistenceService.allReserves) { return 0; }

    let allUsersSum = 0;
    Object.values(this.persistenceService?.allReserves).forEach((reserve: ReserveData) => {
      allUsersSum += reserve.totalLiquidityUSD * reserve.liquidityRate;
    });

    if (userSum === 0 || allUsersSum === 0) { return 0; }

    return (userSum / allUsersSum) * 0.2 * this.persistenceService.tokenDistributionPerDay;
  }

  /**
   * @description Calculate users OMM rewards for borrow of specific asset - reserve (e.g. USDb, ICX, ..)
   * @param assetTag - Tag (ticker) of the asset
   * @param borrowed - Optional parameter for dynamic calculations based on borrow change (slider)
   * @return users Omm reward for borrow amount
   */
  public calculateUsersOmmRewardsForBorrow(assetTag?: AssetTag, borrowed?: number): number {
    let userSum = 0;
    this.persistenceService.userReserves.reserveMap.forEach((reserve, tag) => {
      let borrowBalanceUSD = reserve?.currentBorrowBalanceUSD ?? 0;

      // dynamic calculation of borrow balance USD
      if (assetTag && borrowed && assetTag === tag) {
        const exchangePrice = this.persistenceService.getAssetExchangePrice(assetTag);
        borrowBalanceUSD =  borrowed * exchangePrice;
      }

      const borrowRate = reserve?.borrowRate ?? 0;
      userSum += borrowBalanceUSD * borrowRate;
    });

    if (!this.persistenceService.allReserves) { return 0; }

    let allUsersSum = 0;
    Object.values(this.persistenceService?.allReserves).forEach((reserve: ReserveData) => {
      allUsersSum += reserve.totalBorrowsUSD * reserve.borrowRate;
    });

    if (userSum === 0 || allUsersSum === 0) { return 0; }

    return (userSum / allUsersSum) * 0.2 * this.persistenceService.tokenDistributionPerDay;
  }

  public getTotalAvgSupplyApy(ommApyIncluded = false): number {
    let totalLiquidityUSDsum = 0;
    let totalLiquidityUSDsupplyApySum = 0;

    if (!this.persistenceService.allReserves) {
      return 0;
    }

    let reserve: ReserveData | undefined;
    Object.values(AssetTag).forEach((assetTag: AssetTag) => {
      reserve = this.persistenceService.allReserves!.getReserveData(assetTag);
      totalLiquidityUSDsum += reserve.totalLiquidityUSD;
      const rate = ommApyIncluded ? reserve.liquidityRate + this.calculateSupplyApyWithOmmRewards(assetTag) : reserve.liquidityRate;
      totalLiquidityUSDsupplyApySum += reserve.totalLiquidityUSD * rate;
    });

    return totalLiquidityUSDsupplyApySum / totalLiquidityUSDsum;
  }

  public getTotalAvgBorrowApy(ommApyIncluded = false): number {
    let totalBorrowUSDsum = 0;
    let totalBorrowUSDsupplyApySum = 0;

    if (!this.persistenceService.allReserves) {
      return 0;
    }

    let reserve: ReserveData | undefined;
    Object.values(AssetTag).forEach((assetTag: AssetTag) => {
      reserve = this.persistenceService.allReserves!.getReserveData(assetTag);
      const rate = ommApyIncluded ? reserve.borrowRate + this.calculateBorrowApyWithOmmRewards(assetTag) : reserve.borrowRate;
      totalBorrowUSDsum += reserve.totalBorrowsUSD;
      totalBorrowUSDsupplyApySum += reserve.totalBorrowsUSD * rate;
    });

    return totalBorrowUSDsupplyApySum / totalBorrowUSDsum;
  }

  public getYourSupplyApy(ommApyIncluded = false): number {
    let supplyApySum = 0;
    let supplySum = 0;
    let supplied;
    let supplyApy;

    // Sum(My supply amount for each asset * Supply APY for each asset)
    this.persistenceService.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined, assetTag: AssetTag) => {
      supplied = reserve?.currentOTokenBalanceUSD ?? 0;
      supplyApy = reserve?.liquidityRate ?? 0;
      const rate = ommApyIncluded ? supplyApy + this.calculateSupplyApyWithOmmRewards(assetTag) : supplyApy;
      supplyApySum += supplied * rate;
      supplySum += supplied;
    });

    return supplyApySum / supplySum;
  }

  public getYourBorrowApy(ommApyIncluded = false): number {
    let borrowApySum = 0;
    let borrowSum = 0;
    let borrowed;
    let borrowApy;

    // Sum(My supply amount for each asset * Supply APY for each asset)
    this.persistenceService.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined, assetTag: AssetTag) => {
      borrowed = reserve?.currentBorrowBalanceUSD ?? 0;
      borrowApy = reserve?.borrowRate ?? 0;
      const rate = ommApyIncluded ? borrowApy + this.calculateBorrowApyWithOmmRewards(assetTag) : borrowApy;
      borrowApySum += borrowed * rate;
      borrowSum += borrowed;
    });

    return borrowApySum / borrowSum;
  }

  public calculateBorrowFee(amount?: number): number {
    log.debug("calculateBorrowFee..");

    if (!amount) {
      return 0;
    }

    const loanOriginationFeePercentage = this.persistenceService.loanOriginationFeePercentage ?? 0.001;

    log.debug(`amount=${amount}, feePercentage=${loanOriginationFeePercentage} borrowFee=${amount * loanOriginationFeePercentage}`);
    return Utils.multiplyDecimalsPrecision(amount, loanOriginationFeePercentage, 5);
  }

  public calculatePrepsIcxReward(prep: Prep, prepList: PrepList): number {
    const blockValidationRewards = prep.irep / 2;

    const delegationRate = prep.delegated / prepList.totalDelegated;

    const representativeRewards = prep.irep / 2 * 100 * delegationRate;

    return blockValidationRewards + representativeRewards;
  }


  /** calculate total supplied both for base and quote token
   * Formula: totalStakedBalance / Total LP tokens in the Balanced pool (i.e. poolStats -> total_supply) * getPoolTotal (Balanced API #23)
   * do it twice for base token/quote token (getPoolData dynamic)
   */
  public calculatePoolTotalSupplied(poolData: PoolData, base: boolean = true): number {
    const totalStakedBalance = poolData.totalStakedBalance;
    const totalLpTokenInPool = poolData.poolStats.totalSupply;

    return totalStakedBalance / totalLpTokenInPool * (base ? poolData.poolStats.base : poolData.poolStats.quote);
  }

  /** calculate total supplied both for base and quote token
   * Formula: userStakedBalance / Total LP tokens in the Balanced pool (i.e. poolStats -> total_supply) * getPoolTotal (Balanced API #23)
   * do it twice for base token/quote token (getPoolData dynamic)
   */
  public calculateUserPoolSupplied(poolData: UserPoolData, base: boolean = true): number {
    const userStakedBalance = poolData.userStakedBalance;
    const totalLpTokenInPool = poolData.poolStats.totalSupply;

    return userStakedBalance / totalLpTokenInPool * (base ? poolData.poolStats.base : poolData.poolStats.quote);
  }

  /** Formula: Daily OMM distribution (1M) * Pool pair portion (0.05), same across all 3 pools (OMM/USDS, OMM/iUSDC, OMM/sICX) */
  public calculateDailyRewardsForPool(poolData: PoolData): number {
    return this.persistenceService.tokenDistributionPerDay * 0.05; // TODO replace constant with pool pair portion
  }

  /** Formula: userStakedBalance / totalStakedBalance * Daily OMM distribution (1M) * OMM/USDS pair portion (0.05) */
  public calculateUserDailyRewardsForPool(poolData: UserPoolData): number {
    // TODO replace constant with pool pair portion
    return poolData.userStakedBalance / poolData.totalStakedBalance * this.persistenceService.tokenDistributionPerDay * 0.05;
  }

  /** Formula: Sum (Daily rewards_Liquidity Pools2 across 3 pools) */
  public calculateDailyRewardsAllPools(): number {
    return this.persistenceService.allPools.reduce((a, poolData) => a + this.calculateDailyRewardsForPool(poolData), 0);
  }

  /** Formula: Sum (Daily rewards_Liquidity Pools2 across 3 pools) */
  public calculateDailyRewardsUserPools(): number {
    return this.persistenceService.userPools.reduce((a, poolData) => a + this.calculateUserDailyRewardsForPool(poolData), 0);
  }

  /** Formula: Daily rewards * OMM price * 365/Total supplied in $ value */
  public calculatePoolLiquidityApy(poolData: PoolData): number {
    const dailyRewards = this.calculateDailyRewardsForPool(poolData);
    const ommPrice = this.persistenceService.ommPriceUSD;
    const totalSuppliedUSD = this.calculatePoolTotalSuppliedUSD(poolData);

    if (Utils.isUndefinedOrZero(dailyRewards) || Utils.isUndefinedOrZero(totalSuppliedUSD) || Utils.isUndefinedOrZero(ommPrice)) {
      return 0;
    }

    return dailyRewards * ommPrice * 365 / totalSuppliedUSD;
  }

  /** Calculate total supplied for base and quote token of pool in USD */
  public calculatePoolTotalSuppliedUSD(poolData: PoolData): number {
    const quoteAssetTag = AssetTag.constructFromPoolPairName(poolData.poolStats.name);

    const totalSuppliedBaseUSD = this.calculatePoolTotalSupplied(poolData, true) * this.persistenceService.ommPriceUSD;
    const totalSuppliedQuoteUSD = this.calculatePoolTotalSupplied(poolData, false) *
      this.persistenceService.getAssetExchangePrice(quoteAssetTag);

    return totalSuppliedBaseUSD + totalSuppliedQuoteUSD;
  }

  /** Calculate user total supplied for base and quote token of pool in USD */
  public calculateUserPoolTotalSuppliedUSD(poolData: UserPoolData): number {
    const quoteAssetTag = AssetTag.constructFromPoolPairName(poolData.poolStats.name);

    const totalSuppliedBaseUSD = this.calculateUserPoolSupplied(poolData, true) * this.persistenceService.ommPriceUSD;
    const totalSuppliedQuoteUSD = this.calculateUserPoolSupplied(poolData, false) *
      this.persistenceService.getAssetExchangePrice(quoteAssetTag);

    return totalSuppliedBaseUSD + totalSuppliedQuoteUSD;
  }

  /** Formula: Sum(Total supplied assets across 3 pools in $ value) */
  public getAllPoolTotalLiquidityUSD(): number {
    return this.persistenceService.allPools.reduce((a, poolData) => a + this.calculatePoolTotalSuppliedUSD(poolData), 0);
  }

  /** Formula: Sum(you've supplied assets across 3 pools in $ value) */
  public getUserTotalLiquidityUSD(): number {
    return this.persistenceService.userPools.reduce((a, poolData) => a + this.calculateUserPoolTotalSuppliedUSD(poolData), 0);
  }

  /** Formula: Sum(Liquidity APY (all pools) * Total supplied assets in $ value)/(Total liquidity) */
  public getAllPoolsAverageApy(): number {
    const sum = this.persistenceService.allPools.reduce((a, poolData) => a + (this.calculatePoolLiquidityApy(poolData)
      * this.calculatePoolTotalSuppliedUSD(poolData)), 0);

    const totalLiquidity = this.getAllPoolTotalLiquidityUSD();

    return sum / totalLiquidity;
  }

  /** Formula: Sum(Liquidity APY (your pools) * You've supplied assets $ value)/(your liquidity) */
  public getUserPoolsAverageApy(): number {
    const sum = this.persistenceService.userPools.reduce((a, poolData) => a + (this.calculatePoolLiquidityApy(poolData)
      * this.calculateUserPoolTotalSuppliedUSD(poolData)), 0);

    const totalLiquidity = this.getAllPoolTotalLiquidityUSD();

    return sum / totalLiquidity;
  }

}
