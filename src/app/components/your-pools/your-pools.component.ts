import {Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {ActiveLiquidityPoolsView} from "../../models/enums/ActiveViews";
import {Utils} from "../../common/utils";
import {UserPoolData} from "../../models/classes/UserPoolData";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {YourPoolRowComponent} from "./your-pool-row/your-pool-row.component";

declare var $: any;

@Component({
  selector: 'app-your-pools',
  templateUrl: './your-pools.component.html'
})
export class YourPoolsComponent extends BaseClass implements OnInit {

  // Asset children components
  @ViewChildren('pool') yourPoolRowComponents!: QueryList<YourPoolRowComponent>;

  @Input() activeLiquidityPoolView!: ActiveLiquidityPoolsView;

  @Output() poolClickUpdate = new EventEmitter<UserPoolData>();

  constructor(private stateChangeService: StateChangeService,
              public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
  }

  onPoolClick(poolData: UserPoolData): void {
    this.poolClickUpdate.emit(poolData);

    // commit event to state change
    this.stateChangeService.poolClickCUpdate(poolData);
  }

  userHasStakedOrAvailableToAnyPool(): boolean {
    for (const poolData of this.getUserPoolsData()) {
      if (poolData.userStakedBalance.isGreaterThan(Utils.ZERO) || poolData.userAvailableBalance.isGreaterThan(Utils.ZERO)) {
        return true;
      }
    }

    return false;
  }

  userHasStakedAnyPool(): boolean {
    for (const poolData of this.getUserPoolsData()) {
      if (poolData.userStakedBalance.isGreaterThan(Utils.ZERO)) {
        return true;
      }
    }

    return false;
  }

  userHasStakedToPool(poolData: UserPoolData): boolean {
    return poolData.userStakedBalance.isGreaterThan(Utils.ZERO);
  }
  userHasAvailableStakeToPool(poolData: UserPoolData): boolean {
    return poolData.userAvailableBalance.isGreaterThan(Utils.ZERO);
  }

  getUserPoolsAvailableData(): UserPoolData[] {
    return this.persistenceService.userPools?.filter(pool => pool.userAvailableBalance.isGreaterThan(Utils.ZERO)
      && pool.userStakedBalance.isZero());
  }

  shouldHideYourPoolsHeader(): boolean {
    return this.isAllPoolsActive() || !this.userHasStakedAnyPool();
  }

  getUserStakedPoolsData(): UserPoolData[] {
    return this.persistenceService.userPools?.filter(pool => pool.userStakedBalance.isGreaterThan(Utils.ZERO));
  }

  getUserPoolsData(): UserPoolData[] {
    return this.persistenceService.userPools ?? [];
  }

  isAllPoolsActive(): boolean {
    return this.activeLiquidityPoolView === ActiveLiquidityPoolsView.ALL_POOLS;
  }

}
