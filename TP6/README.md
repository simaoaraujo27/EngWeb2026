# App de Cinema Americano (TPC6)

# Data

11/03/2026

# Autor

A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC

Engenharia Web

# Resumo

Este projeto consiste numa aplicação web para consulta de uma base de dados de cinema americano, implementada através de uma orquestração de contentores **Docker**. O sistema é composto por três serviços principais: uma base de dados **MongoDB**, uma **API de dados** minimalista e um **servidor de interface**.

O dataset original foi processado para estruturar os dados em três coleções distintas: **filmes**, **atores** e **géneros**. A API de dados permite o acesso a estas coleções, enquanto a interface, desenvolvida em Express com templates **Pug** e estilizada com **W3.CSS**, oferece uma navegação intuitiva entre as diferentes entidades e métricas associadas.

# Funcionalidades e Rotas

A interface está disponível na porta `7790` e a API na porta `7789`. As seguintes rotas de interface estão disponíveis:

- **`/filmes`**: Lista de filmes contendo ID, título, ano e o número de atores e géneros associados.
- **`/filmes/:id`**: Detalhes completos de um filme, incluindo links para os atores do elenco.
- **`/atores`**: Lista de atores com ID, nome e o número de filmes em que participaram.
- **`/atores/:id`**: Informação detalhada de um ator e a lista de filmes associados.
- **`/generos`**: Lista de géneros cinematográficos e o número de filmes associados a cada um.

# Como Correr a Aplicação

Para correr a aplicação utilizando a orquestração Docker, siga os seguintes passos:

1.  **Preparar o Dataset** (Caso os ficheiros JSON na `api_dados/` precisem de atualização):
    ```bash
    python3 process_dataset.py
    ```

2.  **Iniciar a Orquestração**: No diretório `TP6`, execute:
    ```bash
    docker-compose up --build
    ```

3.  **Aceder à Aplicação**:
    - Interface Web: [http://localhost:7790](http://localhost:7790)
    - API de Dados: [http://localhost:7789/filmes](http://localhost:7789/filmes)

# Estrutura do Projeto

- `api_dados/`: Servidor da API, esquemas Mongoose e ficheiros de configuração para o MongoDB.
  - `mongo-init/`: Script para importação automática de dados no arranque do contentor.
- `interface/`: Servidor aplicacional (Web Interface).
  - `views/`: Templates Pug para a renderização das páginas.
  - `public/`: Estilos CSS e recursos estáticos.
- `process_dataset.py`: Script Python para normalizar o dataset original em coleções para o MongoDB.
- `docker-compose.yml`: Ficheiro de configuração para a orquestração dos serviços.

# Dependências

- `express`: Framework web para os servidores de API e Interface.
- `mongoose`: ODM para interagir com o MongoDB.
- `axios`: Cliente HTTP para a comunicação entre a Interface e a API.
- `pug`: Motor de templates para a Interface.
- `docker` & `docker-compose`: Para a contentorização e orquestração dos serviços.
