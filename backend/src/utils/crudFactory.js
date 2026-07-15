const { Op } = require("sequelize");
const ApiError = require("./ApiError");
const ApiResponse = require("./ApiResponse");
const { paginate, buildMeta } = require("./pagination");

/**
 * Génère un jeu de handlers CRUD standard (list/getOne/create/update/remove)
 * pour un modèle Sequelize donné. Réduit la duplication entre les
 * contrôleurs Driver / FuelEntry / Inspection / DocumentItem / Incident /
 * Reservation qui partagent tous la même forme.
 *
 * options:
 *  - filterFields: champs acceptés tels quels dans req.query pour un WHERE exact (ex: ["vehicleId", "status"])
 *  - searchFields: champs sur lesquels un paramètre ?search= fait un LIKE
 *  - include: tableau d'options `include` Sequelize (relations à charger)
 *  - order: ordre par défaut, ex: [["createdAt", "DESC"]]
 *  - onCreate(instance, req): hook appelé après création (ex: journal d'activité)
 *  - onUpdate(instance, req, changedFields): hook appelé après mise à jour
 *  - onDelete(instance, req): hook appelé avant suppression
 *  - notFoundMessage
 */
function crudFactory(Model, options = {}) {
  const {
    filterFields = [],
    searchFields = [],
    include = [],
    order = [["id", "DESC"]],
    onCreate,
    onUpdate,
    onDelete,
    notFoundMessage = "Ressource introuvable",
  } = options;

  async function list(req, res, next) {
    try {
      const { page, limit, offset } = paginate(req.query);
      const where = {};

      for (const field of filterFields) {
        if (req.query[field] !== undefined && req.query[field] !== "") {
          where[field] = req.query[field];
        }
      }

      if (req.query.search && searchFields.length) {
        where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.like]: `%${req.query.search}%` } }));
      }

      const { rows, count } = await Model.findAndCountAll({
        where,
        include,
        order,
        limit,
        offset,
        distinct: true,
      });

      return ApiResponse.ok(res, rows, "OK", buildMeta({ page, limit, count }));
    } catch (err) {
      next(err);
    }
  }

  async function getOne(req, res, next) {
    try {
      const instance = await Model.findByPk(req.params.id, { include });
      if (!instance) throw ApiError.notFound(notFoundMessage);
      return ApiResponse.ok(res, instance);
    } catch (err) {
      next(err);
    }
  }

  async function create(req, res, next) {
    try {
      const instance = await Model.create(req.body);
      if (onCreate) await onCreate(instance, req);
      return ApiResponse.created(res, instance);
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const instance = await Model.findByPk(req.params.id);
      if (!instance) throw ApiError.notFound(notFoundMessage);

      const changedFields = Object.keys(req.body).filter(
        (k) => JSON.stringify(instance[k]) !== JSON.stringify(req.body[k])
      );

      await instance.update(req.body);
      if (onUpdate) await onUpdate(instance, req, changedFields);
      return ApiResponse.ok(res, instance, "Mis à jour avec succès");
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      const instance = await Model.findByPk(req.params.id);
      if (!instance) throw ApiError.notFound(notFoundMessage);

      if (onDelete) await onDelete(instance, req);
      await instance.destroy();
      return ApiResponse.noContent(res);
    } catch (err) {
      next(err);
    }
  }

  return { list, getOne, create, update, remove };
}

module.exports = crudFactory;
