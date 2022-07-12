import {Injectable} from '@angular/core';
import {IconApiService} from "../icon-api/icon-api.service";
import {PersistenceService} from "../persistence/persistence.service";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {ScoreMethodNames} from "../../common/score-method-names";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import {CheckerService} from "../checker/checker.service";
import log from "loglevel";
import {AssetTag} from "../../models/classes/Asset";
import {TransactionDispatcherService} from "../transaction-dispatcher/transaction-dispatcher.service";
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class BorrowService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private transactionDispatcherService: TransactionDispatcherService) {
  }

  public borrowAsset(amount: BigNumber, assetTag: AssetTag, notificationMessage: string): void {
    amount = amount.dp(2);
    const tx = this.buildBorrowAssetTx(amount, assetTag);

    log.debug(`borrow ${assetTag} TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  private buildBorrowAssetTx(amount: BigNumber, assetTag: AssetTag): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    const decimals = this.persistenceService.allReserves!.getReserveData(assetTag).decimals;

    const params = {
      _amount: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _reserve: this.persistenceService.allAddresses!.collateralAddress(assetTag)
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.BORROW, params, IconTransactionType.WRITE);
  }

}
