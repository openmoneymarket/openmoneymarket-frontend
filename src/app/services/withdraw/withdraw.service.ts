import {Injectable} from '@angular/core';
import {IconApiService} from "../icon-api/icon-api.service";
import {PersistenceService} from "../persistence/persistence.service";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {ScoreMethodNames} from "../../common/score-method-names";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import {CheckerService} from "../checker/checker.service";
import log from "loglevel";
import {AssetTag, CollateralAssetTag} from "../../models/classes/Asset";
import {Utils} from "../../common/utils";
import {TransactionDispatcherService} from "../transaction-dispatcher/transaction-dispatcher.service";
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class WithdrawService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private transactionDispatcherService: TransactionDispatcherService) {
  }

  public withdrawAsset(amount: BigNumber, assetTag: AssetTag, waitForUnstaking = false, notificationMessage: string): void {
    let tx;
    if (!amount.isEqualTo(new BigNumber("-1"))) {
      amount = amount.dp(2);
    }

    switch (assetTag) {
      case AssetTag.ICX:
        tx = this.buildWithdrawIcxTx(amount, waitForUnstaking);
        break;
      case CollateralAssetTag.sICX:
        tx = this.buildWithdrawIcxTx(amount, waitForUnstaking, false);
        break;
      default:
        tx = this.buildWithdrawIrc2AssetTx(amount, assetTag);
    }

    log.debug(`Withdraw ${assetTag} TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  private buildWithdrawIrc2AssetTx(amount: BigNumber, assetTag: AssetTag): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    const decimals = this.persistenceService.allReserves!.getReserveData(assetTag).decimals;

    const params = {
      _oToken: this.persistenceService.allAddresses!.oTokenAddress(assetTag),
      _amount: !amount.isEqualTo(new BigNumber("-1")) ? IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()) : "-0x1",
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.REDEEM, params, IconTransactionType.WRITE);
  }

  private buildWithdrawIcxTx(amount: BigNumber, waitForUnstaking: boolean, convertToSICX = true): any {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    if (!amount.isEqualTo(new BigNumber("-1"))) {
      if (convertToSICX) {
        // convert amount from ICX value to sICX
        log.debug("Withdraw amount before conversion to sICX = " + amount);
        amount = Utils.convertICXTosICX(amount, this.persistenceService.getAssetReserveData(AssetTag.ICX)!.sICXRate);
        log.debug("Withdraw amount after conversion to sICX = " + amount);
      }
    }

    const params = {
      _oToken: this.persistenceService.allAddresses!.oTokens.oICX,
      _amount: !amount.isEqualTo(new BigNumber("-1")) ? IconConverter.toHex(IconAmount.of(amount, IconAmount.Unit.ICX).toLoop()) : "-0x1",
      _waitForUnstaking: waitForUnstaking ? "0x1" : "0x0"
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.REDEEM, params, IconTransactionType.WRITE);
  }
}
