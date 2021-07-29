import {Injectable} from '@angular/core';
import {IconApiService} from '../icon-api/icon-api.service';
import {ScoreMethodNames} from '../../common/score-method-names';
import {IconTransactionType} from '../../models/IconTransactionType';
import {PersistenceService} from '../persistence/persistence.service';
import {environment} from '../../../environments/environment';
import {Utils} from "../../common/utils";
import {CheckerService} from "../checker/checker.service";
import {AllAddresses} from "../../models/AllAddresses";
import {UserAllReservesData, UserReserveData} from "../../models/UserReserveData";
import {AllReservesData, ReserveData} from "../../models/AllReservesData";
import {UserAccountData} from "../../models/UserAccountData";
import {ReserveConfigData} from "../../models/ReserveConfigData";
import {StateChangeService} from "../state-change/state-change.service";
import {AssetTag, CollateralAssetTag} from "../../models/Asset";
import log from "loglevel";
import {PrepList} from "../../models/Preps";
import {Mapper} from "../../common/mapper";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {YourPrepVote} from "../../models/YourPrepVote";
import {DelegationPreference} from "../../models/DelegationPreference";
import {UnstakeInfo} from "../../models/UnstakeInfo";
import {BalancedDexPools, balDexPoolsPriceDecimalsMap} from "../../models/BalancedDexPools";
import {DistributionPercentages} from "../../models/DistributionPercentages";
import {PoolStats, PoolStatsInterface} from "../../models/PoolStats";
import {TotalPoolInterface, UserPoolDataInterface} from "../../models/Poolnterfaces";
import {PoolsDistPercentages} from "../../models/PoolsDistPercentages";


