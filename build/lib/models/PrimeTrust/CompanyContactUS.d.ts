import { PrimaryAddressUS } from "./PrimaryAddressUS";
import { PrimaryPhoneNumber } from "./PrimaryPhoneNumber";
import { StandardKycDocumentCheck } from "./StandardKycDocumentCheck";
import { StandardKycDocumentCheckOther } from "./StandardKycDocumentCheckOther";
import { RelatedNaturalPersonContact } from "./RelatedNaturalPersonContact";
import { RelatedCompanyContact } from "./RelatedCompanyContact";
export declare class CompanyContactUS {
    email: string;
    name: string;
    primaryAddress: PrimaryAddressUS;
    primaryPhoneNumber: PrimaryPhoneNumber;
    contactType: string;
    regionOfFormation: string;
    relatedContacts: RelatedNaturalPersonContact[] | RelatedCompanyContact[] | null;
    taxCountry: string;
    taxIdNumber: string;
    taxState: string;
    uploadedDocIds: string[];
    kycDocumentChecks: StandardKycDocumentCheck[] | StandardKycDocumentCheckOther[] | null;
    constructor(email: string, name: string, primaryAddress: PrimaryAddressUS, primaryPhoneNumber: PrimaryPhoneNumber, contactType: string, regionOfFormation: string, relatedContacts: RelatedNaturalPersonContact[] | RelatedCompanyContact[] | null, taxCountry: string, taxIdNumber: string, taxState: string, uploadedDocIds: string[], kycDocumentChecks: StandardKycDocumentCheck[] | StandardKycDocumentCheckOther[] | null);
}
//# sourceMappingURL=CompanyContactUS.d.ts.map