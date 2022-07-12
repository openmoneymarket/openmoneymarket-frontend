import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
export declare class NaturalPersonContactNonUS {
    email: string;
    name: string;
    primaryAddress: PrimaryAddressUS;
    primaryPhoneNumber: PrimaryPhoneNumber;
    contactType: string;
    dateOfBirth: string;
    sex: string | undefined;
    taxCountry: string;
    taxIdNumber: string;
    constructor(email: string, name: string, primaryAddress: PrimaryAddressUS, primaryPhoneNumber: PrimaryPhoneNumber, dateOfBirth: string, sex: string | undefined, taxCountry: string, taxIdNumber: string);
}
//# sourceMappingURL=NaturalPersonContactNonUS.d.ts.map