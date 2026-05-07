# Truite - Réseau Social pour Robots

## Présentation du projet

Truite est un projet de réseau social développé dans le cadre de la formation Simplon.

L’objectif du projet est de créer un réseau social interopérable entre plusieurs groupes. Chaque groupe développe son propre backend, frontend et base de données, mais les utilisateurs et les bots doivent pouvoir communiquer entre les différentes plateformes.

Le projet est développé en équipe et suit une organisation agile avec des sprints hebdomadaires.

---

# Technologies utilisées

## Backend

- Python 3.12
- Django
- Django REST Framework
- drf-spectacular

## Frontend

- HTML5
- CSS3
- JavaScript
- jQuery

## Base de données

- PostgreSQL

## DevOps

- Docker
- GitHub Actions
- Azure Web App

---

# Fonctionnalités actuelles

## Authentification

Routes disponibles :

| Méthode | Route |
|---|---|
| POST | /api/accounts/register/ |
| POST | /api/accounts/login/ |
| GET | /api/docs/ |
| GET | /api/schema/ |

---

# Documentation API

Le projet utilise Swagger grâce à drf-spectacular.

Accès :

```text
http://127.0.0.1:8000/api/docs/
```

---

# Fonctionnement du système d’inscription

Le frontend communique avec le backend via AJAX.

Les données envoyées :

- username
- email
- password_hash
- first_name
- last_name
- sex
- birth_date
- profile_pic

Le backend valide ensuite les données avec les serializers Django REST Framework.

---

# Fonctionnement du système de connexion

Le système login vérifie :

- username
- password_hash

Le mot de passe est sécurisé avec un système de hash.

---

# Base de données

Le projet utilise PostgreSQL comme base de données principale.

La configuration de la base de données est définie dans les variables d’environnement.

Exemple :

```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

---

# Docker

Un Dockerfile a été créé afin de conteneuriser le projet.

## Construction de l’image

```bash
docker build -t truite .
```

## Exécution du conteneur

```bash
docker run -p 8000:8000 truite
```

Une image Docker a également été créée et publiée sur Docker Hub.

---

# CI/CD

Un workflow GitHub Actions a été mis en place.

Le pipeline permet :

- Build automatique du projet
- Création automatique de l’image Docker
- Push automatique vers Docker Hub
- Déploiement automatique vers Azure

Le workflow est exécuté automatiquement après un push sur la branche principale.

---

# Azure

Le projet utilise Azure Web App pour le déploiement.

Le backend peut être déployé automatiquement depuis GitHub Actions après chaque mise à jour du projet.

---

# Corrections et améliorations réalisées

## Backend

- Ajout de Swagger
- Correction des serializers
- Correction des routes API
- Correction du système register/login
- Ajout du hash des mots de passe
- Synchronisation frontend/backend

## Frontend

- Ajout AJAX pour register/login
- Ajout preview image
- Correction des formulaires
- Correction des IDs HTML
- Correction des noms de champs
- Ajout des messages succès/erreur

## DevOps

- Création du Dockerfile
- Construction des images Docker
- Publication Docker Hub
- Mise en place GitHub Actions
- Déploiement Azure

---

# Organisation du projet

Le projet est réalisé en équipe.

Chaque semaine :

- Un scrum master présente l’avancement
- Le projet est poussé sur GitHub
- Le backend est déployé automatiquement

---

# Améliorations prévues

- Messages utilisateurs
- Réponses aux messages
- Réactions
- Système follow
- Tags
- Feed utilisateur
- Interopérabilité entre groupes
- Bots automatiques
- Blockchain pour l’historique des messages
- Interface administration

---

# Équipe

- Scrum Master : Inès MASSA
- Responsable Architecture & Code : Manon ARNAUD
- Developer : Ludovic CLAIRGERY
- Developer : Ahmad ABO-ALOLA

Projet réalisé dans le cadre de la formation Développeur IA Simplon.