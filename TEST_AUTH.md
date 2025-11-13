# 🔍 TEST D'AUTHENTIFICATION

## Étape 1 : Vérifier le token

Ouvrez la **Console du navigateur** (F12) et tapez :

```javascript
localStorage.getItem('admin_token')
```

### Résultats possibles :

#### ❌ Si ça retourne `null`
→ **Vous n'êtes pas connecté !**

**Solution :** Allez sur `http://localhost:3002/login` et connectez-vous

#### ✅ Si ça retourne un token (ex: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`)
→ Le token existe, passez à l'étape 2

---

## Étape 2 : Vérifier que le token est envoyé

1. Ouvrez les **DevTools** (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Rechargez la page `/participants`
4. Cliquez sur la requête `participants` dans la liste
5. Regardez l'onglet **Headers** (En-têtes)

### Dans la section "Request Headers" vous devez voir :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### ❌ Si le header Authorization est absent
→ **Problème avec l'intercepteur axios**

#### ✅ Si le header Authorization est présent
→ Passez à l'étape 3

---

## Étape 3 : Vérifier que le token est valide

Si le token est envoyé mais vous avez quand même une 401, c'est que :

### A. Le token a expiré
**Solution :** Déconnectez-vous et reconnectez-vous
```javascript
// Dans la console
localStorage.removeItem('admin_token')
window.location.href = '/login'
```

### B. Le backend ne reconnaît pas le token
**Solutions possibles :**
- Vérifiez que votre backend utilise le même secret JWT
- Vérifiez que le format du token est correct
- Vérifiez que le middleware d'authentification fonctionne

---

## Étape 4 : Test manuel avec curl

Récupérez votre token depuis la console :
```javascript
console.log(localStorage.getItem('admin_token'))
```

Puis testez dans un terminal :
```bash
curl -X GET \
  'http://localhost:3001/api/mgnt-sys-cse/participants' \
  -H 'Authorization: Bearer COLLEZ_VOTRE_TOKEN_ICI' \
  -H 'Content-Type: application/json'
```

### Résultats possibles :

- **401 Unauthorized** → Le token n'est pas valide côté backend
- **404 Not Found** → La route n'existe pas
- **200 OK** → La route fonctionne, le problème vient du front

---

## 🚀 Solution rapide

### Si vous êtes pressé :

1. **Déconnectez-vous complètement**
```javascript
localStorage.clear()
```

2. **Reconnectez-vous** via `/login` avec :
```
email: admin@cse.com
password: Admin123!
```

3. **Retestez** la page `/participants`

---

## 🐛 Debug en console

Ajoutez ce code dans la console pour voir ce qui se passe :

```javascript
// Vérifier le token
const token = localStorage.getItem('admin_token')
console.log('Token:', token ? 'Présent (' + token.substring(0, 20) + '...)' : 'ABSENT')

// Tester une requête manuellement
fetch('http://localhost:3001/api/mgnt-sys-cse/participants', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status)
  return res.json()
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err))
```
