/// <reference types="node" />
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  ECONOMY_MAX_AGE_SECONDS,
  EconomyNotConfiguredError,
  getEconomySnapshot,
} from './_economy-core.js'

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  try {
    const snapshot = await getEconomySnapshot()
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${ECONOMY_MAX_AGE_SECONDS}, stale-while-revalidate=${ECONOMY_MAX_AGE_SECONDS}`,
    )
    res.end(JSON.stringify(snapshot))
  } catch (error) {
    const notConfigured = error instanceof EconomyNotConfiguredError
    res.statusCode = notConfigured ? 503 : 502
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        error: notConfigured ? 'not-configured' : 'unavailable',
      }),
    )
  }
}
