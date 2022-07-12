import {Injectable} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {UserReserveData} from "../../models/classes/UserReserveData";
import {PersistenceService} from "../persistence/persistence.service";
import {AssetTag, CollateralAssetTag} from "../../models/classes/Asset";
import {IconexWallet} from "../../models/wallets/IconexWallet";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {UserAccountData} from "../../models/classes/UserAccountData";
import {ModalAction, ModalActionsResult} from "../../models/classes/ModalAction";
import {UserAccumulatedOmmRewards} from "../../models/classes/UserAccumulatedOmmRewards";
import {OmmTokenBalanceDetails} from "../../models/classes/OmmTokenBalanceDetails";
import log from "loglevel";
import {PoolData} from "../../models/classes/PoolData";
import {UserPoolData} from "../../models/classes/UserPoolData";
import {AllAssetDistPercentages} from "../../models/classes/AllAssetDisPercentages";
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
 * Service that manages state changes
 */
export class StateChangeService {

  /**
   * login change
   */
  public loginChange: Subject<IconexWallet | BridgeWallet | undefined> = new Subject<IconexWallet | BridgeWallet | undefined>();

  /**
   * Map containing subscribable Subjects for each of the Asset (e.g. USDb, ICX, ..)
   */
  public userBalanceChangeMap: Map<AssetTag, Subject<BigNumber>> = new Map([
    [AssetTag.USDS, new Subject<BigNumber>()],
    [AssetTag.ICX, new Subject<BigNumber>()],
    [AssetTag.USDC, new Subject<BigNumber>()],
    [AssetTag.bnUSD, new Subject<BigNumber>()],
    [AssetTag.BALN, new Subject<BigNumber>()],
    [AssetTag.OMM, new Subject<BigNumber>()],
  ]);

  public userCollateralBalanceChangeMap: Map<CollateralAssetTag, Subject<BigNumber>> = new Map([
    [CollateralAssetTag.USDS, new Subject<BigNumber>()],
    [CollateralAssetTag.sICX, new Subject<BigNumber>()],
    [CollateralAssetTag.USDC, new Subject<BigNumber>()],
    [CollateralAssetTag.bnUSD, new Subject<BigNumber>()],
    [CollateralAssetTag.BALN, new Subject<BigNumber>()],
    [CollateralAssetTag.OMM, new Subject<BigNumber>()],
  ]);

  /**
   * Map containing subscribable Subjects for each of the Asset reserve (e.g. USDb, ICX, ..)
   */
  public userReserveChangeMap: Map<AssetTag, Subject<UserReserveData>> = new Map([
    [AssetTag.USDS, new Subject<UserReserveData>()],
    [AssetTag.ICX, new Subject<UserReserveData>()],
    [AssetTag.USDC, new Subject<UserReserveData>()],
    [AssetTag.bnUSD, new Subject<UserReserveData>()],
    [AssetTag.BALN, new Subject<UserReserveData>()],
    [AssetTag.OMM, new Subject<UserReserveData>()],
  ]);


  /**
   * Subscribable subject for user account data change
   */
  public userAccountDataChange: Subject<UserAccountData> = new Subject<UserAccountData>();

  public userOmmAccumulatedRewardsChange: Subject<UserAccumulatedOmmRewards> = new Subject<UserAccumulatedOmmRewards>();

  private userOmmDailyRewardsChange = new Subject<UserDailyOmmReward>();
  userOmmDailyRewardsChange$ = this.userOmmDailyRewardsChange.asObservable();

  public userOmmTokenBalanceDetailsChange: Subject<OmmTokenBalanceDetails> = new Subject<OmmTokenBalanceDetails>();
  public totalOmmStakedChange: Subject<BigNumber> = new Subject<BigNumber>();
  public voteDefinitionFeeChange: Subject<BigNumber> = new Subject<BigNumber>();
  public voteDefinitionCriterionChange: Subject<BigNumber> = new Subject<BigNumber>();
  public proposalListChange: Subject<Proposal[]> = new Subject<Proposal[]>();

  /**
   * Subscribable subject for monitoring the user modal action changes (supply, withdraw, ..)
   * Example: when user confirms the modal action, this Subject should get updated
   */
  public userModalActionChange: Subject<ModalAction> = new Subject<ModalAction>();
  public userModalActionResult: Subject<ModalActionsResult> = new Subject<ModalActionsResult>();

  /**
   * Subscribable subject for monitoring the user total risk changes
   */
  public userTotalRiskChange: Subject<BigNumber> = new Subject<BigNumber>();

