import { LitElement } from 'lit-element';
import { BridgeService } from "../../lib/BridgeService";
import { User } from "../../lib/models/User/User";
import { Token } from "../../lib/models/Tokens/Tokens";
declare class SendToken extends LitElement {
    bridge: BridgeService | undefined;
    user: User | undefined;
    selectedToken: Token | undefined;
    tokenBalance: number;
    userTokensMap: Map<string, Token>;
    inputAmount: HTMLInputElement | null | undefined;
    amountInputError: HTMLElement | undefined | null;
    sendAddress: HTMLInputElement | null | undefined;
    selectToken: HTMLInputElement | null | undefined;
    sendAmountView: HTMLElement | null | undefined;
    confirmationView: HTMLElement | null | undefined;
    processingModalView: HTMLElement | null | undefined;
    sendSuccessView: HTMLElement | null | undefined;
    sendErrorView: HTMLElement | null | undefined;
    activeView: HTMLElement | null | undefined;
    amount: number;
    errors: string[];
    protected firstUpdated(_changedProperties: any): void;
    constructor();
    static styles: any[];
    private showConfirmationView;
    private handleSessionExpired;
    private transferTokens;
    private amountChange;
    private selectedTokenChange;
    private checkTransferTxHashResult;
    private handleError;
    private clearInputFields;
    private showModalView;
    private setActiveModalView;
    tokenTransferEvent(amount: number, to: string): void;
    private backToHomeViewEvent;
    private updateBalanceEvent;
    protected render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'send-token': SendToken;
    }
}
export {};
//# sourceMappingURL=send-token.d.ts.map