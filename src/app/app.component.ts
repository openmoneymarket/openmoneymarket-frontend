import {Component, OnDestroy, OnInit} from '@angular/core';
import {IconexApiService} from './services/iconex-api/iconex-api.service';
import {DataLoaderService} from './services/data-loader/data-loader.service';
import {ModalService} from "./services/modal/modal.service";
import {PersistenceService} from "./services/persistence/persistence.service";
import {BaseClass} from "./components/base-class";
import {WalletType} from "./models/wallets/Wallet";
import {LocalStorageService, WalletLogin} from "./services/local-storage/local-storage.service";
import {IconexWallet} from "./models/wallets/IconexWallet";
import {LedgerWallet} from "./models/wallets/LedgerWallet";
import log from "loglevel";
import {LoginService} from "./services/login/login.service";

declare var $: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends BaseClass implements OnInit, OnDestroy {

  title = 'Open money market';

  private attachedListener = false;

  constructor(private iconexApiService: IconexApiService,
              private dataLoaderService: DataLoaderService,
              private loginService: LoginService,
              private modalService: ModalService,
              public persistenceService: PersistenceService,
              private localStorageService: LocalStorageService) {
    super(persistenceService);

    window.addEventListener("load", () => {
      // register Iconex handler
      window.addEventListener("ICONEX_RELAY_RESPONSE", (e: any) => this.iconexApiService.iconexEventHandler(e));
      this.attachedListener = true;

      // Trigger has account if extension flag is false to check if user has Iconex/Hana extension
      if (!this.iconexApiService.hasWalletExtension) {
        log.debug("Dispatching hasAccount because extension = false");
        this.iconexApiService.hasAccount();
      }
    });

    // load all SCORE addresses
    dataLoaderService.loadAllScoreAddresses().then(() => {
      // load core data
      this.dataLoaderService.loadCoreData().then(() => {
        // after core data is logged try to re-login
        this.reLogin();
      });
    });


    // register on document click handler
    $(document).on("click", (e: any) => {
      if ($(e.target).is(".wallet.bridge") === false) {
        $(".wallet.bridge").removeClass("active");
        $(".wallet-content.bridge").removeClass("active");
        e.stopPropagation();
      }

      if ($(e.target).is("#time-selector") === false && $(e.target).is("#time-selector-dropdown") === false) {
        $("#time-selector").removeClass("active");
        $(".time-selector-content").removeClass("active");
      }

      if ($(e.target).is(".dropdown.time-selector") === false && $(e.target).is(".dropdown-content.locked-selector") === false
        && $(e.target).is(".animation-underline.locked-selector") === false) {
        $(".dropdown-content.locked-selector").removeClass("active");
      }
    });
  }

  reLogin(): void {
    if (!this.persistenceService.userLoggedIn()) {
      const walletLogin: WalletLogin | undefined = this.localStorageService.getLastWalletLogin();
      if (!walletLogin) {
        return;
      }
      const timestamp = walletLogin.timestamp;

      log.debug(`reLogin walletLogin: ${walletLogin}`);

      // if last login was less than 1 hour ago 3600 do re-login
      const currentTimestamp = + new Date();
      if (timestamp > currentTimestamp - 3600000) {
        const activeWallet: any = walletLogin.wallet;
        const activeWalletType = activeWallet?.type;

        if (activeWallet &&  activeWalletType === WalletType.ICONEX || activeWalletType === WalletType.LEDGER) {
          switch (activeWalletType) {
            case WalletType.ICONEX:
              this.loginService.walletLogin(new IconexWallet(activeWallet.address), true);
              break;
            case WalletType.LEDGER:
              this.loginService.walletLogin(new LedgerWallet(activeWallet.address, activeWallet.path), true);
              break;
          }
        }
      }
    }
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    if (this.attachedListener){
      window.removeEventListener("ICONEX_RELAY_RESPONSE", (e: any) => this.iconexApiService.iconexEventHandler(e));
      this.attachedListener = false;
    }
  }

  onOverlayClick(): void {
    this.modalService.hideActiveModal();
  }

}
