import { CipCheck } from "./CipCheck";
import { KycDocumentCheck } from "./KycDocumentCheck";
import { AmlCheck } from "./AmlCheck";
export interface KycChecks {
    "latestAmlCheck": AmlCheck;
    "latestCipCheck": CipCheck;
    "latestIdentityKycDocumentCheck": KycDocumentCheck;
    "latestKycDocumentCheck": KycDocumentCheck;
}
//# sourceMappingURL=KycChecks.d.ts.map