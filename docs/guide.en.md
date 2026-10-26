## What it's for

After a deployment, the site takes a few seconds (sometimes minutes) to answer. Running end-to-end tests too early makes them fail for the wrong reason. This script waits for a URL to respond, retrying at growing intervals, then hands control back.

## Before you start

- The URL to watch (home page, a `/health` route, an API).
- Node.js 18 or later.

## Step by step

1. Wait up to 2 minutes:
   ```bash
   node src/wait-for-url.mjs https://staging.example.com/health --timeout 120
   ```
2. By default any 2xx code is fine; specify others with `--expect 200,301`.
3. Chain the next step only if the script succeeds.

## Reading the output

Each attempt is printed (`HTTP 503`, `ECONNREFUSED`, `timeout`). Exit code 0 as soon as the URL responds, 2 if the time limit is exceeded.

## Automating it

```yaml
- run: node src/wait-for-url.mjs "$PREVIEW_URL/health" --timeout 180 --quiet
- run: npm run test:e2e
```

## Pitfalls

- Watch a route that reflects **real** health (database included), not just a static page.
- A timeout that is too short raises false alarms on a cold start; one that is too long hides a real problem.
