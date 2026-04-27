# 🎓 EduPortal

Bem-vindo ao **EduPortal**! Esta é a nossa plataforma para partilhar e guardar recursos educativos (como aulas, exames e trabalhos). O sistema garante que os ficheiros estão seguros e organizados, usando normas de preservação digital de forma invisível para o utilizador.

---

## 🚀 Como começar?

Não precisas de instalar bases de dados ou bibliotecas manualmente. O projeto está todo "dentro" do Docker.

### 1. Ligar as máquinas
Na pasta raiz do projeto, corre o comando:
```bash
docker-compose up -d --build
```

### 2. Criar os dados de teste (Opcional)
Se queres entrar e ver logo o portal cheio de vida (recursos, utilizadores e comentários), corre este comando:
```bash
docker exec -it projeto_api_dados node scripts/populate_complete.js
```

---

## 🔑 Onde estão as coisas?

Depois de ligares tudo, podes abrir no teu browser:

*   **Portal (Interface):** [http://localhost:16001](http://localhost:16001)
*   **Documentação da API:** [http://localhost:16000/api-docs](http://localhost:16000/api-docs)

### Contas para usares:
A password para todos é `password123`.

*   **Administrador:** `jcr@di.uminho.pt`
*   **Produtor:** `prh@di.uminho.pt`
*   **Consumidor:** `a10004@alunos.uminho.pt`

---

## 📂 Organização do Código

*   `api_dados`: O "cérebro". Gere a base de dados e os ficheiros.
*   `interface`: O que tu vês. Feito para ser simples e intuitivo.
*   `data/db`: Onde o MongoDB guarda as informações.
*   `api_dados/storage/resources`: Onde os teus ficheiros ficam guardados para sempre.

---

## 🛠️ Manutenção Rápida

*   **Parar tudo:** `docker-compose down`
*   **Limpar tudo (Hard Reset):** `docker-compose down -v` (isto apaga também os dados da base de dados).

---
**Criado por:** Francisco Barbosa, Pedro Morais & Simão Araújo (2026)
