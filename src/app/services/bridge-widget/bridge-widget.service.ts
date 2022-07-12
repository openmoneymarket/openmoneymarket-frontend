import {Injectable} from '@angular/core';
import {OmmError} from "../../core/errors/OmmError";

// @ts-ignore
import BridgeService from "../../../../build/bridge.bundle";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {DataLoaderService} from "../data-loader/data-loader.service";
import log from "loglevel";
import {BridgeWidgetAction} from "../../models/Interfaces/BridgeWidgetAction";
import {NotificationService} from "../notification/notification.service";
import {LoginService} from "../login/login.service";
import {Utils} from "../../common/utils";

@Injectable({
  providedIn: 'root'
})
export class BridgeWidgetService {

  constructor(private dataLoaderService: DataLoaderService,
              private loginService: LoginService,
              private notificationService: NotificationService) {
    this.bridge = new BridgeService();
    window.addEventListener("bri.login", (e) => this.handleBridgeLogin(e));
    window.addEventListener("bri.widget.res", (e) => this.handleWidgetRes(e));
    window.addEventListener("bri.logout.res", (e) => this.handleWidgetLogoutRes(e));
    window.addEventListener("bri.deposit", () => this.handleBridgeUserBalanceAction());
    window.addEventListener("bri.withdraw", () => this.handleBridgeUserBalanceAction());
    window.addEventListener("bri.sendToken", () => this.handleBridgeUserBalanceAction());
  }

  bridge: BridgeService;

  handleBridgeLogin(e: any): void {
    const {publicAddress, email} = e.detail;
    log.debug("Bridge login with publicAddress=" + publicAddress);
    this.loginService.walletLogin(new BridgeWallet(publicAddress, email, this.bridge));
  }

  sendTransaction(tx: any): void {
    log.debug(`Bridge sendTransaction tx:`, tx);
    window.dispatchEvent(new CustomEvent('bri.send.tx', {
      detail: {
        payload: tx
      }
    }));
  }

  // when user trigger balance changing action in Bridge (deposit, withdraw, send) update his balances
  handleBridgeUserBalanceAction(): void {
    log.debug("Handling bri.deposit event...");
    this.dataLoaderService.loadAllUserAssetsBalances();
  }

  handleWidgetLogoutRes(e: any): void {
    const error: string = e.detail.error;

    if (error) {
      throw new OmmError(error);
    }

    this.notificationService.showNewNotification("Successfully logged out.");
  }

  handleWidgetRes(e: any): void {
    const error: string = e.detail.error;

    if (error) {
      throw new OmmError(error);
    }
  }

  getUserBridgeAddress(): string {
    const userBridgeAddress = localStorage.getItem("BRIDGE_USER_ICON_ADDRESS");
    if (!userBridgeAddress) {
      throw new OmmError("Unable to retrieve Bridge Icon address from the localstorage.");
    }
    return userBridgeAddress;
  }

  getUserBridgeEmail(): string {
    const userBridgeEmail = localStorage.getItem("BRIDGE_USER_ICON_EMAIL");
    if (!userBridgeEmail) {
      throw new OmmError("Unable to retrieve Bridge email from the localstorage.");
    }
    return userBridgeEmail;
  }

  openBridgeWidget(): void {
    Utils.dispatchBridgeWidgetAction(BridgeWidgetAction.OPEN);
  }

  closeBridgeWidget(): void {
    Utils.dispatchBridgeWidgetAction(BridgeWidgetAction.CLOSE);
  }
}
