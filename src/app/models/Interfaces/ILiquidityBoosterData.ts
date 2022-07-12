import BigNumber from "bignumber.js";

export interface ILiquidityBoosterData {
  from: BigNumber;
  to: BigNumber;
  liquidityBoosterMap: Map<string, BigNumber>;
}
