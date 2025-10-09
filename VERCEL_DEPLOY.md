# 🚀 Déploiement sur Vercel - Back-office CSE

Ce guide explique comment déployer le back-office CSE sur Vercel.

## 📋 Prérequis

1. Un compte Vercel (gratuit) : https://vercel.com/signup
2. L'API backend déployée et accessible (son URL sera nécessaire)
3. Un compte admin créé dans votre base de données (email/password)

## 🎯 Méthode 1 : Déploiement via l'interface Vercel (Recommandé)

### Étape 1 : Préparer le projet

Le projet est déjà préparé avec :
- ✅ `.env.example` pour les variables d'environnement
- ✅ `vercel.json` pour la configuration
- ✅ `package.json` optimisé pour la production

### Étape 2 : Se connecter à Vercel

1. Aller sur https://vercel.com
2. Se connecter avec GitHub, GitLab ou Email
3. Cliquer sur **"Add New"** → **"Project"**

### Étape 3 : Importer le projet

**Option A : Via Git (Recommandé)**
1. Pousser votre code sur GitHub/GitLab
2. Dans Vercel, cliquer sur **"Import Git Repository"**
3. Sélectionner le repository `sys-mgnt-cse-admin`

**Option B : Déploiement manuel**
1. Dans Vercel, cliquer sur **"Import"** puis **"Deploy from .zip or folder"**
2. Uploader le dossier du projet (sans `node_modules` et `.next`)

### Étape 4 : Configurer les variables d'environnement

Dans la section **"Environment Variables"**, ajouter :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://votre-api.vercel.app` | URL de votre API backend (sans slash à la fin) |

⚠️ **Important** : Cette variable doit être définie pour tous les environnements (Production, Preview, Development)

ℹ️ **Authentification** : Le back-office utilise un système de login classique (email/password). Assurez-vous d'avoir un compte admin dans votre base de données.

### Étape 5 : Déployer

1. Vérifier que le **Framework Preset** détecté est bien **"Next.js"**
2. Laisser les autres paramètres par défaut
3. Cliquer sur **"Deploy"**
4. Attendre 2-3 minutes pour le build

### Étape 6 : Tester

1. Une fois le déploiement terminé, Vercel vous donnera une URL : `https://sys-mgnt-cse-admin-xxx.vercel.app`
2. Ouvrir l'URL dans votre navigateur
3. Vous serez redirigé vers la page de login
4. Se connecter avec vos identifiants admin (email/password)
5. Vérifier que le dashboard s'affiche correctement
6. Tester les fonctionnalités (liste des utilisateurs, etc.)

## 🎯 Méthode 2 : Déploiement via CLI Vercel

### Installation

```bash
# Installer Vercel CLI globalement
npm install -g vercel
```

### Déploiement

```bash
# Se connecter à Vercel
vercel login

# Déployer (suivre les prompts)
vercel

# Ou déployer en production directement
vercel --prod
```

### Configurer les variables d'environnement via CLI

```bash
# Ajouter la variable d'environnement
vercel env add NEXT_PUBLIC_API_URL
# Entrer : https://votre-api.vercel.app
```

## 🔧 Configuration personnalisée

### Changer la région de déploiement

Le fichier `vercel.json` est configuré pour déployer en Europe (`cdg1` = Paris).

Pour changer :
```json
{
  "regions": ["iad1"]  // US East
}
```

Régions disponibles :
- `cdg1` - Paris, France (Europe) ⭐ Par défaut
- `iad1` - Washington DC, USA (East)
- `sfo1` - San Francisco, USA (West)
- `hnd1` - Tokyo, Japan (Asia)

### Domaine personnalisé

1. Aller dans **Settings** → **Domains** sur Vercel
2. Ajouter votre domaine (ex: `admin.cse.votreentreprise.com`)
3. Configurer les DNS selon les instructions Vercel

## 📝 Après le déploiement

### Vérifications importantes

- [ ] L'application se charge correctement
- [ ] Les utilisateurs s'affichent (test de connexion API)
- [ ] Aucune erreur dans la console navigateur
- [ ] Les variables d'environnement sont correctement configurées

### Surveillance

Vercel fournit automatiquement :
- 📊 Analytics (trafic, performance)
- 🐛 Error tracking
- 📈 Performance insights

Accessible via le dashboard Vercel du projet.

## 🔄 Mises à jour

### Avec Git (automatique)

Si vous avez connecté un repository Git :
1. Pousser vos modifications sur la branche `main`
2. Vercel détecte et redéploie automatiquement
3. Les previews sont créées pour les autres branches

### Manuel

```bash
vercel --prod
```

## 🛠️ Dépannage

### Erreur : "Module not found"
- Vérifier que toutes les dépendances sont dans `package.json`
- Re-déployer avec `vercel --prod --force`

### Erreur : "API calls fail"
- Vérifier que `NEXT_PUBLIC_API_URL` est correct (sans slash final)
- Vérifier que l'API est accessible publiquement
- Vérifier que vous êtes connecté (token JWT valide)

### Erreur : "Impossible de se connecter"
- Vérifier que vous avez un compte admin créé dans la base de données
- Vérifier que l'URL de l'API est correcte
- Vérifier que l'API backend est déployée et accessible

### Build échoue
- Vérifier les logs de build dans Vercel
- Tester localement : `npm run build`
- Vérifier qu'il n'y a pas d'erreurs TypeScript

### Variables d'environnement non détectées
- Les variables doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client
- Redéployer après avoir ajouté des variables : **Settings** → **Environment Variables** → **Redeploy**

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

## 🔗 URLs importantes

Une fois déployé, vous aurez :
- **Production** : `https://sys-mgnt-cse-admin.vercel.app`
- **Preview** : `https://sys-mgnt-cse-admin-git-branch.vercel.app`
- **Dashboard Vercel** : `https://vercel.com/dashboard`

---

✨ **Le back-office CSE est maintenant prêt à être déployé sur Vercel !**
