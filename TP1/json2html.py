import json, os, shutil


def open_json(filename):
    with open(filename, encoding="utf-8") as f:
        data = json.load(f)
    return data


# Cria subpasta que vai ter todos os HTMLs das cidades (id.html)
def mk_dir(relative_path):
    if not os.path.exists(relative_path):
        os.mkdir(relative_path)
    else:
        shutil.rmtree(relative_path)
        os.mkdir(relative_path)


def new_file(filename, content):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)


def criar_pagina_intervencao(intervencao, id_intervencao, reparacoes):
    html = f"""
    <html>
        <head>
            <title>Reparações</title>
            <meta charset="utf-8"/>
        </head>

        <body>
            <h1>Intervenção</h1>
            <p>Código: {intervencao["codigo"]}</p>
            <p>Nome: {intervencao["nome"]}</p>
            <p>Descrição: {intervencao["descricao"]}</p>
            <p>Lista de reparações onde foi executada:</p>
            <ul>
                {criar_lista_reparacoes(reparacoes)}
            </ul>
        </body>
    </html>
    """

    new_file(f"./output/intervencoes/intervencao_{id_intervencao}.html", html)


def criar_lista_reparacoes(reparacoes):
    lista = ""
    for reparacao in reparacoes:
        lista += f"""
            <li>
                <a href="../reparacoes/reparacao_{reparacao["id"]}.html">{reparacao["id"]}</a><br>
            </li>
        """
    return lista


def criar_pagina_marca_modelo(marca, modelo, reparacoes):
    filename_marca = marca.replace(" ", "_").lower()
    filename_modelo = modelo.replace(" ", "_").lower()
    page_filename = f"viatura_{filename_marca}_{filename_modelo}.html"

    html = f"""
    <html>
        <head>
            <title>Reparações de {marca} {modelo}</title>
            <meta charset="utf-8"/>
        </head>

        <body>
            <h1>{marca} {modelo}</h1>
            <p>Lista de reparações:</p>
            <ul>
                {criar_lista_reparacoes(reparacoes)}
            </ul>
        </body>
    </html>
    """
    new_file(f"./output/viaturas/{page_filename}", html)
    return page_filename


def criar_pagina_reparacao(reparacao, id_reparacao):
    html = f"""
    <html>
        <head>
            <title>Reparações</title>
            <meta charset="utf-8"/>
        </head>

        <body>
            <h1>Reparação</h1>
            <p>Data: {reparacao["data"]}</p>
            <p>NIF: {reparacao["nif"]}</p>
            <p>Nome: {reparacao["nome"]}</p>
            <p>Marca: {reparacao["viatura"]["marca"]}</p>
            <p>Modelo: {reparacao["viatura"]["modelo"]}</p>
            <p>Número de intervenções: {reparacao["nr_intervencoes"]}</p>
            <p>Intervenções:</p>
            <ul>
                {criar_lista_intervencoes(reparacao["intervencoes"])}
            </ul>
        </body>
    </html>
    """

    new_file(f"./output/reparacoes/reparacao_{id_reparacao}.html", html)


def criar_lista_intervencoes(intervencoes):
    lista = ""
    for intervencao in intervencoes:
        lista += f"""
            <li>
                {intervencao["codigo"]}<br>
                {intervencao["nome"]}<br>
                {intervencao["descricao"]}<br>
            </li>
        """
    return lista


# ----- Página principal -----
mk_dir("output")
mk_dir("output/intervencoes")
mk_dir("output/viaturas")
mk_dir("output/reparacoes")
dataset = open_json("dataset_reparacoes.json")
reparacoes = dataset["reparacoes"]

lista_reparacoes = ""
lista_tipos_intervencao = ""
lista_marcas_modelos_carros = ""

temp_tipos_intervencao = []
temp_marcas_modelos_carros = {}
temp_reparacoes_por_intervencao = {}
temp_reparacoes_por_marca_modelo = {}

id_reparacao = 1

