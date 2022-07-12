export interface UploadedDocument {
    type: string;
    id: string;
    attributes: Attributes;
}
export interface Attributes {
    "allow-download": boolean;
    "created-at": string;
    "description": string | null;
    extension: string;
    "file-url": string;
    label: string;
    "mime-type": string;
    public: boolean;
    "version-urls": VersionUrls;
}
export interface VersionUrls {
    original: string;
}
//# sourceMappingURL=UploadedDocument.d.ts.map