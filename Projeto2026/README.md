# EduPortal - Plataforma de Gestão de Recursos Educativos

O **EduPortal** é uma plataforma full-stack para gestão, preservação e disseminação de recursos educativos digitais, seguindo o modelo **OAIS** e utilizando **BagIt** para garantir a integridade dos dados.

## 🚀 Como Executar

A aplicação está totalmente contentorizada com Docker, o que facilita o processo de instalação e execução.

### 1. Pré-requisitos
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Levantar a Infraestrutura
Na raiz do projeto, executa o seguinte comando para construir e iniciar todos os serviços (Base de Dados, API de Dados e Interface):

```bash
docker-compose up -d --build
```

Após o comando terminar, os serviços estarão disponíveis em:
*   **Interface Web:** [http://localhost:16001](http://localhost:16001)
*   **API de Dados:** [http://localhost:16000](http://localhost:16000)
*   **Documentação API (Swagger):** [http://localhost:16000/api-docs](http://localhost:16000/api-docs)

---

## 📥 Povoamento da Base de Dados

Para testar a plataforma com dados reais (utilizadores, recursos de UCs da UMinho, comentários e notícias), podes utilizar os scripts de povoamento incluídos.

### Opção A: Povoamento Completo (Recomendado)
Este script limpa a base de dados e carrega o cenário completo de demonstração.

1. Entra no contentor da API:
   ```bash
   docker exec -it api_dados sh
   ```
2. Executa o script de povoamento:
   ```bash
   node scripts/populate_complete.js
   ```

### Opção B: Apenas utilizador Administrador
Se preferires começar do zero mas precisares de uma conta de admin:
```bash
docker exec -it api_dados node scripts/clear-except-admin.js
```

---

## 👤 Credenciais de Teste

Após o povoamento completo, podes utilizar as seguintes contas (todas têm a password `password123`):

| Utilizador | Role | Password |
| :--- | :--- | :--- |
| **jcr@di.uminho.pt** | Administrador | `password123` |
| **prh@di.uminho.pt** | Produtor | `password123` |
| **a10004@alunos.uminho.pt** | Consumidor | `password123` |

---

## 🔒 Segurança e Acesso

Por questões de segurança e boas práticas de arquitetura:
*   **Interface Web:** Exposta em [http://localhost:16001](http://localhost:16001).
*   **API de Dados:** Está **escondida** do mundo exterior (não tem mapeamento de portas para o host). A `interface` comunica com ela através da rede interna do Docker (`http://api_dados:16000`).
*   **Base de Dados:** Exposta em `localhost:27017` para facilitar a inspeção manual (se necessário), mas protegida pela rede interna para a API.

---

## 🛠 Estrutura do Projeto

*   `/api_dados`: Backend Node.js/Express, gestão de ficheiros e lógica OAIS.
*   `/interface`: Frontend Node.js/Pug/Tailwind CSS.
*   `/storage/resources`: Local onde os ficheiros (AIP) são armazenados persistentemente.
*   `docker-compose.yml`: Orquestração dos microserviços.

---
**Autores:** Francisco Barbosa, Pedro Morais, Simão Araújo (2026)
