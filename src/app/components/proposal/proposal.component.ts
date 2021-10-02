import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Proposal} from "../../models/Proposal";
import {ProposalService} from "../../services/proposal/proposal.service";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {BaseClass} from "../base-class";
import {ModalService} from "../../services/modal/modal.service";
import {ModalType} from "../../models/ModalType";
import {GovernanceAction} from "../../models/GovernanceAction";
import {ReloaderService} from "../../services/reloader/reloader.service";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {LocalStorageService} from "../../services/local-storage/local-storage.service";
import {Vote} from "../../models/Vote";
import {ScoreService} from "../../services/score/score.service";
import log from "loglevel";
import {ModalStatus} from "../../models/ModalAction";
import BigNumber from "bignumber.js";

@Component({
  selector: 'app-proposal',
  templateUrl: './proposal.component.html'
})
export class ProposalComponent extends BaseClass implements OnInit, AfterViewInit {

  activeProposal: Proposal | undefined = this.proposalService.getSelectedProposal() ? this.proposalService.getSelectedProposal()
    : this.localstorageService.getActiveProposal();
  userVote?: Vote;

  constructor(private proposalService: ProposalService,
              private modalService: ModalService,
              public persistenceService: PersistenceService,
              public reloaderService: ReloaderService,
              private stateChangeService: StateChangeService,
              private localstorageService: LocalStorageService,
              private scoreService: ScoreService) {
      super(persistenceService);
  }

  ngOnInit(): void {
    this.subscribeToSelectedProposalChange();
    this.subscribeToModalActionResult();
  }

  ngAfterViewInit(): void {
    if (this.userLoggedIn() && this.activeProposal && !this.userVote) {
      this.scoreService.getVotesOfUsers(this.activeProposal.id).then(vote => this.userVote = vote).catch(e => log.error(e));
    }
  }

  subscribeToSelectedProposalChange(): void {
    this.stateChangeService.selectedProposalChange$.subscribe(proposal => {
      log.debug("selectedProposalChange$...", proposal);
      this.activeProposal = proposal;

      if (this.userLoggedIn()) {
        log.debug("Setting userVote:", this.persistenceService.userProposalVotes.get(this.activeProposal.id));
        this.userVote = this.persistenceService.userProposalVotes.get(this.activeProposal.id);
      }
    });
  }

  private subscribeToModalActionResult(): void {
    this.stateChangeService.userModalActionResult.subscribe(res => {
      if (res.modalAction.modalType === ModalType.CAST_VOTE) {
        if (res.status === ModalStatus.CANCELLED) {
          this.userVote = this.persistenceService.userProposalVotes.get(this.activeProposal?.id ?? new BigNumber("-1"));
        }
      }
    });
  }

  isVoteValid(): boolean {
    if (this.userVote) {
      return (this.userVote.against.isFinite() && !this.userVote.against.isZero()) ||
        (this.userVote.for.isFinite() && !this.userVote.for.isZero());
    } else {
      return false;
    }
  }

  isVoteRejected(): boolean {
    if (this.userVote) {
      return this.userVote.against.isGreaterThan(this.userVote.for);
    }
    return false;
  }

  isVoteApproved(): boolean {
    if (this.userVote) {
      return this.userVote.for.isGreaterThan(this.userVote.against);
    }
    return false;
  }

  totalVoters(): number {
    const proposal = this.activeProposal;
    return (proposal?.forVoterCount.toNumber() ?? 0) + (proposal?.againstVoterCount.toNumber() ?? 0);
  }

  onRejectClick(): void {
    const governanceAction = new GovernanceAction(undefined, false, this.activeProposal?.id);
    this.modalService.showNewModal(ModalType.CAST_VOTE, undefined, undefined, undefined, governanceAction);
  }

  onApproveClick(): void {
    const governanceAction = new GovernanceAction(undefined, true, this.activeProposal?.id);
    this.modalService.showNewModal(ModalType.CAST_VOTE, undefined, undefined, undefined, governanceAction);
  }

  onChangeVoteClick(): void {
    this.userVote = undefined;
  }


}
