# 🔐 Système d'Authentification - Back-office Admin

## Résumé

Le back-office dispose maintenant d'un système d'authentification complet qui vérifie que l'utilisateur est **admin** avant de lui donner accès.

## 🎯 Fonctionnalités

### ✅ Vérifications de sécurité
1. **Connexion obligatoire** : Toutes les pages sont protégées
2. **Vérification du rôle** : Seuls les utilisateurs avec `role: 'admin'` peuvent se connecter
3. **Token JWT** : Authentification sécurisée via l'API CSE
4. **Redirection automatique** : Les non-authentifiés sont redirigés vers `/login`
5. **Intercepteur axios** : Le token JWT est automatiquement ajouté à toutes les requêtes API

## 👤 Compte Admin Créé

Un utilisateur admin a été créé en base de données :

```
Email : admin@cse.com
Mot de passe : Admin123!
Rôle : admin
```

⚠️ **Changez ce mot de passe après la première connexion !**

## 📁 Fichiers Créés

### 1. **Script de création admin**
`/app-cse/scripts/create-admin-user.ts`
- Crée un utilisateur admin en BDD
- Hash le mot de passe avec bcrypt
- Peut être réutilisé pour créer d'autres admins

### 2. **Service d'authentification**
`/lib/auth.ts`
- `authService.login()` - Connexion avec vérification admin
- `authService.me()` - Récupérer l'utilisateur connecté
- `authService.logout()` - Déconnexion
- `tokenStorage` - Gestion du token dans localStorage

### 3. **Context d'authentification**
`/contexts/AuthContext.tsx`
- Fournit l'état d'authentification à toute l'app
- Hook `useAuth()` pour accéder aux fonctions auth
- Vérification automatique au chargement

### 4. **Page de connexion**
`/app/login/page.tsx`
- Formulaire email/password
- Gestion des erreurs
- Design cohérent avec l'app
- Affichage des identifiants de dev

### 5. **Composant de protection**
`/components/ProtectedRoute.tsx`
- Enveloppe les pages protégées
- Vérifie l'authentification et le rôle admin
- Gère les états de chargement

### 6. **Sidebar améliorée**
`/components/Sidebar.tsx`
- Affiche l'utilisateur connecté
- Bouton de déconnexion
- Badge "Admin"

## 🔄 Flux d'Authentification

```
1. Utilisateur accède au back-office
   └─> Redirection vers /login si non authentifié

2. Utilisateur saisit email/password
   └─> Requête POST /api/auth/login
       └─> Vérification que user.role === 'admin'
           └─> Si OK : sauvegarde token + redirection vers /
           └─> Si KO : message d'erreur

3. Navigation dans le back-office
   └─> ProtectedRoute vérifie l'auth à chaque page
   └─> Token ajouté automatiquement aux requêtes API

4. Déconnexion
   └─> Suppression du token
   └─> Redirection vers /login
```

## 🛡️ Sécurité

### Token JWT

**Token JWT utilisateur** (après connexion)
   - Généré par l'API après login réussi
   - Stocké dans `localStorage` sous `admin_token`
   - Utilisé pour **toutes** les requêtes API (auth + mgnt)
   - Ajouté automatiquement via l'intercepteur axios : `Authorization: Bearer {token}`
   - Expire selon la configuration JWT de l'API backend

### Protection des routes

```typescript
// Toutes les pages admin utilisent AdminLayout
<AdminLayout>
  <ProtectedRoute>
    {/* Contenu protégé */}
  </ProtectedRoute>
</AdminLayout>
```

## 🚀 Utilisation

### Se connecter

1. Démarrer l'API CSE : `cd app-cse && npm run dev` (port 3001)
2. Démarrer le back-office : `cd sys-mgnt-cse-admin && npm run dev` (port 3002)
3. Ouvrir http://localhost:3002
4. Utiliser les identifiants :
   - Email : `admin@cse.com`
   - Password : `Admin123!`

### Créer un nouvel admin

```bash
cd /Users/loicmelane/CascadeProjects/app-cse
npx tsx scripts/create-admin-user.ts
```

Puis modifier le script avec les nouvelles informations.

## 🧪 Tests

### Scénarios à tester

1. ✅ Connexion avec compte admin → Accès autorisé
2. ✅ Connexion avec compte non-admin → Erreur "Accès refusé"
3. ✅ Accès direct à `/users` sans auth → Redirection vers `/login`
4. ✅ Token expiré → Redirection vers `/login`
5. ✅ Déconnexion → Retour à `/login`

### Commandes de test

```bash
# Vérifier qu'un utilisateur est admin
npx prisma studio
# → Ouvrir Users → Vérifier le champ 'role'
```

## 🔧 Configuration

### Variables d'environnement (`.env.local`)

```env
# API CSE (URL de l'API backend)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note** : Aucun token statique n'est nécessaire. L'authentification se fait uniquement via JWT après login.

## 📝 Notes Importantes

1. **Authentification JWT unifiée** :
   - Un seul token JWT pour toutes les requêtes
   - Ajouté automatiquement par l'intercepteur axios
   - Aucun token statique côté front-end

2. **Rôle admin obligatoire** :
   - La connexion vérifie `user.role === 'admin'`
   - Les utilisateurs normaux ne peuvent pas se connecter

3. **Persistence** :
   - Le token est sauvegardé dans localStorage
   - L'utilisateur reste connecté même après refresh

4. **Sécurité front-end** :
   - Protection des routes côté client
   - L'API CSE reste la source de vérité pour l'auth
   - Le backend vérifie le token JWT et les permissions sur chaque requête

## 🎨 Interface

- Page de connexion épurée et professionnelle
- Messages d'erreur clairs
- États de chargement
- Informations utilisateur dans la sidebar
- Bouton de déconnexion accessible

## 🔄 Prochaines Améliorations

- [ ] Système de réinitialisation de mot de passe
- [ ] Gestion des sessions expirées (refresh token)
- [ ] Historique des connexions
- [ ] Double authentification (2FA)
- [ ] Gestion des permissions granulaires
