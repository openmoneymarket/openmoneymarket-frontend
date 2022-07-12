import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {PersistenceService} from "../../services/persistence/persistence.service";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {BaseClass} from "../base-class";
import BigNumber from "bignumber.js";
import {StateChangeService} from "../../services/state-change/state-change.service";

@Component({
  selector: 'app-market-overview',
  templateUrl: './market-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketOverviewComponent extends BaseClass implements OnInit {

  @Input() marketOverviewActive!: boolean;
  @Input() ommApyChecked!: boolean;

  totalAvgBorrowApy = new BigNumber(0);
  totalAvgBorrowWithOmmApy = new BigNumber(0);

  totalAvgSupplyApy = new BigNumber(0);
  totalAvgSupplyWithOmmApy = new BigNumber(0);

  totalBorrowedUSD = new BigNumber(0);
  totalSuppliedUSD = new BigNumber(0);

  constructor(public persistenceService: PersistenceService,
              public calculationService: CalculationsService,
              private stateChangeService: StateChangeService,
              private cdRef: ChangeDetectorRef) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initStaticValues();
    this.registerSubscriptions();
  }

  registerSubscriptions(): void {
    this.subscribeToUserDataReload();
    this.subscribeToCoreDataReload();
  }

  public subscribeToUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
        this.initStaticValues();
    });
  }

  public subscribeToCoreDataReload(): void {
    this.stateChangeService.afterCoreDataReload$.subscribe(() => {
      this.initStaticValues();
    });
  }


  initStaticValues(): void {
    this.totalAvgBorrowApy = this.calculationService.getTotalAvgBorrowApy(false);
    this.totalAvgBorrowWithOmmApy = this.calculationService.getTotalAvgBorrowApy(true);
    this.totalAvgSupplyApy = this.calculationService.getTotalAvgSupplyApy(false);
    this.totalAvgSupplyWithOmmApy = this.calculationService.getTotalAvgSupplyApy(true);
    this.totalBorrowedUSD = this.persistenceService.totalBorrowedUSD;
    this.totalSuppliedUSD = this.persistenceService.totalSuppliedUSD;
    this.cdRef.detectChanges();
  }

  getTotalAvgBorrowApy(): BigNumber {
    return this.ommApyChecked ? this.totalAvgBorrowWithOmmApy : this.totalAvgBorrowApy;
  }

  getTotalAvgSupplyApy(): BigNumber {
    return this.ommApyChecked ? this.totalAvgSupplyWithOmmApy : this.totalAvgSupplyApy;
  }

  avgBorrowAprClass(): string {
    if (this.ommApyChecked) {
      return this.isNegative(this.totalAvgBorrowWithOmmApy) ? 'text-purple' : 'text-green';
    } else {
      return this.isNegative(this.totalAvgBorrowApy) ? 'text-purple' : 'text-green';
    }
  }

}
