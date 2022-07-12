import { LitElement } from 'lit-element';
import { User } from '../../lib/models/User/User';
declare class WithdrawElement extends LitElement {
    constructor();
    static styles: any[];
    user: User | undefined;
    iframeUrl: string;
    private backToHomeViewEvent;
    protected updated(_changedProperties: Map<string, any>): void;
    protected render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'withdraw-elem': WithdrawElement;
    }
}
export {};
//# sourceMappingURL=withdraw.d.ts.map