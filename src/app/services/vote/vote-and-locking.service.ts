import { Injectable } from '@angular/core';
import {IconApiService} from "../icon-api/icon-api.service";
import {PersistenceService} from "../persistence/persistence.service";
import {CheckerService} from "../checker/checker.service";
import {TransactionDispatcherService} from "../transaction-dispatcher/transaction-dispatcher.service";
import {ScoreMethodNames} from "../../common/score-method-names";
import {IconTransactionType} from "../../models/enums/IconTransactionType";
import log from "loglevel";
import {IconAmount, IconConverter} from "icon-sdk-js";
import {environment} from "../../../environments/environment";
import {Mapper} from "../../common/mapper";
import {Prep} from "../../models/classes/Preps";
import {YourPrepVote} from "../../models/classes/YourPrepVote";
import BigNumber from "bignumber.js";
import {CreateProposal} from "../../models/classes/Proposal";
import {IconexId} from "../../models/enums/IconexId";

@Injectable({
  providedIn: 'root'
})
export class VoteAndLockingService {

  constructor(private iconApiService: IconApiService,
              private persistenceService: PersistenceService,
              private checkerService: CheckerService,
              private transactionDispatcherService: TransactionDispatcherService) { }

  public castVote(proposalId: BigNumber, approved: boolean, notificationMessage: string): void {
    const tx = this.buildCastVote(proposalId, approved);

    log.debug(`Cast vote TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  public lockOmm(amount: BigNumber, unlockTime: BigNumber, notificationMessage: string): void {
    amount = amount.dp(0);
    const tx = this.buildLockOmmTx(amount, unlockTime);

    log.debug(`Lock OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage, IconexId.SHOW_MESSAGE_KEEP_MODAL);
  }

  public withdrawLockedOmm(notificationMessage: string): void {
    const tx = this.buildWithdrawLockedOmm();

    log.debug(`Withdraw locked OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage, IconexId.SHOW_MESSAGE_HIDE_MODAL);
  }

  public increaseLockAmountAndPeriodOmm(amount: BigNumber, unlockTime: BigNumber, notificationMessage: string): void {
    amount = amount.dp(0);
    const tx = this.buildIncreaseLockPeriodAndAmountOmmTx(amount, unlockTime);

    log.debug(`Increase Lock amount and unlock period OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage, IconexId.SHOW_MESSAGE_KEEP_MODAL);
  }

  public increaseOmmLockPeriod(newPeriod: BigNumber, notificationMessage: string): void {
    const tx = this.buildIncreaseLockTimeOmmTx(newPeriod);

    log.debug(`Increase lock period OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage, IconexId.SHOW_MESSAGE_KEEP_MODAL);
  }

  public increaseOmmLockAmount(amount: BigNumber, notificationMessage: string): void {
    amount = amount.dp(0);
    const tx = this.buildIncreaseLockAmountOmmTx(amount);

    log.debug(`Increase Locked OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage, IconexId.SHOW_MESSAGE_KEEP_MODAL);
  }

