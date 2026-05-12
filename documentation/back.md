# Documentation Backend - Projet Truite

## Présentation

Le backend du projet Truite est développé avec Django et Django REST Framework.
Il expose une API REST permettant au frontend de gérer l’inscription et la connexion des utilisateurs.

---

## Technologies utilisées

- Python 3.12
- Django
- Django REST Framework
- drf-spectacular
- PostgreSQL
- Docker

---

## Structure du backend

```text
back/
├── account/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── templates/
├── static/
└── manage.py
```

---

## API actuelle

### Routes disponibles

| Méthode | Route |
|---|---|
| POST | /api/accounts/register/ |
| POST | /api/accounts/login/ |
| GET | /api/docs/ |
| GET | /api/schema/ |

---

## Swagger

La documentation Swagger est générée avec drf-spectacular.

Accès :

```text
http://127.0.0.1:8000/api/docs/
```

---

## Fonctionnement du Register

Le frontend envoie les données via AJAX vers :

```text
/api/accounts/register/
```

Le serializer valide :

- username
- email
- password_hash
- first_name
- last_name
- sex
- birth_date
- profile_pic

Le backend crée ensuite un nouvel utilisateur.

---

## Fonctionnement du Login

Le login vérifie :

- username
- password_hash

Le backend compare le mot de passe avec le hash enregistré.

---

## Docker

### Construction

```bash
docker build -t truite .
```

### Exécution

```bash
docker run -p 8000:8000 truite
```

---

## Corrections effectuées

- Ajout de Swagger
- Correction des serializers
- Correction du système login/register
- Correction des routes API
- Synchronisation frontend/backend
- Ajout AJAX
- Ajout preview image
- Correction des noms de champs

---

## Limites actuelles

- Pas encore de JWT
- Pas encore de gestion messages
- Pas encore de réactions
- Pas encore de système follow
