import { CountryCode } from "../models/Util/CountryCode";
export declare class CodeLists {
    static BRIDGE_SYMBOL: string;
    static SICX_SYMBOL: string;
    static IUSDC_SYMBOL: string;
    static OMM_SYMBOL: string;
    static stateCodesUS: string[];
    static countryCodes: CountryCode[];
    static companyContactTypes: string[];
    static kycDocumentTypes: string[];
    static kycProofOfAddressDocumentType: string;
    static kycDocumentsTypesPrettyMap: Map<string, string>;
    static sexes: string[];
    static supportedDepositFundsTransferTypes: string[];
    static fundsTransferTypeToPretty: Map<string, string>;
    static getCreditCardPrettyName(creditCardType: string): string;
}
//# sourceMappingURL=code-lists.d.ts.map