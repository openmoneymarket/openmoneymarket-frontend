import {YourPrepVote} from "./YourPrepVote";

export class VoteAction{
  yourVotesPrepList: YourPrepVote[];

  constructor(yourVotesPrepList: YourPrepVote[]) {
    this.yourVotesPrepList = yourVotesPrepList;
  }
}
