## À quoi ça sert

Après un déploiement, le site met quelques secondes (parfois minutes) à répondre. Lancer les tests de bout en bout trop tôt les fait échouer pour une mauvaise raison. Ce script attend qu'une URL réponde, en réessayant à intervalle croissant, puis rend la main.

## Avant de commencer

- L'URL à surveiller (page d'accueil, route de santé `/health`, API).
- Node.js 18 ou plus.

## Pas à pas

1. Attendez jusqu'à 2 minutes :
   ```bash
   node src/wait-for-url.mjs https://staging.exemple.com/health --timeout 120
   ```
2. Par défaut, tout code 2xx convient ; précisez-en d'autres avec `--expect 200,301`.
3. Enchaînez la suite seulement si le script réussit.

## Lire le résultat

Chaque essai est affiché (`HTTP 503`, `ECONNREFUSED`, `délai dépassé`). Code de sortie 0 dès que l'URL répond, 2 si le délai est dépassé.

## L'automatiser

```yaml
- run: node src/wait-for-url.mjs "$PREVIEW_URL/health" --timeout 180 --quiet
- run: npm run test:e2e
```

## Pièges à éviter

- Surveillez une route qui reflète la **vraie** santé (base de données incluse), pas seulement une page statique.
- Un délai trop court déclenchera de fausses alertes sur un démarrage à froid ; un délai trop long masque un vrai problème.
