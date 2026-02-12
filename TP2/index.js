var http = require("http");
var url = require("url");
const axios = require("axios");

const JSON_SERVER_URL = 'http://localhost:3000';

http
  .createServer(function (req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    if (path === '/reparacoes') {
      axios
        .get(`${JSON_SERVER_URL}/reparacoes`)
        .then((resp) => {
          const reparacoes = resp.data;
          let html = `
            <h1>Lista de Reparações</h1>
            <table border="1">
            <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Tipo Intervenção</th>
              <th>Tipo Viatura</th>
              <th>Modelo Viatura</th>
              <th>Observações</th>
            </tr>
            </thead>
            <tbody>
          `;

          const flattenedReparacoes = reparacoes.map((rep, index) => ({
              id: index + 1,
              data: rep.data,
              tipo_intervencao: rep.intervencoes.map(i => i.nome).join(', '),
              tipo_viatura: rep.viatura.marca,
              modelo_viatura: rep.viatura.modelo,
              observacoes: rep.intervencoes.map(i => i.descricao).join('; ')
          }));

          flattenedReparacoes.forEach((a) => {
            html += `<tr>
              <td>${a.id}</td>
              <td>${a.data}</td>
              <td>${a.tipo_intervencao}</td>
              <td>${a.tipo_viatura}</td>
              <td>${a.modelo_viatura}</td>
              <td>${a.observacoes}</td>
            </tr>`;
          });
          html += "</tbody></table>";

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
        })
        .catch((error) => {
          res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>Error loading repair data.</h1><pre>" + JSON.stringify(error) + "</pre>");
        });
    } else if (path === '/intervencoes') {
        axios
            .get(`${JSON_SERVER_URL}/reparacoes`)
            .then((resp) => {
                const reparacoes = resp.data;
                const intervencoesCount = {};
                reparacoes.forEach(rep => {
                    rep.intervencoes.forEach(interv => {
                        const tipo = interv.nome;
                        intervencoesCount[tipo] = (intervencoesCount[tipo] || 0) + 1;
                    });
                });

                let html = `
                    <h1>Tipos de Intervenção</h1>
                    <table border="1">
                    <thead>
                    <tr>
                        <th>Tipo de Intervenção</th>
                        <th>Número de Vezes</th>
                    </tr>
                    </thead>
                    <tbody>
                `;

                Object.keys(intervencoesCount).forEach(tipo => {
                    html += `<tr>
                        <td>${tipo}</td>
                        <td>${intervencoesCount[tipo]}</td>
                    </tr>`;
                });
                html += "</tbody></table>";

                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(html);
            })
            .catch((error) => {
                res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                res.end("<h1>Error loading intervention data.</h1><pre>" + JSON.stringify(error) + "</pre>");
            });
    } else if (path === '/viaturas') {
        axios
            .get(`${JSON_SERVER_URL}/reparacoes`)
            .then((resp) => {
                const reparacoes = resp.data;
                const viaturasCount = {};
                reparacoes.forEach(rep => {
                    const modelo = `${rep.viatura.marca} ${rep.viatura.modelo}`;
                    if (modelo) {
                        viaturasCount[modelo] = (viaturasCount[modelo] || 0) + 1;
                    }
                });

                let html = `
                    <h1>Viaturas Reparadas</h1>
                    <table border="1">
                    <thead>
                    <tr>
                        <th>Modelo da Viatura</th>
                        <th>Número de Reparações</th>
                    </tr>
                    </thead>
                    <tbody>
                `;

                Object.keys(viaturasCount).forEach(modelo => {
                    html += `<tr>
                        <td>${modelo}</td>
                        <td>${viaturasCount[modelo]}</td>
                    </tr>`;
                });
                html += "</tbody></table>";

                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(html);
            })
            .catch((error) => {
                res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                res.end("<h1>Error loading vehicle data.</h1><pre>" + JSON.stringify(error) + "</pre>");
            });
    } else {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404 Not Found</h1>");
    }
  })
  .listen(7777);

console.log("Servidor à escuta na porta 7777");