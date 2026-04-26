import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  console.log('[Auth] Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[Auth] No Authorization header');
    return res.status(401).json({ message: "No token provided" });
  }

  console.log('[Auth] Authorization header:', authHeader);
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    console.log('[Auth] No token found after Bearer');
    return res.status(401).json({ message: "Invalid token format" });
  }
  
  console.log('[Auth] Found token:', token.substring(0, 10) + '...');

  try {
    console.log('[Auth] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth] Token verified for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Optional admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

export const adminOrOwner = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "owner") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
};

