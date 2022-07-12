import {Utils} from "./utils";
import {UserReserveData} from "../models/classes/UserReserveData";
import {ReserveData} from "../models/classes/AllReservesData";
import {UserAccountData} from "../models/classes/UserAccountData";
import log from "loglevel";
import {ReserveConfigData} from "../models/classes/ReserveConfigData";
import {Liquidity, UserAccumulatedOmmRewards, Reserve, Locking} from "../models/classes/UserAccumulatedOmmRewards";
import {OmmTokenBalanceDetails} from "../models/classes/OmmTokenBalanceDetails";
import {Prep, PrepList} from "../models/classes/Preps";
import {DelegationPreference} from "../models/classes/DelegationPreference";
import {YourPrepVote} from "../models/classes/YourPrepVote";
import {UnstakeIcxData, UnstakeInfo} from "../models/classes/UnstakeInfo";
import {DistributionPercentages} from "../models/classes/DistributionPercentages";
import {PoolStats, PoolStatsInterface} from "../models/classes/PoolStats";
import {TotalPoolInterface, UserPoolDataInterface} from "../models/Interfaces/Poolnterfaces";
import {UserPoolData} from "../models/classes/UserPoolData";
import {
  AllAssetDistPercentages, DaoFundDistPercent,
  LiquidityDistPercent,
  OmmLockingDistPercent,
  ReserveAllAsset,
  StakingDistPercent
} from "../models/classes/AllAssetDisPercentages";
import {
  DailyRewardsAllReservesPools, DaoFundDailyRewards,
  LiquidityDailyRewards, OmmLockingDailyRewards,
  ReserveDailyRewards,
  WorkerTokenDailyRewards
} from "../models/classes/DailyRewardsAllReservesPools";
import {BigNumber} from "bignumber.js";
import {Vote, VotersCount} from "../models/classes/Vote";
import {Proposal} from "../models/classes/Proposal";
import {InterestHistory} from "../models/classes/InterestHistory";
import {ILockedOmm} from "../models/Interfaces/ILockedOmm";
import {LockedOmm} from "../models/classes/LockedOmm";
import {UserDailyOmmReward} from "../models/classes/UserDailyOmmReward";
import {IUserDailyOmmReward} from "../models/Interfaces/IUserDailyOmmReward";

export class Mapper {

  public static mapInterestHistory(interestHistory: InterestHistory[]): InterestHistory[] {
    interestHistory.forEach(el => {
      el.date = new Date(el.date);
    });

    return interestHistory;
  }

  public static mapLockedOmm(lockedOmm: ILockedOmm): LockedOmm {
    return new LockedOmm(
      Utils.hexToNormalisedNumber(lockedOmm.amount),
      Utils.hexToNumber(lockedOmm.end)
    );
  }

  public static mapDistributionPercentages(distributionPercentages: DistributionPercentages): DistributionPercentages {
    return new DistributionPercentages(
      Utils.hexToNormalisedNumber(distributionPercentages.daoFund),
      Utils.hexToNormalisedNumber(distributionPercentages.liquidityProvider),
      Utils.hexToNormalisedNumber(distributionPercentages.lendingBorrow),
      Utils.hexToNormalisedNumber(distributionPercentages.worker)
    );
  }

