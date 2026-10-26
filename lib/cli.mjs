import { pathToFileURL } from 'node:url'

/** Vrai quand le fichier est lancé directement (et non importé par un test). */
export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href
}

/**
 * Analyse minimaliste des arguments : `--cle valeur`, `--drapeau`, `--cle=valeur`.
 * `booleans` liste les options sans valeur. Le reste va dans `_`.
 */
export function parseArgs(argv, booleans = []) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { out._.push(a); continue }
    const [k, inline] = a.slice(2).split(/=(.*)/s)
    if (inline !== undefined) out[k] = inline
    else if (booleans.includes(k)) out[k] = true
    else out[k] = argv[++i]
  }
  return out
}

/** Affiche l'aide et quitte si `--help` ou aucun argument requis. */
export function usage(text, args, minPositional = 0) {
  if (args.help || args._.length < minPositional) {
    console.log(text.trim())
    process.exit(args.help ? 0 : 1)
  }
}

export function fail(message, code = 1) {
  console.error(`Erreur : ${message}`)
  process.exit(code)
}
