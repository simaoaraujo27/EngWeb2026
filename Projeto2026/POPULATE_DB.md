# Populating Database com Dados Realistas

## Começar

```bash
# 1. Iniciar containers
docker-compose up -d

# 2. Popular a BD (espera ~10s pelo MongoDB inicializar)
docker exec projeto_api_dados node scripts/populate-db.js
```

## O Que É Inserido

### Utilizadores (8)
- **1 Admin**: Administrador da plataforma
- **3 Produtores**: Professores que criam recursos
- **4 Consumidores**: Estudantes que consomem recursos

### Recursos (8)
- Slides de Node.js, MongoDB, Docker, React
- Artigos sobre Arquitetura Web e Segurança
- Tese sobre OAIS
- Tutorial de Docker

### Posts (6)
- Comentários e avaliações dos alunos sobre os recursos
- Ratings de 1-5 estrelas
- Discussões entre alunos e professores

### Notícias (6)
- Novos recursos adicionados
- Novos utilizadores
- Rankings

## Limpar a BD

```bash
# Remove apenas dados
docker exec projeto_api_dados node scripts/clear-db.js

# Remove tudo (containers, volumes)
docker-compose down -v
```

## URLs para Testar

- Frontend: http://localhost:16001
- API: http://localhost:16000
- MongoDB: localhost:27017

## Contas de Teste

| Email | Tipo | 
|-------|------|
| admin@elearn.pt | Admin | 
| prof.silva@uminho.pt | Produtor | 
| prof.costa@uminho.pt | Produtor | 
| prof.ferreira@uminho.pt | Produtor | 
| aluno1@uminho.pt | Consumidor | 
| aluno2@uminho.pt | Consumidor | 
| aluno3@uminho.pt | Consumidor | 
| aluno4@uminho.pt | Consumidor | 

Nota: As passwords são apenas mocks. Para fazer login, usa os emails acima.
