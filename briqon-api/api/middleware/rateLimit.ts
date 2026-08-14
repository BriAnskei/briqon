import { rateLimit } from "../../util/rateLimit";

type KeyFn = (req: any) => string;

function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ??
    req.socket?.remoteAddress ??
    "unknown"
  );
}

// Default: keyed on the authenticated installationId + client IP (used by /generate).
const defaultKey: KeyFn = (req) =>
  `generate${req.user.installationId}:${getClientIp(req)}`;

// /register is unauthenticated (it mints the token), so there is no req.user.
// Key on client IP + the installationId supplied in the body.
export const registerKey: KeyFn = (req) =>
  `register:${getClientIp(req)}:${req.body?.installationId ?? "unknown"}`;

export function withRateLimit(handler: Function, keyFn: KeyFn = defaultKey) {
  return async (req: any, res: any) => {
    const key = keyFn(req);

    const { success } = await rateLimit.limit(key);

    if (!success)
      return res.status(429).json({
        success: false,
        error: "Too many request",
      });

    return handler(req, res);
  };
}
