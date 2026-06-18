import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { inngest } from "../Inngest/client.js";
import "dotenv/config"; // Ensures .env file context variables are loaded early into this file scope

export const signup = async (req, res) => {
  const { email, password, skills = [], role, staffToken } = req.body;
  try {
    // 1. Check if the email identity is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 2. Safe default authorization fallback role
    let finalRole = "user";

    // 3. Guard Mechanism: Validate requested access privileges against server credentials
    const requestedRole = role?.toLowerCase()?.trim();
    if (requestedRole === "moderator" || requestedRole === "admin") {
      if (!staffToken || staffToken !== process.env.STAFF_SIGNUP_TOKEN) {
        return res.status(403).json({ error: "Unauthorized: Invalid staff registration token." });
      }
      finalRole = requestedRole; // Passcode matches securely
    }

    // 4. Hash user secrets and persist document module
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      password: hashed, 
      skills: finalRole === "moderator" ? skills : [], 
      role: finalRole 
    });

    // 5. Fire async webhook notification payload events
    await inngest.send({
      name: "user/signup",
      data: { email, role: finalRole },
    });

    // 6. Sign and validate JWT auth token tracking configurations
    if (!process.env.JWT_SECRET) {
      console.error("🔥 Error: JWT_SECRET environment key is not defined in your backend .env file!");
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_local_secret_key"
    );

    // 7. Return complete account data structure
    return res.status(201).json({ user, token });

  } catch (error) {
    // Prints out any hidden database collection schema validation blocks directly to terminal console
    console.error("🔥 CRITICAL CONTROLLER SIGNUP DATABASE EXCEPTION:", error);
    return res.status(500).json({ error: "Signup failed", details: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || "fallback_local_secret_key"
    );

    return res.json({ user, token });
  } catch (error) {
    console.error("🔥 LOGIN EXCEPTION:", error);
    return res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET || "fallback_local_secret_key");
    return res.json({ message: "Logout successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Logout failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body;
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
};