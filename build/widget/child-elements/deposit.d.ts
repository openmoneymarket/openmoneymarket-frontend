import { LitElement } from 'lit-element';
import { User } from '../../lib/models/User/User';
declare class DepositElement extends LitElement {
    constructor();
    static styles: any[];
    user: User | undefined;
    iframeUrl: string;
    landingView: HTMLElement | null | undefined;
    stablyIframeView: HTMLElement | null | undefined;
    activeView: HTMLElement | null | undefined;
    private backToHomeViewEvent;
    private showBlockchainAddress;
    protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void;
    protected updated(_changedProperties: Map<string, any>): void;
    private showModalView;
    private setActiveModalView;
    private handleIframeClose;
    protected render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deposit-elem': DepositElement;
    }
}
export {};
//# sourceMappingURL=deposit.d.ts.map