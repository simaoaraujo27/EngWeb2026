const pug = require("pug");

// Helper para compilar e renderizar
function renderPug(fileName, data) {
  return pug.renderFile(`./views/${fileName}.pug`, data);
}

exports.emdsListPage = function (emds, d) {
  return renderPug("index", { emds: emds, data: d });
};

exports.emdFormPage = function (emd, d) {
  return renderPug("emd", { emd: emd, data: d });
};

exports.emdRegistoPage = function (d) {
  return renderPug("form", { emd: null, data: d });
};

exports.emdEditarPage = function (emd, d) {
  return renderPug("form", { emd: emd, data: d });
};

exports.emdStatsPage = function (stats, d) {
  return renderPug("stats", { stats: stats, data: d });
};

exports.errorPage = function (msg, d) {
  return renderPug("error", { error: msg, data: d });
};
