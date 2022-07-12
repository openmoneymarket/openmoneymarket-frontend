import { RequestsWrapper } from "../common/requests-wrapper";
import { AxiosResponse } from "axios";
import { IstaBalanceCheck } from "../models/Util/ista-balance-check";
export declare class UtilsApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Get boolean if instant settlement account has this amount of funds available
     * @return {Promise<AxiosResponse<IstaBalanceCheck>>} Promise with IstaBalanceCheck model in response
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    getIstaBalanceCheck(amount: number): Promise<AxiosResponse<IstaBalanceCheck>>;
    /**
     * @description SANDBOX ONLY endpoint to approve CIP and AML check. It can happen that there is no CIP or AMl check
     * thus they do not get approved
     * @return {Promise<AxiosResponse<any>>} Empty Promise with AxiosResponse
     * @throws {BridgeError} - contains user friendly message from the API and external error
     */
    approveCipAndAml(): Promise<AxiosResponse>;
}
//# sourceMappingURL=utils-api-service.d.ts.map