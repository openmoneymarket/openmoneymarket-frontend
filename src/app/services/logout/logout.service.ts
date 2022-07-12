import { Injectable } from '@angular/core';
import {PersistenceService} from "../persistence/persistence.service";
import {StateChangeService} from "../state-change/state-change.service";
import {BridgeWidgetAction} from "../../models/Interfaces/BridgeWidgetAction";
import {Utils} from "../../common/utils";
import {LocalStorageService} from "../local-storage/local-storage.service";


/**
 * A service that deals with Logout logic.
 */
@Injectable({
  providedIn: 'root'
})
export class LogoutService {

  constructor(
    private persistenceService: PersistenceService,
    private stateChangeService: StateChangeService,
    private localStorageService: LocalStorageService
  ) { }

  signOutUser(keepBridgeSession: boolean = false): void {
    // if Bridge wallet commit request to Bridge to sign out
    if (!keepBridgeSession && this.persistenceService.bridgeWalletActive()) {
      this.signOutBridgeUser();
    }

    // clear active wallet from persistence service
    this.persistenceService.logoutUser();

    // clear local storage wallet data
    this.localStorageService.clearWalletLogin();

    // commit change to the state change service
    this.stateChangeService.updateLoginStatus(this.persistenceService.activeWallet);
  }

  private signOutBridgeUser(): void {
    Utils.dispatchBridgeWidgetAction(BridgeWidgetAction.LOGOUT);
  }
}