@Injectable({
  providedIn: 'root'
})
export class ScoreService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private stateChangeService: StateChangeService) {
  }

  /**
   * @description Get all SCORE addresses (collateral, oTokens, System Contract, ..)
   * @return  List os collateral, oTokens and System Contract addresses
   */
  public async getAllScoreAddresses(): Promise<AllAddresses> {
    const tx = this.iconApiService.buildTransaction("",  environment.ADDRESS_PROVIDER_SCORE,
      ScoreMethodNames.GET_ALL_ADDRESSES, {}, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get Token Distribution per day
   * @return  Token distribution per day in number
   */
  public async getTokenDistributionPerDay(): Promise<number> {
    this.checkerService.checkAllAddressesLoaded();

    const params = {
      _day: "0x1",
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Rewards,
      ScoreMethodNames.GET_TOKEN_DISTRIBUTION_PER_DAY, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getTokenDistributionPerDay: ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get reference data (price)
   * @return  Number quoted price (e.g. USD)
   */
  public async getReferenceData(base: string, quote: string = "USD"): Promise<number> {
    this.checkerService.checkAllAddressesLoaded();

    const params = {
      _base: base,
      _quote: quote
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.PriceOracle,
      ScoreMethodNames.GET_REFERENCE_DATA, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getReferenceData: ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get total staked balance for each pool
   * @return  TotalPoolInterface[]
   */
  public async getPoolsData(): Promise<TotalPoolInterface[]> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.StakedLp,
      ScoreMethodNames.GET_BALANCE_BY_POOL, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getPoolsData: ", res);

    return Mapper.mapPoolsData(res);
  }

  /**
   * @description Get staked LP balance of a particular user for all pools
   * @return  UserPoolDataInterface[]
   */
  public async getUserPoolsData(): Promise<UserPoolDataInterface[]> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _owner: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.StakedLp,
      ScoreMethodNames.GET_POOL_BALANCE_BY_USER, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getUserPoolsData: ", res);

    return res;
  }

  /**
   * @description Get the un-stake information for a specific user.
   * @return  list of un-staking amounts and block heights
   */
  public async getTheUserUnstakeInfo(): Promise<UnstakeInfo> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _address: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_USER_UNSTAKE_INFO, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapUserIcxUnstakeData(res);
  }

  /**
   * @description Get the claimable ICX amount for user.
   * @return  number
   */
  public async getUserClaimableIcx(): Promise<number> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _address: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Staking,
      ScoreMethodNames.GET_USER_CLAIMABLE_ICX, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get total staked Omm
   * @return  total staked Omm normalised number
   */
  public async getTotalStakedOmm(): Promise<number> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.GET_TOTAL_STAKED_OMM, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getTotalStakedOmm (not mapped): ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get user reserve data for a specific reserve
   * @param reserve - Address using 1 a  for USDb and sICX
   * @return reserve data
   */
  public async getUserReserveDataForSpecificReserve(reserve: string): Promise<UserReserveData> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet?.address,
      _reserve: reserve
    };
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_USER_RESERVE_DATA, params, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get user reserve data for a all reserves
   * @return UserAllReservesData
   */
  public async getUserReserveDataForAllReserves(): Promise<UserAllReservesData> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet!.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_USER_ALL_RESERVE_DATA, params, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get user account data
   * @return All user reserve data
   */
  public async getUserAccountData(): Promise<UserAccountData> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet!.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_USER_ACCOUNT_DATA, params, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get real time debt of user for specific reserve, i.e. how much user has to repay
   * @return debt number
   */
  public async getUserDebt(assetTag: AssetTag): Promise<number> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet!.address,
      _reserve: this.persistenceService.getReserveAddressByAssetTag(assetTag)
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_USER_REALTIME_DEBT, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    const normalisedRes = Utils.hexToNormalisedNumber(res, this.persistenceService.getDecimalsForReserve(assetTag));

    // commit the change
    this.stateChangeService.updateUserDebt(normalisedRes, assetTag);

    return normalisedRes;
  }

  /**
   * @description Get distribution percentages for recipients (used in OMM APY calculations)
   * @return DistributionPercentages
   */
  public async getDistPercentages(): Promise<DistributionPercentages> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_DIST_PERCENTAGES, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapDistributionPercentages(res);
  }

  /**
   * @description Get today sicx to icx conversion rate
   * @return today sICX to ICX conversion rate as number
   */
  public async getTodayRate(): Promise<number> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Staking,
      ScoreMethodNames.GET_TODAY_RATE, {}, IconTransactionType.READ);

    const todayRate = Utils.hexToNormalisedNumber(await this.iconApiService.iconService.call(tx).execute());
    log.debug(`getTodayRate: ${todayRate}`);

    return todayRate;
  }

  /**
   * @description Get loan origination fee percentage
   * @return number representing origination fee percentage
   */
  public async getLoanOriginationFeePercentage(): Promise<number> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_LOAN_ORIGINATION_FEE_PERCENTAGE, {}, IconTransactionType.READ);

    const loanOriginationFeePercentage = Utils.hexToNormalisedNumber(await this.iconApiService.iconService.call(tx).execute());
    log.debug(`getLoanOriginationFeePercentage response: ${loanOriginationFeePercentage}`);

    return loanOriginationFeePercentage;
  }

  /**
   * @description Get configuration data for the specific reserve
   * @param reserve - Address using 1 a  for USDb and sICX
   * @return reserve configuration data
   */
  public async getReserveConfigurationData(reserve: string): Promise<ReserveConfigData> {
    const params = {
      _reserve: reserve
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_RESERVE_CONFIGURATION_DATA, params, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get configuration data for all reserves
   * @return All reserves configuration data
   */
  public async getAllReserveConfigurationData(): Promise<any> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_ALL_RESERVE_CONFIGURATION_DATA, {}, IconTransactionType.READ);
    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get reserve data for all reserves
   * @return All reserve data
   */
  public async getAllReserveData(): Promise<AllReservesData> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_ALL_RESERVE_DATA, {}, IconTransactionType.READ);

    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get reserve data for a specific reserve
   * @param reserve - Address using 1 a  for USDb and sICX
   * @return ReserveData
   */
  public async getsSpecificReserveData(reserve: string): Promise<ReserveData> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.LendingPoolDataProvider,
      ScoreMethodNames.GET_SPECIFIC_RESERVE_DATA, { _reserve: reserve }, IconTransactionType.READ);

    return this.iconApiService.iconService.call(tx).execute();
  }

  /**
   * @description Get OMM token minimum stake amount
   * @return  Minimum OMM token stake amount
   */
  public async getOmmTokenMinStakeAmount(): Promise<number> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.GET_MIN_STAKE, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getOmmTokenMinStakeAmount: ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get OMM token USD price
   * @return  number OMM token price in USD
   */
  public async getOmmTokenPriceUSD(poolName: BalancedDexPools): Promise<number> {

    const params = {
      _name: poolName
    };

    const tx = this.iconApiService.buildTransaction("",  environment.BALANCED_DEX_SCORE,
      ScoreMethodNames.GET_PRICE_BY_NAME, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getOmmTokenPriceUSD: ", res);

    return Utils.hexToNormalisedNumber(res, balDexPoolsPriceDecimalsMap.get(poolName));
  }

  public async getUserAssetBalance(assetTag: AssetTag): Promise<number> {
    log.debug(`Fetching user balance for ${assetTag}...`);

    let balance: number;
    if (AssetTag.ICX === assetTag) {
      balance = await this.iconApiService.getIcxBalance(this.persistenceService.activeWallet!.address);
    } else {
      balance = await this.getIRC2TokenBalance(assetTag);
    }

    // set asset balance
    log.debug(`User (${this.persistenceService.activeWallet!.address}) ${assetTag} balance: ${balance}`);

    this.persistenceService.activeWallet!.balances.set(assetTag, balance);

    // commit the change
    this.stateChangeService.updateUserAssetBalance(balance, assetTag);

    return balance;
  }

  public async getUserCollateralAssetBalance(assetTag: CollateralAssetTag): Promise<number> {
    log.debug(`Fetching user collateral balance for ${assetTag}...`);

    const balance = await this.getIRC2TokenBalance(assetTag);

    log.debug(`User (${this.persistenceService.activeWallet!.address}) collateral ${assetTag} balance: ${balance}`);

    this.persistenceService.activeWallet!.collateralBalances.set(assetTag, balance);

    // commit the change
    this.stateChangeService.updateUserCollateralAssetBalance(balance, assetTag);

    return balance;
  }

  private async getIRC2TokenBalance(assetTag: AssetTag | CollateralAssetTag): Promise<number> {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    const decimals = this.persistenceService.allReserves!.getReserveData(assetTag).decimals;

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.collateralAddress(assetTag),
      ScoreMethodNames.BALANCE, {
        _owner: this.persistenceService.activeWallet!.address
      }, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();
    const balance = Utils.hexToNormalisedNumber(res, decimals);

    log.debug(`User (${this.persistenceService.activeWallet!.address}) ${assetTag} balance = ${balance}`);

    if (assetTag instanceof AssetTag) {
      this.stateChangeService.updateUserAssetBalance(balance, assetTag);
    } else {
      this.stateChangeService.updateUserCollateralAssetBalance(balance, assetTag);
    }

    return balance;
  }


  /**
   * @description Get list of PReps
   * @return  Returns the status of all registered P-Rep candidates in descending order by delegated ICX amount
   */
  public async getListOfPreps(startRanking: number = 1, endRanking: number = 100): Promise<PrepList> {
    const params = {
      startRanking: IconConverter.toHex(startRanking),
      endRanking: IconConverter.toHex(endRanking)
    };

    const tx = this.iconApiService.buildTransaction("",  environment.IISS_API,
      ScoreMethodNames.GET_PREPS, params, IconTransactionType.READ);

    const prepList = await this.iconApiService.iconService.call(tx).execute();


    return Mapper.mapPrepList(prepList);
  }

  /**
   * @description Test mint of OMM tokens
   */
  public buildTestMintTx(amount: number = 1000): any {
    const params = {
      _amount: IconConverter.toHex(IconAmount.of(amount, IconAmount.Unit.ICX).toLoop()),
    };

    const tx = this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.TEST_MINT, params, IconTransactionType.WRITE);

    log.debug("testMint tx:", tx);

    return tx;
  }

  /**
   * @description Get user delegation details
   * @return  list of addresses and corresponding delegation detail
   */
  public async getUserDelegationDetails(): Promise<YourPrepVote[]> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet!.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Delegation,
      ScoreMethodNames.GET_USER_DELEGATION_DETAILS, params, IconTransactionType.READ);

    const res: DelegationPreference[] = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getUserDelegationDetails: ", res);

    return Mapper.mapUserDelegations(res, this.persistenceService.prepList?.prepAddressToNameMap);
  }

  /**
   * @description Get stats for specific pool
   * @return  PoolStats
   */
  public async getPoolStats(poolId: number): Promise<PoolStats> {
    const params = {
      _id: IconConverter.toHex(poolId)
    };

    const tx = this.iconApiService.buildTransaction("",  environment.BALANCED_DEX_SCORE,
      ScoreMethodNames.GET_POOL_STATS, params, IconTransactionType.READ);

    const res: PoolStatsInterface = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getPoolStats for " + poolId + ":", res);

    return Mapper.mapPoolStats(res);
  }

  /**
   * @description Get Liquidity provider pool’s reward distribution percentage
   * @return PoolsDistPercentages
   */
  public async getPoolsRewardDistributionPercentages(): Promise<PoolsDistPercentages> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Rewards,
      ScoreMethodNames.GET_DIST_PERCENTAGE_ALL_POOLS, {}, IconTransactionType.READ);

    const res: PoolsDistPercentages = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getPoolsRewardDistributionPercentages:", res);

    return res;
  }

  /**
   * @description Get total amount of token in pool
   * @return  number
   */
  public async getPoolTotal(poolId: number, token: string, decimals: number): Promise<number> {
    const params = {
      _id: IconConverter.toHex(poolId),
      _token: token
    };

    const tx = this.iconApiService.buildTransaction("",  environment.BALANCED_DEX_SCORE,
      ScoreMethodNames.GET_POOL_TOTAL, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getPoolTotal for " + poolId + ":" + token + ":", res);

    return Utils.hexToNormalisedNumber(res, decimals);
  }

}
