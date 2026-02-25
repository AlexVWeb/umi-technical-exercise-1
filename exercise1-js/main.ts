/**
 * Une fonction asynchrone simulée qui imite un appel API.
 * @param {number} id - L'identifiant de la requête.
 * @returns {Promise<string>} Une promesse qui se résout avec une chaîne de résultat.
 */
const fakeFetch = (id: number): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(`result ${id}`), 100));

/**
 * Options de configuration pour le limiteur de débit.
 */
interface RateLimitOptions {
  /** Nombre maximum de requêtes autorisées dans la fenêtre de temps. */
  maxRequests: number;
  /** La fenêtre de temps en millisecondes. */
  perMilliseconds: number;
}

/**
 * Crée une version limitée en débit de la fonction fetch fournie.
 * 
 * Cette implémentation utilise une file d'attente et une fenêtre glissante d'horodatages
 * pour garantir le respect strict de la limite, en traitant les requêtes dans l'ordre (FIFO).
 *
 * @template TArgs - Les types des arguments de la fonction fetch.
 * @template TResult - Le type de retour de la fonction fetch.
 * @param {(...args: TArgs) => Promise<TResult>} fetchFn - La fonction asynchrone originale à limiter.
 * @param {RateLimitOptions} options - Configuration pour la limitation de débit.
 * @returns {(...args: TArgs) => Promise<TResult>} Une fonction wrapper limitant le débit.
 */
function createRateLimitedFetcher<TArgs extends any[], TResult>(
  fetchFn: (...args: TArgs) => Promise<TResult>,
  { maxRequests, perMilliseconds }: RateLimitOptions,
): (...args: TArgs) => Promise<TResult> {
  // Valider les entrées pour éviter les erreurs d'exécution ou les boucles infinies.
  if (maxRequests <= 0 || perMilliseconds <= 0) {
    throw new Error("RateLimitOptions doit avoir des valeurs positives pour maxRequests et perMilliseconds.");
  }

  // File d'attente pour conserver les requêtes en attente.
  const queue: Array<{
    args: TArgs;
    resolve: (value: TResult | PromiseLike<TResult>) => void;
    reject: (reason?: any) => void;
  }> = [];

  // Historique des horodatages d'exécution pour la fenêtre actuelle.
  const timestamps: number[] = [];

  // Référence du minuteur pour la prochaine tentative de traitement planifiée.
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Tente de traiter la prochaine requête dans la file d'attente.
   * Si la limite de débit le permet, exécute la requête immédiatement.
   * Sinon, planifie une nouvelle tentative lorsque la plus ancienne requête expire.
   */
  const processQueue = () => {
    const now = Date.now();

    // 1. Nettoyer l'historique : Supprimer les horodatages plus vieux que la fenêtre.
    // Optimisation : Puisque les horodatages sont ordonnés, on peut juste regarder le début.
    while (timestamps.length > 0 && timestamps[0] <= now - perMilliseconds) {
      timestamps.shift();
    }

    // 2. Traiter les requêtes tant que nous avons de la capacité.
    while (queue.length > 0 && timestamps.length < maxRequests) {
      const item = queue.shift();
      if (!item) break; // Ne devrait pas arriver vu la vérification ci-dessus, mais par sécurité.

      const { args, resolve, reject } = item;

      // Enregistrer l'heure d'exécution.
      timestamps.push(Date.now());

      // Exécuter la fonction originale.
      // Nous l'enveloppons dans un try/catch (ou Promise.resolve) pour assurer la sécurité,
      // bien que la chaîne de promesses le gère naturellement.
      fetchFn(...args)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          // Optionnel : Si nous voulions "libérer" la concurrence basée sur la complétion, nous le ferions ici.
          // Mais ici, la limitation est basée sur l'heure de *début* (leaky bucket / fenêtre glissante),
          // donc le temps de complétion n'affecte pas directement le planning.
        });
    }

    // 3. Planifier le prochain traitement s'il reste des éléments dans la file d'attente.
    if (queue.length > 0) {
      if (timeoutId) clearTimeout(timeoutId);

      // Calculer quand le prochain créneau se libère.
      // Le plus vieil horodatage plus la durée de la fenêtre est le moment où ce créneau expire.
      const oldestTimestamp = timestamps[0];
      const nextSlotTime = oldestTimestamp + perMilliseconds;
      const delay = Math.max(0, nextSlotTime - Date.now());

      timeoutId = setTimeout(processQueue, delay);
    }
  };

  /**
   * La fonction wrapper renvoyée à l'appelant.
   */
  return function (...args: TArgs): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      // Mettre la requête en file d'attente.
      queue.push({ args, resolve, reject });

      // Tenter de traiter immédiatement.
      processQueue();
    });
  };
}

// --- Exécution Principale ---

function main() {
  console.log("Démarrage de la démo du Fetcher à Débit Limité...");
  console.log(`Heure : ${new Date().toISOString()}`);

  const limitedFetch = createRateLimitedFetcher(fakeFetch, {
    maxRequests: 2,
    perMilliseconds: 2000,
  });

  const logResult = (id: number) => (res: string) => {
    console.log(`[${new Date().toISOString()}] Terminé : ${res}`);
  };

  // Envoyer 5 requêtes immédiatement.
  // Attendu : 1 & 2 immédiatement, 3 & 4 après 2s, 5 après 4s.
  limitedFetch(1).then(logResult(1));
  limitedFetch(2).then(logResult(2));
  limitedFetch(3).then(logResult(3));
  limitedFetch(4).then(logResult(4));
  limitedFetch(5).then(logResult(5));
}

main();
