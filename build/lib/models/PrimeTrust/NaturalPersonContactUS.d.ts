import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
import { NaturalPersonContactNonUS } from "./NaturalPersonContactNonUS";
export declare class NaturalPersonContactUS extends NaturalPersonContactNonUS {
    taxState: string;
    constructor(email: string, name: string, primaryAddress: PrimaryAddressUS, primaryPhoneNumber: PrimaryPhoneNumber, dateOfBirth: string, sex: string | undefined, taxIdNumber: string, taxState: string);
}
//# sourceMappingURL=NaturalPersonContactUS.d.ts.map