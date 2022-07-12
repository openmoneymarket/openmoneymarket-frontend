import { PrimaryAddress } from "./PrimaryAddress";
export interface Contact {
    data: Data;
    included: PrimaryAddress[];
}
export interface Data {
    type: string;
    id: string;
    attributes: Attributes;
}
export interface Attributes {
    "account-roles": string[];
    "aml-cleared": boolean;
    "cip-cleared": boolean;
    "contact-type": string;
    "date-of-birth": string;
    email: string;
    "identity-confirmed": boolean;
    "identity-documents-verified": boolean;
    name: string;
    "proof-of-address-documents-verified": boolean;
    "region-of-formation": string | null;
    sex: string | null;
    "tax-country": string;
    "tax-id-number": string;
    "tax-state": string;
    type: string;
    "created-at": string;
    "updated-at": string;
}
//# sourceMappingURL=Contact.d.ts.map