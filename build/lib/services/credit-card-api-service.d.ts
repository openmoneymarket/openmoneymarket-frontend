import { RequestsWrapper } from "../common/requests-wrapper";
import { AxiosResponse } from "axios";
import { CreditCardResourceResponse } from "../models/CreditCard/CreditCardResourceResponse";
import { VerificationCodeResponse } from "../models/CreditCard/VerificationCodeResponse";
export declare class CreditCardApiService {
    private requestsWrapper;
    constructor(requestsWrapper: RequestsWrapper);
    /**
     * @description Get credit card resource token and id
     * @return {Promise<AxiosResponse<CreditCardResourceResponse>>} Promise with CreditCardResourceResponse model response
     */
    getCreditCardResourceTokenAndId(): Promise<AxiosResponse<CreditCardResourceResponse>>;
    /**
     * @description Get credit card verification code
     * @param {string} creditCardResourceId - Prime Trust credit card resource Id
     * @return {Promise<AxiosResponse<VerificationCodeResponse>>} Promise with VerificationCodeResponse model response
     */
    getCreditCardVerificationCode(creditCardResourceId: string): Promise<AxiosResponse<VerificationCodeResponse>>;
}
//# sourceMappingURL=credit-card-api-service.d.ts.map