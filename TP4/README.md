# Sistema de Gestão de EMD (Exame Médico Desportivo)

# Data

25/02/2026

# Autor

A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC

Engenharia Web

# Resumo

Este projeto consiste num sistema de gestão de Exames Médicos Desportivos (EMD) utilizando Node.js. A aplicação permite realizar operações CRUD (Create, Read, Update, Delete) sobre registos de EMD, além de fornecer uma página de estatísticas detalhadas.

O servidor interage com um serviço `json-server` (a correr em `http://localhost:3000`) que atua como base de dados persistente, consumindo os dados do ficheiro `db.json`. A interface é renderizada dinamicamente no servidor usando o motor de templates **Pug** e estilizada com **W3.CSS**.

# Funcionalidades e Rotas

O servidor está configurado para escutar na porta `7777`. As seguintes rotas estão disponíveis:

- **`/` ou `/emd`**:
  - **Descrição**: Página principal que apresenta a lista de todos os EMDs registados.
  - **Comportamento**: Permite ordenação por nome ou data através de parâmetros na query string.

- **`/emd/registo`**:
  - **Descrição**: Formulário para a criação de um novo registo de EMD.

- **`/emd/:id`**:
  - **Descrição**: Página de detalhes de um EMD específico.

- **`/emd/editar/:id`**:
  - **Descrição**: Formulário de edição para um registo existente.

- **`/emd/apagar/:id`**:
  - **Descrição**: Rota que remove um registo da base de dados e redireciona para a lista principal.

- **`/emd/stats`**:
  - **Descrição**: Página de estatísticas que apresenta a distribuição de EMDs por género, modalidade, clube, resultado e estado de federação.

# Como Correr a Aplicação

Para correr a aplicação, siga os seguintes passos:

1.  **Instalar Dependências**: Certifique-se de que está no diretório `TP4` e execute:
    ```bash
    npm install
    ```

2.  **Iniciar o `json-server`**: O servidor de dados deve estar a correr na porta `3000`. No diretório `TP4`, execute:
    ```bash
    json-server --watch db.json
    ```

3.  **Iniciar o Servidor Node.js**: Num terminal separado, no diretório `TP4`, inicie o servidor da aplicação:
    ```bash
    node server.js
    ```

4.  **Aceder à Aplicação**: Abra o seu navegador web em `http://localhost:7777/`.

# Estrutura do Projeto

- `server.js`: Servidor principal em Node.js.
- `db.json`: Base de dados mockada para o `json-server`.
- `templates.js`: Módulo que faz a ponte entre o servidor e os templates Pug.
- `static.js`: Módulo para servir recursos estáticos (CSS, imagens).
- `views/`: Pasta contendo os templates `.pug` para a renderização do HTML.
- `public/`: Pasta contendo ficheiros estáticos como o `w3.css` e ícones.

# Dependências

- `axios`: Para comunicação com a API do `json-server`.
- `pug`: Motor de templates para geração de HTML dinâmico.
- `json-server`: Ferramenta para criar uma API REST completa a partir de um JSON.
