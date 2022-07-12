import {Injectable} from '@angular/core';
import {IconexWallet} from '../../models/wallets/IconexWallet';
import {AllAddresses} from '../../models/classes/AllAddresses';
import {AllReservesData, ReserveData} from "../../models/classes/AllReservesData";
import {UserReserveData, UserReserves} from "../../models/classes/UserReserveData";
import {UserAccountData} from "../../models/classes/UserAccountData";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {AssetTag, CollateralAssetTag} from "../../models/classes/Asset";
import {AllReserveConfigData} from "../../models/classes/AllReserveConfigData";
import {LedgerWallet} from "../../models/wallets/LedgerWallet";
import {UserAccumulatedOmmRewards} from "../../models/classes/UserAccumulatedOmmRewards";
import {OmmTokenBalanceDetails} from "../../models/classes/OmmTokenBalanceDetails";
import {PrepList} from "../../models/classes/Preps";
import {YourPrepVote} from "../../models/classes/YourPrepVote";
import {Utils} from "../../common/utils";
import {UnstakeInfo} from "../../models/classes/UnstakeInfo";
import {DistributionPercentages} from "../../models/classes/DistributionPercentages";
import {PoolData} from "../../models/classes/PoolData";
import {UserPoolData} from "../../models/classes/UserPoolData";
import {PoolsDistPercentages} from "../../models/classes/PoolsDistPercentages";
import {AllAssetDistPercentages} from "../../models/classes/AllAssetDisPercentages";
import {DailyRewardsAllReservesPools} from "../../models/classes/DailyRewardsAllReservesPools";
import BigNumber from "bignumber.js";
import {Proposal} from "../../models/classes/Proposal";
import {Vote} from "../../models/classes/Vote";
import {InterestHistory} from "../../models/classes/InterestHistory";
import {LockedOmm} from "../../models/classes/LockedOmm";
import {UserDailyOmmReward} from "../../models/classes/UserDailyOmmReward";

@Injectable({
  providedIn: 'root'
})
/**
 * Service that holds and manages client data.
 */
export class PersistenceService {

  public activeWallet?: IconexWallet | BridgeWallet | LedgerWallet;

  public allAddresses?: AllAddresses;
  public allReserves?: AllReservesData;
  public allReservesConfigData?: AllReserveConfigData;

  public totalBorrowedUSD = new BigNumber(0);
  public totalSuppliedUSD = new BigNumber(0);

  public allPools: PoolData[] = [];
  public allPoolsDistPercentages?: PoolsDistPercentages;
  public allPoolsDataMap: Map<string, PoolData> = new Map<string, PoolData>();
  public yourVotesPrepList: YourPrepVote[] = [];

  /**
   * User specific data
   */
  public userPools: UserPoolData[] = [];
  public userPoolsDataMap: Map<string, UserPoolData> = new Map<string, UserPoolData>();
  public userReserves: UserReserves = new UserReserves();
  public userTotalSuppliedUSD = new BigNumber(0);
  public userTotalBorrowedUSD = new BigNumber(0);
  public userTotalRisk = new BigNumber("0");
  public userAccountData?: UserAccountData;
  public userAccumulatedOmmRewards?: UserAccumulatedOmmRewards;
  public userDailyOmmRewards?: UserDailyOmmReward;
  public userOmmTokenBalanceDetails?: OmmTokenBalanceDetails;
  public userUnstakingInfo?: UnstakeInfo;
  public userClaimableIcx?: BigNumber;
  public userLockedOmm?: LockedOmm;
  public userbOmmBalance = new BigNumber("0");
  public userDebt: Map<CollateralAssetTag, BigNumber | undefined> = new Map<CollateralAssetTag, BigNumber | undefined>();
  public userVotingWeightForProposal: Map<BigNumber, BigNumber> = new Map<BigNumber, BigNumber>(); // proposalId to voting weight
  public userProposalVotes: Map<BigNumber, Vote> = new Map<BigNumber, Vote>();
  public userMarketSupplyMultiplierMap = new Map<AssetTag, BigNumber>();
  public userMarketBorrowMultiplierMap = new Map<AssetTag, BigNumber>();
  public userLiquidityPoolMultiplierMap = new Map<string, BigNumber>(); // key = pool ID

