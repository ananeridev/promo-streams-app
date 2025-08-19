export type IncomingPromotionEvent = {
	eventId: string
	type: 'CREATED' | 'UPDATED'
	payload: {
		id: string
		title: string
		description?: string
		status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
		startsAt: string
		endsAt?: string
		updatedAt?: string
		tenantId?: string
	}
	occurredAt?: string
}

export type NormalizedPromotion = {
	id: string
	title: string
	description?: string
	status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
	startsAt: Date
	endsAt?: Date | null
	updatedAt: Date
	tenantId?: string | null
}

export function normalizePromotion(e: IncomingPromotionEvent): NormalizedPromotion {
	const p = e.payload
	return {
		id: p.id,
		title: p.title.trim(),
		description: p.description?.trim() || undefined,
		status: p.status,
		startsAt: new Date(p.startsAt),
		endsAt: p.endsAt ? new Date(p.endsAt) : null,
		updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
		tenantId: p.tenantId || null
	}
}

export function isActive(now: Date, p: NormalizedPromotion): boolean {
	const inWindow = p.startsAt <= now && (p.endsAt ? now <= p.endsAt : true)
	return p.status === 'ACTIVE' && inWindow ? true : false
}
