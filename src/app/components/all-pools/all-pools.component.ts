import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ActiveLiquidityPoolsView} from "../../models/enums/ActiveViews";
import {PoolData} from "../../models/classes/PoolData";
import {StateChangeService} from "../../services/state-change/state-change.service";
import BigNumber from "bignumber.js";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {environment} from "../../../environments/environment";
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";

@Component({
  selector: 'app-all-pools',
  templateUrl: './all-pools.component.html'
})
export class AllPoolsComponent extends BaseClass implements OnInit {

  @Input() activeLiquidityPoolView!: ActiveLiquidityPoolsView;
  @Input() allPools!: PoolData[];

  @Output() poolClickUpdate = new EventEmitter<PoolData>();

  constructor(private stateChangeService: StateChangeService,
              private calculationService: CalculationsService,
              public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
  }

  onPoolClick(poolData: PoolData): void {
    this.poolClickUpdate.emit(poolData);

    // commit event to state change
    this.stateChangeService.poolClickCUpdate(poolData);
  }



  getDailyRewards(poolData: PoolData): BigNumber {
    return this.calculationService.calculateDailyRewardsForPool(poolData);
  }

  isAllPoolsActive(): boolean {
    return this.activeLiquidityPoolView === ActiveLiquidityPoolsView.ALL_POOLS;
  }

  isProduction(): boolean {
    return environment.production;
  }

}
