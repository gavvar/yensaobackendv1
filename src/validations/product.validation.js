import Joi from "joi";

export const productSchemas = {
  create: Joi.object({
    // Cho phép productData (JSON string)
    productData: Joi.string().allow(),

    // Các trường từ productData sau khi parse
    name: Joi.string().required().min(3).max(200),
    categoryId: Joi.number().required(),
    price: Joi.number().required().min(0),
    description: Joi.string().allow("", null),
    content: Joi.string().allow("", null),
    discountPrice: Joi.number().allow(null),
    quantity: Joi.number().default(0),
    unit: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive").default("active"),
    isFeatured: Joi.boolean().default(false),
    metaTitle: Joi.string().allow("", null),
    metaDescription: Joi.string().allow("", null),
    sku: Joi.string().allow("", null),
    weight: Joi.number().allow(null),
    origin: Joi.string().allow("", null),

    // Cho phép trường từ multer
    files: Joi.any(),
  }).unknown(true), // Quan trọng: cho phép các trường không xác định

  update: Joi.object({
    name: Joi.string().min(3).max(200),
    price: Joi.number().min(0),
    description: Joi.string().allow("", null),
    content: Joi.string().allow("", null),
    categoryId: Joi.number(),
    discountPrice: Joi.number().allow(null),
    quantity: Joi.number(),
    unit: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive"),
    isFeatured: Joi.boolean(),
    metaTitle: Joi.string().allow("", null),
    metaDescription: Joi.string().allow("", null),
    sku: Joi.string().allow("", null),
    weight: Joi.number().allow(null),
    origin: Joi.string().allow("", null),
    // Cho phép trường productData ban đầu
    productData: Joi.any(),
  }).unknown(true), // Cho phép các trường không xác định

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
