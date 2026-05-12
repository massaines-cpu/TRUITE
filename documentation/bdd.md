# Documentation Base de Données - Projet Truite

## Système utilisé

Le projet utilise PostgreSQL.

---

## Configuration

La configuration est définie dans :

```text
account/settings.py
```

Variables utilisées :

```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

---

## Table utilisateur

Le modèle utilisateur actuel contient :

| Champ |
|---|
| id |
| username |
| email |
| password_hash |
| sex |
| profile_pic |
| first_name |
| last_name |
| birth_date |

---

## Sécurité

Le backend utilise :

```python
make_password()
check_password()
```

pour sécuriser les mots de passe.

---

## Images

Les images de profil sont stockées dans :

```text
media/profiles/
```

---

## Évolutions prévues

- Messages
- Réactions
- Follow
- Tags
- Blockchain
- Interopérabilité entre groupes
