# REDDICE — Refonte cyberpunk

## Modifications

- Ajout d'une navigation commune sur les pages du site : menu desktop, menu mobile repliable, état actif de la page et fermeture avec Échap.
- Harmonisation du thème sombre cyberpunk : cyan, violet et orange, fonds en grille, panneaux, boutons, archives vidéo et pied de page.
- Ajout d'une introduction à la première personne sur Bio, Setup, Mes jeux et Planning.
- Ajout d'animations de révélation au défilement, avec prise en charge de `prefers-reduced-motion`.
- Conservation des pages applicatives, des données, des API, des formulaires, de la console d'administration et de la configuration existante.

## Correctif du lecteur Twitch

L'ancien script réassignait régulièrement `iframe.src` pendant une boucle de plusieurs secondes. Chaque réaffectation pouvait recharger l'embed et provoquer le clignotement visible.

Le lecteur est maintenant corrigé de façon idempotente : le script vérifie les paramètres `parent`, `channel`, `muted` et `autoplay`, puis ne change `src` que si une valeur doit réellement être corrigée. Le traitement ne relance plus le lecteur à chaque mutation du DOM.

## Mise en ligne

Remplacer les fichiers du site par ceux de cette archive dans le dépôt GitHub, puis laisser Vercel effectuer le déploiement habituel. Les variables d'environnement et les données ne sont pas modifiées.

Le lecteur Twitch doit être testé depuis le domaine de production `reddicestream.com`, car Twitch vérifie le domaine présent dans le paramètre `parent`. La vérification locale de cette archive ne peut pas confirmer l'état réel du stream ou des identifiants API Twitch.
