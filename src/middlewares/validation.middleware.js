import { ValidationError } from "../utils/errors.js";

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const data = req[property];
    const { error } = schema.validate(data, { abortEarly: false });

    if (!error) return next();

    const messages = error.details.map((detail) => detail.message).join(", ");
    return next(new ValidationError(messages));
  };
};
