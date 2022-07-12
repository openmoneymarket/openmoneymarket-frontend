import { UploadedDocument } from "./UploadedDocument";
export interface KycDocumentCheck {
    data: Data | null;
    included: UploadedDocument[];
}
export interface Data {
    type: string;
    id: string;
    attributes: Attributes;
    links: Links;
    relationships: Relationships;
}
export interface Attributes {
    'created-at': string;
    'expires-on': string | null;
    exceptions: string[];
    'failure-details': string | null;
    identity: boolean;
    'identity-photo': boolean;
    'kyc-document-country': string;
    'kyc-document-other-type': string | null;
    'kyc-document-type': string;
    'proof-of-address': boolean;
    status: string;
    'updated-at': string;
}
export interface Links {
    self: string;
}
export interface Relationships {
    contact: ContactOrUploadedDocumentOrBacksideDocument;
    'uploaded-document': ContactOrUploadedDocumentOrBacksideDocument;
    'backside-document': ContactOrUploadedDocumentOrBacksideDocument;
}
export interface ContactOrUploadedDocumentOrBacksideDocument {
    links: Links1;
}
export interface Links1 {
    related: string;
}
//# sourceMappingURL=KycDocumentCheck.d.ts.map