  public static mapUserReserve(reserve: UserReserveData, decimals: BigNumber = new BigNumber("18")): UserReserveData {
    log.debug("mapUserReserve before: ", reserve);
    const res = new UserReserveData(
      Utils.hexToNormalisedNumber(reserve.borrowRate),
      Utils.hexToNormalisedNumber(reserve.currentBorrowBalance, decimals),
      Utils.hexToNormalisedNumber(reserve.currentBorrowBalanceUSD),
      Utils.hexToNormalisedNumber(reserve.currentOTokenBalance, decimals),
      Utils.hexToNormalisedNumber(reserve.currentOTokenBalanceUSD),
      Utils.hexToNormalisedNumber(reserve.exchangeRate),
      Utils.hexToNumber(reserve.lastUpdateTimestamp),
      Utils.hexToNormalisedNumber(reserve.liquidityRate),
      Utils.hexToNormalisedNumber(reserve.originationFee, decimals),
      Utils.hexToNormalisedNumber(reserve.principalBorrowBalance, decimals),
      Utils.hexToNormalisedNumber(reserve.principalBorrowBalanceUSD),
      Utils.hexToNormalisedNumber(reserve.principalOTokenBalance, decimals),
      Utils.hexToNormalisedNumber(reserve.principalOTokenBalanceUSD),
      Utils.hexToNumber(reserve.userBorrowCumulativeIndex),
      Utils.hexToNumber(reserve.userLiquidityIndex),
    );
    log.debug("mapUserReserve after: ", res);

    return res;
  }

  public static mapUserAccumulatedOmmRewards(ommRewards: UserAccumulatedOmmRewards): UserAccumulatedOmmRewards {
    log.debug("mapUserAccumulatedOmmRewards before: ", ommRewards);
    const res = new UserAccumulatedOmmRewards(
      new Reserve(
        Utils.hexToNormalisedNumber(ommRewards.reserve.oUSDS),
        Utils.hexToNormalisedNumber(ommRewards.reserve.dUSDS),
        Utils.hexToNormalisedNumber(ommRewards.reserve.dICX),
        Utils.hexToNormalisedNumber(ommRewards.reserve.oICX),
        Utils.hexToNormalisedNumber(ommRewards.reserve.oIUSDC),
        Utils.hexToNormalisedNumber(ommRewards.reserve.dIUSDC),
        Utils.hexToNormalisedNumber(ommRewards.reserve.total)
      ),
      Utils.hexToNormalisedNumber(ommRewards.total),
      Utils.hexToNormalisedNumber(ommRewards.now),
      ommRewards.liquidity ?
      new Liquidity(
        Utils.hexToNormalisedNumber(ommRewards.liquidity["OMM/sICX"]),
        Utils.hexToNormalisedNumber(ommRewards.liquidity["OMM/USDS"]),
        Utils.hexToNormalisedNumber(ommRewards.liquidity["OMM/IUSDC"]),
        Utils.hexToNormalisedNumber(ommRewards.liquidity.total)
      ) : undefined,
      ommRewards.OMMLocking ?
      new Locking(
        Utils.hexToNormalisedNumber(ommRewards.OMMLocking.bOMM),
        Utils.hexToNormalisedNumber(ommRewards.OMMLocking.total)
      ) : undefined,
    );
    log.debug("mapUserAccumulatedOmmRewards after: ", res);

    return res;
  }

  public static mapUserDailyOmmRewards(ommRewards: IUserDailyOmmReward): UserDailyOmmReward {
    log.debug("mapUserDailyOmmRewards before: ", ommRewards);
    const res = new UserDailyOmmReward(
      Utils.hexToNormalisedNumber(ommRewards["OMM/IUSDC"]),
      Utils.hexToNormalisedNumber(ommRewards["OMM/USDS"]),
      Utils.hexToNormalisedNumber(ommRewards["OMM/sICX"]),
      Utils.hexToNormalisedNumber(ommRewards.bOMM),
      Utils.hexToNormalisedNumber(ommRewards.dBALN),
      Utils.hexToNormalisedNumber(ommRewards.dICX),
      Utils.hexToNormalisedNumber(ommRewards.dIUSDC),
      Utils.hexToNormalisedNumber(ommRewards.dOMM),
      Utils.hexToNormalisedNumber(ommRewards.dUSDS),
      Utils.hexToNormalisedNumber(ommRewards.dbnUSD),
      Utils.hexToNormalisedNumber(ommRewards.oBALN),
      Utils.hexToNormalisedNumber(ommRewards.oICX),
      Utils.hexToNormalisedNumber(ommRewards.oIUSDC),
      Utils.hexToNormalisedNumber(ommRewards.oOMM),
      Utils.hexToNormalisedNumber(ommRewards.oUSDS),
      Utils.hexToNormalisedNumber(ommRewards.obnUSD),
    );

    log.debug("mapUserDailyOmmRewards after: ", res);

    return res;
  }

