<template>
  <footer class="border-t border-line bg-surface text-sm text-ink-secondary">
    <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <p>Data from Yahoo Finance, CoinGecko and FRED. May be delayed. Not investment advice.</p>
        <a
          href="https://buzz-was-here.vercel.app/"
          target="_blank"
          rel="noopener"
          class="hover:text-ink hover:underline"
        >
          buzz.was.here
        </a>
      </div>
      <!-- FRED's API terms require this notice wherever its data appears. It lives in the footer
           so it stays visible on every page and while the Economy section is collapsed. -->
      <ol class="text-xs text-ink-muted" aria-label="Footnotes">
        <li id="fred-notice" class="scroll-mt-20">
          <sup>1</sup> This product uses the FRED® API but is not endorsed or certified by the
          Federal Reserve Bank of St. Louis.
        </li>
      </ol>
    </div>
  </footer>
</template>
