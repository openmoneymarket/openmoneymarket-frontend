import { CompanyContactUS } from "./CompanyContactUS";
import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
import { RelatedNaturalPersonContact } from "./RelatedNaturalPersonContact";
import { StandardKycDocumentCheck } from "./StandardKycDocumentCheck";
import { StandardKycDocumentCheckOther } from "./StandardKycDocumentCheckOther";
export declare class RelatedCompanyContact extends CompanyContactUS {
    label: string;
    primary: boolean;
    constructor(email: string, name: string, primaryAddress: PrimaryAddressUS, primaryPhoneNumber: PrimaryPhoneNumber, contactType: string, regionOfFormation: string, relatedContacts: RelatedNaturalPersonContact[] | RelatedCompanyContact[], taxCountry: string, taxIdNumber: string, taxState: string, uploadedDocIds: string[], kycDocumentChecks: StandardKycDocumentCheck[] | StandardKycDocumentCheckOther[], label: string, primary: boolean);
}
//# sourceMappingURL=RelatedCompanyContact.d.ts.map