  public minOmmLockAmount = new BigNumber("1");
  public totalStakedOmm = new BigNumber("0");
  public totalSuppliedOmm = new BigNumber("0");
  public bOmmTotalSupply = new BigNumber("0");
  public ommPriceUSD = new BigNumber("-1"); // -1 indicates that ommPriceUSD is not set

  public tokenDistributionPerDay = new BigNumber("0");
  public loanOriginationFeePercentage = new BigNumber("0.001");
  public distributionPercentages?: DistributionPercentages;
  public allAssetDistPercentages?: AllAssetDistPercentages;
  public dailyRewardsAllPoolsReserves?: DailyRewardsAllReservesPools;

  public voteDefinitionFee = new BigNumber("0");
  public voteDefinitionCriterion = new BigNumber("0");
  public proposalList: Proposal[] = [];
  public voteDuration = new BigNumber("-1");

  public prepList?: PrepList;

  public interestHistory: InterestHistory[] = [];

  constructor() {}

  public userLoggedIn(): boolean {
    return this.activeWallet != null;
  }

  public logoutUser(): void {
    this.activeWallet = undefined;

    // reset values
    this.yourVotesPrepList = [];
    this.userOmmTokenBalanceDetails = undefined;
    this.userAccumulatedOmmRewards = undefined;
    this.userAccountData = undefined;
    this.userTotalRisk = new BigNumber("0");
    this.userReserves = new UserReserves();
    this.userbOmmBalance = new BigNumber("0");
  }


  userCurrentLockedOmmEndInMilliseconds(): BigNumber {
    return this.userLockedOmm?.end.dividedBy(1000) ?? new BigNumber(0);
  }

  getProposal(id: BigNumber): Proposal | undefined {
    return this.proposalList.find(p => p.id.isEqualTo(id));
  }

  getMinOmmStakedRequiredForProposal(): BigNumber {
    return this.bOmmTotalSupply.multipliedBy(this.voteDefinitionCriterion);
  }

  public getDistPercentageOfPool(poolId: BigNumber): BigNumber {
    return this.allPoolsDistPercentages?.getDistPercentageForPool(poolId) ?? new BigNumber("0");
  }

  public getPoolTotalStakedLp(poolId: BigNumber): BigNumber {
    return this.allPoolsDataMap.get(poolId.toString())?.totalStakedBalance ?? new BigNumber("0");
  }

  public getUserPoolStakedBalance(poolId: BigNumber): BigNumber {
    return this.userPoolsDataMap.get(poolId.toString())?.userStakedBalance ?? new BigNumber("0");
  }

  public getUserPoolStakedAvailableBalance(poolId: BigNumber): BigNumber {
    return this.userPoolsDataMap.get(poolId.toString())?.userAvailableBalance ?? new BigNumber("0");
  }

  public getUserPoolTotalBalance(poolId: BigNumber): BigNumber {
    return this.userPoolsDataMap.get(poolId.toString())?.userTotalBalance ?? new BigNumber("0");
  }

  getCurrentUserLpDailyRewards(poolData: UserPoolData): BigNumber {
    const userDailyOmmRewards: any = this.userDailyOmmRewards;
    if (userDailyOmmRewards) {
      return userDailyOmmRewards[poolData.cleanPoolName] ?? new BigNumber(0);
    } else {
      return new BigNumber(0);
    }
  }

  public getUserTotalUnstakeAmount(): BigNumber {
    return this.userUnstakingInfo?.totalAmount ?? new BigNumber("0");
  }

  public getLtvForReserve(assetTag: AssetTag): BigNumber {
    return this.getAssetReserveData(assetTag)?.baseLTVasCollateral ?? new BigNumber("0");
  }

