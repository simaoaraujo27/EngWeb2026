# Docker Setup - Simples

## Começar

```bash
docker-compose up --build
```

Isto vai:
- ✅ Iniciar MongoDB em 27017
- ✅ Iniciar API em 16000
- ✅ Iniciar Interface em 16001

## Parar

```bash
docker-compose down
```

## Variáveis de Ambiente

Arquivo `.env` contém:
```
JWT_SECRET=EngWeb2026
```

Edita se necessário. Tudo o resto é definido no `docker-compose.yml`.

## URLs

- **Frontend**: http://localhost:16001
- **API**: http://localhost:16000
- **MongoDB**: localhost:27017

Fim!
