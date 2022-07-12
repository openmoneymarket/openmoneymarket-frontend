import {Injectable} from '@angular/core';
import {IconApiService} from '../icon-api/icon-api.service';
import {IconJsonRpcResponse} from '../../interfaces/icon-json-rpc-response';
import {DataLoaderService} from "../data-loader/data-loader.service";
import log from "loglevel";
import {NotificationService} from "../notification/notification.service";
import {LocalStorageService} from "../local-storage/local-storage.service";
import {ModalAction, ModalActionsResult, ModalStatus} from "../../models/classes/ModalAction";
import {ModalType} from "../../models/enums/ModalType";
import {StateChangeService} from "../state-change/state-change.service";
import {Utils} from "../../common/utils";
import {BORROW_MAX_ERROR_REGEX} from "../../common/constants";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class TransactionResultService {

  constructor(private iconApiService: IconApiService,
              private dataLoaderService: DataLoaderService,
              private notificationService: NotificationService,
              private localStorageService: LocalStorageService,
              private stateChangeService: StateChangeService,
              private router: Router) {
    window.addEventListener("bri.tx.result", (e) => this.processBridgeTransactionResult(e));
  }

  public processIconexTransactionResult(payload: IconJsonRpcResponse, maxRetry: number = 5): void {
    // get last modal action from localstorage
    const modalAction: ModalAction = this.localStorageService.getLastModalAction()!!;

    if (payload.result) {
      this.iconApiService.getTxResult(payload.result).then(res => {
        // reload all reserves and user specific data (reserve, account data, ..)
        this.dataLoaderService.afterUserActionReload();

        // success
        if (res.status === 1) {
          // show proper success notification
          this.showSuccessActionNotification(modalAction);
        } else {
          // show proper failed notification
          this.showFailedActionNotification(Utils.extractTxFailureMessage(res), modalAction);
          log.debug("Transaction failed! Details: ", res);
        }
      }).catch(e => {
        if (maxRetry > 0) {
          setTimeout( () => this.processIconexTransactionResult(payload, maxRetry - 1), 2200);
        } else {
          log.debug("Error in isTxConfirmed:", e);
          this.showFailedActionNotification("Failed to confirm the transaction.", modalAction);
          // reload all reserves and user specific data (reserve, account data, ..)
          this.dataLoaderService.afterUserActionReload();
        }
      });
    } else  {
      // reload all reserves and user specific data (reserve, account data, ..)
      this.dataLoaderService.afterUserActionReload();

      log.error(`ICON RPC ERROR details:`);
      log.error(payload);
      this.showFailedActionNotification(payload?.error?.message ?? "", modalAction);
    }
  }

  processIconTransactionResult(txHash: string, maxRetry: number = 5): void {
    // get last modal action from localstorage
    const modalAction: ModalAction = this.localStorageService.getLastModalAction()!!;

    this.iconApiService.getTxResult(txHash).then((res: any) => {
      // reload all reserves and user specific data (reserve, account data, ..)
      this.dataLoaderService.afterUserActionReload();

      // success
      if (res.status === 1) {
        // show proper success notification
        this.showSuccessActionNotification(modalAction);
      } else {
        // show proper failed notification
        this.showFailedActionNotification(Utils.extractTxFailureMessage(res), modalAction);
        log.debug("Transaction failed! Details: ", res);
      }
    }).catch(e => {
      if (maxRetry > 0) {
        setTimeout(() => this.processIconTransactionResult(txHash, maxRetry - 1), 2200);
      } else {
        // reload all reserves and user specific data (reserve, account data, ..)
        this.dataLoaderService.afterUserActionReload();

        log.debug("Error in isTxConfirmed:", e);
        this.showFailedActionNotification("Failed to confirm the transaction.", modalAction);
      }
    });
  }

  public processBridgeTransactionResult(event: any): void {
    const { error, status } = event.detail;

    // reload all reserves and user specific data (reserve, account data, ..)
    this.dataLoaderService.afterUserActionReload();

    // get last modal action from localstorage
    const modalAction: ModalAction = this.localStorageService.getLastModalAction()!!;

    // success
    if (status === 1) {
      // show proper success notification
      this.showSuccessActionNotification(modalAction);
    }
    else {
      log.debug("Bridge: transaction failed, details:", error);
      // show proper failed notification
      this.showFailedActionNotification("Error occurred in Bridge. Details: " + error ?? "", modalAction);
    }
  }

  public showSuccessActionNotification(modalAction: ModalAction): void {
    this.stateChangeService.userModalActionResult.next(new ModalActionsResult(modalAction, ModalStatus.SUCCESS));

    if (modalAction.assetAction && modalAction.modalType !== ModalType.CLAIM_AND_APPLY_BOMM_BOOST
      && modalAction.modalType !== ModalType.APPLY_BOMM_BOOST) {
      const assetAction = modalAction.assetAction;
      assetAction.amount = assetAction.amount.dp(2);

      switch (modalAction.modalType) {
        case ModalType.SUPPLY:
          this.notificationService.showNewNotification(`${assetAction.amount} ${assetAction.asset.tag} supplied.`);
          break;
        case ModalType.WITHDRAW:
          this.notificationService.showNewNotification(`${assetAction.amount} ${assetAction.asset.tag} withdrawn.`);
          break;
        case ModalType.BORROW:
          this.notificationService.showNewNotification(`${assetAction.amount} ${assetAction.asset.tag} borrowed.`);
          break;
        case ModalType.REPAY:
          this.notificationService.showNewNotification(`${assetAction.amount} ${assetAction.asset.tag} repaid.`);
          break;
        case ModalType.CLAIM_ICX:
          this.notificationService.showNewNotification(`${assetAction.amount} ICX claimed.`);
          break;
        case ModalType.CLAIM_OMM_REWARDS:
          this.notificationService.showNewNotification(`${assetAction.amount} Omm Tokens claimed.`);
          break;
        case ModalType.WITHDRAW_LOCKED_OMM:
          this.notificationService.showNewNotification(`Withdrew ${assetAction.amount} OMM.`);
          break;
      }
    } else if (modalAction.stakingAction) {
      const stakingAction = modalAction.stakingAction;
      stakingAction.amount = stakingAction.amount.dp(2);

      switch (modalAction.modalType) {
        case ModalType.UNSTAKE_OMM_TOKENS:
          this.notificationService.showNewNotification(`${stakingAction.amount} OMM unstaking.`);
          break;
        case ModalType.POOL_STAKE:
          this.notificationService.showNewNotification(`${stakingAction.amount} LP tokens staked.`);
          break;
        case ModalType.POOL_UNSTAKE:
          this.notificationService.showNewNotification(`${stakingAction.amount}  LP tokens unstaked.`);
          break;
      }
    } else if (modalAction.voteAction) {
      switch (modalAction.modalType) {
        case ModalType.UPDATE_PREP_SELECTION:
          this.notificationService.showNewNotification(`Votes allocated.`);
          break;
        case ModalType.REMOVE_ALL_VOTES:
          this.notificationService.showNewNotification(`Votes removed.`);
          break;
      }
    } else if (modalAction.governanceAction) {
      switch (modalAction.modalType) {
        case ModalType.SUBMIT_PROPOSAL:
          this.router.navigate(['/vote']);
          this.notificationService.showNewNotification("Proposal submitted.");
          break;
        case ModalType.CAST_VOTE:
          this.notificationService.showNewNotification("Vote cast.");
          break;
      }
    } else if (modalAction.lockingOmmAction) {
      const lockingAction = modalAction.lockingOmmAction;

      switch (modalAction.modalType) {
        case ModalType.LOCK_OMM:
          this.notificationService.showNewNotification(`${lockingAction.amount} OMM locked until ${
            Utils.timestampInMillisecondsToPrettyDate(lockingAction.lockingTime)}`);
          break;
        case ModalType.INCREASE_LOCK_TIME:
          this.notificationService.showNewNotification(
            `OMM locked until ${Utils.timestampInMillisecondsToPrettyDate(lockingAction.lockingTime)}`);
          break;
        case ModalType.INCREASE_LOCK_OMM:
          this.notificationService.showNewNotification(`${lockingAction.amount} OMM locked until ${
            Utils.timestampInMillisecondsToPrettyDate(lockingAction.lockingTime)}`);
          break;
        case ModalType.INCREASE_LOCK_TIME_AND_AMOUNT:
          this.notificationService.showNewNotification(
            `${lockingAction.amount} OMM locked until ${Utils.timestampInMillisecondsToPrettyDate(lockingAction.lockingTime)}`);
          break;
      }

      // emit event indicating that locked action succeeded
      this.stateChangeService.lockedOmmActionSucceededUpdate(true);

    } else if (modalAction.manageStakedIcxAction) {
      const mngStkIcxAction = modalAction.manageStakedIcxAction;
      if (ModalType.MANAGE_STAKED_OMM === modalAction.modalType) {
        this.notificationService.showNewNotification(`${mngStkIcxAction.amount} OMM locked until ${
          Utils.timestampInMillisecondsToPrettyDate(mngStkIcxAction.lockingTime)}`);
      } else if (ModalType.UNSTAKE_OMM_TOKENS === modalAction.modalType) {
        this.notificationService.showNewNotification(`${mngStkIcxAction.amount} OMM unstaking.`);
      }
    } else if (modalAction.modalType === ModalType.CLAIM_AND_APPLY_BOMM_BOOST) {
      const ommClaimed = modalAction.assetAction?.details?.ommRewards?.total ?? 0;
      this.notificationService.showNewNotification(`Claimed ${
        Utils.tooUSLocaleString(Utils.roundDownTo2Decimals(ommClaimed))} Omm Tokens. ` + "\n" + "bOMM boost applied.");
    } else if (modalAction.modalType !== ModalType.APPLY_BOMM_BOOST) {
      this.notificationService.showNewNotification("bOMM boost applied.");
    }
  }

  public showFailedActionNotification(failedTxMessage: string, modalAction?: ModalAction): void {
    if (!modalAction) {
      return;
    }

    // handle Borrow max error
    if ((BORROW_MAX_ERROR_REGEX).test(failedTxMessage.toLowerCase())) {
      this.notificationService.showNewNotification(`This market has less than 10% liquidity. Borrow a smaller amount or try again later.`);
      return;
    }

    this.stateChangeService.userModalActionResult.next(new ModalActionsResult(modalAction, ModalStatus.FAILED));

    if (modalAction.assetAction && ModalType.CLAIM_AND_APPLY_BOMM_BOOST !== modalAction.modalType
      && ModalType.APPLY_BOMM_BOOST !== modalAction.modalType) {
      const assetAction = modalAction.assetAction;
      switch (modalAction.modalType) {
        case ModalType.SUPPLY:
          this.notificationService.showNewNotification(`Couldn't supply ${assetAction.asset.tag}. ${failedTxMessage} Try again.`);
          break;
        case ModalType.WITHDRAW:
          this.notificationService.showNewNotification(`Couldn't withdraw ${assetAction.asset.tag}. ${failedTxMessage} Try again.`);
          break;
        case ModalType.BORROW:
          this.notificationService.showNewNotification(`Couldn't borrow ${assetAction.asset.tag}. ${failedTxMessage} Try again.`);
          break;
        case ModalType.REPAY:
          this.notificationService.showNewNotification(`Couldn't repay ${assetAction.asset.tag}. ${failedTxMessage} Try again.`);
          break;
        case ModalType.CLAIM_ICX:
          this.notificationService.showNewNotification(`Couldn't claim ICX. ${failedTxMessage} Try again.`);
          break;
        case ModalType.CLAIM_OMM_REWARDS:
          this.notificationService.showNewNotification(`Couldn't claim Omm Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.WITHDRAW_LOCKED_OMM:
          this.notificationService.showNewNotification(`Couldn't withdraw locked OMM. ${failedTxMessage} Try again.`);
          break;
      }
    } else if (modalAction.modalType === ModalType.CLAIM_AND_APPLY_BOMM_BOOST) {
      this.notificationService.showNewNotification(`Couldn't claim Omm Tokens and apply boost.`);
    } else if (ModalType.APPLY_BOMM_BOOST === modalAction.modalType) {
      this.notificationService.showNewNotification("Couldn't apply boost.");
    } else if (modalAction.stakingAction) {
      switch (modalAction.modalType) {
        case ModalType.UNSTAKE_OMM_TOKENS:
          this.notificationService.showNewNotification(`Couldn't unstake Omm Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.POOL_STAKE:
          this.notificationService.showNewNotification(`Couldn't stake LP Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.POOL_UNSTAKE:
          this.notificationService.showNewNotification(`Couldn't unstake LP Tokens. ${failedTxMessage} Try again.`);
          break;
      }
    } else if (modalAction.voteAction) {
      switch (modalAction.modalType) {
        case ModalType.UPDATE_PREP_SELECTION:
          this.notificationService.showNewNotification(`Couldn't allocate your votes. ${failedTxMessage} Try again.`);
          break;
        case ModalType.REMOVE_ALL_VOTES:
          this.notificationService.showNewNotification(`Couldn't remove your votes. ${failedTxMessage} Try again.`);
          break;
      }
    } else if (modalAction.governanceAction) {
      switch (modalAction.modalType) {
        case ModalType.SUBMIT_PROPOSAL:
          this.notificationService.showNewNotification(`Couldn't submit proposal. ${failedTxMessage} Try again.`);
          break;
        case ModalType.CAST_VOTE:
          this.notificationService.showNewNotification(`Couldn't cast vote. ${failedTxMessage} Try again.`);
          break;
      }
    } else if (modalAction.lockingOmmAction) {
      switch (modalAction.modalType) {
        case ModalType.LOCK_OMM:
          this.notificationService.showNewNotification(`Couldn't lock Omm Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.INCREASE_LOCK_TIME:
          this.notificationService.showNewNotification(
            `Couldn't increase lock period of Omm Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.INCREASE_LOCK_OMM:
          this.notificationService.showNewNotification(`Couldn't increase locked Omm Tokens. ${failedTxMessage} Try again.`);
          break;
        case ModalType.INCREASE_LOCK_TIME_AND_AMOUNT:
          this.notificationService.showNewNotification(
            `Couldn't increase locked Omm Tokens and lock period. ${failedTxMessage} Try again.`);
          break;
      }

      // emit event indicating that locked action succeeded
      this.stateChangeService.lockedOmmActionSucceededUpdate(false);
    } else if (modalAction.manageStakedIcxAction) {
      if (ModalType.MANAGE_STAKED_OMM === modalAction.modalType) {
        this.notificationService.showNewNotification(`Couldn’t lock up staked OMM.`);
      } else if (ModalType.UNSTAKE_OMM_TOKENS === modalAction.modalType) {
        this.notificationService.showNewNotification(`Couldn't unstake Omm Tokens.`);
      }
    }

  }
}
