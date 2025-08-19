import { Kafka } from 'kafkajs'

async function main() {
	const kafka = new Kafka({
		clientId: process.env.KAFKA_CLIENT_ID || 'etl-producer',
		brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
	})

	const admin = kafka.admin()
	await admin.connect()
	await admin.createTopics({ topics: [{ topic: process.env.TOPIC_PROMOTION_EVENTS || 'promotion_events' }], waitForLeaders: true })
	await admin.disconnect()

	const producer = kafka.producer()
	await producer.connect()

	const now = new Date()
	const msg = {
		eventId: `evt-${Date.now()}`,
		type: 'CREATED',
		payload: {
			id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
			title: 'Welcome Promo',
			status: 'ACTIVE',
			startsAt: new Date(now.getTime() - 60_000).toISOString(),
			endsAt: new Date(now.getTime() + 86_400_000).toISOString(),
			updatedAt: now.toISOString()
		}
	}

	await producer.send({
		topic: process.env.TOPIC_PROMOTION_EVENTS || 'promotion_events',
		messages: [{ value: Buffer.from(JSON.stringify(msg)) }]
	})

	await producer.disconnect()
	console.log('Produced example promotion event')
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