  public getTotalAssetBorrows(assetTag: AssetTag): BigNumber {
    return this.getAssetReserveData(assetTag)?.totalBorrows ?? new BigNumber("0");
  }

  public getReserveAddressByAssetTag(assetTag: AssetTag): string | undefined {
    return this.allAddresses?.collateralAddress(assetTag);
  }

  public getDecimalsForReserve(assetTag: AssetTag): BigNumber | undefined {
    return this.allReserves?.getReserveData(assetTag).decimals;
  }

  public getUserAssetDebt(assetTag: AssetTag): BigNumber {
    return this.userDebt.get(assetTag) ?? new BigNumber("0");
  }

  public getUsersLockedOmmBalance(): BigNumber {
    return (this.userLockedOmm?.amount ?? new BigNumber("0")).dp(0);
  }

  public getUsersAvailableOmmBalanceRaw(): BigNumber {
    return (this.userOmmTokenBalanceDetails?.availableBalance ?? new BigNumber("0"));
  }

  public getUsersAvailableOmmBalance(): BigNumber {
    return (this.userOmmTokenBalanceDetails?.availableBalance ?? new BigNumber("0")).dp(0);
  }

  public getUserStakedOmmBalance(): BigNumber {
    return this.userOmmTokenBalanceDetails?.stakedBalance ?? new BigNumber("0");
  }

  public getUserUnstakingOmmBalance0Rounded(): BigNumber {
    return (this.userOmmTokenBalanceDetails?.unstakingBalance ?? new BigNumber("0")).dp(0);
  }

  publicGetActiveIconAddress(): string | undefined {
    return this.activeWallet?.address;
  }

  public bridgeWalletActive(): boolean {
    return this.activeWallet instanceof BridgeWallet;
  }

  public iconexWalletActive(): boolean {
    return this.activeWallet instanceof IconexWallet;
  }

  public getUserAssetBalance(assetTag: AssetTag): BigNumber {
    return this.activeWallet?.balances.get(assetTag) ?? new BigNumber("0");
  }

  public getUserAssetCollateralBalance(collateralAssetTag: CollateralAssetTag): BigNumber {
    return this.activeWallet?.collateralBalances.get(collateralAssetTag) ?? new BigNumber("0");
  }

  public getUserAssetUSDBalance(assetTag: AssetTag): BigNumber {
    const balance = this.activeWallet?.balances.get(assetTag) ?? new BigNumber("0");
    const exchangePrice = this.getAssetExchangePrice(assetTag) ?? new BigNumber("0");
    return balance.multipliedBy(exchangePrice);
  }

  public getAssetExchangePrice(assetTag: AssetTag | CollateralAssetTag): BigNumber {
    if (assetTag === CollateralAssetTag.sICX) {
      const sIcxRate = this.sIcxToIcxRate();
      return Utils.convertICXToSICXPrice(this.getAssetReserveData(AssetTag.ICX)?.exchangePrice ?? new BigNumber("0"), sIcxRate);
    }

    return this.getAssetReserveData(assetTag)?.exchangePrice ?? new BigNumber("0");
  }

  public sIcxToIcxRate(): BigNumber {
    return this.getAssetReserveData(AssetTag.ICX)?.sICXRate ?? new BigNumber("1");
  }

  public getUserSuppliedAssetBalance(assetTag: AssetTag): BigNumber {
    return this.userReserves?.reserveMap.get(assetTag)?.currentOTokenBalance ?? new BigNumber("0");
  }

  public getUserSuppliedAssetUSDBalance(assetTag: AssetTag | CollateralAssetTag): BigNumber {
    if (assetTag === CollateralAssetTag.sICX) {
      return this.getUserAssetCollateralBalance(assetTag);
    }

    return this.userReserves?.reserveMap.get(assetTag)?.currentOTokenBalanceUSD ?? new BigNumber("0");
  }

  public getUserBorrowedAssetBalancePlusOrigFee(assetTag: AssetTag): BigNumber {
    const originationFee = this.userReserves?.reserveMap.get(assetTag)?.originationFee ?? new BigNumber("0");
    const borrowBalance = this.userReserves?.reserveMap.get(assetTag)?.currentBorrowBalance ?? new BigNumber("0");
    return originationFee.plus(borrowBalance);
  }

