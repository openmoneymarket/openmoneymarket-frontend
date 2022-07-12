export interface AmlCheck {
    data: Data | null;
    included?: any[] | null;
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
    exceptions: string[];
    'exception-details': string | null;
    name: string;
    status: string;
    'updated-at': string;
}
export interface Links {
    self: string;
}
export interface Relationships {
    account: AccountOrContactOrFundsTransfer;
    'asset-transfer': AssetTransfer;
    contact: AccountOrContactOrFundsTransfer;
    'funds-transfer': AccountOrContactOrFundsTransfer;
}
export interface AccountOrContactOrFundsTransfer {
    links: Links1;
}
export interface Links1 {
    related: string;
}
export interface AssetTransfer {
    data?: any;
}
//# sourceMappingURL=AmlCheck.d.ts.map