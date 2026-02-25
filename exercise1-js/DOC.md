# ADR - Rate Limited Fetch Wrapper

**Date:** 2026-02-16
**Status:** Implémenté
**Scope:** Node.js (Single Process)

## Contexte

Intégration d'APIs tierces soumises à des quotas stricts (Rate Limits). Le dépassement de ces limites entraîne des erreurs `429 Too Many Requests` ou des bannissements temporaires.

Nous devons standardiser l'accès à ces ressources en amont (client-side throttling) pour garantir la fiabilité du système, sans complexifier le code métier avec des `setTimeout` ou des retries manuels.

## Architecture

Le choix s'est porté sur une implémentation **Stateful Wrapper** utilisant le pattern **Sliding Window Log**.

### Pourquoi pas un simple compteur (Fixed Window) ?

Les compteurs réinitialisés à intervalles fixes (ex: à chaque seconde pile) autorisent des "bursts" doublés aux frontières des intervalles (ex: 10 requêtes à 0.9s et 10 requêtes à 1.1s = 20 requêtes en 200ms). C'est inacceptable pour des APIs strictes.
Le **Sliding Window** lisse la charge et garantit le respect du contrat API à la milliseconde près.

### Design Patterns

* **Factory (HOC)**: `createRateLimitedFetcher` retourne une nouvelle fonction, encapsulant l'état (queue, history) dans une closure. Isolation totale entre différents rate limiters.
* **Promise Queueing**: Les appels excédentaires ne sont pas rejetés (Drop) mais mis en attente (Buffer). L'appelant reçoit une `Promise` qui ne sera résolue que lorsque le slot sera disponible. C'est transparent pour le code appelant.

## Implémentation & Compromis (Trade-offs)

### 1. Gestion de la Mémoire

On stocke les timestamps des requêtes passées (`Array<number>`).

* *Risque:* Fuite mémoire sur des uptime longs ?
* *Mitigation:* Nettoyage proactif (Garbage Collection) à chaque cycle d'exécution (`timestamps.shift()`). La complexité spatiale est `O(maxRequests)`, ce qui est négligeable pour des cas d'usage typiques (< 10k req/sec).

### 2. Précision Temporelle (`Date.now` vs `process.hrtime`)

* *Décision:* Utilisation de `Date.now()` et `setTimeout`.
* *Justification:* JavaScript n'est pas temps réel. La précision de `setTimeout` (~1-4ms d'overhead) est largement suffisante pour des rate limits d'API réseau (> 50ms). `hrtime` ajouterait de la complexité inutile.

### 3. Fail Fast & Résilience

* La configuration est validée au démarrage (constructeur). On plante l'app au boot plutôt que d'avoir un comportement indéfini en production avec des valeurs négatives.
* **Error Handling:** Si l'API throw, la promesse wrapper propage l'erreur *mais* continue de traiter la queue. Un crash d'un appel ne doit pas bloquer le pipeline.

## Limitations Connues

* **Single-Process Only**: Cette implémentation stocke l'état en mémoire locale.
  * *Impact:* Si l'application scale horizontalement sur plusieurs instances ou conteneurs, le rate limit global sera `maxRequests * nb_instances`.
  * *Solution Scaling:* Pour un rate limit distribué strict, il faudra migrer vers un store externe (Redis) avec script Lua (pattern "Leaky Bucket" distribué).

## Utilisation

```typescript
// Initialisation (Singleton conseillé par API cible)
const protectedApi = createRateLimitedFetcher(unsafeApiFn, {
  maxRequests: 5,
  perMilliseconds: 1000 // 5 req/sec
});

// Appel standard - le throttling est transparent
try {
  const data = await protectedApi("/users");
} catch (err) {
  // Gérer l'erreur API classique
}
```