for reparacao in reparacoes:
    reparacao["id"] = id_reparacao
    # Cria a subpágina da reparação
    criar_pagina_reparacao(reparacao, id_reparacao)

    # Linkar a nova página a cada reparação
    lista_reparacoes += f"""
        <li>
            <a href="./reparacoes/reparacao_{id_reparacao}.html">{id_reparacao}</a><br>
            {reparacao["data"]}<br>
            {reparacao["nif"]}<br>
            {reparacao["nome"]}<br>
            {reparacao["viatura"]["marca"]}<br>
            {reparacao["viatura"]["modelo"]}<br>
            {reparacao["nr_intervencoes"]}<br>
        </li>
    """
    id_reparacao += 1

    intervencoes = reparacao["intervencoes"]
    viatura = reparacao["viatura"]

    # Apenas adiciona a intervenção se não tiver sido vista antes
    for intervencao in intervencoes:
        if intervencao not in temp_tipos_intervencao:
            temp_tipos_intervencao += [intervencao]

        if intervencao["codigo"] not in temp_reparacoes_por_intervencao:
            temp_reparacoes_por_intervencao[intervencao["codigo"]] = []

        temp_reparacoes_por_intervencao[intervencao["codigo"]].append(reparacao)

    # Apenas adiciona a viatura se não tiver sido vista antes. Se ja tiver sido vista, aumenta 1 na contagem
    chave_viatura = (viatura["marca"], viatura["modelo"])

    if chave_viatura not in temp_marcas_modelos_carros:
        temp_marcas_modelos_carros[chave_viatura] = 1
    else:
        temp_marcas_modelos_carros[chave_viatura] += 1

    if chave_viatura not in temp_reparacoes_por_marca_modelo:
        temp_reparacoes_por_marca_modelo[chave_viatura] = []
    temp_reparacoes_por_marca_modelo[chave_viatura].append(reparacao)


temp_tipos_intervencao.sort(key=lambda x: x["codigo"])


lista_final_viaturas = [
    {"marca": chave[0], "modelo": chave[1], "numero_de_veiculos": valor}
    for chave, valor in temp_marcas_modelos_carros.items()
]

lista_final_viaturas.sort(
    key=lambda x: (x["marca"], x["modelo"], x["numero_de_veiculos"])
)

id_intervencao = 1
for intervencao in temp_tipos_intervencao:
    reparacoes_com_intervencao = temp_reparacoes_por_intervencao.get(
        intervencao["codigo"], []
    )
    criar_pagina_intervencao(
        intervencao, id_intervencao, reparacoes_com_intervencao
    )

    lista_tipos_intervencao += f"""
        <li>
            <a href="./intervencoes/intervencao_{id_intervencao}.html">{intervencao["codigo"]}</a><br>
            {intervencao["nome"]}<br>
            {intervencao["descricao"]}<br>
        </li>
        """
    id_intervencao += 1


for viatura in lista_final_viaturas:
    marca = viatura["marca"]
    modelo = viatura["modelo"]
    chave_viatura = (marca, modelo)
    reparacoes_da_viatura = temp_reparacoes_por_marca_modelo[chave_viatura]

    page_filename = criar_pagina_marca_modelo(marca, modelo, reparacoes_da_viatura)

    lista_marcas_modelos_carros += f"""
        <li>
            <a href="./viaturas/{page_filename}">{marca} {modelo}</a>: {viatura["numero_de_veiculos"]}
        </li>
        """


html = f"""
<html>
    <head>
        <title>Reparações</title>
        <meta charset="utf-8"/>
    </head>

    <body>
        <h3>Lista das reparações</h3>
        <ul>
            {lista_reparacoes}
        </ul>

        <hr/>
        
        <h3>Lista dos tipos de intervenção</h3>
        <ul>
            {lista_tipos_intervencao}
        </ul>

        <h3>Lista das marcas e modelos dos carros intervencionados</h3>
        <ul>
            {lista_marcas_modelos_carros}
        </ul>
    </body>
</html>
"""

new_file("./output/index.html", html)
