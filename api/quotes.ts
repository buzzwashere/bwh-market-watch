/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getMarketSnapshot, hasAnyQuote } from './_market-core.js'

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const snapshot = await getMarketSnapshot()
  const healthy = hasAnyQuote(snapshot)
  res.statusCode = healthy ? 200 : 502
  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Cache-Control',
    healthy ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
  )
  res.end(JSON.stringify(snapshot))
}
