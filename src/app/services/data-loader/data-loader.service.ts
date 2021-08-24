import {Injectable} from '@angular/core';
import {ScoreService} from '../score/score.service';
import {PersistenceService} from '../persistence/persistence.service';
import {AllAddresses} from '../../models/AllAddresses';
import {AllReservesData, ReserveData} from "../../models/AllReservesData";
import {Mapper} from "../../common/mapper";
import {UserAccountData} from "../../models/UserAccountData";
import {StateChangeService} from "../state-change/state-change.service";
import {AssetTag, CollateralAssetTag} from "../../models/Asset";
import log from "loglevel";
import {OmmError} from "../../core/errors/OmmError";
import {AllReserveConfigData} from "../../models/AllReserveConfigData";
import {OmmService} from "../omm/omm.service";
import {OmmRewards} from "../../models/OmmRewards";
import {OmmTokenBalanceDetails} from "../../models/OmmTokenBalanceDetails";
import {NotificationService} from "../notification/notification.service";
import {ErrorCode, ErrorService} from "../error/error.service";
import {CheckerService} from "../checker/checker.service";
import {LocalStorageService} from "../local-storage/local-storage.service";
import {HttpClient} from "@angular/common/http";
import {UserAllReservesData, UserReserveData} from "../../models/UserReserveData";
import {PoolData} from "../../models/PoolData";
import {UserPoolData} from "../../models/UserPoolData";
import {Utils} from "../../common/utils";
import {PoolsDistPercentages} from "../../models/PoolsDistPercentages";
import BigNumber from "bignumber.js";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {

  constructor(private scoreService: ScoreService,
              private persistenceService: PersistenceService,
              private stateChangeService: StateChangeService,
              private ommService: OmmService,
              private notificationService: NotificationService,
              private errorService: ErrorService,
              private checkerService: CheckerService,
              private localStorageService: LocalStorageService,
              private http: HttpClient) {

  }

  public async loadAllUserAssetsBalances(): Promise<void> {
    try {
      await Promise.all(Object.values(AssetTag).map(
        async (assetTag) => {
          this.scoreService.getUserAssetBalance(assetTag).then().catch(e => {
            log.error("Failed to fetch balance for " + assetTag);
            log.error(e);
          });
      }));

      await Promise.all(CollateralAssetTag.getPropertiesDifferentThanAssetTag().map(
        async (assetTag) => {
          this.scoreService.getUserCollateralAssetBalance(assetTag).then().catch(e => {
            log.error("Failed to fetch balance for " + assetTag);
            log.error(e);
          });
        }));
    } catch (e) {
      log.debug("Failed to fetch all user asset balances!");
    }
  }

  public loadAllUserDebts(): void {
    Object.values(AssetTag).forEach(assetTag => {
      this.scoreService.getUserDebt(assetTag).then()
        .catch(e => {
        log.error("Failed to load user debt for asset " + assetTag);
        log.error(e);
      });
    });
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
      const newAllReserve = new AllReservesData(allReserves.USDS, allReserves.ICX, allReserves.USDC);
      Object.entries(newAllReserve).forEach((value: [string, ReserveData]) => {
        // @ts-ignore
        newAllReserve[value[0]] = Mapper.mapReserveData(value[1]);
      });
      this.persistenceService.allReserves = newAllReserve;
      log.debug("loadAllReserves.allReserves after: ", this.persistenceService.allReserves);
    }).catch(e => {
      log.error("Error in loadAllReserveData: ", e);
    });
  }

  public async loadPoolsData(): Promise<void> {
    try {
      const poolsDataRes: PoolData[] = [];

      // get all pools id and total staked
      const poolsData = await this.scoreService.getPoolsData();
      log.debug("loadPoolsData:", poolsData);

      // get stats for each pool
      this.persistenceService.allPoolsDataMap = new Map<string, PoolData>(); // re-init map to trigger state changes
      for (const poolData of poolsData) {
        const poolStats = await this.scoreService.getPoolStats(poolData.poolID);
        log.debug("getPoolStats for " + poolData.poolID + " AFTER mapping:", poolStats);

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
      const newAllReserveConfigData = new AllReserveConfigData(
        allReservesConfigData.USDS,
        allReservesConfigData.ICX,
        allReservesConfigData.USDC);
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

  async loadUserAssetReserveData(assetTag: AssetTag): Promise<void> {
    this.checkerService.checkAllAddressesLoaded();

    const userReserveData = await this.scoreService.getUserReserveDataForSpecificReserve(
      this.persistenceService.allAddresses!.collateralAddress(assetTag));
    const mappedReserve = Mapper.mapUserReserve(userReserveData, this.persistenceService.getAssetReserveData(assetTag)!!.decimals);

    this.persistenceService.userReserves.reserveMap.set(assetTag, mappedReserve);
    log.debug(`User ${assetTag} reserve data:`, mappedReserve);
    this.stateChangeService.updateUserAssetReserve(mappedReserve, assetTag);
  }

  async loadAllUserReserveData(): Promise<void> {
    this.checkerService.checkAllAddressesLoaded();
    const allUserReserveData = await this.scoreService.getUserReserveDataForAllReserves();

    log.debug("loadAllUserReserveData.allUserReserveData before: ", allUserReserveData);

    const newUserAllReserve = new UserAllReservesData(allUserReserveData.USDS, allUserReserveData.ICX, allUserReserveData.USDC);

    Object.entries(newUserAllReserve).forEach((value: [string, UserReserveData]) => {
      const assetTag = AssetTag.fromString(value[0]);
      const mappedReserve = Mapper.mapUserReserve(value[1],  this.persistenceService.getAssetReserveData(assetTag)!!.decimals);
      // @ts-ignore
      newUserAllReserve[value[0]] = mappedReserve;

      this.persistenceService.userReserves.reserveMap.set(assetTag, mappedReserve);
      this.stateChangeService.updateUserAssetReserve(mappedReserve, assetTag);
    });

    log.debug("loadAllUserReserveData.allUserReserveData after: ", newUserAllReserve);
  }

  public loadUserAccountData(): Promise<void> {
    return this.scoreService.getUserAccountData().then((userAccountData: UserAccountData) => {
      this.persistenceService.userAccountData = Mapper.mapUserAccountData(userAccountData);
      this.stateChangeService.updateUserAccountData(this.persistenceService.userAccountData);
      log.debug("loadUserAccountData -> userAccountData:", this.persistenceService.userAccountData);
    });
  }

  public loadUserOmmRewards(): Promise<void> {
    return this.ommService.getOmmRewardsPerUser().then((ommRewards: OmmRewards) => {
      this.errorService.deregisterError(ErrorCode.USER_OMM_REWARDS);

      this.persistenceService.userOmmRewards = Mapper.mapUserOmmRewards(ommRewards);
      this.stateChangeService.updateUserOmmRewards(this.persistenceService.userOmmRewards);
    }).catch((e: any) => {
      this.errorService.registerErrorForResolve(ErrorCode.USER_OMM_REWARDS, () => this.loadUserOmmRewards());
      log.error(e);
    });
  }

  public loadUserOmmTokenBalanceDetails(): Promise<void> {
    return this.ommService.getOmmTokenBalanceDetails().then((res: OmmTokenBalanceDetails) => {
      this.errorService.deregisterError(ErrorCode.USER_OMM_TOKEN_BALANCE_DETAILS);

      this.persistenceService.userOmmTokenBalanceDetails = Mapper.mapUserOmmTokenBalanceDetails(res);
      log.debug("User Omm Token Balance Details: ", this.persistenceService.userOmmTokenBalanceDetails);
      this.stateChangeService.updateUserOmmTokenBalanceDetails(this.persistenceService.userOmmTokenBalanceDetails);
    }).catch((e: any) => {
      this.errorService.registerErrorForResolve(ErrorCode.USER_OMM_TOKEN_BALANCE_DETAILS, () => this.loadUserOmmTokenBalanceDetails());
      log.error(e);
    });
  }

  public loadUserDelegations(): Promise<void> {
    return this.scoreService.getUserDelegationDetails().then(yourVotesPrep => {
      this.persistenceService.yourVotesPrepList = yourVotesPrep;
      this.stateChangeService.yourVotesPrepChange.next(yourVotesPrep);
    }).catch(e => {
      log.error("Error occurred in loadUserDelegations:");
      log.error(e);
    });
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

  public loadLoanOriginationFeePercentage(): Promise<void> {
    return this.scoreService.getLoanOriginationFeePercentage().then(res => {
      this.persistenceService.loanOriginationFeePercentage = res;
    }).catch(e => {
      log.error("Error in loadLoanOriginationFeePercentage", e);
    });
  }

  public loadMinOmmStakeAmount(): void {
    this.scoreService.getOmmTokenMinStakeAmount().then(minStakeAmount => {
      this.persistenceService.minOmmStakeAmount = minStakeAmount;
    }).catch(e => {
      log.error("Error in loadMinOmmStakeAmount()");
      log.error(e);
    });
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
      const res = await this.scoreService.getDistPercentages();
      this.persistenceService.distributionPercentages = res;
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
      const res = await this.scoreService.getDailyRewardsDistributions();
      this.persistenceService.dailyRewardsAllPoolsReserves = res;
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

  public async loadPrepList(start: number = 1, end: number = 100): Promise<void> {
    try {
      const prepList = await this.scoreService.getListOfPreps(start, end);

      // fetch logos
      try {
        // Promise.all(prepList.preps?.map(async (prep) => {
          // prep.setLogoUrl(await this.getLogoUrl(prep.address));
        // }));

        prepList.preps?.forEach(prep => {
          prep.setLogoUrl(`https://iconwat.ch/logos/${prep.address}.png`);
        });

      } catch (e) {
        log.debug("Failed to fetch all logos");
      }

      this.persistenceService.prepList = prepList;
      this.stateChangeService.updatePrepList(prepList);
    } catch (e) {
      log.error("Failed to load prep list... Details:");
      log.error(e);
    }
  }

  private async getLogoUrl(address: string): Promise<string | undefined> {
    if (!address) { return undefined; }

    const url = `https://iconwat.ch/logos/${address}.png`;

    try {
      if (await this.imageExists(url)) {
        return url;
      } else {
        return undefined;
      }
    } catch (e) {
      log.error("Error occurred in API call to " + url);
      return undefined;
    }
  }

  private async imageExists(url: string): Promise<boolean> {
    const res = await this.http.get(url, { observe: 'response' }).toPromise();
    return res.status < 400;
  }

  public async afterUserActionReload(): Promise<void> {
    // reload all reserves and user asset-user reserve data
    await Promise.all([
      this.loadAllReserveData(),
      this.loadAllReservesConfigData(),
      this.loadTotalStakedOmm(),
      this.loadPoolsData(),
    ]);

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
      this.loadPoolsData()
    ]);
  }

  public async loadUserSpecificData(): Promise<void> {
    this.loadUserAsyncData();

    await Promise.all([
      this.loadAllUserReserveData(),
      this.loadAllUserAssetsBalances(),
      this.loadUserAccountData(),
      this.loadUserGovernanceData(),
      this.loadUserDelegations(),
      this.loadUserUnstakingInfo(),
      this.loadUserClaimableIcx(),
      this.loadUserPoolsData()
    ]);
  }

  /**
   * Load user data async without waiting
   */
  public loadUserAsyncData(): void {
    try {
      this.loadAllUserDebts();
    } catch (e) {
      log.error("Error occurred in loadUserAsyncData...");
      log.error(e);
    }
  }

  /**
   * Load core data async without waiting
   */
  public loadCoreAsyncData(): void {
    this.loadMinOmmStakeAmount();
  }

  public async loadUserGovernanceData(): Promise<void> {
    await Promise.all([
      this.loadUserOmmRewards(),
      this.loadUserOmmTokenBalanceDetails(),
    ]);
  }
}
