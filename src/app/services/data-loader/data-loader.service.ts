import {Injectable} from '@angular/core';
import {ScoreService} from '../score/score.service';
import {PersistenceService} from '../persistence/persistence.service';
import {AllAddresses} from '../../models/classes/AllAddresses';
import {AllReservesData, ReserveData} from "../../models/classes/AllReservesData";
import {Mapper} from "../../common/mapper";
import {UserAccountData} from "../../models/classes/UserAccountData";
import {StateChangeService} from "../state-change/state-change.service";
import {Asset, AssetTag, CollateralAssetTag, supportedAssetsMap} from "../../models/classes/Asset";
import log from "loglevel";
import {OmmError} from "../../core/errors/OmmError";
import {AllReserveConfigData} from "../../models/classes/AllReserveConfigData";
import {OmmService} from "../omm/omm.service";
import {CheckerService} from "../checker/checker.service";
import {UserAllReservesData, UserReserveData} from "../../models/classes/UserReserveData";
import {PoolData} from "../../models/classes/PoolData";
import {UserPoolData} from "../../models/classes/UserPoolData";
import {Utils} from "../../common/utils";
import {PoolsDistPercentages} from "../../models/classes/PoolsDistPercentages";
import BigNumber from "bignumber.js";
import {environment} from "../../../environments/environment";
import {Vote} from "../../models/classes/Vote";
import {ReloaderService} from "../reloader/reloader.service";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {InterestHistoryService} from "../interest-history/interest-history.service";
import {CalculationsService} from "../calculations/calculations.service";

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {

  constructor(private scoreService: ScoreService,
              private persistenceService: PersistenceService,
              private stateChangeService: StateChangeService,
              private ommService: OmmService,
              private checkerService: CheckerService,
              private reloaderService: ReloaderService,
              private interestHistoryService: InterestHistoryService,
              private calculationService: CalculationsService) {

  }

  public async loadInterestHistory(): Promise<void> {
    try {

      // load interest history from local storage
      const interestHistoryPersisted = this.interestHistoryService.getInterestHistoryFromLocalStorage();
      let interestHistory = interestHistoryPersisted?.data;

      // if interest history did not exist in local storage fetch from backend API
      if (!interestHistoryPersisted || !interestHistory) {
        log.debug("Interest history does not exists in localstorage!");
        interestHistory = Mapper.mapInterestHistory([...(await this.interestHistoryService.getInterestHistory()).docs]);
        this.interestHistoryService.persistInterestHistoryInLocalStorage(interestHistory);
      } else {
        log.debug("Interest history exists!");
        const nowDate = Utils.dateToDateOnlyIsoString(new Date());

        // check if loaded interest history is up to date and re-load if not
        if (interestHistoryPersisted.to !== nowDate) {
          log.debug("Interest history exists but with old date (older than 365 days)!!");
          interestHistory = Mapper.mapInterestHistory([...(await this.interestHistoryService.getInterestHistoryFromTo(
            interestHistoryPersisted.to, nowDate
          )).docs]);
          this.interestHistoryService.persistInterestHistoryInLocalStorage(interestHistory, true);
          interestHistory = this.interestHistoryService.getInterestHistoryFromLocalStorage()!.data;
        }
      }

      this.stateChangeService.interestHistoryUpdate(interestHistory);
    } catch (e) {
      log.error("Failed to fetch interest history..");
      log.error(e);
    }
  }

  public async loadAllUserAssetsBalances(): Promise<void> {
    try {
      await Promise.all(Object.values(AssetTag).map(
        async (assetTag) => {
          try {
            await this.scoreService.getUserAssetBalance(assetTag);
          } catch (e) {
            log.error("Failed to fetch balance for " + assetTag);
            log.error(e);
          }
      }));

      await Promise.all(CollateralAssetTag.getPropertiesDifferentThanAssetTag().map(
        async (assetTag) => {
          try {
            await this.scoreService.getUserCollateralAssetBalance(assetTag);
          } catch (e) {
            log.error("Failed to fetch balance for " + assetTag);
            log.error(e);
          }
        }));
    } catch (e) {
      log.debug("Failed to fetch all user asset balances!");
    }
  }

  public async loadAllUserDebts(): Promise<void> {
    await Promise.all(Object.values(AssetTag).map(async (assetTag) => {
      try {
        await this.scoreService.getUserDebt(assetTag);
      } catch (e) {
        log.error("Failed to load user debt for asset " + assetTag);
        log.error(e);
      }
    }));
  }

  public loadAllScoreAddresses(): Promise<void> {
    return this.scoreService.getAllScoreAddresses().then((allAddresses: AllAddresses) => {
      this.persistenceService.allAddresses = new AllAddresses(allAddresses.collateral, allAddresses.oTokens, allAddresses.dTokens,
        allAddresses.systemContract);
      log.debug("Loaded all addresses: ", allAddresses);
    });
  }

  public loadAllReserveData(): Promise<void> {
    return this.scoreService.getAllReserveData().then((allReserves: AllReservesData) => {
      log.debug("loadAllReserves.allReserves: ", allReserves);
      const newAllReserve = new AllReservesData(allReserves.USDS, allReserves.ICX, allReserves.USDC, allReserves.bnUSD, allReserves.BALN,
        allReserves.OMM);
      Object.entries(newAllReserve).forEach((value: [string, ReserveData]) => {
        // @ts-ignore
        newAllReserve[value[0]] = Mapper.mapReserveData(value[1]);
      });
      this.persistenceService.allReserves = newAllReserve;
      log.debug("loadAllReserves.allReserves after: ", this.persistenceService.allReserves);

      this.persistenceService.initTotalBorrowedUSD();
      this.persistenceService.initTotalSuppliedUSD();
    }).catch(e => {
      log.error("Error in loadAllReserveData: ", e);
    });
  }

  public async loadPoolsData(): Promise<void> {
    try {
      const poolsDataRes: PoolData[] = [];

      // get all pools id and total staked
      const poolsData = await this.scoreService.getPoolsData();

      // get stats for each pool
      this.persistenceService.allPoolsDataMap = new Map<string, PoolData>(); // re-init map to trigger state changes
      for (const poolData of poolsData) {
        const poolStats = await this.scoreService.getPoolStats(poolData.poolID);
        const newPoolData = new PoolData(poolData.poolID, Utils.hexToNormalisedNumber(poolData.totalStakedBalance, poolStats.getPrecision())
          , poolStats);
        // push combined pool and stats to response array and persistence map
        poolsDataRes.push(newPoolData);
        this.persistenceService.allPoolsDataMap.set(poolData.poolID.toString(), newPoolData);
      }

      this.stateChangeService.poolsDataUpdate(poolsDataRes);
    } catch (e) {
      log.error("Error in loadPoolsData: ", e);
    }
  }

  public async loadAllPoolsDistPercentages(): Promise<void> {
    try {
      const res = await this.scoreService.getPoolsRewardDistributionPercentages();
      this.persistenceService.allPoolsDistPercentages = new PoolsDistPercentages(res.liquidity);
    } catch (e) {
      log.error("Failed to load distribution percentages for all pools!");
    }
  }

  public async loadUserPoolsData(): Promise<void> {
    try {
      const userPoolsDataRes: UserPoolData[] = [];

      // get all users pools
      const userPoolsData = await this.scoreService.getUserPoolsData();
      log.debug("loadUserPoolsData:", userPoolsData);

      // get stats for each pool from persistence pool map
      this.persistenceService.userPoolsDataMap = new Map<string, UserPoolData>(); // re-init map to trigger state changes
      for (const userPoolData of userPoolsData) {
        log.debug("allPoolsDataMap:", this.persistenceService.allPoolsDataMap);
        log.debug("poolId = ", Utils.hexToNumber(userPoolData.poolID));
        const poolStats = this.persistenceService.allPoolsDataMap.get(Utils.hexToNumber(userPoolData.poolID).toString())?.poolStats;

        if (!poolStats) {
          log.error("Could not find pool stats for pool " + Utils.hexToNumber(userPoolData.poolID));
          continue;
        }

        const newUserPoolData = Mapper.mapUserPoolData(userPoolData, poolStats.getPrecision(), poolStats);

        userPoolsDataRes.push(newUserPoolData);
        this.persistenceService.userPoolsDataMap.set(newUserPoolData.poolId.toString(), newUserPoolData);
      }

      this.stateChangeService.userPoolsDataUpdate(userPoolsDataRes);
    } catch (e) {
      log.error("Error in loadUserPoolsData: ", e);
    }
  }

  public loadSpecificReserveData(assetTag: AssetTag): Promise<void> {
    return this.scoreService.getsSpecificReserveData(this.persistenceService.allAddresses!.collateralAddress(assetTag))
      .then(reserveData => {
        const newReserveData = Mapper.mapReserveData(reserveData);
        this.persistenceService.allReserves?.setReserveData(assetTag, newReserveData);
        log.debug(`Loaded ${assetTag} reserveData: `, newReserveData);
      }).catch(e => {
        throw new OmmError(`Error occurred in loadSpecificReserveData`, e);
      });
  }

  public loadAllReservesConfigData(): Promise<void> {
    return this.scoreService.getAllReserveConfigurationData().then((allReservesConfigData: AllReserveConfigData) => {
      log.debug("loadAllReservesConfigData : ", allReservesConfigData);
      const newAllReserveConfigData = new AllReserveConfigData(allReservesConfigData.USDS, allReservesConfigData.ICX,
        allReservesConfigData.USDC, allReservesConfigData.bnUSD, allReservesConfigData.BALN, allReservesConfigData.OMM);
      Object.entries(newAllReserveConfigData).forEach((value: [string, ReserveData]) => {
        // @ts-ignore
        newAllReserveConfigData[value[0]] = Mapper.mapReserveConfigurationData(value[1]);
      });
      this.persistenceService.allReservesConfigData = newAllReserveConfigData;
      log.debug("loadAllReservesConfigData after mapping : ", newAllReserveConfigData);
    }).catch(e => {
      throw new OmmError(`Error occurred in loadAllReservesConfigData`, e);
    });
  }

  async loadAllUserReserveData(): Promise<void> {
    this.checkerService.checkAllAddressesLoaded();
    const allUserReserveData = await this.scoreService.getUserReserveDataForAllReserves();

    log.debug("loadAllUserReserveData.allUserReserveData before: ", allUserReserveData);

    const newUserAllReserve = new UserAllReservesData(allUserReserveData.USDS, allUserReserveData.ICX, allUserReserveData.USDC,
      allUserReserveData.bnUSD, allUserReserveData.BALN, allUserReserveData.OMM);

    Object.entries(newUserAllReserve).forEach((value: [string, UserReserveData]) => {
      const assetTag = AssetTag.fromString(value[0]);
      const mappedReserve = Mapper.mapUserReserve(value[1],  this.persistenceService.getAssetReserveData(assetTag)!!.decimals);
      // @ts-ignore
      newUserAllReserve[value[0]] = mappedReserve;

      this.persistenceService.userReserves.reserveMap.set(assetTag, mappedReserve);
      this.stateChangeService.updateUserAssetReserve(mappedReserve, assetTag);
    });

    log.debug("loadAllUserReserveData.allUserReserveData after: ", newUserAllReserve);

    this.persistenceService.initUserTotalSuppliedUSD();
    this.persistenceService.initUserTotalBorrowedUSD();
  }

  public async loadUserLockedOmm(): Promise<void> {
    try {
      const lockedOmm = await this.scoreService.getUserLockedOmmTokens();
      this.stateChangeService.userLockedOmmUpdate(lockedOmm);

      log.debug("User locked OMM: ", lockedOmm);
    } catch (e) {
      log.error("Error in loadUserLockedOmm:");
      log.error(e);
    }
  }

  public async loadUserbOmmBalance(): Promise<void> {
    try {
      const balance = await this.scoreService.getUsersbOmmBalance();
      this.stateChangeService.userbOmmBalanceUpdate(balance);

      log.debug("User bOMM balance ", balance.toString());
    } catch (e) {
      log.error("Error in loadUserbOmmBalance:");
      log.error(e);
    }
  }

  public async loadbOmmTotalSupply(): Promise<void> {
    try {
      const totalSupply = await this.scoreService.getTotalbOmmSupply();
      this.stateChangeService.bOmmTotalSupplyUpdate(totalSupply);

      log.debug("bOMM total supply ", totalSupply.toString());
    } catch (e) {
      log.error("Error in loadbOmmTotalSupply:");
      log.error(e);
    }
  }

  public loadUserAccountData(): Promise<void> {
    return this.scoreService.getUserAccountData().then((userAccountData: UserAccountData) => {
      this.persistenceService.userAccountData = Mapper.mapUserAccountData(userAccountData);
      this.stateChangeService.updateUserAccountData(this.persistenceService.userAccountData);
      log.debug("loadUserAccountData -> userAccountData:", this.persistenceService.userAccountData);
    });
  }

  public async loadUserAccumulatedOmmRewards(): Promise<void> {
    try {
      const ommRewards = await this.ommService.getUserAccumulatedOmmRewards();
      this.persistenceService.userAccumulatedOmmRewards = Mapper.mapUserAccumulatedOmmRewards(ommRewards);
      this.stateChangeService.updateUserAccumulatedOmmRewards(this.persistenceService.userAccumulatedOmmRewards);
    } catch (e) {
      log.error("loadUserAccumulatedOmmRewards:");
      log.error(e);
    }
  }

  public async loadUserDailyOmmRewards(): Promise<void> {
    try {
      const ommDailyRewards = await this.ommService.getUserDailyOmmRewards();
      this.stateChangeService.userOmmDailyRewardsUpdate(ommDailyRewards);
    } catch (e) {
      log.error(e);
    }
  }

  public async loadUserOmmTokenBalanceDetails(): Promise<void> {
    try {
      const res = await this.ommService.getOmmTokenBalanceDetails();
      log.debug("User Omm Token Balance Details: ", res);
      this.stateChangeService.updateUserOmmTokenBalanceDetails(res);
    } catch (e) {
      log.error("loadUserOmmTokenBalanceDetails:");
      log.error(e);
    }
  }

  public async loadUserDelegations(): Promise<void> {
    try {
      const yourVotesPrep = await this.scoreService.getUserDelegationDetails();
      this.persistenceService.yourVotesPrepList = yourVotesPrep;
    } catch (e) {
      log.error("Error occurred in loadUserDelegations:");
      log.error(e);
    }
  }

  public loadUserUnstakingInfo(): Promise<void> {
    return this.scoreService.getTheUserUnstakeInfo().then(res => {
      this.persistenceService.userUnstakingInfo = res;
      log.debug("User unstake info:", res);
    });
  }

  public loadUserClaimableIcx(): Promise<void> {
    return this.scoreService.getUserClaimableIcx().then(amount => {
      this.persistenceService.userClaimableIcx = amount;
      log.debug("User claimable ICX: " + amount);
    });
  }

  // public async loadUsersVotingWeight(): Promise<void> {
  //   try {
  //     this.persistenceService.userVotingWeight = await  this.scoreService.getUserVotingWeight();
  //     log.debug(`Users voting weight = ${this.persistenceService.userVotingWeight}`);
  //   } catch (e) {
  //     log.error("Error in loadUsersVotingWeight", e);
  //   }
  // }

  public async loadLoanOriginationFeePercentage(): Promise<void> {
    try {
      this.persistenceService.loanOriginationFeePercentage = await this.scoreService.getLoanOriginationFeePercentage();
    } catch (e) {
      log.error("Error in loadLoanOriginationFeePercentage", e);
    }
  }

  public async loadOmmTokenPriceUSD(): Promise<void> {
    try {
      log.debug("loadOmmTokenPriceUSD..");
      const res = await this.scoreService.getReferenceData("OMM");
      this.stateChangeService.ommPriceUpdate(res);
    } catch (e) {
      log.debug("Failed to fetch OMM price");
      log.error(e);
    }
  }

  public async loadDistributionPercentages(): Promise<void> {
    try {
      this.persistenceService.distributionPercentages = await this.scoreService.getDistPercentages();
    } catch (e) {
      log.error("Error in loadDistributionPercentages()");
      log.error(e);
    }
  }

  public async loadAllAssetDistPercentages(): Promise<void> {
    try {
      const res = await this.scoreService.getAllAssetsRewardDistributionPercentages();
      this.stateChangeService.allAssetDistPercentagesUpdate(res);
    } catch (e) {
      log.error("Error in loadAllAssetDistPercentages()");
      log.error(e);
    }
  }

  public async loadDailyRewardsAllReservesPools(): Promise<void> {
    try {
      this.persistenceService.dailyRewardsAllPoolsReserves = await this.scoreService.getDailyRewardsDistributions();
    } catch (e) {
      log.error("Error in loadDailyRewardsAllReservesPools()");
      log.error(e);
    }
  }

  public async loadTokenDistributionPerDay(day?: BigNumber): Promise<void> {
    try {
      this.stateChangeService.tokenDistributionPerDayUpdate((await this.scoreService.getTokenDistributionPerDay(day)));
    } catch (e) {
      log.error("Error in loadTokenDistributionPerDay:");
      log.error(e);
    }
  }

  public async loadTotalStakedOmm(): Promise<void> {
    try {
      const res = await this.scoreService.getTotalStakedOmm();
      log.debug("getTotalStakedOmm (mapped): ", res);

      this.stateChangeService.updateTotalStakedOmm(res);
    } catch (e) {
      log.error("Error in loadTotalStakedOmm:");
      log.error(e);
    }
  }

  public async loadVoteDefinitionFee(): Promise<void> {
    try {
      const res = await this.scoreService.getVoteDefinitionFee();
      log.debug("getVoteDefinitionFee (mapped): ", res);

      this.stateChangeService.updateVoteDefinitionFee(res);
    } catch (e) {
      log.error("Error in loadVoteDefinitionFee:");
      log.error(e);
    }
  }

  public async loadVoteDefinitionCriterion(): Promise<void> {
    try {
      const res = await this.scoreService.getBoostedOmmVoteDefinitionCriteria();
      log.debug("loadVoteDefinitionCriterion (mapped): ", res);

      this.stateChangeService.updateVoteDefinitionCriterion(res);
    } catch (e) {
      log.error("Error in loadVoteDefinitionCriterion:");
      log.error(e);
    }
  }

  public async loadTotalOmmSupply(): Promise<void> {
    try {
      const res = await this.scoreService.getTotalOmmSupply();
      log.debug("loadTotalOmmSupply (mapped): ", res);

      this.persistenceService.totalSuppliedOmm = res;
    } catch (e) {
      log.error("Error in loadTotalOmmSupply:");
      log.error(e);
    }
  }

  public async loadVoteDuration(): Promise<void> {
    try {
      const res = await this.scoreService.getVoteDuration();
      log.debug("loadVoteDuration (mapped): ", res);

      this.persistenceService.voteDuration = res;
    } catch (e) {
      log.error("Error in loadVoteDuration:");
      log.error(e);
    }
  }

  public async loadProposalList(): Promise<void> {
    try {
      const res = await this.scoreService.getProposalList();
      this.stateChangeService.updateProposalsList(res);
    } catch (e) {
      log.error("Error in loadProposalList:");
      log.error(e);
    }
  }

  public async loadUserProposalVotes(): Promise<void> {
    await Promise.all(this.persistenceService.proposalList.map( async (proposal) => {
      try {
        if (!proposal.proposalIsOver(this.reloaderService)) {
          try {
            const votingWeight = await this.scoreService.getUserVotingWeight(proposal.voteSnapshot);
            this.persistenceService.userVotingWeightForProposal.set(proposal.id, votingWeight);
          } catch (e) {
            log.error(e);
          }
        }

        const vote: Vote = await this.scoreService.getVotesOfUsers(proposal.id);

        if (vote.against.isGreaterThan(Utils.ZERO) || vote.for.isGreaterThan(Utils.ZERO)) {
          this.stateChangeService.userProposalVotesUpdate(proposal.id, vote);
        }
      } catch (e) {
        log.error("Failed to get user vote for proposal ", proposal);
        log.error(e);
      }
    }));
  }


  public async loadPrepList(start: number = 1, end: number = 100): Promise<void> {
    try {
      const prepList = await this.scoreService.getListOfPreps(start, end);

      // set logos
      try {
        let logoUrl;
        prepList.preps?.forEach(prep => {
          logoUrl = environment.production ? `https://iconwat.ch/logos/${prep.address}.png` : "assets/img/logo/icx.svg";
          prepList.prepAddressToLogoUrlMap.set(prep.address, logoUrl);
          prep.setLogoUrl(logoUrl);
        });
      } catch (e) {
        log.debug("Failed to fetch all logos");
      }

      this.persistenceService.prepList = prepList;
    } catch (e) {
      log.error("Failed to load prep list... Details:");
      log.error(e);
    }
  }

  private refreshBridgeBalances(): void {
    window.dispatchEvent(new CustomEvent("bri.widget", {
      detail: {
        action: 'refreshBalance'
      }
    }));
  }

  initialiseUserSpecificPersistenceData(): void {
    this.initialisebOmmMultipliers();
  }

  initialisebOmmMultipliers(): void {
    // log.debug("****** bOMM calculated multipliers ****** ");

    // market multipliers
    // log.debug("Market multipliers:");
    supportedAssetsMap.forEach((value: Asset, key: AssetTag) => {
      if (!this.persistenceService.getUserSuppliedAssetBalance(key).isZero()) {
        const supplyMultiplier = this.calculationService.calculateMarketRewardsSupplyMultiplier(key);
        this.persistenceService.userMarketSupplyMultiplierMap.set(key, supplyMultiplier);
        // log.debug(`asset=${key} supplyMultiplier=${supplyMultiplier}`);
      }

      if (!this.persistenceService.getUserBorrAssetBalance(key).isZero()) {
        const borrowMultiplier = this.calculationService.calculateMarketRewardsBorrowMultiplier(key);
        this.persistenceService.userMarketBorrowMultiplierMap.set(key, borrowMultiplier);
        // log.debug(`asset=${key} borrowMultiplier=${borrowMultiplier}`);
      }
    });

    // liquidity multipliers
    // log.debug("Liquidity multipliers:");
    this.persistenceService.userPoolsDataMap.forEach((value: UserPoolData, poolId: string) => {
      if (!value.userStakedBalance.isZero()) {
        const liquidityMultiplier = this.calculationService.calculateLiquidityRewardsMultiplier(new BigNumber(poolId));
        this.persistenceService.userLiquidityPoolMultiplierMap.set(poolId, liquidityMultiplier);
        // log.debug(`poolId=${poolId} liquidityMultiplier=${liquidityMultiplier}`);
      }
    });
  }

  public async afterUserActionReload(): Promise<void> {
    if (this.persistenceService.activeWallet instanceof BridgeWallet) {
      this.refreshBridgeBalances();
    }

    // reload all reserves and user asset-user reserve data
    await Promise.all([
      this.loadOmmTokenPriceUSD(),
      this.loadAllReserveData(),
      this.loadAllReservesConfigData(),
      this.loadTotalStakedOmm(),
      this.loadPrepList(),
      this.loadPoolsData(),
      this.loadProposalList(),
      this.loadbOmmTotalSupply(),
    ]);

    this.stateChangeService.coreDataReloadUpdate();

    await this.loadUserSpecificData();
  }

  public async loadCoreData(): Promise<void> {
    this.loadCoreAsyncData();

    await Promise.all([
      this.loadTokenDistributionPerDay(),
      this.loadOmmTokenPriceUSD(),
      this.loadDistributionPercentages(),
      this.loadAllAssetDistPercentages(),
      this.loadDailyRewardsAllReservesPools(),
      this.loadAllPoolsDistPercentages(),
      this.loadAllReserveData(),
      this.loadAllReservesConfigData(),
      this.loadLoanOriginationFeePercentage(),
      this.loadTotalStakedOmm(),
      this.loadPrepList(),
      this.loadPoolsData(),
      this.loadVoteDefinitionFee(),
      this.loadVoteDefinitionCriterion(),
      this.loadProposalList(),
      this.loadTotalOmmSupply(),
      this.loadVoteDuration(),
      this.loadbOmmTotalSupply()
    ]);

    // emit event indicating that core data was loaded
    this.stateChangeService.coreDataReloadUpdate();
  }

  public async loadUserSpecificData(): Promise<void> {
    await Promise.all([
      this.loadAllUserReserveData(),
      this.loadAllUserAssetsBalances(),
      this.loadUserAccountData(),
      this.loadUserAccumulatedOmmRewards(),
      this.loadUserOmmTokenBalanceDetails(),
      this.loadUserDailyOmmRewards(),
      this.loadUserDelegations(),
      this.loadUserUnstakingInfo(),
      this.loadUserClaimableIcx(),
      this.loadUserPoolsData(),
      this.loadUserProposalVotes(),
      this.loadUserLockedOmm(),
      this.loadUserbOmmBalance(),
      this.loadAllUserDebts()
    ]);

    this.initialiseUserSpecificPersistenceData();

    // emit event that user data load has been completed
    this.stateChangeService.userDataReloadUpdate();
  }

  /**
   * Load core data async without waiting
   */
  public loadCoreAsyncData(): void {
    this.loadInterestHistory();
  }
}
