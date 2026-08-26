# Organigramme TRUSK

Organigramme interactif — React + Vite, données hébergées sur Supabase, déploiement sur Vercel.

100 personnes, 10 équipes. Consultation ouverte, modification réservée aux comptes administrateurs.

---

## Mise en route — environ 30 minutes

> **Les comptes sont à créer au nom de TRUSK**, pas au nom du prestataire : hébergement, base de données et accès restent ainsi la propriété du client. C'est aussi ce qui permet l'usage commercial du plan Vercel.

### 1. Vercel et la base de données

1. Créer un compte Vercel avec une adresse TRUSK. Le plan Hobby est réservé à un usage non commercial : pour un outil interne d'entreprise, prendre le plan Pro.
2. Pousser ce dossier sur un dépôt Git appartenant à TRUSK.
3. Sur Vercel : **Add New > Project**, importer le dépôt. Vite est détecté automatiquement.
4. Dans l'onglet **Storage** du projet, provisionner **Supabase** depuis le Marketplace. Vercel crée la base et injecte lui-même les variables d'environnement dans le projet — rien à recopier.

Si Supabase est créé de son côté plutôt que via le Marketplace, ajouter à la main dans **Settings > Environment Variables** les valeurs `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, relevées dans **Project Settings > API** de la console Supabase.

> Les variables injectées par le Marketplace peuvent porter d'autres noms (`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`…). Seules celles préfixées `VITE_` sont visibles côté navigateur : au besoin, créer deux variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` reprenant les mêmes valeurs.

### 2. Préparer la base

Depuis l'onglet Storage, ouvrir la console Supabase, puis :

1. **SQL Editor > New query** : coller le contenu de `supabase/schema.sql`, cliquer **Run**.
2. **Authentication > Users > Add user** : créer un compte pour chaque personne autorisée à modifier l'organigramme (Sonali, et toute personne des RH concernée). Cocher « Auto Confirm User ».
3. **Authentication > Providers > Email** : désactiver **Enable email signups**. Sans cela, n'importe qui pourrait se créer un compte et modifier l'organigramme.

### 3. Premier remplissage

Ouvrir l'URL du déploiement. La base étant vide, l'organigramme affiché provient du code. Se connecter via le cadenas en haut à droite, puis cliquer **Publier** dans le bandeau noir en bas : les données partent dans Supabase. Cette opération n'est à faire qu'une fois.

### Travailler en local (facultatif)

```bash
npm install
cp .env.example .env      # y coller les deux valeurs de la console Supabase
npm run dev
```

## À savoir sur la confidentialité

**La clé `anon` est publique.** Elle se retrouve dans le code de la page, c'est prévu ainsi : ce qui protège les données, ce sont les règles RLS définies dans `schema.sql`, pas le secret de la clé. Ne jamais utiliser la clé `service_role` dans ce projet — elle contourne toutes les règles.

**Par défaut, la consultation est ouverte à qui possède le lien**, emails internes compris. Pour la réserver aux personnes connectées, inverser les deux policies commentées dans `schema.sql` — il faudra alors créer un compte pour chaque lecteur.

**L'URL Vercel n'est pas indexée** (`noindex` dans `index.html`), mais elle reste accessible à qui la connaît. Sur un plan Vercel Pro, la protection par mot de passe du déploiement offre une barrière supplémentaire.

---

## Fonctionnement au quotidien

Les personnes disposant d'un compte se connectent via le cadenas en haut à droite. Elles peuvent alors ajouter, modifier et supprimer des fiches, gérer les équipes, ajuster le thème, importer et exporter en CSV. Chaque modification est enregistrée immédiatement et visible de tous.

La date de mise à jour affichée en bas à gauche s'actualise automatiquement à chaque changement.

**Historique** : le schéma conserve les 50 derniers états dans la table `org_history`. Pour revenir en arrière, dans le SQL Editor :

```sql
-- voir les versions disponibles
select id, saved_at from org_history order by saved_at desc;

-- restaurer une version précise
update org_state
set data = (select data from org_history where id = <ID>)
where id = 1;
```

---

## Structure

```
src/OrgChart.jsx   composant principal — affichage, édition, thème
src/store.js       accès Supabase : lecture, écriture, authentification
src/main.jsx       point d'entrée React
supabase/schema.sql  tables, règles d'accès, historique
public/logo-trusk.webp
```

Les données livrées avec le code (`SEED` dans `OrgChart.jsx`) ne servent qu'au premier démarrage. Une fois la publication faite, Supabase fait foi.

---

## Points restés en suspens

Deux lectures du PDF d'organigramme demandent confirmation :

- **Gennevilliers** : le PDF empile responsable d'exploitation → chefs d'équipe jour → chefs d'équipe nuit → caristes → agents. Interprété comme une mise en page et non comme une chaîne hiérarchique — chefs, caristes et agents sont placés côte à côte sous le responsable d'exploitation.
- **Wissous** : la chaîne est reprise telle quelle, avec « suivi de commandes » au-dessus d'un chef d'équipe.

Les portraits ne sont pas intégrés : les initiales s'affichent, teintées par équipe. L'import photo est disponible dans le formulaire d'édition.