  public static mapAllAssetDistPercentages(value: AllAssetDistPercentages): AllAssetDistPercentages {
    log.debug("mapAllAssetDistPercentages value: ", value);
    const res = new AllAssetDistPercentages(
      new ReserveAllAsset(
        Utils.hexToNormalisedNumber(value.reserve.oUSDS),
        Utils.hexToNormalisedNumber(value.reserve.dUSDS),
        Utils.hexToNormalisedNumber(value.reserve.dICX),
        Utils.hexToNormalisedNumber(value.reserve.oICX),
        Utils.hexToNormalisedNumber(value.reserve.oIUSDC),
        Utils.hexToNormalisedNumber(value.reserve.dIUSDC),
        Utils.hexToNormalisedNumber(value.reserve.total)
      ),
      Utils.hexToNormalisedNumber(value.total),
      new OmmLockingDistPercent(
        Utils.hexToNormalisedNumber(value.OMMLocking.bOMM),
        Utils.hexToNormalisedNumber(value.OMMLocking.total)
      ),
      new DaoFundDistPercent(
        Utils.hexToNormalisedNumber(value.daoFund.daoFund),
        Utils.hexToNormalisedNumber(value.daoFund.total)),
      value.liquidity ?
        new LiquidityDistPercent(
          Utils.hexToNormalisedNumber(value.liquidity["OMM/sICX"]),
          Utils.hexToNormalisedNumber(value.liquidity["OMM/USDS"]),
          Utils.hexToNormalisedNumber(value.liquidity["OMM/IUSDC"]),
          Utils.hexToNormalisedNumber(value.liquidity.total),
        ) : undefined,
      value.staking ?
      new StakingDistPercent(
        Utils.hexToNormalisedNumber(value.staking.OMM),
        Utils.hexToNormalisedNumber(value.staking.total)
      ) : undefined);
    log.debug("mapAllAssetDistPercentages after: ", res);

    return res;
  }

  public static mapDailyRewardsAllReservesPools(value: DailyRewardsAllReservesPools): DailyRewardsAllReservesPools {
    log.debug("mapDailyRewardsAllReservesPools value: ", value);
    const res = new DailyRewardsAllReservesPools(
      new ReserveDailyRewards(
        Utils.hexToNormalisedNumber(value.reserve.oUSDS),
        Utils.hexToNormalisedNumber(value.reserve.dUSDS),
        Utils.hexToNormalisedNumber(value.reserve.dICX),
        Utils.hexToNormalisedNumber(value.reserve.oICX),
        Utils.hexToNormalisedNumber(value.reserve.oIUSDC),
        Utils.hexToNormalisedNumber(value.reserve.dIUSDC),
        Utils.hexToNormalisedNumber(value.reserve.obnUSD),
        Utils.hexToNormalisedNumber(value.reserve.dbnUSD),
        Utils.hexToNormalisedNumber(value.reserve.oBALN),
        Utils.hexToNormalisedNumber(value.reserve.dBALN),
        Utils.hexToNormalisedNumber(value.reserve.oOMM),
        Utils.hexToNormalisedNumber(value.reserve.dOMM),
        Utils.hexToNormalisedNumber(value.reserve.total)
      ),
      Utils.hexToNormalisedNumber(value.total),
      Utils.hexToNumber(value.day),
      new DaoFundDailyRewards(
        Utils.hexToNormalisedNumber(value.daoFund.daoFund),
        Utils.hexToNormalisedNumber(value.daoFund.total),
      ),
      new OmmLockingDailyRewards(
        Utils.hexToNormalisedNumber(value.OMMLocking.bOMM),
        Utils.hexToNormalisedNumber(value.OMMLocking.total),
      ),
      value.liquidity ?
      new LiquidityDailyRewards(
        Utils.hexToNormalisedNumber(value.liquidity["OMM/sICX"]),
        Utils.hexToNormalisedNumber(value.liquidity["OMM/USDS"]),
        Utils.hexToNormalisedNumber(value.liquidity["OMM/IUSDC"]),
        Utils.hexToNormalisedNumber(value.liquidity.total),
      ) : undefined,
      value.workerToken ?
      new WorkerTokenDailyRewards(
        Utils.hexToNormalisedNumber(value.workerToken.workerToken),
        Utils.hexToNormalisedNumber(value.workerToken.total)
      ) : undefined);
    log.debug("mapDailyRewardsAllReservesPools after: ", res);

    return res;
  }

