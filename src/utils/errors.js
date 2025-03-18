export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(message) {
    super(message, 401); // 401 Unauthorized
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400); // 400 Bad Request
  }
}
