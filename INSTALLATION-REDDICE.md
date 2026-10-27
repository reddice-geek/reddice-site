# REDDICE — mise en service des fonctionnalités admin

## 1. Variables Vercel
Dans **Project Settings → Environment Variables**, vérifier les trois variables suivantes :

- `ADMIN_PASSWORD` : mot de passe choisi pour la console admin.
- `SUPABASE_URL` : URL du projet Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` : clé **service_role**, uniquement côté serveur (ne jamais la mettre dans le HTML ou dans une variable préfixée `NEXT_PUBLIC_`).

Redéployer après toute modification de variable.

## 2. Migration Supabase obligatoire
Dans **Supabase → SQL Editor**, exécuter le fichier `supabase-migration-reddice.sql`. Il prépare la table du planning, le statut des contacts et les états de modération des avis. Les avis déjà présents restent publiés par défaut ; les nouveaux avis sont en attente de validation.

Si le projet utilise une ancienne table de Livre d’or nommée `guestbook`, le script prépare également cette table si elle existe. Vérifier ensuite que les colonnes `id`, `name` et `message` y sont déjà présentes.

## 3. Console admin
Ouvrir `/admin` (redirige maintenant vers la vraie console de gestion) ou `/admin-tools.html`, saisir le mot de passe `ADMIN_PASSWORD`, puis charger la section voulue. Les onglets Planning, Contacts et Avis chargent les données réelles via `/api/admin-manage`. La page `/admin.html` ne contient plus les anciens boutons de démonstration. Le planning permet d’ajouter, modifier et supprimer les streams. Les avis peuvent être publiés, remis en attente, refusés ou supprimés. Les contacts peuvent être marqués comme traités et supprimés. Le planning public est fourni par `/api/planning`.

## 4. Comportement en cas d’erreur
Les formulaires n’affichent une confirmation que si le serveur a bien confirmé l’enregistrement. Sans Supabase configuré ou si l’écriture échoue, l’utilisateur voit un message d’erreur ; les données ne sont pas présentées comme enregistrées.

## 5. Vérifications effectuées
La structure des fichiers et la syntaxe JavaScript ont été vérifiées localement. L’exécution réelle des écritures nécessite les variables et les tables du projet Supabase/Vercel de production.
