import { Injectable } from '@angular/core';
import {IconApiService} from "../icon-api/icon-api.service";
import {PersistenceService} from "../persistence/persistence.service";
import {CheckerService} from "../checker/checker.service";
import log from "loglevel";
import {TransactionDispatcherService} from "../transaction-dispatcher/transaction-dispatcher.service";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {ScoreMethodNames} from "../../common/score-method-names";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import {environment} from "../../../environments/environment";
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class StakeLpService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private transactionDispatcherService: TransactionDispatcherService) { }

  public stakeLp(poolId: BigNumber, amount: BigNumber, notificationMessage: string): void {
    amount = amount.dp(2);
    const tx = this.buildStakeLpTx(poolId, amount);

    log.debug(`Stake LP TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  public unstakeLp(poolId: BigNumber, amount: BigNumber, notificationMessage: string): void {
    amount = amount.dp(2);
    const tx = this.buildUnstakeLpTx(poolId, amount);

    log.debug(`Unstake LP TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  /**
   * @description Build Transaction for staking LP Tokens
   * **Note**: if the user tries to increase the stake, ”_value” should be previous staked balance + amount being additionally staked
   * @return IconTransaction Stake LP Tokens transaction
   */
  private buildStakeLpTx(poolId: BigNumber, amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Stake LP amount = ` + amount);
    const decimals = this.persistenceService.userPoolsDataMap.get(poolId.toString())?.poolStats.getPrecision() ?? 18;

    const params = {
      _to: this.persistenceService.allAddresses!.systemContract.StakedLp,
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _id: IconConverter.toHex(poolId),
      _data: IconConverter.fromUtf8('{ "method": "stake"}')
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      environment.BALANCED_DEX_SCORE, ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Transaction for un-staking LP Tokens
   * @return  IconTransaction Un-stake LP Tokens transaction
   */
  private buildUnstakeLpTx(poolId: BigNumber, amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Un-stake LP amount = ` + amount);
    const decimals = this.persistenceService.userPoolsDataMap.get(poolId.toString())?.poolStats.getPrecision() ?? 18;

    const params = {
      _id: IconConverter.toHex(poolId),
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.StakedLp, ScoreMethodNames.POOL_UNSTAKE, params, IconTransactionType.WRITE);
  }
}
