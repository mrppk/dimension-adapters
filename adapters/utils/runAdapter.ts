import allSettled, { PromiseRejection, PromiseResolution, PromiseResult } from 'promise.allsettled'
import { BaseAdapter, ChainBlocks, DISABLED_ADAPTER_KEY, FetchResult, FetchResultGeneric } from '../types'

const ONE_DAY_IN_SECONDS = 60 * 60 * 24

export interface IRunAdapterResponseFulfilled extends FetchResult {
    chain: string
    startTimestamp: number
}
export interface IRunAdapterResponseRejected {
    chain: string
    timestamp: number
    error: Error
}

export default async function runAdapter(volumeAdapter: BaseAdapter, cleanCurrentDayTimestamp: number, chainBlocks: ChainBlocks) {
    const cleanPreviousDayTimestamp = cleanCurrentDayTimestamp - ONE_DAY_IN_SECONDS
    const chains = Object.keys(volumeAdapter).filter(c => c !== DISABLED_ADAPTER_KEY)
    return allSettled(chains
        .filter(async (chain) => {
            const start = await volumeAdapter[chain].start()
            return start !== undefined && (start <= cleanPreviousDayTimestamp) || (start === 0)
        })
        .map(async (chain) => {
            const fetchFunction = volumeAdapter[chain].customBackfill ?? volumeAdapter[chain].fetch
            try {
                const startTimestamp = await volumeAdapter[chain].start()
                const result: FetchResultGeneric = await fetchFunction(cleanCurrentDayTimestamp - 1, chainBlocks);
                Object.keys(result).forEach(key => {
                    const resultValue = result[key]
                    if (resultValue && Number.isNaN(+resultValue)) delete result[key]
                })
                return Promise.resolve({
                    chain,
                    startTimestamp,
                    ...result
                })
            } catch (e) {
                return Promise.reject({ chain, error: e, timestamp: cleanPreviousDayTimestamp });
            }
        })) as Promise<PromiseResult<IRunAdapterResponseFulfilled, IRunAdapterResponseRejected>[]>
}

const isFulfilled = <T,>(p: PromiseResult<T>): p is PromiseResolution<T> => p.status === 'fulfilled';
const isRejected = <T, E>(p: PromiseResult<T, E>): p is PromiseRejection<E> => p.status === 'rejected';
export const getFulfilledVolumes = <T,>(results: PromiseResult<T>[]) => results.filter(isFulfilled).map(r => r.value)
export const getRejectedVolumes = <T, E>(results: PromiseResult<T, E>[]) => results.filter(isRejected).map(r => r.reason)