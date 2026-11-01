# REDDICE — Refonte cyberpunk V2

## Ce qui change

- Navigation unique sur toutes les pages : l'ancien menu React présent dans chaque page est repéré à partir des libellés réels (Accueil, Bio, Setup PCB RGB, Mes Jeux, Planning, Livre d’or, Contact, etc.) puis masqué. La détection ne dépend plus d'une liste d'URL rigide, ce qui corrige notamment les variantes de liens sur Setup.
- Navigation mobile sous forme de panneau repliable, fermeture après sélection, avec Échap et clic extérieur.
- En-tête et pied de page communs sur les pages publiques, les pages légales, le plan du site, la 404 et la console d'administration.
- Bannière d'introduction conçue pour chaque page : texte à la première personne, couleur d'accent dédiée, tags et liens rapides.
- Harmonisation des composants de chaque page : typographie, cartes, bordures, formulaires, boutons, espacements, grilles et effets de survol.
- Apparitions douces des sections au défilement, jauge de progression et animations décoratives. Les animations sont désactivées si l'utilisateur préfère réduire les mouvements.
- Maintien des contenus React existants, de la bibliothèque de jeux, du planning administrable, du livre d'or, du formulaire de contact, des rediffusions et des fonctions Twitch.

## Lecteur Twitch

Le script de correction garde un fonctionnement idempotent : il vérifie `parent`, `channel`, `muted` et `autoplay`, puis ne modifie `iframe.src` que si un paramètre est incorrect ou manquant. Il n'y a pas de réaffectation périodique de l'URL, ce qui évite de forcer le rechargement du lecteur en boucle.

## Fichiers fonctionnels préservés

Les API, données JSON, `vercel.json`, `script.js` et le script `cyberpunk-fixes.js` de la version précédente ont été conservés. Les changements principaux de cette V2 sont dans `site-enhancements.js` et `site-polish.css`.

## Contrôles effectués

- Syntaxe JavaScript vérifiée avec Node.js pour les scripts partagés.
- Feuille CSS vérifiée : aucune erreur de parsing.
- Présence de la feuille de style et du script communs vérifiée sur toutes les pages HTML du site.
- Les fichiers API, les fichiers de données et la configuration Vercel ont été comparés : ils sont inchangés.

La prévisualisation complète du navigateur et le test du lecteur Twitch sur le domaine de production doivent encore être faits après déploiement. Twitch exige que le domaine réel figure dans le paramètre `parent`.
## Mise à jour géographique — Bourges (Cher, 18)
Les références géographiques du site indiquent désormais Bourges et le Cher (18). Les coordonnées géographiques détaillées ont été retirées de l’affichage au profit de la seule localisation déclarée.
