import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
export declare class PatchContact {
    email?: string;
    name?: string;
    primaryAddress?: PrimaryAddressUS;
    primaryPhoneNumber?: PrimaryPhoneNumber;
    contactType: string;
    dateOfBirth?: string;
    sex?: string | undefined;
    taxCountry?: string;
    taxIdNumber?: string;
    taxState?: string;
    constructor(email?: string, name?: string, primaryAddress?: PrimaryAddressUS, primaryPhoneNumber?: PrimaryPhoneNumber, dateOfBirth?: string, sex?: string, taxCountry?: string, taxIdNumber?: string, taxState?: string);
}
//# sourceMappingURL=PatchContact.d.ts.map