import Joi from "joi";

export const categorySchemas = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().allow("", null),
    parentId: Joi.number().integer().allow(null),
    imageUrl: Joi.string().allow("", null),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().allow("", null),
    parentId: Joi.number().integer().allow(null),
    imageUrl: Joi.string().allow("", null),
    isActive: Joi.boolean(),
    sortOrder: Joi.number().integer(),
  }),

  getCategories: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    isActive: Joi.boolean(),
    parentId: Joi.number().integer(),
  }),

  reorder: Joi.object({
    orderedIds: Joi.array().items(Joi.number().integer()).required(),
  }),
};
