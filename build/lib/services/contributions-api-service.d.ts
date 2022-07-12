import { RequestsWrapper } from "../common/requests-wrapper";
import { AxiosResponse } from "axios";
import { Deposit } from "../models/Transaction/Deposit";
export declare class ContributionsApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Create contribution request to Prime Trust
     * @param {number} amount - (2 decimal point precision) Amount of funds to be deposited == amount of stable coins getting minted
     * @param {string} fundsTransferMethodId - Prime Trust funds transfer method id
     * @param {string} fundsTransferType - Type of fund transfer method ["credit_card", "ach"]
     * @param {number} fee - (Decimal, 2 point precision, rounded up) Fee amount (e.g. should be 4.5% of amount for credit card)
     * @return {Promise<AxiosResponse>} Promise with PrimeTrust response https://documentation.primetrust.com/#operation/POST__v2_contributions
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    createContribution(amount: number, fundsTransferMethodId: string, fundsTransferType: string, fee?: number, challengeId?: string, forterToken?: string): Promise<AxiosResponse>;
    /**
     * @description Get all of the users successfull deposits
     * @param {number} pageNumber - Indicates the page number
     * @param {number} pageSize - Maximum number of resources returned
     * @return {Promise<AxiosResponse<{"deposits": Deposit[]}>>} Promise with Transaction model response
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getAllDeposits(pageNumber?: number, pageSize?: number): Promise<AxiosResponse<{
        "deposits": Deposit[];
    }>>;
}
//# sourceMappingURL=contributions-api-service.d.ts.map