  public static mapUserOmmTokenBalanceDetails(ommTokenBalanceDetails: OmmTokenBalanceDetails): OmmTokenBalanceDetails {
    log.debug("mapUserOmmTokenBalanceDetails before: ", ommTokenBalanceDetails);
    const res = new OmmTokenBalanceDetails(
      Utils.hexToNormalisedNumber(ommTokenBalanceDetails.totalBalance),
      Utils.hexToNormalisedNumber(ommTokenBalanceDetails.availableBalance),
      Utils.hexToNormalisedNumber(ommTokenBalanceDetails.stakedBalance),
      Utils.hexToNormalisedNumber(ommTokenBalanceDetails.unstakingBalance),
      Utils.hexToNumber(ommTokenBalanceDetails.unstakingTimeInMills)
    );
    log.debug("mapUserOmmTokenBalanceDetails after: ", res);

    return res;
  }

  public static mapUserAccountData(userAccountData: UserAccountData): UserAccountData {
    log.debug("mapUserAccountData before: ", userAccountData);
    const res = new UserAccountData(
      Utils.hexToNormalisedNumber(userAccountData.availableBorrowsUSD),
      Utils.hexToNormalisedNumber(userAccountData.borrowingPower),
      Utils.hexToNormalisedNumber(userAccountData.currentLiquidationThreshold),
      Utils.hexToNormalisedNumber(userAccountData.currentLtv),
      Utils.hexToNormalisedNumber(userAccountData.healthFactor),
      Utils.hexToNormalisedNumber(userAccountData.healthFactorBelowThreshold),
      Utils.hexToNormalisedNumber(userAccountData.totalBorrowBalanceUSD),
      Utils.hexToNormalisedNumber(userAccountData.totalCollateralBalanceUSD),
      Utils.hexToNormalisedNumber(userAccountData.totalFeesUSD),
      Utils.hexToNormalisedNumber(userAccountData.totalLiquidityBalanceUSD),
    );
    log.debug("mapUserAccountData after: ", res);
    return res;
  }

