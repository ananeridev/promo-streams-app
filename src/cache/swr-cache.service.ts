import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'

export type LoaderFn<T> = () => Promise<T>

@Injectable()
export class SwrCacheService {
	private readonly redis: Redis
	private readonly ttlSeconds: number
	private readonly staleAfterSeconds: number

	constructor() {
		this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
		this.ttlSeconds = Number(process.env.SWR_TTL_SECONDS || 300)
		this.staleAfterSeconds = Number(process.env.SWR_STALE_AFTER_SECONDS || 20)
	}

	async getWithSWR<T>(key: string, loader: LoaderFn<T>): Promise<{ data: T; cache: 'MISS' | 'HIT' | 'STALE' }> {
		const raw = await this.redis.get(key)
		const isFresh = await this.redis.exists(this.freshKey(key))

		if (!raw) {
			const data = await loader()
			await this.set(key, data)
			return { data, cache: 'MISS' }
		}

		const data = JSON.parse(raw) as T
		if (isFresh) {
			return { data, cache: 'HIT' }
		}
		
		this.revalidate(key, loader).catch(() => void 0)
		return { data, cache: 'STALE' }
	}

	async bustFreshness(key: string): Promise<void> {
		await this.redis.del(this.freshKey(key))
	}

	private async set<T>(key: string, data: T): Promise<void> {
		await this.redis.set(key, JSON.stringify(data), 'EX', this.ttlSeconds)
		await this.redis.set(this.freshKey(key), '1', 'EX', this.staleAfterSeconds)
	}

	private freshKey(key: string): string {
		return `${key}:fresh`
	}

	private async revalidate<T>(key: string, loader: LoaderFn<T>): Promise<void> {
		const freshLock = `${key}:reval:lock`
		const acquired = await this.redis.set(freshLock, '1', 'NX', 'EX', 10)
		acquired ? await this.set(key, await loader()) : null
	}
}
