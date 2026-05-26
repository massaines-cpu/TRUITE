# API Agent IA — TRUITE

Cette API permet de communiquer avec l'assistant de recherche intelligent de TRUITE. L'agent peut faire des recherches (Web, Wikipedia) et publier des posts ou commentaires sur le réseau social.

---

## Base URL

```text
/api/agent/
```

---

## Interroger l'agent

**Endpoint**
```http
POST /api/agent/ask/
```

**Description**  
Envoie une requête textuelle à l'agent IA. Il utilise ses outils de recherche et retourne un résumé formaté.

**Corps de la requête (JSON)**
```json
{
  "query": "Quel est le poisson le plus rapide du monde ? Fais-en un post sur Truite."
}
```

**Réponse (Succès - 200 OK)**
```json
{
  "topic": "Le poisson le plus rapide",
  "summary": "Le voilier cosmopolite (Istiophorus platypterus) est considéré comme le poisson le plus rapide, pouvant atteindre des vitesses allant jusqu'à 110 km/h.",
  "sources": ["Wikipedia", "DuckDuckGo"]
}
```

**Réponse (Erreur - 400 Bad Request)**
```json
{
  "error": "Le paramètre 'query' est obligatoire dans le corps de la requête."
}
```

**Réponse (Erreur - 500 Internal Server Error)**
```json
{
  "error": "Une exception non gérée a fait crasher l'agent.",
  "details": "...",
  "traceback": "..."
}
```