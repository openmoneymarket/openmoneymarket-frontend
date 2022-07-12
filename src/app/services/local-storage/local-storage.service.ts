import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {ModalAction} from "../../models/classes/ModalAction";
import {BridgeWallet} from "../../models/wallets/BridgeWallet";
import {IconexWallet} from "../../models/wallets/IconexWallet";
import {LedgerWallet} from "../../models/wallets/LedgerWallet";
import {Proposal} from "../../models/classes/Proposal";
import log from "loglevel";
import BigNumber from "bignumber.js";

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  localStorage: Storage;
  changes$ = new Subject();

  lastModalAction?: ModalAction;

  constructor() {
    this.localStorage   = window.localStorage;
  }

  persistModalAction(modalAction: ModalAction): void {
    this.lastModalAction = modalAction;
  }

  persistActiveProposal(proposal: Proposal): void {
    log.debug("persistActiveProposal: ", proposal);
    this.set("proposal", proposal);
  }

  getActiveProposal(): Proposal | undefined {
    const proposal: Proposal | undefined = this.get("proposal");
    return proposal !== undefined ? new Proposal(
      new BigNumber(proposal.against), new BigNumber(proposal.againstVoterCount), proposal.description, new BigNumber(proposal.endDay),
      new BigNumber(proposal.forVotes), new BigNumber(proposal.forVoterCount), new BigNumber(proposal.id), new BigNumber(proposal.majority),
      proposal.name, proposal.proposer, new BigNumber(proposal.quorum), new BigNumber(proposal.startDay), proposal.status,
      proposal.voteSnapshot, proposal.forumLink) : undefined;
  }

  getLastModalAction(): ModalAction | undefined {
    return this.lastModalAction;
  }

  persistWalletLogin(wallet: BridgeWallet | IconexWallet | LedgerWallet): void {
    this.set("wallet", new WalletLogin(wallet, + new Date()));
  }

  getLastWalletLogin(): WalletLogin | undefined {
    return this.get("wallet");
  }

  clearWalletLogin(): void {
    this.remove("wallet");
  }

  get(key: string): any {
    if (this.isLocalStorageSupported) {
      const item = this.localStorage.getItem(key);
      return item ? JSON.parse(item) : undefined;
    }
    return undefined;
  }

  set(key: string, value: any): boolean {
    if (this.isLocalStorageSupported) {
      this.localStorage.setItem(key, JSON.stringify(value));
      this.changes$.next({
        type: 'set',
        key,
        value
      });
      return true;
    }
    return false;
  }

  remove(key: string): boolean {
    if (this.isLocalStorageSupported) {
      this.localStorage.removeItem(key);
      this.changes$.next({
        type: 'remove',
        key
      });
      return true;
    }
    return false;
  }

  get isLocalStorageSupported(): boolean {
    return !!this.localStorage;
  }

}

export class WalletLogin {
  wallet: BridgeWallet | IconexWallet | LedgerWallet;
  timestamp: number;


  constructor(wallet: BridgeWallet | IconexWallet | LedgerWallet, timestamp: number) {
    this.wallet = wallet;
    this.timestamp = timestamp;
  }
}
