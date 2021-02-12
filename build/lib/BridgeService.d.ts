import { MagicUserMetadata } from 'magic-sdk';
import { UserApiService } from "./services/user-api-service";
import { AccountApiService } from "./services/account-api-service";
import { CreditCardApiService } from "./services/credit-card-api-service";
import { IconApiService } from "./services/icon-api-service";
import { PlaidLinkApiService } from "./services/plaid-link-api-service";
import { ContributionsApiService } from "./services/contributions-api-service";
import { KycApiService } from "./services/kyc-api-service";
import { WithdrawApiService } from "./services/withdraw-api-service";
import { MagicLoginResponse } from "./models/Interfaces/MagicLogin";
import { UtilsApiService } from "./services/utils-api-service";
declare const IconService: any;
export declare class BridgeService {
    constructor();
    private readonly magic;
    magicUserMetadata: MagicUserMetadata | undefined;
    readonly iconSdk: typeof IconService;
    userApiService: UserApiService;
    accountApiService: AccountApiService;
    kycApiService: KycApiService;
    iconApiService: IconApiService;
    plaidLinkApiService: PlaidLinkApiService;
    creditCardApiService: CreditCardApiService;
    contributionsApiService: ContributionsApiService;
    withdrawApiService: WithdrawApiService;
    utilsApiService: UtilsApiService;
    plaidLinkHandler: any;
    /**
     * @description Polls for txResult until not pending and dispatches the result as event
     * @param {string} txHash - The transaction hash.
     * @param {number} retryAttempt - The number of attempts to get the transaction result
     */
    private dispatchTxResultEvent;
    private checkMagicInitialized;
    private checkUserMetadataInitialized;
    /**
     * @description Login user in to Magic using email and dispatch login event
     * @param {string} email - The email of user.
     * @return {Promise<MagicLoginResponse>} Promise with MagicLoginResponse model containing user and magicUserMetadata.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    magicLogin(email: string): Promise<MagicLoginResponse>;
    /**
     * @description Logout user from Magic and dispatch logout event
     * @return {void}
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    magicLogout(): Promise<void>;
    /**
     * @description Check if user is logged in to Magic.
     * @return {Promise<boolean>} The boolean Promise, true if user is logged in.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    userIsLoggedIn(): Promise<boolean>;
    /**
     * @description Get logged in user Magic metadata
     * @return {Promise<MagicUserMetadata>} The MagicUserMetadata Promise
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    getLoggedInUsersMagicMetadata(): Promise<MagicUserMetadata>;
    /**
     * @description Sign withdrawal request transaction using Magic extension
     * @param {any} txObj - Icon transaction, see here: https://github.com/icon-project/icon-sdk-js#iconserviceiconbuilder
     * @return {Promise<string>} Promise of signature (string)
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    signTransaction(txObj: any): Promise<string>;
    /**
     * @description Send IRC2 tokens to another wallet.
     * @param {string} to - The EOA address.
     * @param {string} scoreAddress - The EOA address of the token SCORE.
     * @param {number} amount - The amount of tokens to send as a whole number.
     * @return {Promise<string>} The transaction hash promise
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    sendIrc2Tokens(to: string, amount: number, scoreAddress: string): Promise<string>;
    /**
     * @description Send ICX tokens to another wallet.
     * @param {string} to - The EOA address.
     * @param {number} amount - The amount of ICX tokens to send as a whole number.
     * @return {Promise<string>} The transaction hash promise
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    sendIcxTokens(to: string, amount: number): Promise<string>;
    addSendTransactionEventListener(): void;
    /**
     * @description Event handler for sending stable coins initiated by Bridge integrator.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    handleSendTransactionEvent(event: Event): Promise<void>;
    /**
     * @description Get users Icon wallet ICX balance.
     * @return {Promise<number>} The icx balance as number in promise
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    getIcxBalance(): Promise<number>;
    /**
     * Get users IRC-2 token balance.
     * @param {string} scoreAddress - The EOA address of the token SCORE.
     * @return {Promise<number> } The Promise IRC2 token balance as number.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    getIrc2TokenBalance(scoreAddress: string): Promise<number>;
    /**
     * @description Get transaction result object.
     * @param {string} txHash - The transaction hash.
     * @return {Promise<any>} The transaction result.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    getTxResult(txHash: string): Promise<any>;
    /**
     * @description Build Icon Call transaction for withdrawal request specific
     * @param {string} from - Icon address from which to send transaction
     * @param {number} amount - Amount to be included in params
     * @return {CallTransaction} Returns Icon SDK CallTransaction
     * https://github.com/icon-project/icon-sdk-js#iconserviceiconbuildercalltransactionbuilder
     */
    buildWithdrawalRequestTransaction(from: string, amount: number): any;
    /**
     * @description Change users Magic email
     * @param {string} email - The email of user.
     * @return {Promise<void>} Promise with empty response.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    updateEmail(email: string): Promise<void>;
    /**
     * @description Load and initialise Plaid Link script
     * @return {Promise<void>} Promise with empty response.
     * @throws {BridgeError} - contains user friendly message and external error (if present)
     */
    loadPlaid(): Promise<void>;
    /**
     * @description Dispatch event to initialize Prime Trust credit card widget.
     * @param {HTMLElement} target - Target HTML element in which to initialize widget
     * @param {string} resourceTokenHash - Credit card resource token hash
     */
    dispatchCreditCardWidgetInitEvent(target: HTMLElement, resourceTokenHash: string): void;
}
export {};
// # sourceMappingURL=BridgeService.d.ts.map
