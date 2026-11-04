/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getQuoteHistory, historyMaxAgeSeconds, isTimeframe } from './_market-core.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const params = new URL(req.url ?? '', 'http://localhost').searchParams
  const id = params.get('id')
  const timeframe = params.get('timeframe')
  res.setHeader('Content-Type', 'application/json')

  if (!id || !isTimeframe(timeframe)) {
    res.statusCode = 400
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: 'Expected id and a valid timeframe' }))
    return
  }

  try {
    const history = await getQuoteHistory(id, timeframe)
    if (!history) {
      res.statusCode = 404
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ error: 'Unknown instrument' }))
      return
    }
    const maxAge = historyMaxAgeSeconds(timeframe)
    res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`)
    res.end(JSON.stringify(history))
  } catch {
    res.statusCode = 502
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: 'History source unavailable' }))
  }
}
