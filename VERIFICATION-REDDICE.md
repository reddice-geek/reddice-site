# REDDICE — rapport de vérification locale

## Changements intégrés
- Harmonisation responsive partagée via `site-polish.css` sur les pages HTML du site.
- Console admin sécurisée par `ADMIN_PASSWORD` : ajout, modification (début/fin, jeu, description) et suppression du planning ; modération des avis (en attente, publié, refusé) ; traitement et suppression des contacts.
- `/api/contact` enregistre les messages dans Supabase et ne renvoie plus une fausse confirmation de succès en mode mémoire temporaire.
- `/api/guestbook` stocke les nouveaux avis en attente et ne retourne publiquement que les avis approuvés.
- `/api/planning` expose les futurs créneaux au planning public sans autoriser leur modification.
- Fichier `supabase-migration-reddice.sql` et guide `INSTALLATION-REDDICE.md` inclus.

## Vérifications effectuées
- Parsing de 11 pages HTML.
- Vérification de syntaxe de tous les scripts JavaScript inline et de 7 fonctions API.
- Validation des fichiers JSON `vercel.json`, `data/planning.json` et `data/games.json`.
- Tests API avec réponses Supabase simulées : garde d’accès admin, création et validation des dates du planning, sauvegarde contact, avis pending, fallback de l’ancienne table du Livre d’or et filtre d’approbation public.

## Limite restante
Ces tests sont locaux et simulent les réponses de Supabase. La persistance en production nécessite d’exécuter la migration SQL, de vérifier les variables d’environnement Vercel et de faire un test réel sur le projet Supabase associé. Aucun identifiant de production n’a été utilisé ici.
