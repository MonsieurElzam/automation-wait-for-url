#!/usr/bin/env node
/* Attend qu'une URL réponde (déploiement, base, API) avant de poursuivre : utile entre deux étapes d'une CI.
   Réessaie à intervalle croissant jusqu'à la limite de temps. */
import { isMain, parseArgs, usage, fail } from '../lib/cli.mjs'

const realSleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** `expect` : liste de codes exacts (200) ou de classes (2xx). */
export function matchesStatus(status, expect = ['2xx']) {
  return expect.some((e) => (/^\dxx$/i.test(e) ? Math.floor(status / 100) === Number(e[0]) : Number(e) === status))
}

export async function waitFor(url, { timeout = 60_000, interval = 2_000, maxInterval = 15_000, expect = ['2xx'], fetchImpl = fetch, sleep = realSleep, now = Date.now, onTry = () => {} } = {}) {
  const started = now()
  let attempt = 0
  let last = 'aucune réponse'
  let wait = interval
  while (now() - started <= timeout) {
    attempt++
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), Math.min(10_000, Math.max(1_000, timeout)))
      const res = await fetchImpl(url, { signal: ctrl.signal, redirect: 'follow' }).finally(() => clearTimeout(timer))
      last = `HTTP ${res.status}`
      onTry(attempt, last)
      if (matchesStatus(res.status, expect)) return { ok: true, attempts: attempt, last, elapsed: now() - started }
    } catch (e) { last = e.name === 'AbortError' ? 'délai dépassé' : (e.cause?.code ?? e.message); onTry(attempt, last) }
    await sleep(wait)
    wait = Math.min(Math.round(wait * 1.5), maxInterval)
  }
  return { ok: false, attempts: attempt, last, elapsed: now() - started }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['help', 'quiet'])
  usage(`
Usage : node src/wait-for-url.mjs <url> [--timeout 60] [--interval 2] [--expect 200,3xx] [--quiet]
Durées en secondes. Par défaut, tout code 2xx convient. Code de sortie 0 dès que l'URL répond, 2 si le délai est dépassé.`, args, 1)
  const expect = String(args.expect ?? '2xx').split(',').map((s) => s.trim())
  const r = await waitFor(args._[0], {
    timeout: Number(args.timeout ?? 60) * 1000, interval: Number(args.interval ?? 2) * 1000, expect,
    onTry: (n, msg) => { if (!args.quiet) console.log(`  essai ${n} : ${msg}`) },
  })
  if (!Number.isFinite(r.elapsed)) fail('paramètres de durée invalides.')
  console.log(r.ok ? `✓ ${args._[0]} répond (${r.last}) après ${r.attempts} essai(s), ${(r.elapsed / 1000).toFixed(1)} s.` : `✗ ${args._[0]} ne répond pas après ${(r.elapsed / 1000).toFixed(0)} s (${r.last}).`)
  process.exit(r.ok ? 0 : 2)
}
