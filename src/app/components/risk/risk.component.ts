import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {PersistenceService} from "../../services/persistence/persistence.service";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {BaseClass} from "../base-class";
import BigNumber from "bignumber.js";
import {Utils} from "../../common/utils";

declare var noUiSlider: any;
declare var wNumb: any;

@Component({
  selector: 'app-risk',
  templateUrl: './risk.component.html',
  styleUrls: ['./risk.component.css'],
})
export class RiskComponent extends BaseClass implements OnInit, AfterViewInit {

  className = "[RiskComponent]";

  @ViewChild("risk") set totalRiskSetter(totalRisk: ElementRef) {this.totalRiskEl = totalRisk.nativeElement; }
  totalRiskEl!: HTMLElement;

  @ViewChild("sliderRisk") set a(sliderRisk: ElementRef) {this.sliderRiskEl = sliderRisk.nativeElement; }
  sliderRiskEl!: any;

  totalRisk = new BigNumber("0");

  userTotalBorrowedUSD = Utils.ZERO;

  constructor(private stateChangeService: StateChangeService,
              public persistenceService: PersistenceService,
              private calculationService: CalculationsService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    this.initSubscribedValues();
  }

  ngAfterViewInit(): void {
    this.initRiskSlider();

    if (this.persistenceService.userLoggedIn()) {
      // re-calculate total risk percentage
      this.calculationService.calculateTotalRisk();
    }
  }

  initSubscribedValues(): void {
    this.subscribeToTotalRiskChange();
    this.subscribeToUserDataReload();
  }

  private subscribeToTotalRiskChange(): void {
    // subscribe to total risk changes
    this.stateChangeService.userTotalRiskChange.subscribe(totalRisk => {
      // log.debug("Total risk change = " + totalRisk);
      this.totalRisk = totalRisk;
      this.updateViewRiskData();
    });
  }

  public subscribeToUserDataReload(): void {
    this.stateChangeService.afterUserDataReload$.subscribe(() => {
      // re-calculate total risk percentage
      this.calculationService.calculateTotalRisk();
      this.userTotalBorrowedUSD = this.persistenceService.userTotalBorrowedUSD;
    });
  }

  userBorrowIsZero(): boolean {
    return this.userTotalBorrowedUSD.eq(0);
  }

  initRiskSlider(): void {
    // Risk slider
    noUiSlider.create(this.sliderRiskEl, {
      start: [0],
      connect: 'lower',
      tooltips: [wNumb({decimals: 0, thousand: ',', suffix: '%'})],
      range: {
        min: [0],
        max: [100]
      },
    });
  }

  updateViewRiskData(): void {
    // Update the risk slider
    this.sliderRiskEl?.noUiSlider.set(this.totalRisk.multipliedBy(new BigNumber("100")).dp(2).toNumber());
  }
}
