import jwt from "jsonwebtoken";

const issuerSources = ["https://accounts.google.com", "accounts.google.com"];

const authenticate = (appSecret, googleClientId) => {
  return async (req, res) => {
    try {
      const now = Math.floor(Date.now() / 1000);
      if (req.body.type == "google") {
        const response = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.token}`
        );
        if (!response.ok) {
          res.json({ success: false, message: "Authentication failed" });
          return;
        }
        const userResponse = await response.json();
        if (userResponse.aud !== googleClientId) {
          res.json({ success: false, message: "ID mismatch" });
          return;
        }
        if (!issuerSources.includes(userResponse.iss)) {
          res.json({ success: false, message: "Invalid issuer" });
          return;
        }
        if (userResponse.exp < now) {
          res.json({ success: false, message: "Credential has expired" });
          return;
        }

        const userRole = "admin";
        console.log(
          `Authentication successful for ${userResponse.name} as ${userRole}`
        );
        const appToken = jwt.sign(
          { email: userResponse.email, name: userResponse.name },
          appSecret,
          { expiresIn: "4h" }
        );
        res.json({
          success: true,
          token: appToken,
          email: userResponse.email,
          name: userResponse.name,
          role: userRole,
        });
        return;
      }
      res.json({ success: false, message: "Incorrect type" });
    } catch (error) {
      res.json({ success: false, message: "Authentication failed" });
    }
  };
};

export default authenticate;
