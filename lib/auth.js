export function isAuthorized(request) {
  const password = request.headers.get("x-upload-password");
  return password && password === process.env.UPLOAD_PASSWORD;
}
