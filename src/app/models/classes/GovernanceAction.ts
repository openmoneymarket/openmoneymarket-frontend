import {CreateProposal} from "./Proposal";
import BigNumber from "bignumber.js";

export class GovernanceAction {
  newProposal?: CreateProposal;
  proposalId?: BigNumber;
  approveProposal?: boolean;
  payload: any;

  constructor(newProposal?: CreateProposal, approveProposal?: boolean, proposalId?: BigNumber, payload?: any) {
    this.newProposal = newProposal;
    this.payload = payload;
    this.approveProposal = approveProposal;
    this.proposalId = proposalId;
  }
}


