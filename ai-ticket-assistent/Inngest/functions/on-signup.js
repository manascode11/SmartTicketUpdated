import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  {
    id: "on-user-signup",
    retries: 2,
    triggers: [{ event: "user/signup" }],
  },
  async ({ event, step }) => {
    try {
      const { email } = event.data;

      // Verify the user profile exists in MongoDB
      const verifiedEmail = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email }).lean();
        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }
        return userObject.email; // Pass ONLY the clean email string
      });

      // Dispatch the onboarding welcome notification
      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to SmartTicket TMS!`;
        const message = `Welcome aboard! Your account is active.\n\nIf you encounter any bugs, system crashes, or telemetry errors on your platform, simply submit a ticket in your main dashboard queue. Our AI co-pilot will triage it instantly and assign a dedicated engineering moderator to fix it.`;
        await sendMail(verifiedEmail, subject, message);
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Error running signup email step:", error.message);
      return { success: false };
    } 
  }
);