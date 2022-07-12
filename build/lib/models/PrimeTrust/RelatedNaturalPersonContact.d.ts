import { NaturalPersonContactUS } from "./NaturalPersonContactUS";
import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
export declare class RelatedNaturalPersonContact extends NaturalPersonContactUS {
    label: string;
    primary: boolean;
    constructor(email: string, name: string, primaryAddress: PrimaryAddressUS, primaryPhoneNumber: PrimaryPhoneNumber, dateOfBirth: string, sex: string, taxCountry: string, taxIdNumber: string, label: string, primary: boolean);
}
//# sourceMappingURL=RelatedNaturalPersonContact.d.ts.map