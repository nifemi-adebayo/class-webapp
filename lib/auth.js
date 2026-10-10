import { verifyToken } from "./session";

export function isAuthorized(request) {
  return verifyToken(request.cookies.get("session")?.value) === "admin";
}
