# WIP - Promotion Event projetct using ETL Streaming (SWR) + Redis

> Goal: consume `promotion_events` (creation/update), normalize payloads, maintain a *materialized view* of active promotions and expose a GET endpoint with **stale‑while‑revalidate** (Redis). Simple, opinionated and easy to run locally.

---


## Quickstart

1. **Start services**

```bash
docker compose up -d
```

2. **Create topic** `promotion_events` (via Redpanda/rpk)

```bash
bash scripts/kafka-create-topic.sh
```

3. **Install & migrate**

```bash
npm i
npx prisma migrate dev
```

4. **Run API + Kafka consumer (hybrid)**

```bash
npm run start:dev
```

5. **Publish example events**

```bash
npx ts-node ./scripts/produce.ts
```

6. **Use SWR endpoint**

```bash
curl -i http://localhost:3000/promotions/active
```

You'll see `x-cache:` headers with `HIT`/`STALE`/`MISS` and the JSON of active promotions.

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/etl?schema=public"
REDIS_URL="redis://localhost:6379"
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID=
KAFKA_GROUP_ID=
TOPIC_PROMOTION_EVENTS=
SWR_TTL_SECONDS=
SWR_STALE_AFTER_SECONDS=
```

---

## How SWR(state-while-revalidate) works here

* Redis stores two *keys*: `active_promotions` (data) and `active_promotions:fresh` (freshness marker).
* If `:fresh` expired, we return the **stale** value immediately and revalidate in *background*.
* When processing Kafka events, we do `bustFreshness` to force the next read to revalidate.

**Why not native Postgres Materialized View?** It could be used, but here we do *application-level materialization* in a specific table, updated incrementally with each event — this avoids full refresh and is simple to understand.

---

## Routes

* `GET /promotions/active` → `{ items: Array<{ id, title, startsAt, endsAt }> }` with `x-cache: HIT|STALE|MISS`.

---

## Testing

```bash
# Unit tests
npm test

# Tests in watch mode
npm run test:watch

# E2E tests
npm test -- --testPathPattern=e2e
```

---

## Design Notes for me

* **Idempotency**: we use `upsert` with `version` incrementing and `eventId` derived from `updatedAt`. In production, include idempotency keys from the producer.
* **Ordering**: ideally, events should be ordered by `occurredAt` per `promotionId`. If there's *out-of-order*, compare `updatedAt` and ignore old versions.
* **Partitioning**: partition the topic by `promotionId` to ensure key ordering in the consumer.
* **Testing**: unit tests cover transformation and SWR. Simple E2E covers API and DB. A complete E2E with Kafka is trivial via `kafkajs`.
* **Observability**: plug OpenTelemetry later (traces in consumer and cache loader).

---
