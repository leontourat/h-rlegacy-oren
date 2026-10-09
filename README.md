# H&R Legacy — catalogue filtrable, sans essais

1. Dans Cloudflare D1, exécuter une seule fois `migration-filtres.sql`. Si les colonnes existent déjà, ne pas relancer.
2. Dans Cloudflare Workers, déployer `worker.js` (conserver le binding `DB` et le secret `ADMIN_CODE`).
3. Sur GitHub Pages, remplacer les fichiers du site par les fichiers HTML et le dossier `assets/`. Supprimer l’ancienne page `rendez-vous.html` du dépôt.
4. Dans l’administration, renseigner **places** et **poids coffre (kg)** sur les véhicules existants : la migration leur attribue 0 par défaut.

Le Worker ne propose plus les routes de création/gestion de rendez-vous, mais conserve la table historique `appointments` et détache les anciens rendez-vous lorsqu’un véhicule est supprimé.

Filtres disponibles : recherche, catégorie, disponibilité, prix min/max, places min/max, poids coffre min/max. Les filtres se combinent.