  public static mapReserveData(reserveData: ReserveData): ReserveData {
    const decimals = Utils.hexToNumber(reserveData.decimals);

    return new ReserveData(
      Utils.hexToNormalisedNumber(reserveData.totalLiquidity, decimals),
      Utils.hexToNormalisedNumber(reserveData.availableLiquidity, decimals),
      Utils.hexToNormalisedNumber(reserveData.totalLiquidityUSD),
      Utils.hexToNormalisedNumber(reserveData.availableLiquidityUSD),
      Utils.hexToNormalisedNumber(reserveData.totalBorrows, decimals),
      Utils.hexToNormalisedNumber(reserveData.totalBorrowsUSD),
      Utils.hexToNormalisedNumber(reserveData.liquidityRate),
      Utils.hexToNormalisedNumber(reserveData.borrowRate),
      reserveData.oTokenAddress,
      Utils.hexToNormalisedNumber(reserveData.exchangePrice),
      Utils.hexToNumber(reserveData.lastUpdateTimestamp),
      Utils.hexToNormalisedNumber(reserveData.baseLTVasCollateral),
      Utils.hexToNormalisedNumber(reserveData.borrowCumulativeIndex),
      Utils.hexToNumber(reserveData.borrowingEnabled),
      Utils.hexToNumber(reserveData.decimals),
      Utils.hexToNumber(reserveData.isActive),
      Utils.hexToNumber(reserveData.isFreezed),
      Utils.hexToNormalisedNumber(reserveData.liquidationBonus),
      Utils.hexToNormalisedNumber(reserveData.liquidationThreshold),
      Utils.hexToNormalisedNumber(reserveData.liquidityCumulativeIndex),
      reserveData.reserveAddress,
      Utils.hexToNormalisedNumber(reserveData.sICXRate),
      Utils.hexToBoolean(reserveData.usageAsCollateralEnabled),
      Utils.hexToNormalisedNumber(reserveData.rewardPercentage),
      Utils.hexToNormalisedNumber(reserveData.lendingPercentage),
      Utils.hexToNormalisedNumber(reserveData.borrowingPercentage),
      Utils.hexToNormalisedNumber(reserveData.availableBorrows),
      Utils.hexToNormalisedNumber(reserveData.borrowThreshold),
    );
  }

  public static mapReserveConfigurationData(reserveConfigData: ReserveConfigData): ReserveConfigData {
    return new ReserveConfigData(
      Utils.hexToNormalisedNumber(reserveConfigData.baseLTVasCollateral),
      Utils.hexToNumber(reserveConfigData.decimals),
      Utils.hexToNormalisedNumber(reserveConfigData.liquidationThreshold),
      Utils.hexToNormalisedNumber(reserveConfigData.liquidationBonus),
      Utils.hexToNumber(reserveConfigData.usageAsCollateralEnabled),
      Utils.hexToNumber(reserveConfigData.borrowingEnabled),
      Utils.hexToNumber(reserveConfigData.isActive)
    );
  }

  public static mapPrepList(prepList: PrepList): PrepList {
    log.debug("prepList before: ", prepList);

    const preps: Prep[] = [];

    let totalPower = new BigNumber("0");

    prepList.preps.forEach(prep => {
      const power = Utils.hexToNormalisedNumber(prep.power);
      totalPower = totalPower.plus(power);

      preps.push(new Prep(
        prep.address,
        prep.name,
        Utils.hexToNormalisedNumber(prep.stake),
        Utils.hexToNormalisedNumber(prep.delegated),
        Utils.hexToNormalisedNumber(prep.irep),
        prep.details,
        power
      ));
    });

    let stakeIrepSum = new BigNumber("0");
    let total = new BigNumber("0");

    preps.slice(0, 22).forEach(prep => {
      stakeIrepSum = stakeIrepSum.plus(prep.irep.multipliedBy(prep.delegated));
      total = total.plus(prep.delegated);
    });

    const avgIRep = stakeIrepSum.dividedBy(total);

    const res = new PrepList(
      Utils.hexToNormalisedNumber(prepList.totalDelegated),
      Utils.hexToNormalisedNumber(prepList.totalStake),
      preps,
      avgIRep,
      totalPower
    );

    log.debug("prepList after: ", res);

    return res;
  }

  public static mapPrep(prep: Prep): Prep {
    return new Prep(
      prep.address,
      prep.name,
      Utils.hexToNormalisedNumber(prep.stake),
      Utils.hexToNormalisedNumber(prep.delegated),
      Utils.hexToNormalisedNumber(prep.irep),
      prep.details,
      Utils.hexToNormalisedNumber(prep.power)
    );
  }

