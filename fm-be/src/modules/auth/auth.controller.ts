import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "./user.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured in the backend" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) return res.status(401).json({ message: "Invalid token payload" });

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        watchlist: ["HDFCBANK", "ICICIBANK", "TCS", "INFY", "NTPC", "TATAPOWER", "M&M", "TMCV", "SUNPHARMA", "CIPLA"],
      });
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "super_secret_jwt_key",
      { expiresIn: "7d" }
    );

    res.json({ data: { user, token: jwtToken } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
