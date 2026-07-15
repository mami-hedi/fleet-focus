/**
 * Construit les paramètres de pagination Sequelize (limit/offset) à partir
 * de la query string, et un objet meta à renvoyer au frontend.
 */
function paginate(query, defaultLimit = 10) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildMeta({ page, limit, count }) {
  return {
    page,
    limit,
    total: count,
    totalPages: Math.max(Math.ceil(count / limit), 1),
  };
}

module.exports = { paginate, buildMeta };
