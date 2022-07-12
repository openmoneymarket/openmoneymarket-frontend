import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {UserPoolData} from "../../../models/classes/UserPoolData";
import {BaseClass} from "../../base-class";
import {StateChangeService} from "../../../services/state-change/state-change.service";
import {CalculationsService} from "../../../services/calculations/calculations.service";
import {PersistenceService} from "../../../services/persistence/persistence.service";
import {Utils} from "../../../common/utils";
import BigNumber from "bignumber.js";
import {Subscription} from "rxjs";

declare var $: any;

@Component({
  selector: 'app-your-avail-pool-row',
  templateUrl: './your-avail-pool-row.component.html'
})
export class YourAvailPoolRowComponent extends BaseClass implements OnInit, OnDestroy {

  poolEl: any; @ViewChild("pool")set c(c: ElementRef) {this.poolEl = c.nativeElement; }

  @Input() poolData!: UserPoolData;

  @Output() poolClickUpdate = new EventEmitter<UserPoolData>();

  /**
   * Template values
   */
  poolPairClassName = "";
  poolPrettyName = "";
  poolQuoteAssetName = "";
  userAvailableBalance = new BigNumber(0);
  userPoolLiquidityApr = new BigNumber(0);
  userHasLpTokenAvailableOrHasStaked = false;

  collapseYourPoolsTablesSub?: Subscription;

  constructor(private stateChangeService: StateChangeService,
              private calculationService: CalculationsService,
              public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initCoreValues();
    this.initUserValues();
    this.subscribeToCoreDataChange();
    this.subscribeToUserDataChange();
    this.subscribeToCollapseOtherPoolTablesChange();
  }

  ngOnDestroy(): void {
    this.collapseYourPoolsTablesSub?.unsubscribe();
  }

  subscribeToCollapseOtherPoolTablesChange(): void {
    this.collapseYourPoolsTablesSub = this.stateChangeService.collapseYourPoolsTablesChange$.subscribe(activePool => {
      if (activePool && activePool.poolId.isEqualTo(this.poolData.poolId)) {
        this.poolEl.classList.toggle("active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideToggle();
      } else {
        this.removeClass(this.poolEl, "active");
        $(`.pool-${this.poolPairClassName}-expanded`).slideUp();
      }
    });
  }

  subscribeToCoreDataChange(): void {
    this.stateChangeService.afterCoreDataReload$.subscribe(() => {
      this.initCoreValues();
      this.initUserValues();
    });
  }

  subscribeToUserDataChange(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      this.initCoreValues();
      this.initUserValues();
    });
  }

  initCoreValues(): void {
    this.poolPairClassName = this.poolData.pairClassName;
    this.poolPrettyName = this.poolData.prettyName;
    this.poolQuoteAssetName = this.poolData.quoteAssetName;
  }

  initUserValues(): void {
    if (this.userLoggedIn()) {
      this.userAvailableBalance = this.poolData.userAvailableBalance;
      this.userPoolLiquidityApr = this.getUserPoolLiquidityApr(this.poolData);
      this.userHasLpTokenAvailableOrHasStaked = this.persistenceService.getUserPoolStakedAvailableBalance(this.poolData.poolId)
        .isGreaterThan(Utils.ZERO) || this.persistenceService.getUserPoolStakedBalance(this.poolData.poolId).isGreaterThan(Utils.ZERO);
    }
  }

  onPoolClick(poolData: UserPoolData): void {
    this.poolClickUpdate.emit(poolData);
  }

  getUserPoolLiquidityApr(poolData: UserPoolData): BigNumber {
    return this.calculationService.calculateUserPoolLiquidityApr(poolData);
  }

}
