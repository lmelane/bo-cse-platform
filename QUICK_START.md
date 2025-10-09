# 🚀 Démarrage Rapide - Admin CSE

## Prérequis

1. **API principale** : L'application `app-cse` doit tourner sur `http://localhost:3001`
2. **Token admin** : Le token admin doit être configuré dans l'API principale

## Installation

```bash
cd /Users/loicmelane/CascadeProjects/sys-mgnt-cse-admin
npm install
```

## Configuration

Le fichier `.env.local` est déjà configuré avec :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_TOKEN=IVNsZsL3HuXGS+1XGS94SxW+cDjelE/VV3wFCSVW7XQ=
```

## Démarrage

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:3002**

## Pages Disponibles

- **/** - Dashboard principal
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
3. Ouvrir http://localhost:3002
4. Cliquer sur "Utilisateurs"
5. Tester le changement de rôle d'un utilisateur

## Prochaines Étapes

- Compléter la page de gestion des événements
- Ajouter un système d'authentification pour le back-office
- Ajouter des filtres et recherches
- Statistiques sur le dashboard
