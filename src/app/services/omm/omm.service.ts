import { Injectable } from '@angular/core';
import {IconApiService} from "../icon-api/icon-api.service";
import {PersistenceService} from "../persistence/persistence.service";
import {CheckerService} from "../checker/checker.service";
import {ScoreMethodNames} from "../../common/score-method-names";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import {UserAccumulatedOmmRewards} from "../../models/classes/UserAccumulatedOmmRewards";
import log from "loglevel";
import {OmmTokenBalanceDetails} from "../../models/classes/OmmTokenBalanceDetails";
import {Mapper} from "../../common/mapper";
import {UserDailyOmmReward} from "../../models/classes/UserDailyOmmReward";

@Injectable({
  providedIn: 'root'
})
export class OmmService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService) {

  }

  /**
   * @description Claim OMM rewards
   * @return Built transaction
   */
  public buildClaimOmmRewardsTx(): any {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.CLAIM_OMM_REWARDS,
      {}, IconTransactionType.WRITE);
  }

  /**
   * @description Get user accumulated OMM rewards
   * @return UserAccumulatedOmmRewards - Omm user accumulated rewards
   */
  public async getUserAccumulatedOmmRewards(): Promise<UserAccumulatedOmmRewards> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();
    log.debug("Executing getUserAccumulatedOmmRewards...");

    const params = {
      _user: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Rewards,
      ScoreMethodNames.GET_OMM_REWARDS_PER_USER, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getUserAccumulatedOmmRewards: ", res);

    return res;
  }

  /**
   * @description Get user daily OMM rewards
   * @return UserAccumulatedOmmRewards - Omm accumulated rewards for user
   */
  public async getUserDailyOmmRewards(): Promise<UserDailyOmmReward> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();
    log.debug("Executing getUserDailyOmmRewards...");

    const params = {
      user: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.Rewards,
      ScoreMethodNames.GET_USER_DAILY_OMM_REWARDS, params, IconTransactionType.READ);

    const res = await this.iconApiService.iconService.call(tx).execute();

    log.debug("getUserDailyOmmRewards: ", res);

    return Mapper.mapUserDailyOmmRewards(res);
  }

  /**
   * @description Get OMM token balance details
   * @return OmmTokenBalanceDetails - Omm token balance details
   */
  public async getOmmTokenBalanceDetails(): Promise<OmmTokenBalanceDetails> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _owner: this.persistenceService.activeWallet!.address,
    };

    const tx = this.iconApiService.buildTransaction("",  this.persistenceService.allAddresses!.systemContract.OmmToken,
      ScoreMethodNames.GET_OMM_TOKEN_BALANCE_DETAILS, params, IconTransactionType.READ);

    log.debug("Executing getOmmTokenBalanceDetails tx: ", tx);
    try {
      const res = await this.iconApiService.iconService.call(tx).execute();
      log.debug("getOmmTokenBalanceDetails: ", res);

      return Mapper.mapUserOmmTokenBalanceDetails(res);
    } catch (e) {
      log.error(e);
      throw e;
    }
  }


}
