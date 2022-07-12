import { LitElement } from 'lit-element';
import { User } from '../../lib/models/User/User';
declare class DepositElement extends LitElement {
    constructor();
    static styles: any[];
    stablyDepositUrl: string;
    user: User | undefined;
    private backToHomeViewEvent;
    protected render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deposit-elem': DepositElement;
    }
}
export {};
//# sourceMappingURL=deposit.d.ts.map