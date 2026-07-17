import jwt from "jsonwebtoken";
import { registerKey, withRateLimit } from "./middleware/rateLimit";

export async function registerHanlder(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      success: false,
    });
  }

  const { installationId } = req.body;

  if (!installationId) {
    return res.status(400).json({
      error: "Missing installationId",
      success: false,
    });
  }

  const token = jwt.sign(
    {
      installationId,
      iss: "briqon",
      aud: "mobile",
    },
    process.env.JWT_SECRET!,
  );

  return res.status(200).json({
    token,
    success: true,
  });
}

export default withRateLimit(registerHanlder, registerKey);
