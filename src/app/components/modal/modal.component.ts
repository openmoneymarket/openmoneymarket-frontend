import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ModalService} from "../../services/modal/modal.service";
import {Subscription} from "rxjs";
import {ModalType} from "../../models/ModalType";
import {IconexApiService} from "../../services/iconex-api/iconex-api.service";
import {BridgeWidgetService} from "../../services/bridge-widget/bridge-widget.service";
import {ModalAction} from "../../models/ModalAction";
import {BaseClass} from "../base-class";
import {BORROW, REPAY, SUPPLY, WITHDRAW} from "../../common/constants";
import {SupplyService} from "../../services/supply/supply.service";
import {WithdrawService} from "../../services/withdraw/withdraw.service";
import {BorrowService} from "../../services/borrow/borrow.service";
import {RepayService} from "../../services/repay/repay.service";
import {OmmError} from "../../core/errors/OmmError";
import {LocalStorageService} from "../../services/local-storage/local-storage.service";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {NotificationService} from "../../services/notification/notification.service";
import {AssetTag} from "../../models/Asset";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {LedgerService} from "../../services/ledger/ledger.service";
import {DataLoaderService} from "../../services/data-loader/data-loader.service";
import {LedgerWallet} from "../../models/wallets/LedgerWallet";
import log from "loglevel";
import {TransactionDispatcherService} from "../../services/transaction-dispatcher/transaction-dispatcher.service";
import {OmmService} from "../../services/omm/omm.service";


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent extends BaseClass implements OnInit {

  @ViewChild('signInModal', { static: true }) signInModal!: ElementRef;
  @ViewChild('stakeOmm', { static: true }) stakeOmmTokensModal!: ElementRef;
  @ViewChild('unstakeOmm', { static: true }) unstakeOmmTokensModal!: ElementRef;
  @ViewChild('addPrep', { static: true }) addPrepModal!: ElementRef;
  @ViewChild('rmvPrep', { static: true }) removePrepModal!: ElementRef;
  @ViewChild('assetActionModal', { static: true }) assetActionModal!: ElementRef;
  @ViewChild('iconWithdrawModal', { static: true }) iconWithdrawModal!: ElementRef;
  @ViewChild('claimOmmRewardsModal', { static: true }) claimOmmRewardsModal!: ElementRef;


  activeModalSubscription: Subscription;
  activeModal?: HTMLElement;
  activeModalChange?: ModalAction;

  withdrawOption = "unstake";

  constructor(private modalService: ModalService,
              private iconexApiService: IconexApiService,
              private bridgeWidgetService: BridgeWidgetService,
              private supplyService: SupplyService,
              private withdrawService: WithdrawService,
              private borrowService: BorrowService,
              private repayService: RepayService,
              private localStorageService: LocalStorageService,
              private stateChangeService: StateChangeService,
              private notificationService: NotificationService,
              public persistenceService: PersistenceService,
              private ledgerService: LedgerService,
              private dataLoaderService: DataLoaderService,
              private transactionDispatcherService: TransactionDispatcherService,
              private ommService: OmmService) {
    super(persistenceService);

    this.activeModalSubscription = this.modalService.activeModalChange$.subscribe((activeModalChange: ModalAction) => {
      switch (activeModalChange.modalType) {
        case ModalType.SIGN_IN:
          this.setActiveModal(this.signInModal.nativeElement, activeModalChange);
          break;
        case ModalType.CLAIM_OMM_REWARDS:
          this.setActiveModal(this.claimOmmRewardsModal.nativeElement, activeModalChange);
          break;
        case ModalType.STAKE_OMM_TOKENS:
          this.setActiveModal(this.stakeOmmTokensModal.nativeElement, activeModalChange);
          break;
        case ModalType.UNSTAKE_OMM_TOKENS:
          this.setActiveModal(this.unstakeOmmTokensModal.nativeElement, activeModalChange);
          break;
        case ModalType.ADD_PREP_SELECTION:
          this.setActiveModal(this.addPrepModal.nativeElement, activeModalChange);
          break;
        case ModalType.REMOVE_PREP_SELECTION:
          this.setActiveModal(this.removePrepModal.nativeElement, activeModalChange);
          break;
        default:
          // check if it is ICX withdraw action and show corresponding specific view / modal
          if (this.isIcxWithdraw(activeModalChange)) {
            this.setActiveModal(this.iconWithdrawModal.nativeElement, activeModalChange);
          } else {
            this.setActiveModal(this.assetActionModal.nativeElement, activeModalChange);
          }
      }

      this.modalService.showModal(this.activeModal);
    });
  }

  ngOnInit(): void {
  }

  private setActiveModal(htmlElement: any, activeModalChange: ModalAction): void {
    this.activeModal = htmlElement;
    this.activeModalChange = activeModalChange;
  }

  onSignInIconexClick(): void {
    this.modalService.hideActiveModal();
    this.iconexApiService.hasAccount();
  }

  onSignInBridgeClick(): void {
    this.modalService.hideActiveModal();
    this.bridgeWidgetService.openBridgeWidget();
  }

  onSignInLedgerClick(): void {
    this.modalService.hideActiveModal();
    this.ledgerService.signIn().then(res => {
      this.dataLoaderService.walletLogin(new LedgerWallet(res!.address));
    }).catch(e => {
      log.error(e);
      this.notificationService.showNewNotification("Can not connect to Ledger device. Make sure it is connected and try again.");
    });
  }

  onClaimOmmRewardsClick(): void {
    // store asset-user action in local storage
    this.localStorageService.persistModalAction(this.activeModalChange!);

    // hide current modal
    this.modalService.hideActiveModal();

    this.transactionDispatcherService.dispatchTransaction(this.ommService.BuildClaimOmmRewardsTx(), "Claiming Omm Tokens...");
  }

  onCancelClick(): void {
    this.modalService.hideActiveModal();
  }

  riskGreaterThanZero(): boolean {
    if (this.activeModalChange?.assetAction?.risk) {
      return this.activeModalChange.assetAction.risk > 0
    } else {
      return false;
    }
  }

  isIcxWithdraw(activeModalChange: ModalAction): boolean {
    return activeModalChange.modalType === ModalType.WITHDRAW && activeModalChange.assetAction?.asset.tag === AssetTag.ICX;
  }

  isBorrow(): boolean {
    return this.activeModalChange?.modalType === ModalType.BORROW;
  }

  isIconSupply(): boolean {
    return this.activeModalChange?.modalType === ModalType.SUPPLY && this.activeModalChange.assetAction?.asset.tag === AssetTag.ICX;
  }

  isWithdrawIcxModal(): boolean {
    return this.activeModalChange?.modalType === ModalType.WITHDRAW && this.activeModalChange.assetAction?.asset.tag === AssetTag.ICX;
  }

  getModalActionName(): string {
    switch (this.activeModalChange?.modalType) {
      case ModalType.BORROW:
        return BORROW;
      case ModalType.SUPPLY:
        return SUPPLY;
      case ModalType.REPAY:
        return REPAY;
      case ModalType.WITHDRAW:
        return WITHDRAW;
      default:
        return "";
    }
  }

  getBeforeAfterDiff(): number {
    return Math.abs((this.activeModalChange?.assetAction?.before ?? 0) -
      (this.activeModalChange?.assetAction?.after ?? 0));
  }

  onAssetModalActionClick(): void {
    // store asset-user action in local storage
    this.localStorageService.persistModalAction(this.activeModalChange!);

    const assetTag = this.activeModalChange!.assetAction!.asset.tag;
    switch (this.activeModalChange?.modalType) {
      case ModalType.BORROW:
        this.borrowService.borrowAsset(this.activeModalChange!.assetAction!.amount, assetTag, `Borrowing ${assetTag}...`);
        break;
      case ModalType.SUPPLY:
        this.supplyService.supplyAsset(this.activeModalChange!.assetAction!.amount, assetTag, `Supplying ${assetTag}...`);
        break;
      case ModalType.REPAY:
        this.repayService.repayAsset(this.activeModalChange!.assetAction!.amount, assetTag, `Repaying ${assetTag}...`);
        break;
      case ModalType.WITHDRAW:
        this.withdrawService.withdrawAsset(this.activeModalChange!.assetAction!.amount, assetTag, this.waitForUnstakingIcx(),
          `Withdrawing ${assetTag}...`);
        break;
      default:
        throw new OmmError(`Invalid modal type: ${this.activeModalChange?.modalType}`);

        // TODO!!!
        // <!-- Notification: Votes processing -->
      //   <div class="panel notification">
      //     <p>Allocating votes...</p>
      // </div>
      //
      // <!-- Notification: Votes succeded -->
      // <div class="panel notification">
      //   <p>Votes allocated.</p>
      // </div>
      //
      // <!-- Notification: Votes failed -->
      // <div class="panel notification">
      //   <p>Couldn't allocate your votes. Try again.</p>
      // </div>
      //
      // <!-- Notification: Stake processing -->
      // <div class="panel notification">
      //   <p>Staking Omm Tokens...</p>
      // </div>
      //
      // <!-- Notification: Stake succeded -->
      // <div class="panel notification">
      //   <p>50 OMM staked.</p>
      // </div>
      //
      // <!-- Notification: Stake failed -->
      // <div class="panel notification">
      //   <p>Couldn't stake Omm Tokens. Try again.</p>
      // </div>
      //
      // <!-- Notification: Unstaking processing -->
      // <div class="panel notification">
      //   <p>Starting unstaking process...</p>
      // </div>
      //
      // <!-- Notification: Unstaking succeded -->
      // <div class="panel notification">
      //   <p>50 OMM unstaking.</p>
      // </div>
      //
      // <!-- Notification: Unstaking failed -->
      // <div class="panel notification">
      //   <p>Couldn't unstake Omm Tokens. Try again.</p>
      // </div>
    }

    // commit modal action change
    this.stateChangeService.updateUserModalAction(this.activeModalChange);

    // hide current modal
    this.modalService.hideActiveModal();
  }

  private waitForUnstakingIcx(): boolean {
    const waitForUnstaking = this.withdrawOption === "unstake";
    log.debug(`waitForUnstaking = ${waitForUnstaking}`);

    return waitForUnstaking;
  }

}
