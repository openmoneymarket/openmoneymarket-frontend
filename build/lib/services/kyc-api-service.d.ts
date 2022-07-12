import { RequestsWrapper } from "../common/requests-wrapper";
import { KycDocument } from "../models/PrimeTrust/KycDocument";
import { AxiosResponse } from "axios";
import { StandardKycDocumentCheck } from "../models/PrimeTrust/StandardKycDocumentCheck";
import { KycCheckOption } from "../models/Enums/KycCheckOption";
import { KycChecks } from "../models/Interfaces/KycChecks";
export declare class KycApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Get the list of the KYC document checks
     * @param {number} pageNumber - Indicates the page number
     * @param {number} pageSize - Maximum number of resources returned
     * @return {Promise<any>} Promise with Prime Trust response https://docs.primetrust.com/?version=latest#6d2f9ae9-c588-40ba-a939-e49ba2ca68b5
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getKycDocumentChecks(pageNumber?: number, pageSize?: number): Promise<AxiosResponse>;
    /**
     * @description Upload KYC document to Prime Trust
     * @param {KycDocument} kycDocument - Request model for KYC upload documents REST API endpoint
     * @param {File} file - Selected KYC document file to be uploaded to users Prime Trust contact
     * @return {Promise<AxiosResponse>} Promise with Prime Trust response https://docs.primetrust.com/?version=latest#f425da4a-6a87-4742-861d-3c397442c0f5
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    postAccountDocument(kycDocument: KycDocument, file: File): Promise<AxiosResponse>;
    /**
     * @description Get list of documents that are uploaded to Prime Trust
     * @return {Promise<any>} Promise with Prime Trust response https://documentation.primetrust.com/#operation/GET__v2_kyc_document_checks
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getAccountDocument(pageNumber?: number, pageSize?: number): Promise<AxiosResponse>;
    /**
     * @description Create KYC document check on uploaded KYC document
     * @param {StandardKycDocumentCheck} kycDocumentCheck - Request model for creation of KYC document check
     * @return {Promise<any>} Promise with Prime Trust response https://docs.primetrust.com/?version=latest#6d2f9ae9-c588-40ba-a939-e49ba2ca68b5
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    postKycDocumentChecks(kycDocumentCheck: StandardKycDocumentCheck): Promise<AxiosResponse>;
    /**
     * @description Get KYC checks based on option: ['cip', 'aml', 'identity-kyc-document-check', 'kyc-document-check']
     * @return {Promise<AxiosResponse<KycChecks>>} Promise KycChecks model response
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getKycCheck(kycCheck: KycCheckOption): Promise<AxiosResponse<KycChecks>>;
}
//# sourceMappingURL=kyc-api-service.d.ts.map