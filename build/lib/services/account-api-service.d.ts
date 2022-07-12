import { RequestsWrapper } from "../common/requests-wrapper";
import { Account } from "../models/PrimeTrust/Account";
import { AxiosResponse } from "axios";
import { NaturalPersonContactUS } from "../models/PrimeTrust/NaturalPersonContactUS";
import { NaturalPersonContactNonUS } from "../models/PrimeTrust/NaturalPersonContactNonUS";
import { UserKycData } from "../models/Account/UserKycData";
import { Contact } from "../models/Interfaces/Contact";
import { PatchContact } from "../models/PrimeTrust/PatchContact";
export declare class AccountApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Get Prime Trust account
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET account response https://documentation.primetrust.com/#tag/Accounts
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getAccount(): Promise<AxiosResponse>;
    /**
     * @description Get Prime Trust contact linked to the user account which contains more information about the user
     * @param {string} include - Optionally include can be specified as documented in https://documentation.primetrust.com/#operation/GET__v2_contacts
     * @return {Promise<AxiosResponse<Contact>>} Promise with Prime Trust GET contact response https://documentation.primetrust.com/#operation/GET__v2_contacts
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getContact(include?: string): Promise<AxiosResponse<Contact>>;
    /**
     * @description Update Prime Trust contact linked to the user account which contains more information about the user
     * @param {PatchContact} patchContact - PatchContact model
     * @param {string} include - Optionally include can be specified as documented in https://documentation.primetrust.com/#operation/GET__v2_contacts
     * @return {Promise<AxiosResponse<Contact>>} Promise with Prime Trust GET contact response https://documentation.primetrust.com/#operation/GET__v2_contacts
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    updateContact(patchContact: PatchContact, include?: string): Promise<AxiosResponse<Contact>>;
    /**
     * @description Get Prime Trust account KYC data (including contact kyc info)
     * @return {Promise<AxiosResponse<UserKycData>>} Promise with AccountKyc model as response
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getUserKycData(): Promise<AxiosResponse<UserKycData>>;
    /**
     * @description Create Prime Trust custodial account
     * @param {Account} custodialAccount - Custodial account model
     * @return {Promise<AxiosResponse>} Promise with Prime Trust POST account response https://documentation.primetrust.com/#tag/Accounts
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    postAccount(custodialAccount: Account): Promise<AxiosResponse>;
    /**
     * @description Get users linked US (ach) bank accounts
     * @param {number} pageNumber - Indicates the page number
     * @param {number} pageSize - Maximum number of resources returned
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET funds transfer method response https://documentation.primetrust.com/#tag/Funds-Transfer-Methods
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getAccountsLinkedBankAccounts(pageNumber?: number, pageSize?: number): Promise<AxiosResponse>;
    /**
     * @description Get users linked credit cards
     * @param {number} pageNumber - Indicates the page number
     * @param {number} pageSize - Maximum number of resources returned
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET funds transfer method response https://documentation.primetrust.com/#tag/Funds-Transfer-Methods
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getAccountsLinkedCreditCards(pageNumber?: number, pageSize?: number): Promise<AxiosResponse>;
    /**
     * @description Get users funds transfer method by id
     * @param {string} ftmId - Funds transfer method id
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET funds transfer method response https://documentation.primetrust.com/#tag/Funds-Transfer-Methods
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getFundsTransferMethodById(ftmId: string): Promise<AxiosResponse>;
    /**
     * @description Deactivate users linked funds transfer method
     * @param {string} ftmId - Funds transfer method id
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET funds transfer method response https://documentation.primetrust.com/#tag/Funds-Transfer-Methods
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    deactivateFundsTransferMethod(ftmId: string): Promise<AxiosResponse>;
    /**
     * @description Get latest users Prime Trust account agreement
     * @return {Promise<AxiosResponse>} Promise with Prime Trust GET agreement response https://documentation.primetrust.com/#operation/GET__v2_agreements
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getLatestAccountAgreement(): Promise<AxiosResponse>;
    /**
     * @description Create Prime Trust account agreement preview
     * @param {NaturalPersonContactUS | NaturalPersonContactNonUS} owner - Prime Trust contact model
     * @return {Promise<AxiosResponse>} Promise with Prime Trust POST agreement previews response https://documentation.primetrust.com/#tag/Agreement-Previews
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    postAccountAgreementPreview(owner: NaturalPersonContactUS | NaturalPersonContactNonUS): Promise<AxiosResponse>;
}
//# sourceMappingURL=account-api-service.d.ts.map