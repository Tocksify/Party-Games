import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "glo-party-games-secret-change-in-prod";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId } satisfies JwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
