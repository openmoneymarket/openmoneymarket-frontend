export declare class StandardKycDocumentCheck {
    uploadedDocumentId: string;
    backsideDocumentId: string | undefined;
    expiresOn: string | undefined;
    identity: boolean;
    identityPhoto: boolean;
    proofOfAddress: boolean;
    kycDocumentCountry: string;
    kycDocumentType: string;
    constructor(uploadedDocumentId: string, kycDocumentCountry: string, kycDocumentType: string, identity: boolean, identityPhoto: boolean, proofOfAddress: boolean, backsideDocumentId?: string, expiresOn?: string);
}
//# sourceMappingURL=StandardKycDocumentCheck.d.ts.map