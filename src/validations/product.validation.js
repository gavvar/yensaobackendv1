import Joi from "joi";

export const productSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(200),
    price: Joi.number().required().min(0),
    description: Joi.string().allow("", null),
    stock: Joi.number().integer().min(0).default(0),
    categoryId: Joi.number().integer().allow(null),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri(),
        isFeatured: Joi.boolean().default(false),
      })
    ),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(200),
    price: Joi.number().min(0),
    description: Joi.string().allow("", null),
    stock: Joi.number().integer().min(0),
    categoryId: Joi.number().integer().allow(null),
  }),

  getProducts: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.alternatives().try(
      Joi.string().valid("popularity", "newest", "price-low", "price-high"),
      Joi.string().regex(/^[a-zA-Z]+,(ASC|DESC)$/)
    ),
    filter: [
      Joi.string(), // Cho phép JSON string
      Joi.object({
        categoryId: Joi.number().integer(),
        price: Joi.object({
          min: Joi.number().min(0),
          max: Joi.number().min(0),
        }),
      }),
    ],
    search: Joi.string().allow(""),
  }),
};
