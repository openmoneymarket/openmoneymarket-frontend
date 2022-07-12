import { RequestsWrapper } from "../common/requests-wrapper";
import { AxiosResponse } from "axios";
export declare class PlaidLinkApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Exchange Plaid Public Token for Plaid Access Token
     * @param {string} publicToken - Plaid public token.
     * @return {Promise<AxiosResponse>} Promise with Plaid sandbox response https://plaid.com/docs/#exchange-token-flow
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    exchangePublicTokenForAccessToken(publicToken: string): Promise<AxiosResponse>;
    /**
     * @description Get a Plaid Account ID
     * @param {string} accessToken - Plaid access token.
     * @return {Promise<AxiosResponse>} Promise with plaid sandbox response https://plaid.com/docs/#accounts
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getPlaidAccountId(accessToken: string): Promise<AxiosResponse>;
    /**
     * @description Exchange Plaid Access Token for Plaid Processor Token
     * @param {string} accessToken - Plaid access token.
     * * @param {string} accountId - Plaid account ID.
     * @return {Promise<AxiosResponse>} Promise with plaid sandbox response https://plaid.com/docs/processor/
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    createPlaidProcessorToken(accountId: string, accessToken: string): Promise<AxiosResponse>;
    /**
     * @description Create the ach funds transfer method for user using Plaid Processor token
     * @param {string} processorToken - Plaid processor token.
     * @return {Promise<AxiosResponse>} Promise with Prime Trust sandbox response https://docs.primetrust.com/?version=latest#7d87d6ac-f47b-421f-8477-454574c6ad77
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    createAchFundsTransferMethod(processorToken: string): Promise<AxiosResponse>;
    /**
     * @description Create the link token used for initializing the Plaid Link widget
     * @return {Promise<AxiosResponse>} Promise with plaid sandbox response https://plaid.com/docs/quickstart/#cs-link-config
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    createLinkToken(): Promise<AxiosResponse>;
}
//# sourceMappingURL=plaid-link-api-service.d.ts.map