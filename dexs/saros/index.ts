import { SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

import fetchURL from "../../utils/fetchURL"

const endpoints = {
  [CHAIN.SOLANA]: "https://api.saros.finance/info",
};

const graphs = (chain: string) => async (timestamp: number) => {
  let res;
  switch (chain) {
    case CHAIN.SOLANA:
      res = await fetchURL(endpoints[CHAIN.SOLANA]);
    default:
      res = await fetchURL(endpoints[CHAIN.SOLANA]);
  }

  return {
    timestamp,
    dailyVolume: res.data.volume24h,
    totalVolume: res.data.totalvolume,
  };
};

// @TODO check and backfill
const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.SOLANA]: {
      fetch: graphs(CHAIN.SOLANA),
      runAtCurrTime: true,
      customBackfill: undefined,
      start: async () => 0,
    },
  },
};
export default adapter;
