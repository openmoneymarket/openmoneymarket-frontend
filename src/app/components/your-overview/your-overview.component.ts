import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {BaseClass} from "../base-class";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {CalculationsService} from "../../services/calculations/calculations.service";
import BigNumber from "bignumber.js";
import {StateChangeService} from "../../services/state-change/state-change.service";

@Component({
  selector: 'app-your-overview',
  templateUrl: './your-overview.component.html'
})
export class YourOverviewComponent extends BaseClass implements OnInit {

  @Input() marketOverviewActive!: boolean;
  @Input() ommApyChecked!: boolean;

  userAvgBorrowApy = new BigNumber(0);
  userAvgBorrowWithOmmApy = new BigNumber(0);

  userAvgSupplyApy = new BigNumber(0);
  userAvgSupplyWithOmmApy = new BigNumber(0);

  userTotalBorrowedUSD = new BigNumber(0);
  userTotalSuppliedUSD = new BigNumber(0);

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
    this.userAvgBorrowApy = this.calculationService.getYourBorrowApy(false);
    this.userAvgBorrowWithOmmApy = this.calculationService.getYourBorrowApy(true);
    this.userAvgSupplyApy = this.calculationService.getYourSupplyApy(false);
    this.userAvgSupplyWithOmmApy = this.calculationService.getYourSupplyApy(true);
    this.userTotalBorrowedUSD = this.persistenceService.userTotalBorrowedUSD;
    this.userTotalSuppliedUSD = this.persistenceService.userTotalSuppliedUSD;
    this.cdRef.detectChanges();
  }

  getUserAvgBorrowApy(): BigNumber {
    return this.ommApyChecked ? this.userAvgBorrowWithOmmApy : this.userAvgBorrowApy;
  }

  getUserAvgSupplyApy(): BigNumber {
    return this.ommApyChecked ? this.userAvgSupplyWithOmmApy : this.userAvgSupplyApy;
  }

  avgBorrowAprClass(): string {
    if (this.ommApyChecked) {
      return this.isNegative(this.userAvgBorrowWithOmmApy) ? 'text-purple' : 'text-green';
    } else {
      return this.isNegative(this.userAvgBorrowApy) ? 'text-purple' : 'text-green';
    }
  }

}
