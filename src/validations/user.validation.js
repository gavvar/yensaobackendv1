import Joi from "joi";

export const userSchemas = {
  // Schema cập nhật thông tin cá nhân
  updateProfile: Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    phone: Joi.string()
      .pattern(/^\+?[0-9]{10,15}$/)
      .allow("", null),
    address: Joi.string().allow("", null),
    avatar: Joi.string()
      .uri({ scheme: ["http", "https"] })
      .allow("", null),
    currentPassword: Joi.string().min(6).max(100),
    password: Joi.string().min(6).max(100).when("currentPassword", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }).with("password", "currentPassword"),

  // Schema admin cập nhật user
  updateUser: Joi.object({
    fullName: Joi.string().optional(),
    email: Joi.string().email(),
    phone: Joi.string()
      .pattern(/^\+?[0-9]{10,15}$/)
      .allow("", null),
    address: Joi.string().allow("", null),
    role: Joi.string().valid("customer", "admin"),
    isActive: Joi.boolean(),
    avatar: Joi.string()
      .uri({ scheme: ["http", "https"] })
      .allow("", null),
    password: Joi.alternatives().conditional("isAdminReset", {
      is: true,
      then: Joi.string().min(6).max(100), // Admin reset không cần currentPassword
      otherwise: Joi.string().min(6).max(100).when("currentPassword", {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    }),
    isAdminReset: Joi.boolean().default(false),
    currentPassword: Joi.string().min(6).max(100),
  }),

  // Schema tìm kiếm user
  listUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    search: Joi.string().allow(""),
    role: Joi.string().valid("customer", "admin"),
    isActive: Joi.boolean(),
  }),
};
