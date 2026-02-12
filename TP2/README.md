# Website de Reparações

# Data
12/02/2026

# Autor
A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC
Engenharia Web

# Resumo
Este projeto consiste num servidor web Node.js que serve conteúdo HTML dinâmico. O servidor interage com um serviço `json-server` (a correr em `http://localhost:3000`) para obter dados relacionados com reparações de veículos de um dataset JSON. O objetivo é apresentar informações sobre reparações de veículos de uma forma organizada e navegável através de diferentes rotas HTTP.

O servidor `index.js` define várias rotas que, ao serem acedidas via browser, efetuam pedidos ao `json-server` e geram tabelas HTML com os dados formatados.

# Funcionalidades e Rotas

O servidor está configurado para escutar na porta `7777`. As seguintes rotas estão disponíveis:

*   **`/reparacoes`**:
    *   **Descrição**: Apresenta uma lista completa de todas as reparações de veículos.
    *   **Comportamento**: O servidor faz um pedido GET a `http://localhost:3000/reparacoes`, processa os dados e gera uma tabela HTML detalhada com informações como ID, data, tipo de intervenção, tipo e modelo da viatura, e observações.

*   **`/intervencoes`**:
    *   **Descrição**: Exibe um resumo dos tipos de intervenção mais comuns e o número de vezes que cada um ocorreu.
    *   **Comportamento**: O servidor obtém os dados de `reparacoes` do `json-server`, calcula a frequência de cada tipo de intervenção e renderiza uma tabela HTML com esta contagem.

*   **`/viaturas`**:
    *   **Descrição**: Lista os modelos de viaturas que foram reparadas e a contagem de reparações para cada um.
    *   **Comportamento**: Similar às outras rotas, o servidor recolhe os dados de `reparacoes`, agrega as informações por modelo de viatura (marca e modelo) e apresenta uma tabela HTML com os modelos e o total de reparações para cada um.

Para correr a aplicação, certifique-se que o `json-server` está a correr na porta `3000` com o `dataset_reparacoes.json`. Depois, inicie o servidor Node.js:

```bash
node index.js
```

E aceda às rotas no seu navegador (ex: `http://localhost:7777/reparacoes`).
