import { LitElement } from 'lit-element';
import { User } from '../../lib/models/User/User';
declare class WithdrawElement extends LitElement {
    constructor();
    static styles: any[];
    stablyWithdrawUrl: string;
    user: User | undefined;
    private backToHomeViewEvent;
    protected render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'withdraw-elem': WithdrawElement;
    }
}
export {};
//# sourceMappingURL=withdraw.d.ts.map