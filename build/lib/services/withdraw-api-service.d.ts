import { RequestsWrapper } from "../common/requests-wrapper";
import { AxiosResponse } from "axios";
import { WithdrawalRequest } from "../models/Transaction/withdrawal-request";
import { Withdrawal } from "../models/Transaction/Withdrawal";
export declare class WithdrawApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Get all of the users withdrawals
     * @param {number} pageNumber - Indicates the page number
     * @param {number} pageSize - Maximum number of resources returned
     * @return {Promise<AxiosResponse<{"withdrawals": Withdrawal[]}>>} Promise with Transaction model response
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getWithdrawals(pageNumber?: number, pageSize?: number): Promise<AxiosResponse<{
        "withdrawals": Withdrawal[];
    }>>;
    /**
     * @description Create withdrawal/disbursement request to Prime Trust
     * @param {WithdrawalRequest} withdrawalRequest - Withdrawal request model
     * @return {Promise<AxiosResponse>} Promise with plaid response https://documentation.primetrust.com/#operation/POST__v2_disbursements
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    requestWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<AxiosResponse>;
}
//# sourceMappingURL=withdraw-api-service.d.ts.map