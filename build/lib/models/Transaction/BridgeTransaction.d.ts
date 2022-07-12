import { Irc2TokenTransaction } from "./Irc2TokenTransaction";
export declare class BridgeTransaction {
    dateString: string;
    date: Date;
    amount: number;
    iconTransaction: Irc2TokenTransaction | undefined;
    type: TransactionType;
    constructor(dateString: string, date: Date, amount: number, iconTransaction: Irc2TokenTransaction | undefined, type: TransactionType);
}
export declare enum TransactionType {
    SENT = "Sent",
    RECEIVED = "Received"
}
//# sourceMappingURL=BridgeTransaction.d.ts.map