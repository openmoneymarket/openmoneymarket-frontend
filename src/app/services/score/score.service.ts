import {Injectable} from '@angular/core';
import {IconApiService} from '../icon-api/icon-api.service';
import {ScoreMethodNames} from '../../common/score-method-names';
import {IconTransactionType} from '../../models/enums/IconTransactionType';
import {PersistenceService} from '../persistence/persistence.service';
import {environment} from '../../../environments/environment';
import {Utils} from "../../common/utils";
import {CheckerService} from "../checker/checker.service";
import {AllAddresses} from "../../models/classes/AllAddresses";
import {UserAllReservesData, UserReserveData} from "../../models/classes/UserReserveData";
import {AllReservesData, ReserveData} from "../../models/classes/AllReservesData";
import {UserAccountData} from "../../models/classes/UserAccountData";
import {ReserveConfigData} from "../../models/classes/ReserveConfigData";
import {StateChangeService} from "../state-change/state-change.service";
import {AssetTag, CollateralAssetTag} from "../../models/classes/Asset";
import log from "loglevel";
import {PrepList} from "../../models/classes/Preps";
import {Mapper} from "../../common/mapper";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {YourPrepVote} from "../../models/classes/YourPrepVote";
import {DelegationPreference} from "../../models/classes/DelegationPreference";
import {UnstakeInfo} from "../../models/classes/UnstakeInfo";
import {DistributionPercentages} from "../../models/classes/DistributionPercentages";
import {PoolStats, PoolStatsInterface} from "../../models/classes/PoolStats";
import {TotalPoolInterface, UserPoolDataInterface} from "../../models/Interfaces/Poolnterfaces";
import {PoolsDistPercentages} from "../../models/classes/PoolsDistPercentages";
import {AllAssetDistPercentages} from "../../models/classes/AllAssetDisPercentages";
import {DailyRewardsAllReservesPools} from "../../models/classes/DailyRewardsAllReservesPools";
import BigNumber from "bignumber.js";
import {Vote, VotersCount} from "../../models/classes/Vote";
import {Proposal} from "../../models/classes/Proposal";
import {LockedOmm} from "../../models/classes/LockedOmm";
import {ILockedOmm} from "../../models/Interfaces/ILockedOmm";


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
  public async getTokenDistributionPerDay(day?: BigNumber): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    day = day ? IconConverter.toHex(day) : await this.getRewardsDay();

    const params = {
      _day: day,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.RewardWeightController,
      ScoreMethodNames.GET_TOKEN_DISTRIBUTION_PER_DAY, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getTokenDistributionPerDay: ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  public async getRewardsDay(): Promise<string> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.RewardWeightController,
      ScoreMethodNames.GET_DAY, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getRewardsDay: ", res);

    return res;
  }

  /**
   * @description Get reference data (price)
   * @return  Number quoted price (e.g. USD)
   */
  public async getReferenceData(base: string, quote: string = "USD"): Promise<BigNumber> {
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
  public async getUserClaimableIcx(): Promise<BigNumber> {
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
  public async getTotalStakedOmm(): Promise<BigNumber> {
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
  public async getUserDebt(assetTag: AssetTag): Promise<BigNumber> {
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
  public async getTodayRate(): Promise<BigNumber> {
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
  public async getLoanOriginationFeePercentage(): Promise<BigNumber> {
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
  public async getOmmTokenMinStakeAmount(): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.GET_MIN_STAKE, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getOmmTokenMinStakeAmount: ", res);

    return Utils.hexToNormalisedNumber(res);
  }

  public async getUserAssetBalance(assetTag: AssetTag): Promise<BigNumber> {
    let balance: BigNumber;
    if (AssetTag.ICX === assetTag) {
      balance = await this.iconApiService.getIcxBalance(this.persistenceService.activeWallet!.address);
    } else {
      balance = await this.getIRC2TokenBalance(assetTag);
    }

    // set asset balance
    log.debug(`User (${this.persistenceService.activeWallet!.address}) ${assetTag} balance: ${balance}`);

    // commit the change
    this.stateChangeService.updateUserAssetBalance(balance, assetTag);

    return balance;
  }

  public async getUserCollateralAssetBalance(assetTag: CollateralAssetTag): Promise<BigNumber> {
    log.debug(`Fetching user collateral balance for ${assetTag}...`);

    const balance = await this.getIRC2TokenBalance(assetTag);

    log.debug(`User (${this.persistenceService.activeWallet!.address}) collateral ${assetTag} balance: ${balance}`);

    this.persistenceService.activeWallet!.collateralBalances.set(assetTag, balance);

    // commit the change
    this.stateChangeService.updateUserCollateralAssetBalance(balance, assetTag);

    return balance;
  }

  private async getIRC2TokenBalance(assetTag: AssetTag | CollateralAssetTag): Promise<BigNumber> {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    const decimals = this.persistenceService.allReserves!.getReserveData(assetTag).decimals;
    const method = assetTag === AssetTag.BALN ? ScoreMethodNames.AVAILABLE_BALANCE_OF : ScoreMethodNames.BALANCE_OF;

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.collateralAddress(assetTag),
      method, {
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
  public async getPoolStats(poolId: BigNumber): Promise<PoolStats> {
    const params = {
      _id: IconConverter.toHex(poolId)
    };

    const tx = this.iconApiService.buildTransaction("",  environment.BALANCED_DEX_SCORE,
      ScoreMethodNames.GET_POOL_STATS, params, IconTransactionType.READ);

    const res: PoolStatsInterface = await this.iconApiService.iconService.call(tx).execute();

    // log.debug("getPoolStats for " + poolId + ":", res);

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
   * @description Get all assets reward distribution percentage
   * @return AllAssetDistPercentages
   */
  public async getAllAssetsRewardDistributionPercentages(): Promise<AllAssetDistPercentages> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.RewardWeightController,
      ScoreMethodNames.GET_ALL_ASSET_DIST_PERCENTAGE, {}, IconTransactionType.READ);

    const res: AllAssetDistPercentages = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapAllAssetDistPercentages(res);
  }

  /**
   * @description Get users locked OMM token amount
   * @return LockedOmm - Locked OMM tokens amount and end
   */
  public async getUserLockedOmmTokens(): Promise<LockedOmm> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = { _owner: this.persistenceService.activeWallet!.address};

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.bOMM,
      ScoreMethodNames.GET_LOCKED_OMM, params, IconTransactionType.READ);

    const res: ILockedOmm = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapLockedOmm(res);
  }

  /**
   * @description Get users bOMM balance
   * @return BigNumber - Users bOMM balance as BigNumber
   */
  public async getUsersbOmmBalance(): Promise<BigNumber> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = { _owner: this.persistenceService.activeWallet!.address};

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.bOMM,
      ScoreMethodNames.BALANCE_OF, params, IconTransactionType.READ);

    const res: string = await this.iconApiService.iconService.call(tx).execute();

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get total bOMM supply
   * @return BigNumber - Total bOMM supply
   */
  public async getTotalbOmmSupply(): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.bOMM,
      ScoreMethodNames.TOTAL_SUPPLY, {}, IconTransactionType.READ);

    const res: string = await this.iconApiService.iconService.call(tx).execute();

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get daily reward distribution for all reserve and pools
   * @return DailyRewardsAllReservesPools
   */
  public async getDailyRewardsDistributions(): Promise<DailyRewardsAllReservesPools> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.RewardWeightController,
      ScoreMethodNames.GET_DAILY_REWARDS_RESERVES_POOLS, {}, IconTransactionType.READ);

    const res: DailyRewardsAllReservesPools = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapDailyRewardsAllReservesPools(res);
  }

  /**
   * @description Get total amount of token in pool
   * @return  BigNumber
   */
  public async getPoolTotal(poolId: BigNumber, token: string, decimals: BigNumber): Promise<BigNumber> {
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

  /**
   * @description Get the proposal list
   * @return  VotersCount - the numbers represent voters
   */
  public async getProposalList(batchSize?: BigNumber, offset: BigNumber = new BigNumber("0")): Promise<Proposal[]> {
    if (!batchSize) {
      batchSize = await this.getNumberOfProposals();
    }

    const params = {
      batch_size: IconConverter.toHex(batchSize),
      offset: IconConverter.toHex(offset)
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_PROPOSALS, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapProposalList(res);
  }

  /**
   * @description Get voters count for vote
   * @return  VotersCount - the numbers represent voters
   */
  public async getVotersCount(voteIndex: BigNumber): Promise<VotersCount> {
    const params = {
      vote_index: IconConverter.toHex(voteIndex),
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_VOTERS_COUNT, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getVotersCount = ${res}`);

    return Mapper.mapVotersCount(res);
  }

  /**
   * @description Get votes of users
   * @return  Vote - the numbers represents OMM tokens in EXA
   */
  public async getVotesOfUsers(proposalId?: BigNumber): Promise<Vote> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      vote_index: IconConverter.toHex(proposalId),
      user: this.persistenceService.activeWallet!.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_VOTES_OF_USER, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapUserVote(res);
  }

  /**
   * @description Get users voting weight
   * @return  BigNumber
   */
  public async getUsersVotingWeight(day: BigNumber | number = Date.now()): Promise<BigNumber> {
    // for day provide timestamp in microseconds
    const params = {
      day: IconConverter.toHex(day),
      address: this.persistenceService.activeWallet!.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_USERS_VOTING_WEIGHT, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getUsersVotingWeight = ${res}`);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get number of proposals
   * @return  BigNumber
   */
  public async getNumberOfProposals(day: BigNumber | number = Date.now()): Promise<BigNumber> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_PROPOSAL_COUNT, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getNumberOfProposals = ${res}`);

    return Utils.hexToNumber(res);
  }

  /**
   * @description Get vote definition fee
   * @return  BigNumber - amount of omm as  fee required for creating a proposal
   */
  public async getVoteDefinitionFee(): Promise<BigNumber> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_VOTE_DEFINITION_FEE, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getVoteDefinitionFee = ${res}`);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get vote definition criteria
   * @return  BigNumber - percentage representing vote definition criteria
   */
  public async getBoostedOmmVoteDefinitionCriteria(): Promise<BigNumber> {
    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_BOOSTED_OMM_VOTE_DEFINITION_CRITERION, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getBoostedOmmVoteDefinitionCriteria = ${res}`);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get users voting weight
   * @return  BigNumber - Users voting weight in OMM token number denomination
   */
  public async getUserVotingWeight(proposalBlockHeight: BigNumber): Promise<BigNumber> {

    const params = {
      _block: proposalBlockHeight,
      _address: this.persistenceService.activeWallet?.address
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.MY_VOTING_WEIGHT, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getUserVotingWeight = ${res}`);

    return Utils.hexToNormalisedNumber(res);
  }

  /**
   * @description Get vote duration
   * @return  BigNumber - Vote duration number
   */
  public async getVoteDuration(): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.GET_VOTE_DURATION, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getVoteDuration = ${res}`);

    return Utils.hexToNumber(res);
  }

  /**
   * @description Get total staked OMM at certain timestamp
   * @return  BigNumber - Users voting weight in OMM token number denomination
   */
  public async getTotalStakedOmmAt(timestamp: BigNumber = Utils.timestampNowMicroseconds()): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    const params = {
      _timestamp: timestamp,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.TOTAL_STAKED_OMM_AT, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug(`getTotalStakedOmmAt = ${res}`);

    return Utils.hexToNormalisedNumber(res);
  }

  public async getTotalOmmSupply(): Promise<BigNumber> {
    this.checkerService.checkAllAddressesLoaded();

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.TOTAL_SUPPLY, {}, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    return Utils.hexToNormalisedNumber(res);
  }

}
