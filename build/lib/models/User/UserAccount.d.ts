import { User } from "./User";
export declare class UserAccount extends User {
    name: string;
    auth_signature: string;
    city: string;
    country: string;
    street: string;
    phone_number: string;
    date_of_birth: string;
    id_or_tax_id: string;
    tax_country: string;
    tax_state: string;
    constructor(email: string, didEthrWalletAddress: string, iconWalletAddress: string, name: string, auth_signature: string, city: string, country: string, street: string, phone_number: string, date_of_birth: string, id_or_tax_id: string, tax_country: string, tax_state: string);
}
//# sourceMappingURL=UserAccount.d.ts.map