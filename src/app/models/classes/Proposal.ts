import BigNumber from "bignumber.js";
import {Times} from "../../common/constants";
import {ReloaderService} from "../../services/reloader/reloader.service";

export class Proposal {
  against: BigNumber;
  againstVoterCount: BigNumber;
  description: string;
  endDay: BigNumber;
  forVotes: BigNumber;
  forVoterCount: BigNumber;
  id: BigNumber;
  majority: BigNumber;
  name: string;
  proposer: string;
  quorum: BigNumber;
  startDay: BigNumber;
  status: ProposalStatus;
  voteSnapshot: BigNumber;
  forumLink: string;


  constructor(against: BigNumber, againstVoterCount: BigNumber, description: string, endDay: BigNumber, forVotes: BigNumber,
              forVoterCount: BigNumber, id: BigNumber, majority: BigNumber, name: string, proposer: string, quorum: BigNumber,
              startDay: BigNumber, status: ProposalStatus, voteSnapshot: BigNumber, forumLink: string) {
    this.against = against;
    this.againstVoterCount = againstVoterCount;
    this.description = description;
    this.endDay = endDay;
    this.forVotes = forVotes;
    this.forVoterCount = forVoterCount;
    this.id = id;
    this.majority = majority;
    this.name = name;
    this.proposer = proposer;
    this.quorum = quorum;
    this.startDay = startDay;
    this.status = status;
    this.voteSnapshot = voteSnapshot;
    this.forumLink = forumLink;
  }

  public toString(): string {
    return `against = ${this.against} \n`
      + `againstVoterCount = ${this.againstVoterCount} \n`
      + `description = ${this.description} \n`
      + `endDay = ${this.endDay} \n`
      + `forVotes = ${this.forVotes} \n`
      + `forVoterCount = ${this.forVoterCount} \n`
      + `id = ${this.id} \n`
      + `majority = ${this.majority} \n`
      + `name = ${this.name} \n`
      + `proposer = ${this.proposer} \n`
      + `quorum = ${this.quorum} \n`
      + `startDay = ${this.startDay} \n`
      + `status = ${this.status} \n`
      + `voteSnapshot = ${this.voteSnapshot} \n`
      + `forumLink = ${this.forumLink}`;
  }

  getShortDescription(): string {
    if (this.description.length > 67) {
      return this.description.substring(0, 67) + "...";
    }

    return this.description;
  }

  public proposalIsOver(reloaderService: ReloaderService): boolean {
    return this.endDay < reloaderService.currentTimestampMicro;
  }

  public getTotalVotePercentage(): BigNumber {
    return this.forVotes.plus(this.against);
  }

  public getApprovedPercentage(): BigNumber {
    if (!this.forVotes.isZero() && this.getTotalVotePercentage().isFinite() && !this.getTotalVotePercentage().isZero()) {
      return this.forVotes.dividedBy(this.getTotalVotePercentage());
    }
    return new BigNumber("0");
  }

  public getRejectedPercentage(): BigNumber {
    if (!this.against.isZero() && this.getTotalVotePercentage().isFinite() && !this.getTotalVotePercentage().isZero()) {
      return this.against.dividedBy(this.getTotalVotePercentage());
    }
    return new BigNumber("0");
  }

  public getStatusImgSrc(): string {
    const pendingClock = "assets/img/icon/clock.svg";
    const successClock = "assets/img/icon/tick-circle-green.svg";
    const failClock = "assets/img/icon/cross-circle-purple.svg";

    switch (this.status) {
      case ProposalStatus.SUCCEEDED:
        return successClock;
      case ProposalStatus.EXECUTED:
        return successClock;
      case ProposalStatus.PENDING:
        return pendingClock;
      case ProposalStatus.ACTIVE:
        return pendingClock;
      default:
        return failClock;
    }
  }