  /**
   * Subscribable subject for monitoring the pools data
   */
  private poolsDataChange: Subject<PoolData[]> = new Subject<PoolData[]>();
  poolsDataChange$: Observable<PoolData[]> = this.poolsDataChange.asObservable();

  private userPoolsDataChange: Subject<UserPoolData[]> = new Subject<UserPoolData[]>();
  userPoolsDataChange$: Observable<UserPoolData[]> = this.userPoolsDataChange.asObservable();

  private onPoolClick: Subject<UserPoolData | PoolData> = new Subject<UserPoolData | PoolData>();
  onPoolClick$: Observable<UserPoolData | PoolData> = this.onPoolClick.asObservable();

  private allAssetDistPercentagesChange: Subject<AllAssetDistPercentages> = new Subject<AllAssetDistPercentages>();
  allAssetDistPercentagesChange$: Observable<AllAssetDistPercentages> = this.allAssetDistPercentagesChange.asObservable();

  private ommPriceChange: Subject<BigNumber> = new Subject<BigNumber>();
  ommPriceChange$: Observable<BigNumber> = this.ommPriceChange.asObservable();

  private tokenDistributionPerDayChange: Subject<BigNumber> = new Subject<BigNumber>();
  tokenDistributionPerDayChange$: Observable<BigNumber> = this.tokenDistributionPerDayChange.asObservable();

  private sIcxSelectedChange: Subject<boolean> = new Subject<boolean>();
  sIcxSelectedChange$: Observable<boolean> = this.sIcxSelectedChange.asObservable();

  private userProposalVotesChange: Subject<{proposalId: BigNumber, vote: Vote}> = new Subject<{proposalId: BigNumber, vote: Vote}>();
  userProposalVotesChange$: Observable<{proposalId: BigNumber, vote: Vote}> = this.userProposalVotesChange.asObservable();

  // subscribe to afterUserDataReload$ in order to react to user data loading being complete
  private afterUserDataReload: Subject<void> = new Subject<void>();
  afterUserDataReload$: Observable<void> = this.afterUserDataReload.asObservable();

  private afterCoreDataReload: Subject<void> = new Subject<void>();
  afterCoreDataReload$: Observable<void> = this.afterCoreDataReload.asObservable();

  private collapseMarketAssets: Subject<void> = new Subject<void>();
  collapseMarketAssets$: Observable<void> = this.collapseMarketAssets.asObservable();

  private disableAssetsInputs: Subject<void> = new Subject<void>();
  disableAssetsInputs$: Observable<void> = this.disableAssetsInputs.asObservable();

  private showDefaultActions: Subject<void> = new Subject<void>();
  showDefaultActions$: Observable<void> = this.showDefaultActions.asObservable();

  private removeAdjustClass: Subject<void> = new Subject<void>();
  removeAdjustClass$: Observable<void> = this.removeAdjustClass.asObservable();

  private collapseOtherAssetsTable: Subject<AssetTag | CollateralAssetTag> = new Subject<AssetTag | CollateralAssetTag>();
  collapseOtherAssetsTable$: Observable<AssetTag | CollateralAssetTag> = this.collapseOtherAssetsTable.asObservable();

  private interestHistoryChange: Subject<InterestHistory[]> = new Subject<InterestHistory[]>();
  interestHistoryChange$: Observable<InterestHistory[]> = this.interestHistoryChange.asObservable();

  private userLockedOmmChange = new Subject<LockedOmm>();
  userLockedOmmChange$ = this.userLockedOmmChange.asObservable();

  private userbOmmBalanceChange = new Subject<BigNumber>();
  userbOmmBalanceChange$ = this.userbOmmBalanceChange.asObservable();

  private bOmmTotalSupplyChange = new Subject<BigNumber>();
  bOmmTotalSupplyChange$ = this.bOmmTotalSupplyChange.asObservable();

  private currentTimestampChange = new Subject<{ currentTimestamp: number, currentTimestampMicro: BigNumber }>();
  currentTimestampChange$ = this.currentTimestampChange.asObservable();

  private collapseAllPoolsTablesChange = new Subject<PoolData | undefined>();
  collapseAllPoolsTablesChange$ = this.collapseAllPoolsTablesChange.asObservable();

  private collapseYourPoolsTablesChange = new Subject<UserPoolData | undefined>();
  collapseYourPoolsTablesChange$ = this.collapseYourPoolsTablesChange.asObservable();

