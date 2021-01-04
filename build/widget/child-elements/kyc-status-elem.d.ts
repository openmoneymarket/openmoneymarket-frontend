import { LitElement, PropertyValues } from 'lit-element';
import { BridgeService } from "../../lib/BridgeService";
import { User } from "../../lib/models/User/User";
import "./kyc-documents";
import { KycChecks } from "../../lib/models/Interfaces/KycChecks";
import { UserKycData } from "../../lib/models/Account/UserKycData";
import { Contact } from "../../lib/models/Interfaces/Contact";
import { KycState } from "../../lib/models/Enums/KycState";
declare class KycStatusElem extends LitElement {
    bridge: BridgeService | undefined;
    user: User | undefined;
    userContact: Contact | undefined;
    userKycData: UserKycData | undefined;
    kycChecks: KycChecks | undefined;
    accountName: HTMLInputElement | null | undefined;
    accountBirthDate: HTMLInputElement | null | undefined;
    accountIdNumber: HTMLInputElement | null | undefined;
    accountStreet: HTMLInputElement | null | undefined;
    accountPostalCode: HTMLInputElement | any;
    accountCity: HTMLInputElement | null | undefined;
    accountRegionOrState: HTMLInputElement | null | undefined;
    accountAddressCountry: HTMLInputElement | null | undefined;
    accountCountry: HTMLInputElement | null | undefined;
    accountPhoneNumber: string;
    documentType: HTMLInputElement | undefined;
    documentOther: HTMLInputElement | undefined;
    documentFrontSide: HTMLInputElement | undefined;
    documentBackSide: HTMLInputElement | undefined;
    proofOfAddress: HTMLInputElement | undefined;
    errors: string[];
    kycCipErrors: string[];
    kycDocErrors: string[];
    nameErrorSpan: HTMLElement | undefined | null;
    dobErrorSpan: HTMLElement | undefined | null;
    countryErrorSpan: HTMLElement | undefined | null;
    idErrorSpan: HTMLElement | undefined | null;
    photoIdErrorSpan: HTMLElement | undefined | null;
    photoIdFrontErrorSpan: HTMLElement | undefined | null;
    photoIdBackErrorSpan: HTMLElement | undefined | null;
    proofOfAddressErrorSpan: HTMLElement | undefined | null;
    streetErrorSpan: HTMLElement | undefined | null;
    cityErrorSpan: HTMLElement | undefined | null;
    stateOrRegionErrorSpan: HTMLElement | undefined | null;
    postcodeErrorSpan: HTMLElement | undefined | null;
    addressCountryErrorSpan: HTMLElement | undefined | null;
    selectedDocumentType: string;
    selectedAddressCountry: string;
    selectedCountry: string;
    selectedCipException: string;
    selectedKycDocException: string;
    cipExceptionInput: HTMLInputElement | undefined | null;
    kycDocExceptionInput: HTMLInputElement | undefined | null;
    kycStatusView: HTMLElement | null | undefined;
    kycIdentityModalView: HTMLElement | null | undefined;
    kycAddressModalView: HTMLElement | null | undefined;
    kycProcessingModalView: HTMLElement | null | undefined;
    kycVerifyingView: HTMLElement | null | undefined;
    beforeErrorView: HTMLElement | null | undefined;
    errorView: HTMLElement | null | undefined;
    activeView: HTMLElement | null | undefined;
    identityState: KycState;
    addressState: KycState;
    constructor();
    static styles: any[];
    protected updated(_changedProperties: PropertyValues): void;
    protected firstUpdated(_changedProperties: any): void;
    private uploadKycDocuments;
    private handleError;
    contactUpdatedEvent(contact: Contact): void;
    backToHomeViewEvent(): void;
    private resetFields;
    private showModalView;
    private setActiveModalView;
    private validateIdentityInputFields;
    private validateAddressInputFields;
    private identityFormChanged;
    private addressFormChanged;
    submitKycIdentityForm(event: Event): Promise<boolean>;
    submitKycAddressForm(event: Event): Promise<boolean>;
    private uploadProofOfAddress;
    private documentIdTypeChange;
    private UScountrySelected;
    private UScountryAddressSelected;
    private addressCountryChange;
    private countryChange;
    private driverLicenseSelected;
    private getKycStatusImg;
    private getKycStatusText;
    private getKycStatusTitle;
    private handleOnIdentityFailClick;
    private requireAndRemoveDisable;
    private removeDisable;
    private handleOnAddressFailClick;
    private isKycCleared;
    private getKycExceptions;
    private getIdentityStateHtml;
    private getIdentityState;
    private getAddressStateHtml;
    private getAddressState;
    private cipExceptionChange;
    private kycDocExceptionChange;
    private getUploadedFileLink;
    render(): import("lit-element").TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'kyc-status-elem': KycStatusElem;
    }
}
export {};
//# sourceMappingURL=kyc-status-elem.d.ts.map