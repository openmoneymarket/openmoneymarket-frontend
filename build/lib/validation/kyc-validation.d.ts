export declare function validateKycIdentityViewFields(name: string | undefined, dateOfBirth: string | undefined, taxIdNumber: string | undefined, taxState: string | undefined, phoneNumber: string | undefined, phoneCountry: string | undefined, contactHasUSTaxInfo: boolean): string[];
export declare function validateKycAddressViewFields(street: string | undefined, city: string | undefined, country: string | undefined, region: string | undefined, postalCode: string | undefined, hasUSAddress: boolean): string[];
export declare function validateDocumentsUploadView(documentFrontFile: FileList | null, documentBackFile: FileList | null, documentProofOfAddress: FileList | null, selectedIdDocumentType: string, other: string): string[];
// # sourceMappingURL=kyc-validation.d.ts.map
