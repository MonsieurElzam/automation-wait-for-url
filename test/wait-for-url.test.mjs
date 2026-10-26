import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sample = (n) => readFileSync(new URL(`../samples/${n}`, import.meta.url), 'utf8')
const mod = (n) => import(`../src/${n}.mjs`)
const run = (n, args = []) => spawnSync(process.execPath, [fileURLToPath(new URL(`../src/${n}.mjs`, import.meta.url)), ...args], { encoding: 'utf8' })
const samplePath = (n) => fileURLToPath(new URL(`../samples/${n}`, import.meta.url))

test('21 attente d\'URL : réessais, délai dépassé, classes de statut', async () => {
  const { waitFor, matchesStatus } = await mod('wait-for-url')
  assert.ok(matchesStatus(204, ['2xx'])); assert.ok(matchesStatus(301, ['200', '3xx'])); assert.ok(!matchesStatus(503, ['2xx']))
  let t = 0; const now = () => t; const sleep = async (ms) => { t += ms }
  const codes = [503, 503, 200]; let i = 0
  const ok = await waitFor('http://x', { fetchImpl: async () => ({ status: codes[i++] }), sleep, now, interval: 1000, timeout: 60_000 })
  assert.equal(ok.ok, true); assert.equal(ok.attempts, 3)
  const fail = await waitFor('http://x', { fetchImpl: async () => { throw Object.assign(new Error('x'), { cause: { code: 'ECONNREFUSED' } }) }, sleep, now: (() => { let c = 0; return () => (c += 1000) })(), interval: 1000, timeout: 5000 })
  assert.equal(fail.ok, false); assert.equal(fail.last, 'ECONNREFUSED')
})
