import jwt from "jsonwebtoken";

export function withAuth(handler: Function) {
  return async (req: any, res: any) => {
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({
        success: false,
        error: "Unauthorize",
      });

    const token = authHeader.replace("Bearer ", "");

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);

      req.user = payload;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  };
}
