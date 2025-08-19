import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.KAFKA,
		options: {
			client: {
				clientId: process.env.KAFKA_CLIENT_ID || 'etl-promotion-service',
				brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
			},
			consumer: {
				groupId: process.env.KAFKA_GROUP_ID || 'etl-promotion-consumer'
			}
		}
	})

	await app.startAllMicroservices()
	await app.listen(3000)
}

bootstrap()
