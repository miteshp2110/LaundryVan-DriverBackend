const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/secrets");

const driverAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    // @ts-ignore
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "driver") {
      return res.status(403).json({ error: "Not authorized as driver" });
    }

    req.driver = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = driverAuthMiddleware;
