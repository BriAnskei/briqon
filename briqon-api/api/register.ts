import jwt from "jsonwebtoken";

export default async function hanlder(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { installationId } = req.body;


  if (!installationId) {
    return res.status(400).json({
      error: "Missing installationId"
    })
  }

  const token = jwt.sign({
    installationId,
    iss: 'briqon',
    aud: 'mobile'
  },
    process.env.JWT_SECRET, {
    expiresIn:
    }
  )



} 
