import { Irc2TokenTransaction } from "../models/Transaction/Irc2TokenTransaction";
import { SupportedIrc2TokenTransaction } from '../models/Transaction/SupportedIrc2TokenTransaction';
import { BridgeTransaction, TransactionType } from "../models/Transaction/BridgeTransaction";
import { IcxTransaction, IcxTransactions } from "../models/Transaction/IcxTransaction";
export declare function formatAndFilterIcxTransactions(icxTransactions: IcxTransactions, userIconWalletAddress: string): IcxTransaction[];
export declare function formatAndFilterBridgeTransactions(iconTokenTransactions: Irc2TokenTransaction[] | undefined, userIconWalletAddress: string): BridgeTransaction[];
export declare function formatAndFilterIrc2Transactions(iconTokenTransactions: Irc2TokenTransaction[] | undefined): SupportedIrc2TokenTransaction;
export declare function transactionTypeToClass(transaction: BridgeTransaction): string;
export declare function tokenTransactionTypeToClass(type: TransactionType): "deposited" | "sent";
export declare function getTransactionName(transaction: BridgeTransaction): string;
//# sourceMappingURL=Mapping.d.ts.map