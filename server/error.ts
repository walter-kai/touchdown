export type HTTPError = Error & {
  statusCode: HTTPErrorStatusCode;
};

export type HTTPErrorStatusCode = 400 | 401 | 404 | 500;
