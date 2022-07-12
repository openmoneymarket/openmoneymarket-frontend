import { Injectable } from '@angular/core';
import {IconexWallet} from "../../models/wallets/IconexWallet";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {LedgerWallet} from "../../models/wallets/LedgerWallet";
import {WalletType} from "../../models/wallets/Wallet";
import log from "loglevel";
import {OmmError} from "../../core/errors/OmmError";
import {PersistenceService} from "../persistence/persistence.service";
import {LocalStorageService} from "../local-storage/local-storage.service";
import {DataLoaderService} from "../data-loader/data-loader.service";
import {NotificationService} from "../notification/notification.service";
import {StateChangeService} from "../state-change/state-change.service";
import {LogoutService} from "../logout/logout.service";


/**
 * A service that deals with Login logic.
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private persistenceService: PersistenceService,
    private localStorageService: LocalStorageService,
    private dataLoaderService: DataLoaderService,
    private notificationService: NotificationService,
    private stateChangeService: StateChangeService,
    private logoutService: LogoutService
  ) { }

  public async walletLogin(wallet: IconexWallet | BridgeWallet | LedgerWallet, relogin: boolean = false, keepBridgeSession: boolean = false
  ): Promise<void> {
    // clear old login
    this.logoutService.signOutUser(keepBridgeSession);

    this.persistenceService.activeWallet = wallet;

    if (!relogin) {
      if (wallet.type !== WalletType.BRIDGE) {
        this.localStorageService.persistWalletLogin(wallet);
      } else {
        this.localStorageService.clearWalletLogin();
      }
    }

    log.info("Login with wallet: ", wallet);

    try {
      await this.dataLoaderService.loadUserSpecificData();
    } catch (e) {
      log.debug(e);
      this.persistenceService.activeWallet = undefined;
      this.notificationService.showNewNotification("Error occurred! Try again in a moment.");
      throw new OmmError("Error occurred! Try again in a moment.", e);
    }

    // gracefully fetch Omm part
    try {
      await Promise.all([
        this.dataLoaderService.loadUserAccumulatedOmmRewards(),
        this.dataLoaderService.loadUserOmmTokenBalanceDetails()
      ]);
    } catch (e) {
      log.error("Error in [loadUserOmmRewards, loadUserOmmTokenBalanceDetails]");
    }

    this.stateChangeService.updateLoginStatus(this.persistenceService.activeWallet);
  }
}
