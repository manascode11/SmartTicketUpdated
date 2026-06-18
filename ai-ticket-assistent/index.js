import "dotenv/config";
process.env.INNGEST_DEV = "1";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { serve } from "inngest/express";

dotenv.config();

import authRoutes from "./routes/user.js";
import ticketRoutes from "./routes/ticket.js";

import { inngest } from "./Inngest/client.js";
import { onUserSignup } from "./Inngest/functions/on-signup.js";
import { onTicketCreated } from "./Inngest/functions/on-ticket.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
    signingKey: "local"
  })
);

// app.use(
//   "/api/inngest",
//   serve({ client: inngest, functions: [onUserSignup, onTicketCreated] })
// );

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.get("/", (req, res) => {
  res.send(" Smart Ticket Assistant API is running smoothly!");
});

if (!process.env.MONGO_URI) {
  console.error("CRITICAL ERROR: MONGO_URI is not defined in your .env file!");
  process.exit(1);
}
const mockInngestContext = {
  step: {
    run: async (name, fn) => await fn(),
  }
};

app.post("/api/test/signup-worker", async (req, res) => {
  try {
    // Directly run your signup logic with the Postman data payload
    await onUserSignup.fn({ event: { data: req.body }, ...mockInngestContext });
    res.status(200).json({ status: "Success", message: "Signup worker completed successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/test/ticket-worker", async (req, res) => {
  try {
    // Directly run your Gemini AI ticket logic with the Postman data payload
    await onTicketCreated.fn({ event: { data: req.body }, ...mockInngestContext });
    res.status(200).json({ status: "Success", message: "Gemini AI Agent ticket analysis completed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🚀 MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });