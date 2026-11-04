<template>
  <article class="flex max-w-2xl flex-col gap-4">
    <h1 class="text-2xl font-semibold tracking-tight">About</h1>
    <p>
      Market Watch shows the current level of the major stock, bond, and crypto benchmarks, and
      refreshes every minute while the tab is visible.
    </p>
    <h2 class="text-lg font-semibold">Where the numbers come from</h2>
    <ul class="flex list-disc flex-col gap-2 pl-5">
      <li>Stock indices, Treasury yields, and bond ETFs come from Yahoo Finance.</li>
      <li>Crypto prices and total market cap come from CoinGecko.</li>
    </ul>
    <h2 class="text-lg font-semibold">How to read the cards</h2>
    <ul class="flex list-disc flex-col gap-2 pl-5">
      <li>Stock and bond changes are measured against the previous close.</li>
      <li>Crypto trades around the clock, so its changes cover the last 24 hours.</li>
      <li>
        Treasury cards show the yield and its move in basis points. A rising yield means falling
        bond prices, so those moves are not colored as gains or losses.
      </li>
      <li>
        Bond index levels are not freely available, so ETFs that track those markets stand in for
        them.
      </li>
      <li>
        Each chart covers 1 week, 30 days, or the last year, and history comes from Yahoo Finance.
        The change beside it runs from the first point in the chart to the last.
      </li>
      <li>
        Total crypto market cap has no free history, so that card charts the Bitwise 10 Crypto Index
        ETF (BITW) instead. It shows the direction of large coins, not the market cap itself.
      </li>
    </ul>
    <p class="text-sm text-ink-secondary">
      Quotes may be delayed and are for information only. This is not investment advice.
    </p>
  </article>
</template>
