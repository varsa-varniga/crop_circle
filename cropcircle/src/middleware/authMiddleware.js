import admin from "./firebaseAdmin.js"; // your existing firebase admin setup

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // attach user info to request
    next();
  } catch (err) {
    console.error("Firebase token verification error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