  getProposalState(currentTimestampMicro: BigNumber, shortVersion: boolean = false): string {
    switch (this.status) {
      case ProposalStatus.CANCELLED:
        return "Cancelled";
      case ProposalStatus.DEFEATED:
        return "Rejected";
      case ProposalStatus.FAILED_EXECUTION:
        return "Failed Execution";
      case ProposalStatus.NO_QUORUM:
        return "No quorum";
      case ProposalStatus.EXECUTED:
        return "Enacted";
      case ProposalStatus.SUCCEEDED:
        return "Approved";
      default:
        const secondsUntilStart = (this.endDay.minus(currentTimestampMicro)).dividedBy(new BigNumber("1000000"))
          .dp(2);
        const daysUntilStart = secondsUntilStart.dividedBy(Times.DAY_IN_SECONDS).dp(0);
        const hoursUntilStart = secondsUntilStart.dividedBy(Times.HOUR_IN_SECONDS).dp(0)
          .minus(daysUntilStart.multipliedBy(24)).dp(0);
        const minutesUntilStart = secondsUntilStart.dividedBy(Times.MINUTE_IN_SECONDS).dp(0);

        let res = "";
        if (!shortVersion) {
          if (!daysUntilStart.isZero()) {
            res += daysUntilStart.isEqualTo(1) ? `${daysUntilStart} day` : `${daysUntilStart} days`;
            if (!hoursUntilStart.isZero()) {
              res += hoursUntilStart.isEqualTo(1) ? `, ${hoursUntilStart} hour` : `, ${hoursUntilStart} hours`;
            }
          } else if (!hoursUntilStart.isZero()) {
            res += hoursUntilStart.isEqualTo(1) ? `${hoursUntilStart} hour` : `${hoursUntilStart} hours`;
          } else {
            res += minutesUntilStart.isEqualTo(1) ? `${minutesUntilStart} minute` : `${minutesUntilStart} minutes`;
          }

          res += " left";
        } else {
          if (!daysUntilStart.isZero()) {
            res += daysUntilStart.isEqualTo(1) ? `${daysUntilStart} day` : `${daysUntilStart} days`;
          } else if (!hoursUntilStart.isZero()) {
            res += hoursUntilStart.isEqualTo(1) ? `${hoursUntilStart} hour` : `${hoursUntilStart} hours`;
          } else {
            res += minutesUntilStart.isEqualTo(1) ? `${minutesUntilStart} minute` : `${minutesUntilStart} minutes`;
          }
        }

        return res;
    }
  }
}

export class CreateProposal {
  title: string;
  description: string;
  forumLink: string;
  voteStart: BigNumber;
  snapshot: BigNumber;
  voteDefinitionFee: BigNumber;


  constructor(title: string, description: string, voteStart: BigNumber, snapshot: BigNumber, voteDefinitionFee: BigNumber,
              forumLink: string) {
    this.title = title;
    this.description = description;
    this.voteStart = voteStart;
    this.snapshot = snapshot;
    this.voteDefinitionFee = voteDefinitionFee;
    this.forumLink = forumLink;
  }
}

export enum ProposalStatus {
  PENDING = "Pending",
  ACTIVE = "Active",
  CANCELLED = "Cancelled",
  DEFEATED =  "Defeated",
  SUCCEEDED = "Succeeded",
  NO_QUORUM = "No Quorum",
  EXECUTED = "Executed",
  FAILED_EXECUTION = "Failed Execution"
}

// EXAMPLE RESPONSE
// 'against': '0x0',
//   'against_voter_count': '0x0',
//   'description': 'description for proposal',
//   'endday': '0x5cc419f3bf300',
//   'for': '0x0',
//   'for_voter_count': '0x0',
//   'id': '0x2',
//   'majority': '0x94079cd1a42aaab',
//   'name': 'OIP2,     RandomTest2',
//   'proposer': 'hx5de49b9c9833f31d6bd237a074f86a30cc77126b',
//   'quorum': '0x2c68af0bb140000',
//   'startday': '0x5cbdd0a071300',
//   'status': 'Cancelled',
//   'votesnapshot': '0x5cbdd0a0712f6'
