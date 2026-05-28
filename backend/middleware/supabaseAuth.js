const { supabaseAdmin } = require("../config/supabaseAdmin");

/**
 * protect
 * Verifies the Supabase JWT sent in the Authorization header.
 * Attaches req.user = { id, email, role } to the request.
 *
 * Usage in routes:
 *   router.post("/", protect, myController);
 *   router.post("/", protect, requireRole("vendor"), myController);
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorised. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Ask Supabase to verify the token — returns the user if valid
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
    }

    const authUser = data.user;

    // Fetch the extra profile info (role, full_name) from public.users
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      // Profile row may not exist yet — use auth data as fallback
      req.user = {
        id:        authUser.id,
        email:     authUser.email,
        full_name: authUser.user_metadata?.full_name || "",
        role:      authUser.user_metadata?.role || "buyer",
      };
    } else {
      req.user = profile;
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

/**
 * requireRole(...roles)
 * Must be used AFTER protect.
 * Example: protect, requireRole("vendor")
 *          protect, requireRole("vendor", "admin")
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

module.exports = { protect, requireRole };
