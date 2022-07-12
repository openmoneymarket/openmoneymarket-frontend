import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Proposal} from "../../models/classes/Proposal";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {BaseClass} from "../base-class";
import {ModalService} from "../../services/modal/modal.service";
import {ModalType} from "../../models/enums/ModalType";
import {GovernanceAction} from "../../models/classes/GovernanceAction";
import {ReloaderService} from "../../services/reloader/reloader.service";
import {StateChangeService} from "../../services/state-change/state-change.service";
import {Vote} from "../../models/classes/Vote";
import {ScoreService} from "../../services/score/score.service";
import log from "loglevel";
import {ModalStatus} from "../../models/classes/ModalAction";
import BigNumber from "bignumber.js";
import {ActivatedRoute} from "@angular/router";
import {Utils} from "../../common/utils";

@Component({
  selector: 'app-proposal',
  templateUrl: './proposal.component.html'
})
export class ProposalComponent extends BaseClass implements OnInit, AfterViewInit {

  activeProposal?: Proposal;
  userVote?: Vote;
  proposalId?: BigNumber;

  currentTimestampMicro = Utils.timestampNowMicroseconds();


  constructor(private modalService: ModalService,
              public persistenceService: PersistenceService,
              public reloaderService: ReloaderService,
              private stateChangeService: StateChangeService,
              private scoreService: ScoreService,
              private cdRef: ChangeDetectorRef,
              private route: ActivatedRoute) {
      super(persistenceService);
  }

  ngOnInit(): void {
    this.subscribeToPathParamsChange();
    this.subscribeToModalActionResult();
    this.subscribeToUserProposalVoteChange();
    this.subscribeToProposalListChange();
    this.subscribeToLoginChange();
  }

  ngAfterViewInit(): void {
    if (this.userLoggedIn() && this.activeProposal && !this.userVote) {
      this.scoreService.getVotesOfUsers(this.activeProposal.id).then(vote => this.userVote = vote).catch(e => log.error(e));
    }
  }

  subscribeToCurrenTimestampChange(): void {
    this.stateChangeService.currentTimestampChange$.subscribe(res => {
      this.currentTimestampMicro = res.currentTimestampMicro;
    });
  }

  subscribeToPathParamsChange(): void {
    // handle when user comes directly to the link with id
    this.route.paramMap.subscribe(paramMap => {
      log.debug("subscribeToPathParamsChange...");
      const proposalId = new BigNumber(paramMap.get('id') ?? 0);

      if (proposalId.isFinite() && proposalId.gt(0) && !proposalId.isEqualTo(this.activeProposal?.id ?? 0)) {
        log.debug("pathParams... handling proposal " + proposalId.toString());
        const proposal = this.persistenceService.getProposal(proposalId);
        if (proposal) {
          this.handleProposal(proposal);
        } else {
          this.proposalId = proposalId;
        }
      }
    });
  }

  subscribeToLoginChange(): void {
    this.stateChangeService.loginChange.subscribe((wallet) => {
      // logout
      if (!wallet) {
        this.userVote = undefined;
      }
    });
  }

  subscribeToProposalListChange(): void {
    this.stateChangeService.proposalListChange.subscribe((proposalList) => {
      log.debug("proposalListChange..", proposalList);
      log.debug("proposalId = " + this.proposalId?.toString());
      for (const proposal of proposalList) {
        if (proposal.id.isEqualTo(this.proposalId ?? -1)) {
          this.handleProposal(proposal);
          break;
        }
      }

      this.cdRef.detectChanges();
    });
  }

  subscribeToUserProposalVoteChange(): void {
    this.stateChangeService.userProposalVotesChange$.subscribe((change) => {
      if (this.userLoggedIn() && this.activeProposal?.id === change.proposalId) {
        this.userVote = this.persistenceService.userProposalVotes.get(this.activeProposal.id);
      }
    });
  }

  private subscribeToModalActionResult(): void {
    this.stateChangeService.userModalActionResult.subscribe(res => {
      if (res.modalAction.modalType === ModalType.CAST_VOTE && res.modalAction.governanceAction?.proposalId?.isEqualTo(
        this.activeProposal?.id ?? -1)) {
        if (res.status === ModalStatus.CANCELLED) {
          log.debug("proposal ModalStatus.CANCELLED");
          log.debug(`this.activeProposal?.id = ${this.activeProposal?.id.toNumber()}`);
          log.debug(`this.userVote = ${this.persistenceService.userProposalVotes.get(this.activeProposal?.id ?? new BigNumber("-1"))}`);
          this.userVote = this.persistenceService.userProposalVotes.get(this.activeProposal?.id ?? new BigNumber("-1"));
        }
      }
    });
  }

  handleProposal(proposal?: Proposal): void {
    if (!proposal) {
      return log.debug("handleProposal.. proposal is undefined..");
    }

    log.debug("handleProposal:", proposal);
    this.activeProposal = proposal;
    this.proposalId = this.activeProposal.id;

    if (this.userLoggedIn()) {
      log.debug("handleProposal... Setting userVote:", this.persistenceService.userProposalVotes.get(this.activeProposal.id));
      this.userVote = this.persistenceService.userProposalVotes.get(this.activeProposal.id);
    }
  }

  getUsersVotingWeightOnProposal(): BigNumber {
    if (this.userVote) {
      if (this.userVote.against.isFinite() && !this.userVote.against.isZero()) {
        return this.userVote.against;
      } else {
        return this.userVote.for;
      }
    } else {
      return new BigNumber("0");
    }
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
    if (this.isVoteApproved()) {
      this.onRejectClick();
    } else if (this.isVoteRejected()) {
      this.onApproveClick();
    }
  }

}
