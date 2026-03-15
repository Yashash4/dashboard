const AUTH_TOKEN = process.env.AUTH_TOKEN;

function authMiddleware(req, res, next) {
  if (!AUTH_TOKEN) {
    return res.status(500).json({ error: "Server misconfigured: no auth token" });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = header.slice(7);
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ error: "Invalid token" });
  }

  next();
}

module.exports = authMiddleware;
