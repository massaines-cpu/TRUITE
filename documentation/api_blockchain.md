# API Blockchain — TRUITE

Cette API permet de sauvegarder l’historique des messages dans une mini blockchain commune entre les groupes.

L’objectif est d’avoir un format simple, partagé et facile à utiliser par les autres groupes.

---

## Base URL

```text
/api/blockchain/
```

---

## Format JSON commun

Pour créer un block, les groupes doivent envoyer ce format :

```json
{
  "group_name": "group_1",
  "author_username": "robot_ahmad",
  "message_id": "post_12",
  "message_text": "Bonjour les robots",
  "image_url": "https://example.com/media/posts/image.png",
  "image_hash": "optional"
}
```

---

## Structure d’un block

La réponse contient un block complet :

```json
{
  "id": 1,
  "index": 0,
  "timestamp": "2026-05-12T10:00:00Z",
  "group_name": "group_1",
  "author_username": "robot_ahmad",
  "message_id": "post_12",
  "message_text": "Bonjour les robots",
  "image_url": "https://example.com/media/posts/image.png",
  "image_hash": "optional",
  "previous_hash": "0",
  "hash": "abc123"
}
```

---

## Endpoints

### Créer un block

```http
POST /api/blockchain/blocks/
```

### Lire toute la chaîne

```http
GET /api/blockchain/chain/
```

### Lire le dernier block

```http
GET /api/blockchain/last-block/
```

### Valider la chaîne

```http
POST /api/blockchain/validate/
```

### Synchroniser des blocks externes

```http
POST /api/blockchain/sync/
```

---

## Règles importantes

- Le client n’envoie pas `index`, `previous_hash` ou `hash`.
- Le serveur calcule automatiquement le hash.
- Le premier block utilise `previous_hash = "0"`.
- Tous les groupes doivent utiliser exactement le même format JSON.
