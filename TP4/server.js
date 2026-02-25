var http = require("http");
var axios = require("axios");
const { parse } = require("querystring");

var templates = require("./templates.js"); // Necessario criar e colocar na mesma pasta
var static = require("./static.js"); // Colocar na mesma pasta

// Aux functions
function collectRequestBodyData(request, callback) {
  if (request.headers["content-type"] === "application/x-www-form-urlencoded") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      callback(parse(body));
    });
  } else {
    callback(null);
  }
}

// Server creation
var server = http.createServer((req, res) => {
  // Logger: what was requested and when it was requested
  var d = new Date().toISOString().substring(0, 16);
  console.log(req.method + " " + req.url + " " + d);

  // Handling request
  if (static.staticResource(req)) {
    static.serveStaticResource(req, res);
  } else {
    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const query = Object.fromEntries(url.searchParams.entries());

    switch (req.method) {
      case "GET":
        // GET / ou /emd => Página principal
        if (pathname == "/" || pathname == "/emd") {
          let sort = query._sort || "nome.primeiro";
          let order = query._order || "asc";
          axios
            .get(`http://localhost:3000/emds?_sort=${sort}&_order=${order}`)
            .then((resp) => {
              var emds = resp.data;
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.emdsListPage(emds, d));
            })
            .catch((erro) => {
              console.log("Erro: " + erro);
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.errorPage("Não foi possível obter a lista de EMDs...", d));
            });
        } 
        // GET /emd/registo => Formulário de registo
        else if (pathname == "/emd/registo") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(templates.emdRegistoPage(d));
        }
        // GET /emd/stats => Estatísticas
        else if (pathname == "/emd/stats") {
          axios
            .get("http://localhost:3000/emds")
            .then((resp) => {
              let emds = resp.data;
              let stats = {
                gender: {},
                modalidade: {},
                clube: {},
                resultado: { true: 0, false: 0 },
                federado: { true: 0, false: 0 }
              };
              emds.forEach(e => {
                stats.gender[e.género] = (stats.gender[e.género] || 0) + 1;
                stats.modalidade[e.modalidade] = (stats.modalidade[e.modalidade] || 0) + 1;
                stats.clube[e.clube] = (stats.clube[e.clube] || 0) + 1;
                stats.resultado[e.resultado] = (stats.resultado[e.resultado] || 0) + 1;
                stats.federado[e.federado] = (stats.federado[e.federado] || 0) + 1;
              });
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(templates.emdStatsPage(stats, d));
            })
            .catch(erro => {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(templates.errorPage("Não foi possível obter as estatísticas...", d));
            });
        }
        // GET /emd/editar/:id => Formulário de edição
        else if (pathname.startsWith("/emd/editar/")) {
          var id = pathname.split("/")[3];
          axios
            .get(`http://localhost:3000/emds/${id}`)
            .then((resp) => {
              var emd = resp.data;
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(templates.emdEditarPage(emd, d));
            })
            .catch((erro) => {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(templates.errorPage("Não foi possível obter o registo para editar...", d));
            });
        }
        // GET /emd/apagar/:id => Apagar registo
        else if (pathname.startsWith("/emd/apagar/")) {
          var id = pathname.split("/")[3];
          axios
            .delete(`http://localhost:3000/emds/${id}`)
            .then((resp) => {
              res.writeHead(302, { Location: "/emd" });
              res.end();
            })
            .catch((erro) => {
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
              res.end(templates.errorPage("Não foi possível apagar o registo...", d));
            });
        }
        // GET /emd/:id => Página de detalhes de um EMD
        else if (pathname.startsWith("/emd/")) {
          var id = pathname.split("/")[2];
          axios
            .get(`http://localhost:3000/emds/${id}`)
            .then((resp) => {
              var emd = resp.data;
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.emdFormPage(emd, d));
            })
            .catch((erro) => {
              console.log("Erro: " + erro);
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(
                templates.errorPage(
                  "Não foi possível obter os detalhes do EMD...",
                  d,
                ),
              );
            });
        }
        break;

      case "POST":
        if (pathname == "/emd") {
          collectRequestBodyData(req, (data) => {
            if (data) {
              // Map flat data to nested structure
              let newEmd = {
                nome: {
                  primeiro: data.nome_primeiro,
                  último: data.nome_último
                },
                idade: parseInt(data.idade),
                género: data.género,
                dataEMD: data.dataEMD,
                modalidade: data.modalidade,
                clube: data.clube,
                email: data.email,
                morada: data.morada,
                federado: data.federado === "on",
                resultado: data.resultado === "on"
              };
              axios
                .post("http://localhost:3000/emds", newEmd)
                .then((resp) => {
                  res.writeHead(302, { Location: "/emd" });
                  res.end();
                })
                .catch((erro) => {
                  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                  res.end(templates.errorPage("Não foi possível inserir o registo...", d));
                });
            }
          });
        } else if (pathname.startsWith("/emd/")) {
          var id = pathname.split("/")[2];
          collectRequestBodyData(req, (data) => {
            if (data) {
              let updatedEmd = {
                id: id,
                nome: {
                  primeiro: data.nome_primeiro,
                  último: data.nome_último
                },
                idade: parseInt(data.idade),
                género: data.género,
                dataEMD: data.dataEMD,
                modalidade: data.modalidade,
                clube: data.clube,
                email: data.email,
                morada: data.morada,
                federado: data.federado === "on",
                resultado: data.resultado === "on"
              };
              axios
                .put(`http://localhost:3000/emds/${id}`, updatedEmd)
                .then((resp) => {
                  res.writeHead(302, { Location: "/emd" });
                  res.end();
                })
                .catch((erro) => {
                  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                  res.end(templates.errorPage("Não foi possível atualizar o registo...", d));
                });
            }
          });
        }
        break;

      default:
        // Outros metodos nao sao suportados
        res.writeHead(405, {
          "Content-Type": "text/html; charset=utf-8",
        });
        res.end("Method not supported");
    }
  }
});

server.listen(7777, () => {
  console.log("Servidor à escuta na porta 7777...");
});