  public getUserBorrAssetBalance(assetTag: AssetTag): BigNumber {
    return this.userReserves?.reserveMap.get(assetTag)?.currentBorrowBalance ?? new BigNumber("0");
  }

  public getUserBorrowedAssetUSDBalance(assetTag: AssetTag): BigNumber {
    return this.userReserves?.reserveMap.get(assetTag)?.currentBorrowBalanceUSD ?? new BigNumber("0");
  }

  public getUserAssetReserve(assetTag: AssetTag): UserReserveData | undefined {
    return this.userReserves?.reserveMap.get(assetTag);
  }

  public getUserAssetReserveLiquidityRate(assetTag: AssetTag | CollateralAssetTag): BigNumber {
    if (assetTag === CollateralAssetTag.sICX) {
      return this.getUserAssetReserve(AssetTag.ICX)?.liquidityRate ?? new BigNumber("0");
    }
    return this.getUserAssetReserve(assetTag)?.liquidityRate ?? new BigNumber(0);
  }

  public getUserAssetReserveBorrowRate(assetTag: AssetTag): BigNumber {
    return this.getUserAssetReserve(assetTag)?.borrowRate ?? new BigNumber(0);
  }

  public getAssetReserveLiquidityRate(assetTag: AssetTag): BigNumber {
    return this.getAssetReserveData(assetTag)?.liquidityRate ?? new BigNumber(0);
  }

  public getAssetReserveBorrowRate(assetTag: AssetTag): BigNumber {
    return this.getAssetReserveData(assetTag)?.borrowRate ?? new BigNumber(0);
  }

  public getAssetReserveData(assetTag?: AssetTag): ReserveData | undefined {
    if (!assetTag) {
      return undefined;
    }
    return this.allReserves?.getReserveData(assetTag);
  }

  public initTotalSuppliedUSD(): void {
    if (this.allReserves) {
      let totalSupplied = new BigNumber("0");

      Object.values(this.allReserves).forEach((property: ReserveData) => {
        totalSupplied = totalSupplied.plus(property.totalLiquidityUSD);
      });

      this.totalSuppliedUSD =  totalSupplied;
    }
  }

  public initTotalBorrowedUSD(): void {
    if (this.allReserves) {
      let totalBorrowed = new BigNumber("0");

      Object.values(this.allReserves).forEach((property: ReserveData) => {
        totalBorrowed = totalBorrowed.plus(property.totalBorrowsUSD);
      });

      this.totalBorrowedUSD =  totalBorrowed;
    }
  }

