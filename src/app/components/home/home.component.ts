import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {RiskComponent} from "../risk/risk.component";
import {Asset} from "../../models/classes/Asset";
import log from "loglevel";
import {AssetComponent} from "../asset/asset.component";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {ActiveMarketOverview, ActiveViews} from "../../models/enums/ActiveViews";
import {ModalAction} from "../../models/classes/ModalAction";
import {BridgeWidgetService} from "../../services/bridge-widget/bridge-widget.service";
import {Utils} from "../../common/utils";
import BigNumber from "bignumber.js";
import {environment} from "../../../environments/environment";
import {ReloaderService} from "../../services/reloader/reloader.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent extends BaseClass implements OnInit, AfterViewInit {

  className = "[HomeComponent]";

  // Child components
  @ViewChild("riskComponent") riskComponent!: RiskComponent;

  // Asset children components
  @ViewChildren('assetEl') assetComponents!: QueryList<AssetComponent>;
  // Asset children components
  @ViewChildren('availAsset') userAvailableAssetComponents!: QueryList<AssetComponent>;

  // array of the user's assets (user's balance of asset, supplied > 0)
  public userAssets: Asset[] = [];
  // array of the user's available (user's balance of asset > 0 and supplied = 0)
  public availableAssets: Asset[] = [];

  // keep track of current active market view in this variable
  public activeMarketView: ActiveViews = this.userLoggedIn() ? ActiveViews.USER_MARKET : ActiveViews.ALL_MARKET;
  public activeMarketOverview: ActiveMarketOverview = this.userLoggedIn() ? ActiveMarketOverview.YOUR_OVERVIEW :
    ActiveMarketOverview.MARKET_OVERVIEW;

  // OMM toggle checkbox
  public ommApyChecked = false;

  constructor(public persistenceService: PersistenceService,
              private cd: ChangeDetectorRef,
              private stateChangeService: StateChangeService,
              private bridgeWidgetService: BridgeWidgetService,
              private reloaderService: ReloaderService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.registerSubscriptions();
  }

  ngAfterViewInit(): void {
    this.loadAssetLists();

    // call cd after to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.cd.detectChanges();
  }

  // load the asset lists
  loadAssetLists(): void {
    if (this.activeMarketView === ActiveViews.ALL_MARKET) {
      this.userAssets = [...this.supportedAssets];
    } else {
      const userAssetsTmp: Asset[] = [];
      const availableAssetsTmp: Asset[]  = [];

      Array.from(this.supportedAssetsMap.values()).forEach(asset => {
        // if user is logged in, load his available and current assets
        if (this.userLoggedIn()) {
          // Asset that is supplied or borrowed should be in userAssets
          if (this.persistenceService.assetSuppliedOrBorrowed(asset.tag)) {
            userAssetsTmp.push(asset);
          }
          // check if asset is available to supply
          else if (this.persistenceService.isAssetAvailableToSupply(asset.tag)) {
            availableAssetsTmp.push(asset);
          }
        }
      });

      this.userAssets = [...userAssetsTmp];
      this.availableAssets = [...availableAssetsTmp];

      // trigger re-init in case the Asset object was not changed / added (Angular only re-renders component if object is changed / added)
      this.initAssetValues();
    }
  }

  private registerSubscriptions(): void {
    this.subscribeToLoginChange();
    this.subscribeToUserModalActionChange();
    this.subscribeToUserDataReload();
  }

  private subscribeToUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      // reload the asset lists
      this.loadAssetLists();
    });
  }

  private subscribeToLoginChange(): void {
    this.stateChangeService.loginChange.subscribe(wallet => {
      if (wallet) {
        // user login
        this.onYourMarketsClick();
        this.onToggleYourOverviewClick();
      } else {
        // user logout
        this.onToggleMarketOverviewClick();
        this.onAllMarketsClick();
      }
    });
  }

  private subscribeToUserModalActionChange(): void {
    // User confirmed the modal action
    this.stateChangeService.userModalActionChange.subscribe((modalAction?: ModalAction) => {
      log.debug(`userModalActionChange -> modalAction: ${modalAction}`);
      // collapse the opened tables of the user assets
      this.collapseTableUserAssets();
    });
  }

  onDepositUSDClick(): void {
    this.bridgeWidgetService.openBridgeWidget();
  }

  // On "Market overview" click
  onToggleMarketOverviewClick(): void {
    this.activeMarketOverview = ActiveMarketOverview.MARKET_OVERVIEW;
  }

  // On "Your overview" click
  onToggleYourOverviewClick(): void {
    this.activeMarketOverview = ActiveMarketOverview.YOUR_OVERVIEW;
  }

  // On "All markets tab" click
  onAllMarketsClick(): void {
    // set active market view
    this.activeMarketView = ActiveViews.ALL_MARKET;

    // re-load the asset lists
    this.loadAssetLists();

    // collapse assets tables
    this.collapseTableUserAssets();

    /** Set everything to default */

    // Remove adjust class in user assets
    this.removeAdjustClass();

    // disable and reset supply and borrow sliders
    this.disableAndResetAssetsSupplyAndBorrowSliders();
  }

  onYourMarketsClick(login: boolean = false): void {
    // set active market view
    this.activeMarketView = ActiveViews.USER_MARKET;

    // re-load the asset lists
    this.loadAssetLists();

    // collapse assets tables
    if (!login) {
      this.collapseTableUserAssets();
    }

    /** Set everything to default */

    // Remove adjust class
    this.removeAdjustClass();

    // Show default actions
    this.showDefaultActions();

    // disable and reset supply and borrow sliders
    if (!login) {
      this.disableAndResetAssetsSupplyAndBorrowSliders();
    }

    // Disable asset-user inputs (Your markets)
    this.disableAssetsInputs();
  }

  showDefaultActions(): void {
    this.stateChangeService.showDefaultActionsUpdate();
  }

  removeAdjustClass(): void {
    this.stateChangeService.removeAdjustClassUpdate();
  }

  collapseOtherAssetsTable(assetTag: any): void {
    this.stateChangeService.collapseOtherAssetsTableUpdate(assetTag);
  }

  collapseTableUserAssets(): void {
    // emit event to collapse asset tables
    this.stateChangeService.collapseMarketAssetsUpdate();
  }

  disableAndResetAssetsSupplyAndBorrowSliders(): void {
    // disable and reset supply and borrow sliders
    this.assetComponents.forEach(userAssetComponent => {
      userAssetComponent.disableAndResetSupplySlider();
      userAssetComponent.disableAndResetBorrowSlider();
    });

    this.userAvailableAssetComponents.forEach(userAvailableAssetComponent => {
      userAvailableAssetComponent.disableAndResetSupplySlider();
    });
  }

  initAssetValues(): void {
    // disable and reset supply and borrow sliders
    this.assetComponents.forEach(userAssetComponent => {
      userAssetComponent.initSupplyAndBorrowValues();
    });

    this.userAvailableAssetComponents.forEach(userAvailableAssetComponent => {
      userAvailableAssetComponent.initSupplyAndBorrowValues();
    });
  }

  disableAssetsInputs(): void {
    this.stateChangeService.disableAssetsInputsUpdate();
  }

  // hide your market header if view is not active or active assets length == 0 and available is not
  shouldHideYourMarketHeader(): boolean {
    return !this.userMarketViewActive() || this.userAssets.length === 0;
  }

  noActiveOrAvailableAsset(): boolean {
    return this.userAssets.length === 0 && this.availableAssets.length === 0;
  }

  userMarketViewActive(): boolean {
    return this.activeMarketView === ActiveViews.USER_MARKET;
  }

  allMarketViewActive(): boolean {
    return this.activeMarketView === ActiveViews.ALL_MARKET;
  }

  isMarketOverviewActive(): boolean {
    return this.activeMarketOverview === ActiveMarketOverview.MARKET_OVERVIEW;
  }

  getOmmPriceUSD(): string {
    if (!this.shouldShowOmmPriceAndToggle() || this.persistenceService.ommPriceUSD.isLessThanOrEqualTo(new BigNumber("0"))) {
      return "";
    } else {
      return `($${this.tooUSLocaleString(Utils.roundOffTo2Decimals(this.persistenceService.ommPriceUSD))})`;
    }
  }

  // show OMM price and toggle only if timestamps are not active or time to show has passed
  shouldShowOmmPriceAndToggle(): boolean {
    return !environment.ACTIVATE_REWARDS_TIMESTAMPS || environment.REWARDS_CLAIMABLE_START < this.reloaderService.currentTimestamp;
  }
}