  public static mapUserDelegations(delegations: DelegationPreference[], prepAddressToNameMap?: Map<string, string>): YourPrepVote[] {
    const res: YourPrepVote[] = [];

    delegations.forEach(delegation => {
      res.push(new YourPrepVote(
        delegation._address,
        prepAddressToNameMap?.get(delegation._address) ?? "Unknown",
        Utils.multiply(Utils.hexToNormalisedNumber(delegation._votes_in_per), new BigNumber("100"))));
    });

    return res;
  }

  public static mapPoolStats(poolStats: PoolStatsInterface): PoolStats {
    const baseDecimals = Utils.hexToNumber(poolStats.base_decimals);
    const quoteDecimals = Utils.hexToNumber(poolStats.quote_decimals);

    return new PoolStats(
      Utils.hexToNormalisedNumber(poolStats.base, baseDecimals),
      Utils.hexToNormalisedNumber(poolStats.quote, quoteDecimals),
      poolStats.base_token,
      poolStats.quote_token,
      Utils.hexToNormalisedNumber(poolStats.total_supply, PoolStats.getPoolPrecision(baseDecimals, quoteDecimals)),
      Utils.hexToNormalisedNumber(poolStats.price, quoteDecimals),
      poolStats.name,
      baseDecimals,
      quoteDecimals,
      Utils.hexToNumber(poolStats.min_quote)
    );
  }

  public static mapUserIcxUnstakeData(unstakeIcxData: UnstakeIcxData[]): UnstakeInfo {
    let totalAmount = new BigNumber("0");
    unstakeIcxData.forEach(u => totalAmount = totalAmount.plus(Utils.hexToNormalisedNumber(u.amount)));
    return new UnstakeInfo(totalAmount, unstakeIcxData);
  }

  public static mapPoolsData(poolsData: TotalPoolInterface[]): TotalPoolInterface[] {
    return poolsData.map(data => {
      return {
        poolID: Utils.hexToNumber(data.poolID),
        totalStakedBalance: data.totalStakedBalance // map this after pool stats is received and precision derived
      };
    });
  }

  public static mapUserPoolData(poolsData: UserPoolDataInterface, decimals: BigNumber, poolStats: PoolStats): UserPoolData {
    return new UserPoolData(
      Utils.hexToNumber(poolsData.poolID),
      Utils.hexToNormalisedNumber(poolsData.totalStakedBalance, decimals),
      Utils.hexToNormalisedNumber(poolsData.userAvailableBalance, decimals),
      Utils.hexToNormalisedNumber(poolsData.userStakedBalance, decimals),
      Utils.hexToNormalisedNumber(poolsData.userTotalBalance, decimals),
      poolStats
  );
  }

  public static mapUserVote(vote: any): Vote {
    return new Vote(
      Utils.hexToNormalisedNumber(vote.against),
      Utils.hexToNormalisedNumber(vote.for)
    );
  }

  public static mapVotersCount(votersCount: any): VotersCount {
    return new VotersCount(
      Utils.hexToNormalisedNumber(votersCount.against_voters),
      Utils.hexToNormalisedNumber(votersCount.for_voters)
    );
  }

  public static mapProposalList(proposals: any[]): Proposal[] {
    return proposals.map(proposal => {
      return new Proposal(
        Utils.hexToNormalisedNumber(proposal.against),
        Utils.hexToNumber(proposal.against_voter_count),
        Utils.uriDecodeIfEncodedUri(proposal.description),
        Utils.hexToNumber(proposal["end day"]),
        Utils.hexToNormalisedNumber(proposal.for),
        Utils.hexToNumber(proposal.for_voter_count),
        Utils.hexToNumber(proposal.id),
        Utils.hexToNormalisedNumber(proposal.majority),
        proposal.name,
        proposal.proposer,
        Utils.hexToNormalisedNumber(proposal.quorum),
        Utils.hexToNumber(proposal["start day"]),
        proposal.status,
        Utils.hexToNumber(proposal["vote snapshot"]),
        decodeURI(proposal.forum)
      );
    }).sort((a, b) => b.startDay.minus(a.startDay).toNumber());
  }
}
