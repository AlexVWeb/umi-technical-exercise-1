# Documentation Technique (N8N & Supabase)

Ce document décrit l'organisation des workflows d'automatisation, la modélisation des données, les choix techniques entrepris, ainsi que les perspectives d'évolution pour un environnement de production.

## 1. Organisation des Workflows

L'automatisation a été divisée en plusieurs **workflows distincts**, regroupés par champ de responsabilité (principe de micro-services) :

*   **Gestion Utilisateurs (`workflow_users.json`)** : Interroge l'API Random User, vérifie la robustesse du mot de passe (via Regex), sécurise le mot de passe (hachage SHA3-512 + sel cryptographique) et insère l'utilisateur en prévenant les doublons (par vérification de l'email).
*   **Authentification (`workflows_auth.json`)** : Point d'entrée pour la connexion utilisateur (`POST /auth/login`). Le webhook valide la correspondance du hash du mot de passe et émet en cas de succès un token JWT signé contenant l'ID du sujet (`sub`), valide 1 heure.
*   **Articles (`workflow_articles.json` & `worflow_update_article.json`)** : Gère la création et la modification. Protégé par JWT, ce workflow garantit le principe d'**Ownership** : un utilisateur (reconnu par son token, via `subject`) ne peut créer, modifier ou interagir qu'avec les articles qui lui appartiennent.
*   **Favoris (`workflow_add_favori.json` & `workflow_list_articles_favoris.json`)** : Gère les interactions relatives aux articles mis en favoris. Effectue des vérifications croisées : l'utilisateur et l'article doivent exister, et la relation ne doit pas déjà être présente (pour éviter les doublons). Pour la lecture, une boucle itère pour récupérer et enrichir les données des articles concernés.

## 2. Modélisation des Données (Supabase)

Une base de données relationnelle **PostgreSQL** a été choisie (hébergée via Supabase) pour assurer une forte cohérence des données et l'intégrité référentielle qui en découle.

### Structure
*   **Table `users`** : Enregistre les métadonnées (`firstname`, `lastname`, `email`) et l'accès sécurisé (`password`, `salt`). L'email possède une contrainte d'unicité (`UNIQUE`) native en base de données pour empêcher la création de doublons.
*   **Table `articles`** : Contient le titre et le contenu (`title`, `body`). Une contrainte de clé étrangère `user_id` la relie à son créateur (`users.id`).
*   **Table pivot `favorites_articles`** : Gère la relation "Many-To-Many". Un article peut être favori de multiples utilisateurs, et un utilisateur peut avoir de multiples articles en favori. Elle possède deux clés étrangères : `user_id` et `article_id`.

### Contournement des Doublons
*   **Utilisateurs** : La base de données applique une contrainte stricte (`UNIQUE`) sur la colonne `email` de la table `users`, rendant impossible la création de doublon. Le workflow N8N effectue conjointement une protection algorithmique "douce" (nœud "Get" + condition) pour intercepter le cas proprement avant l'échec d'insertion SQL.
*   **Favoris** : Gérés algorithmiquement depuis le workflow N8N en vérifiant l'existence avant insertion (nœud "Get" + if empty condition). Il n'y a pas de binôme `{user_id, article_id}` en double pour les favoris.

## 3. Choix Techniques, Hypothèses et Compromis

*   **Sécurité des mots de passe** : Les mots de passe ne sont jamais stockés en clair. Un `salt` (grain de sel) aléatoire est généré par utilisateur et ajouté au mot de passe de base, le tout haché en cryptographie unidirectionnelle **SHA3-512** avant stockage. Lors de l'authentification (Login), l'opération est refaite afin de valider une équivalence de hash.
*   **Autorisations par Jetons JWT** : Le flux JWT transmet l'identité (`sub=user_id`). Les autres requêtes doivent présenter un `Authorization: Bearer <token>` valide. Les workflows procèdent systématiquement au croisement entre les variables de requêtes (Body, params) et les données du *sujet* du JWT pour rejeter les accès frauduleux avec un status `HTTP 403 Forbidden` ou `401 Unauthorized`.
*   **Enrichissement depuis N8N vs SQL (N+1)** : Afin de démontrer les capacités de boucles logiques dans N8N, l'enrichissement des données pour la liste de favoris (ex: récupérer le titre/body à partir des ID) est effectué par le nœud *Loop Over Items*. Dans une base de données pure, cela aurait pu être résolu par un simple `JOIN`. C'est un **compromis technique**.

## 4. Limitations Constatées

1. **Performances du N+1 queries** : Le processus de "boucling" dans N8N sur les articles favorisés génère un nombre important de requêtes HTTP à l'API Supabase. Si l'utilisateur possède 50 favoris, le nœud effectuera 50 appels REST individuels.
2. **Race Conditions & Atomicité** : La protection contre les doublons via les workflows N8N ("vérifier l'existence, puis insérer") peut être mise à défaut en cas de requêtes hautement concurrentes (arrivant à quelques millisecondes d'intervalle). En effet, il n'y a pas de verrou de transaction de bout en bout avec ce schéma.

## 5. Perspectives d'Évolution (Production)

Pour passer d'un prototype à une architecture Cloud robuste prête pour la production :

1.  **Déléguer la totalité de la contrainte des doublons à la base de données (SQL Strict)** : L'email étant déjà nativement sous contrainte `UNIQUE` sur `users`, il conviendrait de parfaire le modèle en ajoutant `UNIQUE(user_id, article_id)` sur la table `favorites_articles`. Même en concurrence parfaite, la base s'auto-protégera (et N8N rattrapera l'erreur SQL pour alerter le client de façon ciblée, au lieu de devoir scripter des lectures préalables).
2.  **Optimisation avec Vues PostgreSQL ou jointures API natives** : Utiliser l'API REST de Supabase de façon plus poussée via les requêtes en Select imbriqués (ex: `select=*,articles(*)` via l'URL API) ou en créant une Vue (`View`) SQL afin d'obtenir tous les favoris avec contenus enrichis **en une seule requête réseau N8N**.
3.  **Renouvellement automatique JWT** : Au lieu d'avoir un simple délai fixe ("Le Token expire après une heure"), implémenter le concept de `Refresh Token` pour maintenir l'utilisateur connecté sans compromettre la sécurité en cas de vol du JWT.
4.  **Batching Import** : Si l'API "Random User" est sollicitée agressivement, utiliser un script Node / AWS Lambda asynchrone pour les ingestions de gros volume (ou gérer les imports via des queues), pour éviter les Timeouts éventuels du process Webhook principal.
