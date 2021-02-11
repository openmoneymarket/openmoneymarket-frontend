import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalType} from "../../models/ModalType";
import {ModalService} from "../../services/modal/modal.service";
import {UserReserveData} from "../../models/UserReserveData";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {AssetTag} from "../../models/Asset";
import {BaseClass} from "../base-class";
import {CalculationsService} from "../../services/calculations/calculations.service";
import {PersistenceService} from "../../services/persistence/persistence.service";

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.css']
})
export class PerformanceComponent extends BaseClass implements OnInit {

  @ViewChild('suppInterest', { static: true }) supplyInterestEl!: ElementRef;
  @ViewChild('borrInterest', { static: true }) borrowInterestEl!: ElementRef;

  supplyInterest = 0;
  borrowInterest = 0;
  ommRewards = 0;

  constructor(private modalService: ModalService,
              private stateChangeService: StateChangeService,
              private calculationService: CalculationsService,
              public persistenceService: PersistenceService) {
    super(persistenceService);
  }

  ngOnInit(): void {
    // handle users assets reserve changes
    this.subscribeToUserAssetReserveChange();
  }

  public subscribeToUserAssetReserveChange(): void {
    Object.values(AssetTag).forEach(assetTag => {
      this.stateChangeService.userReserveChangeMap.get(assetTag)!.subscribe((reserve: UserReserveData) => {
        // update performance values
        this.updatePerformanceValues();
      });
    });
  }

  updatePerformanceValues(): void {
    this.updateSupplyInterest();
    this.updateBorrowInterest();
    this.updateOmmRewards();
  }

  updateSupplyInterest(): void {
    this.supplyInterest = this.calculationService.calculateUsersSupplyInterestPerDayUSD();
  }

  updateBorrowInterest(): void {
    this.borrowInterest = this.calculationService.calculateUsersBorrowInterestPerDayUSD();
  }

  updateOmmRewards(): void {
    this.ommRewards = this.calculationService.calculateUserTotalOmmRewards();
  }

  onClaimOmmRewardsClick(): void {
    this.modalService.showNewModal(ModalType.CLAIM_OMM_REWARDS);
  }

}
