const axios = require('axios')
const http = require('http')

// ----------------- Utils -------------------
function pagina(titulo, corpo){
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <title>${titulo}</title>
        <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"/>
    </head>
    <body class="w3-light-grey">

        <div class="w3-bar w3-teal">
            <a href="/" class="w3-bar-item w3-button">Início</a>
            <a href="/alunos" class="w3-bar-item w3-button">Alunos</a>
            <a href="/cursos" class="w3-bar-item w3-button">Cursos</a>
            <a href="/instrumentos" class="w3-bar-item w3-button">Instrumentos</a>
        </div>

        <div class="w3-container w3-teal">
            <h1>${titulo}</h1>
        </div>

        <div class="w3-container w3-margin-top">
            ${corpo}
        </div>
    </body>
    </html>
    `
}

function card(titulo, conteudo){
    return `
    <div class="w3-card-4 w3-white w3-margin-bottom">
        <header class="w3-container w3-teal">
            <h3>${titulo}</h3>
        </header>
        <div class="w3-container w3-padding">
            ${conteudo}
        </div>
    </div>
    `
}

// ---------------------------------------------------------------

var myServer = http.createServer(async function (req, res) {
    var d = new Date().toISOString().substring(0, 16)
    console.log(req.method + " " + req.url + " " + d)

    switch(req.method){
        case "GET":
            // --- Página principal
            if(req.url == "/"){
                var corpo = `
                    <div class="w3-container">
                        <h2>Bem-vindo à Escola de Música</h2>
                        <ul class="w3-ul w3-card-4">
                            <li><a href="/alunos">Lista de Alunos</a></li>
                            <li><a href="/cursos">Lista de Cursos</a></li>
                            <li><a href="/instrumentos">Lista de Instrumentos</a></li>
                        </ul>
                    </div>
                `
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(pagina("Escola de Música", corpo))
            }
            // --- /alunos
            else if(req.url == "/alunos"){
                try {
                    const resp = await axios.get("http://localhost:3000/alunos")
                    const alunos = resp.data
                    var linhas = alunos.map(a => `
                        <tr>
                            <td>${a.id}</td>
                            <td>${a.nome}</td>
                            <td>${a.curso}</td>
                            <td>${a.instrumento}</td>
                        </tr>
                    `).join("")

                    var corpo = card("Lista de Alunos", `
                        <table class="w3-table-all w3-hoverable">
                            <tr class="w3-teal">
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Curso</th>
                                <th>Instrumento</th>
                            </tr>
                            ${linhas}
                        </table>
                    `)
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(pagina("Gestão de Alunos", corpo))
                } catch (erro) {
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(`<p>Erro ao carregar alunos: ${erro}</p>`)
                }
            }
            // --- /cursos
            else if(req.url == "/cursos"){
                try {
                    const resp = await axios.get("http://localhost:3000/cursos")
                    const cursos = resp.data
                    var linhas = cursos.map(c => `
                        <tr>
                            <td>${c.id}</td>
                            <td>${c.designacao}</td>
                            <td>${c.duracao} anos</td>
                            <td>${c.instrumento["#text"]}</td>
                        </tr>
                    `).join("")

                    var corpo = card("Lista de Cursos", `
                        <table class="w3-table-all w3-hoverable">
                            <tr class="w3-teal">
                                <th>ID</th>
                                <th>Designação</th>
                                <th>Duração</th>
                                <th>Instrumento</th>
                            </tr>
                            ${linhas}
                        </table>
                    `)
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(pagina("Gestão de Cursos", corpo))
                } catch (erro) {
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(`<p>Erro ao carregar cursos: ${erro}</p>`)
                }
            }
            // --- /instrumentos
            else if(req.url == "/instrumentos"){
                try {
                    const resp = await axios.get("http://localhost:3000/instrumentos")
                    const instrumentos = resp.data
                    var linhas = instrumentos.map(i => `
                        <tr>
                            <td>${i.id}</td>
                            <td>${i["#text"]}</td>
                        </tr>
                    `).join("")

                    var corpo = card("Lista de Instrumentos", `
                        <table class="w3-table-all w3-hoverable">
                            <tr class="w3-teal">
                                <th>ID</th>
                                <th>Nome</th>
                            </tr>
                            ${linhas}
                        </table>
                    `)
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(pagina("Gestão de Instrumentos", corpo))
                } catch (erro) {
                    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(`<p>Erro ao carregar instrumentos: ${erro}</p>`)
                }
            }
            else{
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(`<p>Rota não suportada: ${req.url}.</p>`)
            }
            break

        default: 
            res.writeHead(405, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`<p>Método não suportado: ${req.method}.</p>`)
    }
})

myServer.listen(7777)
console.log("Servidor à escuta na porta 7777...")
