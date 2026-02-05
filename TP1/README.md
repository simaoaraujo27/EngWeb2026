# Título
Website de reparações

# Data
04/02/2026

# Autor
A106855, Simão Pedro da Silva Araújo, <img src="../simao.jpg" alt="Imagem" width="150"/>

# UC
Engenharia Web

# Resumo
Este projeto consiste na criação de um site estático HTML gerado a partir de um conjunto de dados em formato JSON. O objetivo é apresentar informações sobre reparações de veículos de uma forma organizada e navegável.

O processo é automatizado por um script Python, `json2html.py`. Este script lê o ficheiro `dataset_reparacoes.json`, processa os dados e gera uma estrutura de pastas e ficheiros HTML no diretório `output/`.

O site gerado inclui uma página principal (`index.html`) que agrega e lista todas as reparações, os diferentes tipos de intervenção e as viaturas intervencionadas. Para além da página de índice, são geradas páginas individuais para cada reparação, cada tipo de intervenção e cada modelo de viatura, permitindo uma navegação detalhada e cruzada entre os diferentes dados.

# Lista de resultados
A execução do script `json2html.py` resulta na criação do diretório `output/`, que contém o website estático. A estrutura gerada é a seguinte:
*   `output/index.html`: A página principal que serve como portal de entrada para o site. Contém três listas principais: uma de todas as reparações, uma dos tipos de intervenção e uma das viaturas intervencionadas.
*   `output/reparacoes/`: Um diretório que contém uma página HTML individual para cada reparação registada no dataset (ex: `reparacao_1.html`).
*   `output/intervencoes/`: Um diretório que contém uma página HTML para cada tipo de intervenção único, listando todas as reparações associadas a essa intervenção (ex: `intervencao_1.html`).
*   `output/viaturas/`: Um diretório que contém uma página HTML para cada par único de marca/modelo de viatura, listando todas as reparações efetuadas nesse tipo de veículo (ex: `viatura_audi_a4.html`).