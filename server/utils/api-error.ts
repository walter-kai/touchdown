import { HTTPErrorStatusCode } from "../error";

class ApiError extends Error {
  statusCode: HTTPErrorStatusCode;
  isOperational: boolean;

  constructor(
    statusCode: HTTPErrorStatusCode,
    message: string,
    isOperational = true,
    stack?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
