import fetch from "node-fetch"; // or use native global 'fetch' if on Node v18+
import { inngest } from "./Inngest/client.js";
import { onUserSignup } from "./Inngest/functions/on-signup.js";
import { onTicketCreated } from "./Inngest/functions/on-ticket.js";

async function forceSync() {
  console.log("⏳ Forcing clean manual sync bypass...");
  
  const payload = {
    appName: "smart-ticket-assistant",
    url: "http://localhost:3000/api/inngest",
    functions: [
      { id: "on-user-signup", name: "on-user-signup", triggers: [{ event: "user/signup" }] },
      { id: "on-ticket-created", name: "on-ticket-created", triggers: [{ event: "ticket/created" }] }
    ]
  };

  try {
    const response = await fetch("http://localhost:8288/v1/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log("✅ SUCCESS: Inngest successfully bypassed and synced!");
    } else {
      const errText = await response.text();
      console.log(`❌ Dev server responded with: ${errText}`);
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

forceSync();