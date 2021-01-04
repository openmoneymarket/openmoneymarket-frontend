import {AfterViewInit, Component, OnInit} from '@angular/core';
import {RiskData} from "../../models/RiskData";
import {percentageFormat} from "../../common/formats";
import {Subject} from "rxjs";
import {Reserve} from "../../interfaces/reserve";
import {AssetTag} from "../../models/Asset";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {StateChangeService} from "../../services/state-change/state-change.service";
import log from "loglevel";
import {CalculationsService} from "../../services/calculations/calculations.service";

declare var noUiSlider: any;
declare var wNumb: any;
declare var $: any;

@Component({
  selector: 'app-risk',
  templateUrl: './risk.component.html',
  styleUrls: ['./risk.component.css']
})
export class RiskComponent implements OnInit, AfterViewInit {

  private sliderRisk?: any;
  // private totalRisk = 0;

  constructor(private stateChangeService: StateChangeService,
              private persistenceService: PersistenceService,
              private calculationService: CalculationsService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Risk slider
    this.sliderRisk = document.getElementById('slider-risk');
    noUiSlider.create(this.sliderRisk, {
      start: [0],
      connect: 'lower',
      tooltips: [wNumb({decimals: 0, thousand: ',', suffix: '%'})],
      range: {
        min: [0],
        max: [100]
      },
    });
  }

  initSubscribedValues(): void {
    // subscribe to total risk changes
    // this.stateChangeService.userTotalRiskChange.subscribe(totalRisk => {
    //   log.debug("Total risk change = " + totalRisk);
    //   this.totalRisk = totalRisk;
    //   this.updateRiskData(new RiskData(totalRisk));
    // });
  }

  updateRiskData(riskData?: RiskData): void {
    const riskTotal = riskData ? riskData.riskTotal : this.calculationService.calculateValueRiskTotal();

    // Update the risk percentage
    $('.value-risk-total').text(percentageFormat.to(riskTotal));

    // Update the risk slider
    this.sliderRisk.noUiSlider.set(riskTotal);

    // Change text to red if over 100
    if (riskTotal > 100) {
      // Hide supply actions
      $('.supply-actions.actions-2').css("display", "none");
    }

    // Change text to red if over 75
    if (riskTotal > 75) {
      $('.value-risk-total').addClass("alert");
    }
    // Change text to normal if under 75
    if (riskTotal < 75) {
      $('.value-risk-total').removeClass("alert");
    }

  }

  hideRiskData(): void {
    // show risk data
    $('.risk-container').css("display", "none");
  }

  showRiskData(): void {
    // show risk data
    $('.risk-container').css("display", "block");
  }

  showRiskMessage(): void {
    // Hide risk message
    $('.risk-message-noassets').css("display", "block");
  }

  hideRiskMessage(): void {
    // Hide risk message
    $('.risk-message-noassets').css("display", "none");
  }


}