import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Proposal} from "../../models/classes/Proposal";
import {PersistenceService} from "../../services/persistence/persistence.service";
import {BaseClass} from "../base-class";
import {ReloaderService} from "../../services/reloader/reloader.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-all-proposals',
  templateUrl: './all-proposals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllProposalsComponent extends BaseClass implements OnInit {

  constructor(public persistenceService: PersistenceService,
              public reloaderService: ReloaderService,
              private router: Router) {
    super(persistenceService);
  }

  ngOnInit(): void {
  }

  getProposalList(): Proposal[] {
    return this.persistenceService.proposalList;
  }

  onProposalClick(proposal: Proposal): void {
    this.router.navigate(["vote/proposal", proposal.id.toString()]);
  }

}
