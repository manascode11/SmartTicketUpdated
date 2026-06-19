import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  {
    id: "on-ticket-created",
    retries: 2,
    triggers: [{ event: "ticket/created" }],
  },
  async ({ event, step }) => {
    try {
      const { ticketId, aiModel } = event.data;

      // Step 1: Fetch the target ticket from MongoDB
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId).lean();
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      // Step 2: Analyze telemetry logs using the selected AI Engine Model
      const aiResponse = await step.run("analyze-ticket-with-ai", async () => {
        return await analyzeTicket(ticket, aiModel);
      });

      // Step 3: Save AI analytical results to DB & Compute Dynamic SLA Deadlines
      const relatedskills = await step.run("ai-processing-and-update", async () => {
        let skills = [];
        if (aiResponse) {
          const priority = !["low", "medium", "high"].includes(aiResponse.priority?.toLowerCase())
            ? "medium"
            : aiResponse.priority.toLowerCase();

          // ⏳ Programmatic SLA Deadline Calculation Logic
          const now = new Date();
          let hoursToComplete = 24; // Default medium fallback (1 day)
          
          if (priority === "high") hoursToComplete = 4;   // Urgent production crashes
          if (priority === "low") hoursToComplete = 72;   // Non-blocking backlog items

          const deadlineDate = new Date(now.getTime() + hoursToComplete * 60 * 60 * 1000);

          await Ticket.findByIdAndUpdate(ticket._id, {
            priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills || [],
            deadline: deadlineDate, // Persistent database milestone
          });
          
          skills = aiResponse.relatedSkills || [];
        }
        return skills;
      });

      // Step 4: Smart Round-Robin Workload-Balanced Moderator Assignment
      const moderatorEmail = await step.run("assign-moderator-workflow", async () => {
        let selectedUser = null;

        // 1. Filter skill-matched candidates if metadata tags exist
        if (relatedskills && relatedskills.length > 0) {
          const safeSkills = relatedskills.map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
          const regexPattern = safeSkills.join("|");

          const candidateModerators = await User.find({
            role: "moderator",
            skills: {
              $elemMatch: {
                $regex: regexPattern,
                $options: "i",
              },
            },
          }).lean();

          // Balance operational loads across candidates
          if (candidateModerators.length > 0) {
            const candidateIds = candidateModerators.map(m => m._id);
            
            const workloads = await Ticket.aggregate([
              { $match: { assignedTo: { $in: candidateIds }, status: { $ne: "CLOSED" } } },
              { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
            ]);

            const workloadMap = {};
            workloads.forEach(w => {
              workloadMap[w._id.toString()] = w.count;
            });

            // Sort ascending: least busy moderator floats to index 0
            candidateModerators.sort((a, b) => {
              const countA = workloadMap[a._id.toString()] || 0;
              const countB = workloadMap[b._id.toString()] || 0;
              return countA - countB;
            });

            selectedUser = candidateModerators[0];
          }
        }

        // Fallback 1: No direct skill match -> Locate least busy moderator globally
        if (!selectedUser) {
          const allModerators = await User.find({ role: "moderator" }).lean();
          if (allModerators.length > 0) {
            const candidateIds = allModerators.map(m => m._id);
            const workloads = await Ticket.aggregate([
              { $match: { assignedTo: { $in: candidateIds }, status: { $ne: "CLOSED" } } },
              { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
            ]);
            
            const workloadMap = {};
            workloads.forEach(w => { workloadMap[w._id.toString()] = w.count; });
            
            allModerators.sort((a, b) => (workloadMap[a._id.toString()] || 0) - (workloadMap[b._id.toString()] || 0));
            selectedUser = allModerators[0];
          }
        }

        // Fallback 2: Route to admin backup account
        if (!selectedUser) {
          selectedUser = await User.findOne({ role: "admin" }).lean();
        }

        // Fallback 3: Master collection safety net fallback
        if (!selectedUser) {
          selectedUser = await User.findOne({}).lean();
        }

        // Commit assigned overseer to the ticket document
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: selectedUser?._id || null,
        });

        // Return email primitive string to optimize step communication
        return selectedUser ? selectedUser.email : null;
      });

      // Step 5: Send Dispatch Alert Email with SLA Deadline Details
      await step.run("send-email-notification", async () => {
        if (moderatorEmail) {
          const finalTicket = await Ticket.findById(ticket._id).lean();
          const formattedDeadline = new Date(finalTicket.deadline).toLocaleString();
          
          const subject = `🚨 CRITICAL: New Ticket Assigned to Your Triage Queue`;
          const message = `You have been assigned a new system incident based on your skill matching and real-time workload balance.\n\n` +
                          `🔹 Ticket Title: ${finalTicket.title}\n` +
                          `🔹 Current Status: ${finalTicket.status}\n` +
                          `⏰ STRICT COMPLETION DEADLINE (SLA): ${formattedDeadline}\n\n` +
                          `👉 Action Required: Log into your Moderator Dashboard, review the automated Gemini AI mitigation blueprints, and resolve this query before the timeline expires.`;

          await sendMail(moderatorEmail, subject, message);
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error executing background assignment engine:", err.message);
      return { success: false };
    }
  }
);