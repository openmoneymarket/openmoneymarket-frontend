export interface CipCheck {
    data: Data | null;
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
    status: string;
    'updated-at': string;
    'submit-for-review': boolean;
}
export interface Links {
    self: string;
}
export interface Relationships {
    account: AccountOrContact;
    contact: AccountOrContact;
}
export interface AccountOrContact {
    links: Links1;
}
export interface Links1 {
    related: string;
}
//# sourceMappingURL=CipCheck.d.ts.map