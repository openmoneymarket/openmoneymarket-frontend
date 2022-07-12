import { NaturalPersonContactUS } from "./NaturalPersonContactUS";
import { CompanyContactUS } from "./CompanyContactUS";
import { NaturalPersonContactNonUS } from "./NaturalPersonContactNonUS";
export declare class CustodialAccountAttributes {
    name: string;
    authorizedSignature: string;
    owner: NaturalPersonContactUS | NaturalPersonContactNonUS | CompanyContactUS;
    accountType: string;
    constructor(name: string, owner: NaturalPersonContactUS | NaturalPersonContactNonUS | CompanyContactUS);
}
//# sourceMappingURL=CustodialAccountAttributes.d.ts.map