  private lockedOmmActionSucceeded: Subject<boolean> = new Subject<boolean>();
  lockedOmmActionSucceeded$: Observable<boolean> = this.lockedOmmActionSucceeded.asObservable();

  /**
   * Subscribable subject for monitoring the user debt changes for each asset
   */
  public userDebtMapChange: Map<AssetTag, Subject<BigNumber | undefined>> = new Map([
    [AssetTag.USDS, new Subject<BigNumber | undefined>()],
    [AssetTag.ICX, new Subject<BigNumber | undefined>()],
    [AssetTag.USDC, new Subject<BigNumber | undefined>()],
    [AssetTag.bnUSD, new Subject<BigNumber | undefined>()],
    [AssetTag.BALN, new Subject<BigNumber | undefined>()],
    [AssetTag.OMM, new Subject<BigNumber | undefined>()],
  ]);


  constructor(private persistenceService: PersistenceService) {
    this.userBalanceChangeMap.forEach((subject: Subject<BigNumber>, key: AssetTag) => {
      subject.subscribe(value => {
        if (this.persistenceService.activeWallet) {
          this.persistenceService.activeWallet.balances.set(key, value);
        }
      });
    });

    this.userCollateralBalanceChangeMap.forEach((subject: Subject<BigNumber>, key: CollateralAssetTag) => {
      subject.subscribe(value => {
        if (this.persistenceService.activeWallet) {
          this.persistenceService.activeWallet.collateralBalances.set(key, value);
        }
      });
    });

    this.userReserveChangeMap.forEach((subject: Subject<UserReserveData>, assetTag: AssetTag) => {
      subject.subscribe((value: UserReserveData) => {
        if (this.persistenceService.activeWallet) {
          this.persistenceService.userReserves.reserveMap.set(assetTag, value);
        }
      });
    });

    this.userDebtMapChange.forEach((subject: Subject<BigNumber | undefined>, assetTag: AssetTag) => {
      subject.subscribe((value: BigNumber | undefined) => {
        if (this.persistenceService.activeWallet) {
          log.debug(`Loaded asset ${assetTag} debt ${value}...`);
          this.persistenceService.userDebt.set(assetTag, value);
        }
      });
    });
  }

  public lockedOmmActionSucceededUpdate(succeeded: boolean): void {
    this.lockedOmmActionSucceeded.next(succeeded);
  }

  public collapseOtherPoolTablesUpdate(activePool: PoolData | undefined): void {
    this.collapseAllPoolsTablesChange.next(activePool);
  }

  public collapseYourPoolTablesUpdate(activePool: UserPoolData | undefined): void {
    this.collapseYourPoolsTablesChange.next(activePool);
  }

  public currentTimestampUpdate(currentTimestamp: number, currentTimestampMicro: BigNumber): void {
    this.currentTimestampChange.next({ currentTimestamp, currentTimestampMicro});
  }

  public userOmmDailyRewardsUpdate(rewards: UserDailyOmmReward): void {
    this.persistenceService.userDailyOmmRewards = rewards;
    this.userOmmDailyRewardsChange.next(rewards);
  }

  public bOmmTotalSupplyUpdate(totalSupply: BigNumber): void {
    this.persistenceService.bOmmTotalSupply = totalSupply;
    this.bOmmTotalSupplyChange.next(totalSupply);
  }

  public userbOmmBalanceUpdate(balance: BigNumber): void {
    this.persistenceService.userbOmmBalance = balance;
    this.userbOmmBalanceChange.next(balance);
  }

  public userLockedOmmUpdate(lockedOmm: LockedOmm): void {
    this.persistenceService.userLockedOmm = lockedOmm;
    this.userLockedOmmChange.next(lockedOmm);
  }

  public interestHistoryUpdate(interestHistory: InterestHistory[]): void {
    this.persistenceService.interestHistory =  [...interestHistory];
    this.interestHistoryChange.next(this.persistenceService.interestHistory);
  }

  public allAssetDistPercentagesUpdate(value: AllAssetDistPercentages): void {
    this.persistenceService.allAssetDistPercentages = value;
    this.allAssetDistPercentagesChange.next(value);
  }

  public collapseOtherAssetsTableUpdate(assetTag: AssetTag | CollateralAssetTag): void {
    this.collapseOtherAssetsTable.next(assetTag);
  }

  public removeAdjustClassUpdate(): void {
    this.removeAdjustClass.next();
  }

