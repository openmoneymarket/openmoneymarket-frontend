// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  iconRpcUrl: "https://sejong.net.solidwallet.io/api/v3",
  ommRestApi: "https://omm-stats-api-dev-r8jdq.ondigitalocean.app/api/v1",
  iconDebugRpcUrl: "https://sejong.net.solidwallet.io/api/v3d",
  ADDRESS_PROVIDER_SCORE: 'cxada79d199446d81b2809c514c6d8f43f6604cf1f',
  BALANCED_DEX_SCORE: "cxf0276a2413b46d5660e09c4935eecbf401c5811a",
  ledgerBip32Path: "44'/4801368'/0'/0'",
  GOVERNANCE_ADDRESS: "cx0000000000000000000000000000000000000001",
  IISS_API: "cx0000000000000000000000000000000000000000",
  NID: 83,
  REWARDS_ACCRUE_START: 1628312400, // unix timestamp from when rewards accrue will start
  REWARDS_CLAIMABLE_START: 1628917200, // unix timestamp from when rewards are going to be claimable
  ACTIVATE_REWARDS_TIMESTAMPS: false, // boolean flag deciding if above two timestamp should be respected
  SHOW_BANNER: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