  public initUserTotalSuppliedUSD(): void {
    let totalSupplied = new BigNumber("0");

    this.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined) => {
      totalSupplied = totalSupplied.plus((reserve?.currentOTokenBalanceUSD ?? new BigNumber("0")));
    });

    this.userTotalSuppliedUSD =  totalSupplied;
  }

  public initUserTotalBorrowedUSD(): void {
    let totalBorrowed = new BigNumber("0");

    this.userReserves.reserveMap.forEach((reserve: UserReserveData | undefined) => {
      const originationFee = reserve?.originationFee ?? new BigNumber("0");
      const exchangeRate = reserve?.exchangeRate ?? new BigNumber("0");
      const borrowBalanceUSD = reserve?.currentBorrowBalanceUSD ?? new BigNumber("0");
      totalBorrowed = totalBorrowed.plus(borrowBalanceUSD).plus(originationFee.multipliedBy(exchangeRate));
    });

    this.userTotalBorrowedUSD =  totalBorrowed;
  }

  public getReserveTotalLiquidity(assetTag: AssetTag): BigNumber {
    return this.allReserves?.getReserveData(assetTag).totalLiquidity ?? new BigNumber(0);
  }

  public getReserveTotalBorrows(assetTag: AssetTag): BigNumber {
    return this.allReserves?.getReserveData(assetTag).totalBorrows ?? new BigNumber(0);
  }

  public getReserveLiquidationThreshold(assetTag: AssetTag): BigNumber {
    return this.allReserves?.getReserveData(assetTag).liquidationThreshold ?? new BigNumber(0);
  }

  public reserveIsUsedAsCollateral(assetTag: AssetTag): boolean {
    return this.allReserves?.getReserveData(assetTag).usageAsCollateralEnabled ?? false;
  }

  public getReserveLtv(assetTag: AssetTag): BigNumber {
    return this.allReserves?.getReserveData(assetTag).baseLTVasCollateral ?? new BigNumber("0");
  }

  public userHasNotBorrowedAnyAsset(): boolean {
    for (const value of this.userReserves.reserveMap.values()) {
      if (value && value.currentBorrowBalance.isGreaterThan(Utils.ZERO)) {
        return false;
      }
    }
    return true;
  }

  getUserOmmRewardsBalance(): BigNumber {
    return this.userAccumulatedOmmRewards?.total ?? new BigNumber("0");
  }

  public userHasNotSuppliedAnyAsset(): boolean {
    for (const value of this.userReserves.reserveMap.values()) {
      if (value && value.currentOTokenBalance.isGreaterThan(Utils.ZERO)) {
        return false;
      }
    }
    return true;
  }

  public userAssetSuppliedOrBorrowedNotZero(assetTag: AssetTag): boolean {
    return !this.userAssetSuppliedIsZero(assetTag) || !this.userAssetBorrowedIsZero(assetTag);
  }

  public userAssetSuppliedAndBorrowedIsZero(assetTag: AssetTag): boolean {
    return this.userAssetSuppliedIsZero(assetTag) && this.userAssetBorrowedIsZero(assetTag);
  }

  public userAssetWalletSupplyAndBorrowIsZero(assetTag: AssetTag): boolean {
    // If asset-user wallet, supply, and borrow balance = 0
    return this.userAssetBalanceIsZero(assetTag)
      && this.userAssetSuppliedIsZero(assetTag)
      && this.userAssetBorrowedIsZero(assetTag);
  }

  public userAssetSuppliedIsZero(assetTag: AssetTag): boolean {
    return (this.getUserSuppliedAssetBalance(assetTag) ?? new BigNumber("0")).isZero();
  }

  isAssetAvailable(assetTag: AssetTag): boolean {
    const supplied = this.getUserSuppliedAssetBalance(assetTag) ?? new BigNumber("0");
    const balance = this.getUserAssetBalance(assetTag) ?? new BigNumber("0");

    return supplied.isZero() && balance.isGreaterThan(Utils.ZERO);
  }

  public userAssetBorrowedIsZero(assetTag: AssetTag): boolean {
    return (this.getUserBorrAssetBalance(assetTag) ?? new BigNumber("0")).isZero();
  }

  public userAssetBalanceIsZero(assetTag: AssetTag): boolean {
    return (this.activeWallet?.balances.get(assetTag) ?? new BigNumber("0")).isZero();
  }

  public isAssetSuppliedBorrowedBalanceZero(assetTag: AssetTag): boolean {
    return this.userAssetSuppliedIsZero(assetTag)
      && this.userAssetBorrowedIsZero(assetTag)
      && this.userAssetBalanceIsZero(assetTag);
  }

  public isAssetAvailableToSupply(assetTag: AssetTag): boolean {
    // if user has not supplied or borrowed the asset and has balance of it > 0
    return this.userAssetSuppliedIsZero(assetTag) && this.userAssetBorrowedIsZero(assetTag)  && !this.userAssetBalanceIsZero(assetTag);
  }

  // asset is active if is either supplied or borrowed (available to borrow should be also considered using calc service)
  public assetSuppliedOrBorrowed(assetTag: AssetTag): boolean {
    return !this.userAssetSuppliedIsZero(assetTag) || !this.userAssetBorrowedIsZero(assetTag) ;
  }

}