  public migrateStakedOmm(amount: BigNumber, unlockTime: BigNumber, notificationMessage: string): void {
    const tx = this.buildMigrateStakedOmmTx(amount, unlockTime);

    log.debug(`Migrate staked OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  public stakeOmm(amount: BigNumber, notificationMessage: string): void {
    amount = amount.dp(2);
    const tx = this.buildStakeOmmTx(amount);

    log.debug(`Stake OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  public unstakeOmm(amount: BigNumber, notificationMessage: string): void {
    amount = amount.dp(2);
    const tx = this.buildUnstakeOmmTx(amount);

    log.debug(`Unstake OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }

  public cancelUnstakeOmm(amount: BigNumber, notificationMessage: string): void {
    const tx = this.buildCancelUnstakeOmmTx(amount);

    log.debug(`Cancel Unstake OMM TX: `, tx);
    this.transactionDispatcherService.dispatchTransaction(tx, notificationMessage);
  }



  /**
   * @description Build lock OMM Tokens Icon transaction
   * **Note**: Lock period is timestamp in microseconds. The lock period should be an integer/long, not a string.
   * @param amount - Amount of OMM tokens to lock
   * @param unlockTime - lock time in milliseconds that needs to be converted to microseconds
   * @return any lock OMM Tokens Icon transaction
   */
  private buildLockOmmTx(amount: BigNumber, unlockTime: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    // convert to microseconds
    const unlockTimeMicro = unlockTime.multipliedBy(1000);
    log.debug(`Lock Omm amount = ` + amount.toString());
    log.debug(`unlockTime = ` + unlockTime.toString());
    const decimals = 18;
    const dataPayload = '{ "method": "createLock", "params": { "unlockTime":' + unlockTimeMicro.toFixed() + '}}';
    log.debug("Data payload = ", dataPayload);

    const params = {
      _to: this.persistenceService.allAddresses!.systemContract.bOMM,
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _data: IconConverter.fromUtf8(dataPayload)};

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken, ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);
  }

  private buildMigrateStakedOmmTx(amount: BigNumber, unlockTime: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    // convert to microseconds
    const unlockTimeMicro = unlockTime.multipliedBy(1000);
    log.debug(`Omm amount to migrate from staked to locked = ` + amount.toString());
    log.debug(`unlockTime in microseconds = ` + unlockTime.toString());
    const decimals = 18;

    const params = {
      _amount: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _lockPeriod: IconConverter.toHex(unlockTimeMicro)
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address, this.persistenceService.allAddresses!.
      systemContract.OmmToken, ScoreMethodNames.MIGRATE_STAKED_OMM, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build increase lock amount and unlock period OMM Tokens Icon transaction
   * **Note**: Lock period is timestamp in microseconds. The lock period should be an integer/long, not a string.
   * @param amount - Amount of OMM tokens to lock
   * @param unlockTime - lock time in milliseconds that needs to be converted to microseconds
   * @return any lock OMM Tokens Icon transaction
   */
  private buildIncreaseLockPeriodAndAmountOmmTx(amount: BigNumber, unlockTime: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    // convert to microseconds
    const unlockTimeMicro = unlockTime.multipliedBy(1000);
    log.debug(`Lock Omm amount = ` + amount.toString());
    log.debug(`unlockTime = ` + unlockTime.toString());
    const decimals = 18;
    const dataPayload = '{ "method": "increaseAmount", "params": { "unlockTime":' + unlockTimeMicro.toFixed() + '}}';
    log.debug("Data payload = ", dataPayload);

    const params = {
      _to: this.persistenceService.allAddresses!.systemContract.bOMM,
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _data: IconConverter.fromUtf8(dataPayload)};

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken, ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build increase lock OMM amount Icon transaction
   * @param amount - Amount of OMM tokens to lock
   * @return any lock OMM Tokens Icon transaction
   */
  private buildIncreaseLockAmountOmmTx(amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Increase Lock Omm amount = ` + amount.toString());
    const decimals = 18;

    const params = {
      _to: this.persistenceService.allAddresses!.systemContract.bOMM,
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
      _data: IconConverter.fromUtf8('{ "method": "increaseAmount", "params": { "unlockTime": 0 }}')};

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken, ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);
  }

  private buildWithdrawLockedOmm(): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.bOMM, ScoreMethodNames.WITHDRAW_LOCKED_OMM, {}, IconTransactionType.WRITE);
  }

  /**
   * @description Build increase lock time of locked OMM tokens
   * @param lockPeriod - New lock period
   * @return any increase OMM Tokens lock period Icon transaction
   */
  private buildIncreaseLockTimeOmmTx(lockPeriod: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug("buildIncreaseLockTimeOmmTx lockPeriod = " + lockPeriod.toString());

    // convert to microseconds
    const unlockTimeMicro = lockPeriod.multipliedBy(1000);
    log.debug(`Increase Lock Omm time for = ` + unlockTimeMicro.toString());

    const params = {
      unlockTime: IconConverter.toHex(unlockTimeMicro)
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.bOMM, ScoreMethodNames.INCREASE_UNLOCK_TIME, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Transaction for staking Omm Tokens
   * **Note**: if the user tries to increase the stake, ”_value” should be previous staked balance + amount being additionally staked
   * @return  Stake Omm Tokens transaction
   */
  private buildStakeOmmTx(amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Stake Omm amount = ` + amount);
    const decimals = 18;

    const params = {
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.STAKE_OMM, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Transaction for un-staking Omm Tokens
   * @return  Un-stake Omm Tokens transaction
   */
  private buildUnstakeOmmTx(amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Un-stake Omm amount = ` + amount);
    const decimals = 18;

    const params = {
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.LendingPool, ScoreMethodNames.UNSTAKE_OMM, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Transaction to cancel un-staking of Omm Tokens
   * @return  Cancel Un-stake Omm Tokens transaction
   */
  private buildCancelUnstakeOmmTx(amount: BigNumber): any {
    this.checkerService.checkUserLoggedInAllAddressesAndReservesLoaded();

    log.debug(`Cancel Un-stake Omm amount = ` + amount);
    const decimals = 18;

    const params = {
      _value: IconConverter.toHex(IconAmount.of(amount, decimals).toLoop()),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken, ScoreMethodNames.CANCEL_UNSTAKE_OMM, params,
      IconTransactionType.WRITE);
  }

  /**
   * @description Build Create a proposal tx
   * @return  Icon transaction
   */
  public createProposal(proposal: CreateProposal ): any {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const to = this.persistenceService.allAddresses!.systemContract.Governance;
    const value = IconConverter.toHex(IconAmount.of(proposal.voteDefinitionFee, 18).toLoop());
    const data = IconConverter.fromUtf8(`{ "method": "defineVote", "params": { "name": "${
      proposal.title}", "description": "${ // "unique name of the proposal"
      proposal.description}", "forum": "${proposal.forumLink}"}}`);

    const params = {
      _to: to,
      _value: value,
      _data: data
    };

    const tx =  this.iconApiService.buildTransaction(this.persistenceService.activeWallet!!.address,
      this.persistenceService.allAddresses!.systemContract.OmmToken,  ScoreMethodNames.TRANSFER, params, IconTransactionType.WRITE);

    log.debug("createProposal tx = ", tx);

    return tx;
  }

  /**
   * @description Cast vote on proposal
   * @return Icon tx
   */
  public buildCastVote(proposalId: BigNumber, approve: boolean): Promise<any> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      vote_index: IconConverter.toHex(proposalId),
      vote: approve ? "0x1" : "0x0"
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.CAST_VOTE, params, IconTransactionType.WRITE);
  }

  /**
   * @description Cancel vote on proposal
   * @return Icon tx
   */
  public buildCancelVoteOnProposal(proposalId: BigNumber): Promise<any> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      vote_index: IconConverter.toHex(proposalId),
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.Governance,
      ScoreMethodNames.CANCEL_VOTE_ON_PROPOSAL, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Icon transaction to remove all of the users votes
   * @return Icon tx
   */
  public buildRemoveAllVotes(): Promise<any> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const params = {
      _user: this.persistenceService.activeWallet!.address
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.Delegation,
      ScoreMethodNames.CLEAR_PREVIOUS_DELEGATIONS, params, IconTransactionType.WRITE);
  }

  /**
   * @description Build Icon transaction to update user delegation preferences
   * @return  Icon tx
   */
  public buildUpdateUserDelegationPreferencesTx(yourVotesPrepList: YourPrepVote[]): Promise<any> {
    this.checkerService.checkUserLoggedInAndAllAddressesLoaded();

    const delegations: {_address: string, _votes_in_per: string}[] = this.prepareDelegations(yourVotesPrepList);
    log.debug("delegations:", delegations);

    const params = {
      _delegations: delegations
    };

    return this.iconApiService.buildTransaction(this.persistenceService.activeWallet!.address,
      this.persistenceService.allAddresses!.systemContract.Delegation,
      ScoreMethodNames.UPDATE_DELEGATIONS, params, IconTransactionType.WRITE);
  }

  prepareDelegations(yourVotesPrepList: YourPrepVote[]): {_address: string, _votes_in_per: string}[] {
    // handle 3 votes by putting high precision 1/3 hex-es with last being rounded up at 18 decimal point
    if (yourVotesPrepList.length === 3) {
      return [
        {_address: yourVotesPrepList[0].address, _votes_in_per: "0x4a03ce68d215555"},
        {_address: yourVotesPrepList[1].address, _votes_in_per: "0x4a03ce68d215555"},
        {_address: yourVotesPrepList[2].address, _votes_in_per: "0x4a03ce68d215556"}
      ];
    }

    const delegations: {_address: string, _votes_in_per: string}[] = [];

    yourVotesPrepList.forEach(yourVote  => {
      delegations.push({
        _address: yourVote.address,
        _votes_in_per: IconConverter.toHex(IconAmount.of(yourVote.percentage, 16).toLoop())
      });
    });

    return delegations;
  }

  /**
   * @description Get Prep
   * @param prepAddress - Address of the Prep we want to fetch data for
   * @return  Returns the mapped Prep data
   */
  public async getPrep(prepAddress: string): Promise<Prep> {
    const params = {
      address : prepAddress
    };

    const tx = this.iconApiService.buildTransaction("",  environment.IISS_API,
      ScoreMethodNames.GET_PREP, params, IconTransactionType.READ);

    const prepList = await this.iconApiService.iconService.call(tx).execute();

    return Mapper.mapPrep(prepList);
  }

}
