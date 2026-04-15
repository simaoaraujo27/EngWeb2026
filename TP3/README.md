# Website da Escola de Música

# Data

18/02/2026

# Autor

A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC

Engenharia Web

# Resumo

Este projeto consiste num servidor web Node.js que serve conteúdo HTML dinâmico, simulando uma plataforma de gestão para uma escola de música. O servidor interage com um serviço `json-server` (a correr em `http://localhost:3000`) para obter dados sobre alunos, cursos e instrumentos de um dataset JSON (`db.json`). O objetivo é apresentar estas informações de forma organizada e navegável através de diferentes rotas HTTP.

O servidor `servidorApp.js` define várias rotas que, ao serem acedidas via browser, efetuam pedidos GET ao `json-server` e geram tabelas HTML com os dados formatados e estilizados usando W3.CSS.

# Funcionalidades e Rotas

O servidor está configurado para escutar na porta `7777`. As seguintes rotas estão disponíveis:

- **`/`**:
  - **Descrição**: Página inicial que serve como um menu de navegação para as diferentes listas.
  - **Comportamento**: Apresenta links para as rotas `/alunos`, `/cursos` e `/instrumentos`.

- **`/alunos`**:
  - **Descrição**: Apresenta uma lista completa de todos os alunos registados na escola.
  - **Comportamento**: O servidor faz um pedido GET a `http://localhost:3000/alunos`, processa os dados e gera uma tabela HTML detalhada com informações como ID do aluno, nome, curso e instrumento.

- **`/cursos`**:
  - **Descrição**: Exibe uma lista de todos os cursos oferecidos pela escola de música.
  - **Comportamento**: O servidor obtém os dados de `cursos` do `json-server`, e renderiza uma tabela HTML com a designação do curso, duração e o instrumento associado.

- **`/instrumentos`**:
  - **Descrição**: Lista todos os instrumentos ensinados ou disponíveis na escola.
  - **Comportamento**: O servidor recolhe os dados de `instrumentos` do `json-server` e apresenta uma tabela HTML com o ID e o nome de cada instrumento.

# Como Correr a Aplicação

Para correr a aplicação, siga os seguintes passos:

1.  **Iniciar o `json-server`**: Certifique-se de que o `json-server` está a correr na porta `3000` e a servir o ficheiro `db.json`. Navegue até ao diretório `TP3` no seu terminal e execute:

    ```bash
    json-server --watch db.json
    
    ```

2.  **Iniciar o Servidor Node.js**: Num terminal separado, navegue até ao diretório `TP3` e inicie o servidor Node.js:

    ```bash
    node servidorApp.js
    ```

3.  **Aceder à Aplicação**: Abra o seu navegador web e aceda às rotas disponíveis, começando pela página inicial:
    - `http://localhost:7777/`
    - `http://localhost:7777/alunos`
    - `http://localhost:7777/cursos`
    - `http://localhost:7777/instrumentos`

# Dependências

As dependências do projeto estão listadas no `package.json` e podem ser instaladas com `npm install`.

- `axios`: Para fazer requisições HTTP ao `json-server`.
- `json-server`: Para simular uma API REST a partir do `db.json`.
