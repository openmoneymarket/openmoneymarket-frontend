import BigNumber from "bignumber.js";

export class Vote {
  against: BigNumber;
  "for": BigNumber;

  constructor(against: BigNumber, forVote: BigNumber) {
    this.against = against;
    this.for = forVote;
  }
}

export class VotersCount {
  againstVoters: BigNumber;
  forVoters: BigNumber;


  constructor(againstVoters: BigNumber, forVoters: BigNumber) {
    this.againstVoters = againstVoters;
    this.forVoters = forVoters;
  }
}
