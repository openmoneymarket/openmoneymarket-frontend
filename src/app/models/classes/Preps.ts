import BigNumber from "bignumber.js";
import {defaultPrepLogoUrl} from "../../common/constants";

export class PrepList {
  prepAddressToNameMap: Map<string, string>;
  prepAddressToLogoUrlMap: Map<string, string>;
  totalDelegated: BigNumber;
  totalPower: BigNumber;
  totalStake: BigNumber;
  avgIRep: BigNumber;
  preps: Prep[];


  constructor(totalDelegated: BigNumber, totalStake: BigNumber, preps: Prep[], avgIRep: BigNumber, totalPower: BigNumber) {
    this.avgIRep = avgIRep;
    this.totalDelegated = totalDelegated;
    this.totalStake = totalStake;
    this.preps = preps;
    this.totalPower = totalPower;
    this.prepAddressToNameMap = new Map<string, string>();
    preps.forEach(prep => {
      this.prepAddressToNameMap.set(prep.address, prep.name);
    });
    this.prepAddressToLogoUrlMap = new Map<string, string>();
    preps.forEach(prep => {
      this.prepAddressToLogoUrlMap.set(prep.address, prep.logoUrl);
    });
  }
}

export class Prep {
  address: string;
  name: string;
  stake: BigNumber;
  delegated: BigNumber;
  irep: BigNumber;
  details: string;
  logoUrl = defaultPrepLogoUrl;
  power: BigNumber;


  constructor(address: string, name: string, stake: BigNumber, delegated: BigNumber, irep: BigNumber, details: string, power: BigNumber,
              logoUrl: string = defaultPrepLogoUrl) {
    this.address = address;
    this.name = name;
    this.stake = stake;
    this.delegated = delegated;
    this.irep = irep;
    this.details = details;
    this.logoUrl = logoUrl;
    this.power = power;
  }

  setLogoUrl(logoUrl: string | undefined): void {
    this.logoUrl = logoUrl ? logoUrl : defaultPrepLogoUrl;
  }

}
