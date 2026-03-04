# Sistema de Gestão de Filmes (Cinema Database)

# Data

04/03/2026

# Autor

A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC

Engenharia Web

# Resumo

Este projeto consiste num sistema de gestão e consulta de uma base de dados de cinema utilizando Node.js e a framework **Express**. A aplicação permite navegar por listas de filmes, atores e géneros, fornecendo detalhes específicos para cada entidade.

O servidor consome dados de um serviço `json-server` (a correr em `http://localhost:3000`), que utiliza o ficheiro `db.json` (gerado a partir de um dataset original através do script `fix_json.py`). A interface é renderizada no servidor com **Pug** e estilizada com **W3.CSS**.

# Funcionalidades e Rotas

O servidor Express escuta na porta `5000`. As seguintes rotas estão disponíveis:

- **`/` ou `/filmes`**: Lista completa de filmes ordenados alfabeticamente.
- **`/filmes/:id`**: Detalhes de um filme (ano, géneros e elenco).
- **`/atores`**: Lista de todos os atores e o respetivo número de filmes em que participaram.
- **`/atores/:id`**: Detalhes de um ator e a lista de filmes associados.
- **`/generos`**: Lista de todos os géneros cinematográficos disponíveis.
- **`/generos/:id`**: Filmes pertencentes a um determinado género.

# Como Correr a Aplicação

Para correr a aplicação, siga os seguintes passos:

1.  **Instalar Dependências**: No diretório `TP5`, execute:
    ```bash
    npm install
    ```

2.  **Preparar a Base de Dados**: Caso o ficheiro `db.json` não exista ou precise de ser atualizado:
    ```bash
    python3 fix_json.py
    ```

3.  **Iniciar a Aplicação**: Pode iniciar ambos os servidores (Express e json-server) em simultâneo:
    ```bash
    npm run dev
    ```

4.  **Aceder à Aplicação**: Abra o navegador em `http://localhost:5000/`.

# Estrutura do Projeto

- `server.js`: Servidor principal utilizando Express.
- `fix_json.py`: Script Python para processar o dataset e estruturar o `db.json`.
- `db.json`: Base de dados estruturada para o `json-server`.
- `views/`: Templates `.pug` para renderização das páginas.
- `public/`: Recursos estáticos (CSS).

# Dependências

- `express`: Framework web para Node.js.
- `axios`: Cliente HTTP para comunicar com a API.
- `pug`: Motor de templates.
- `json-server`: API REST para persistência de dados.
