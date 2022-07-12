import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {ModalType} from "../../models/enums/ModalType";
import {ModalAction} from "../../models/classes/ModalAction";
import log from "loglevel";
import {AssetAction} from "../../models/classes/AssetAction";
import {StakingAction} from "../../models/classes/StakingAction";
import {VoteAction} from "../../models/classes/VoteAction";
import {GovernanceAction} from "../../models/classes/GovernanceAction";
import {LockingAction} from "../../models/classes/LockingAction";
import {ManageStakedIcxAction} from "../../models/classes/ManageStakedIcxAction";

declare var classie: any;
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private activeModalChange: Subject<ModalAction> = new Subject<ModalAction>();
  activeModalChange$ = this.activeModalChange.asObservable();

  public activeModal?: HTMLElement;

  constructor() { }

  showNewModal(modal: ModalType, assetAction?: AssetAction, stakingAction?: StakingAction, voteAction?: VoteAction,
               governanceAction?: GovernanceAction, lockingOmmAction?: LockingAction, manageStakedIcxAction?: ManageStakedIcxAction): void {
    this.activeModalChange.next(new ModalAction(modal, assetAction, stakingAction, voteAction, governanceAction,
      lockingOmmAction, manageStakedIcxAction));
  }

  hideActiveModal(): void {
    log.debug("hideActiveModal activeModal=", this.activeModal);
    if (this.activeModal) {
      classie.remove( this.activeModal, 'modal-show' );

      if (classie.has(this.activeModal, 'md-setperspective')) {
        classie.remove(document.documentElement, 'md-perspective');
      }
      this.activeModal = undefined;

      $(".modal-overlay").css({opacity: 0, visibility: "hidden"});
    }
  }

  showModal(modal?: HTMLElement): void {
    if (modal) {
      classie.add(modal, 'modal-show');
      $(".modal-overlay").css({opacity: 1, visibility: "visible"});
      this.activeModal = modal;
    }
  }
}
