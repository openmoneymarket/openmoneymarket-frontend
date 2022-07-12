import {Injectable} from '@angular/core';
import {IconTransactionType} from '../../models/enums/IconTransactionType';
import {IconAmount, IconConverter} from "icon-sdk-js";
import {IconApiService} from '../icon-api/icon-api.service';
import {PersistenceService} from '../persistence/persistence.service';
import {ScoreMethodNames} from '../../common/score-method-names';
import {Utils} from "../../common/utils";
import {CheckerService} from "../checker/checker.service";
import log from "loglevel";
import {AssetTag, CollateralAssetTag, collateralTagToAssetTag} from "../../models/classes/Asset";
import {TransactionDispatcherService} from "../transaction-dispatcher/transaction-dispatcher.service";
import BigNumber from "bignumber.js";


@Injectable({
  providedIn: 'root'
})
export class SupplyService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private transactionDispatcherService: TransactionDispatcherService) {
  }

  public supplyAsset(amount: BigNumber, assetTag: AssetTag | CollateralAssetTag, notificationMessage: string): void {
    let tx;
    amount = amount.dp(2);

    switch (assetTag) {
      case AssetTag.ICX:
        tx = this.buildDepositIcxTx(amount);
        break;
      default:
        tx = this.buildDepositIRC2(amount, assetTag);
    }

    log.debug(`Supply ${assetTag} TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  private buildDepositIRC2(amount: BigNumber, assetTag: AssetTag | CollateralAssetTag): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Deposit ${assetTag} amount = ` + amount);
    const decimals = this.persistenceService.allReserves!.getReserveData(collateralTagToAssetTag(assetTag)).decimals;

    const params = {
      _to: this.persistenceService.allAddresses!.systemContract.LendingPool,
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _data: IconConverter.fromUtf8('{ "method": "deposit", "params": { "amount":' +
        Utils.normalisedAmountToBaseAmountString(amount, decimals) + '}}')
    };
    log.debug(`Deposit ${assetTag} params amount = ` +  Utils.normalisedAmountToBaseAmountString(amount, decimals));

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.collateralAddress(assetTag), ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);
  }

  private buildDepositIcxTx(amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    log.debug("Deposit ICX amount = " + amount);

    const params = {
      _amount: IconConverter.toHex(IconAmount.of(amount, IconAmount.Unit.ICX).toLoop()),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.DEPOSIT, params,
      IconTransactionType.WRITE, amount);
  }

}