  public collapseMarketAssetsUpdate(): void {
    this.collapseMarketAssets.next();
  }

  public showDefaultActionsUpdate(): void {
    this.showDefaultActions.next();
  }

  public disableAssetsInputsUpdate(): void {
    this.disableAssetsInputs.next();
  }

  public userDataReloadUpdate(): void {
    this.afterUserDataReload.next();
  }

  public coreDataReloadUpdate(): void {
    this.afterCoreDataReload.next();
  }

  public tokenDistributionPerDayUpdate(value: BigNumber): void {
    this.persistenceService.tokenDistributionPerDay = value;
    this.tokenDistributionPerDayChange.next(value);
  }

  public ommPriceUpdate(value: BigNumber): void {
    this.persistenceService.ommPriceUSD = value;
    this.ommPriceChange.next(value);
  }

  public poolClickCUpdate(pool: PoolData | UserPoolData): void {
    this.onPoolClick.next(pool);
  }

  public sIcxSelectedUpdate(sIcxSelected: boolean): void {
    this.sIcxSelectedChange.next(sIcxSelected);
  }

  public userProposalVotesUpdate(proposalId: BigNumber, vote: Vote): void {
    this.persistenceService.userProposalVotes.set(proposalId, vote);
    this.userProposalVotesChange.next({proposalId, vote});
  }

  public poolsDataUpdate(poolsData: PoolData[]): void {
    this.persistenceService.allPools = [...poolsData];
    this.poolsDataChange.next(poolsData);
  }

  public userPoolsDataUpdate(userPoolsData: UserPoolData[]): void {
    this.persistenceService.userPools = [...userPoolsData];
    this.userPoolsDataChange.next(userPoolsData);
  }

  public updateLoginStatus(wallet: IconexWallet | BridgeWallet | undefined): void {
    this.loginChange.next(wallet);
  }

  public updateUserTotalRisk(totalRisk: BigNumber): void {
    this.persistenceService.userTotalRisk = totalRisk;
    this.userTotalRiskChange.next(totalRisk);
  }

  public updateUserAssetBalance(balance: BigNumber, assetTag: AssetTag): void {
    this.persistenceService.activeWallet!.balances.set(assetTag, balance);
    this.userBalanceChangeMap.get(assetTag)!.next(balance);
  }

  public updateUserCollateralAssetBalance(balance: BigNumber, assetTag: CollateralAssetTag): void {
    this.userCollateralBalanceChangeMap.get(assetTag)!.next(balance);
  }

  public updateUserDebt(debt: BigNumber, assetTag: AssetTag): void {
    this.userDebtMapChange.get(assetTag)!.next(debt);
  }

  public updateUserAssetReserve(reserve: UserReserveData, assetTag: AssetTag): void {
    this.userReserveChangeMap.get(assetTag)!.next(reserve);
  }

  public updateUserAccountData(userAccountData: UserAccountData): void {
    this.userAccountDataChange.next(userAccountData);
  }

  public updateUserAccumulatedOmmRewards(userOmmRewards: UserAccumulatedOmmRewards): void {
    this.userOmmAccumulatedRewardsChange.next(userOmmRewards);
  }

  public updateUserOmmTokenBalanceDetails(userOmmTokenBalanceDetails: OmmTokenBalanceDetails): void {
    this.persistenceService.userOmmTokenBalanceDetails = userOmmTokenBalanceDetails;
    this.userOmmTokenBalanceDetailsChange.next(userOmmTokenBalanceDetails);
  }

  public updateTotalStakedOmm(totalStakedOmm: BigNumber): void {
    this.persistenceService.totalStakedOmm = totalStakedOmm;
    this.totalOmmStakedChange.next(totalStakedOmm);
  }

  public updateVoteDefinitionFee(voteDefinitionFee: BigNumber): void {
    this.persistenceService.voteDefinitionFee = voteDefinitionFee;
    this.voteDefinitionFeeChange.next(voteDefinitionFee);
  }

  public updateVoteDefinitionCriterion(voteDefinitionCriterion: BigNumber): void {
    this.persistenceService.voteDefinitionCriterion = voteDefinitionCriterion;
    this.voteDefinitionCriterionChange.next(voteDefinitionCriterion);
  }

  public updateProposalsList(proposalList: Proposal[]): void {
    this.persistenceService.proposalList = [...proposalList];
    this.proposalListChange.next(proposalList);
  }

  public updateUserModalAction(modalAction: ModalAction): void {
    this.userModalActionChange.next(modalAction);
  }

}
