import { Irc2TokenTransaction } from "./Irc2TokenTransaction";
import { Deposit } from "./Deposit";
import { Withdrawal } from "./Withdrawal";
export declare class BridgeTransaction {
    dateString: string;
    date: Date;
    amount: number;
    iconTransaction: Irc2TokenTransaction | undefined;
    depositTransaction: Deposit | undefined;
    withdrawTransaction: Withdrawal | undefined;
    type: TransactionType;
    constructor(dateString: string, date: Date, amount: number, iconTransaction: Irc2TokenTransaction | undefined, depositTransaction: Deposit | undefined, type: TransactionType, withdrawTransaction: Withdrawal | undefined);
}
export declare enum TransactionType {
    SENT = "Sent",
    RECEIVED = "Received",
    DEPOSITED = "Deposited",
    WITHDRAW = "Withdrawn"
}
//# sourceMappingURL=BridgeTransaction.d.ts.map