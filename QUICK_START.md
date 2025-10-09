# 🚀 Démarrage Rapide - Admin CSE

## Prérequis

1. **API principale** : L'application `app-cse` doit tourner sur `http://localhost:3001`
2. **Compte admin** : Un utilisateur avec le rôle `admin` doit exister dans la base de données

## Installation

```bash
cd /Users/loicmelane/CascadeProjects/sys-mgnt-cse-admin
npm install
```

## Configuration

Le fichier `.env.local` doit contenir :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Authentification** : Le back-office utilise un système de login avec JWT. Connectez-vous avec vos identifiants admin.

## Démarrage

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:3002**

## Pages Disponibles

- **/login** - Page de connexion (✅ Fonctionnel)
- **/** - Dashboard principal (protégé)
- **/users** - Gestion des utilisateurs (✅ Fonctionnel)
- **/events** - Gestion des événements (🚧 En construction)

## Fonctionnalités Utilisateurs

✅ **Page Utilisateurs** :
- Liste complète de tous les utilisateurs
- Affichage des informations : email, nom, association, rôle
- Badge de statut d'onboarding (Complété/En cours)
- Action : Promouvoir/Rétrograder le rôle admin
- Design responsive et moderne

## Test Rapide

1. Démarrer l'API principale sur le port 3001
2. Démarrer ce back-office : `npm run dev`
3. Ouvrir http://localhost:3002/login
4. Se connecter avec un compte admin (ex: admin@cse.com / Admin123!)
5. Naviguer vers "Utilisateurs"
6. Tester le changement de rôle d'un utilisateur

## Prochaines Étapes

- Compléter la page de gestion des événements
- Ajouter un système d'authentification pour le back-office
- Ajouter des filtres et recherches
- Statistiques sur le dashboard
