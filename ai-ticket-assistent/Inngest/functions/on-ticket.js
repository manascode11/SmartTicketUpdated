// import { inngest } from "../client.js";
// import Ticket from "../../models/ticket.js";
// import User from "../../models/user.js";
// import { NonRetriableError } from "inngest";
// import { sendMail } from "../../utils/mailer.js";
// import analyzeTicket from "../../utils/ai.js";

// export const onTicketCreated = inngest.createFunction(
//   {
//     id: "on-ticket-created",
//     retries: 2,
//     triggers: [{ event: "ticket/created" }],
//   },
//   async ({ event, step }) => {
//     try {
//       const { ticketId } = event.data;

//       // Step 1: Fetch the ticket
//       const ticket = await step.run("fetch-ticket", async () => {
//         const ticketObject = await Ticket.findById(ticketId).lean();
//         if (!ticketObject) {
//           throw new NonRetriableError("Ticket not found");
//         }
//         return ticketObject;
//       });

//       // Step 2: Analyze with AI
//       const aiResponse = await step.run("analyze-ticket-with-ai", async () => {
//         return await analyzeTicket(ticket);
//       });

//       // Step 3: Save AI result to DB
//       const relatedskills = await step.run("ai-processing-and-update", async () => {
//         let skills = [];
//         if (aiResponse) {
//           await Ticket.findByIdAndUpdate(ticket._id, {
//             priority: !["low", "medium", "high"].includes(
//               aiResponse.priority?.toLowerCase()
//             )
//               ? "medium"
//               : aiResponse.priority.toLowerCase(),
//             helpfulNotes: aiResponse.helpfulNotes,
//             status: "IN_PROGRESS",
//             relatedSkills: aiResponse.relatedSkills || [],
//           });
//           skills = aiResponse.relatedSkills || [];
//         }
//         return skills;
//       });

//       // Step 4: Assign moderator
//       const moderator = await step.run("assign-moderator-workflow", async () => {
//         let user = null;

//         // Try skill-matched moderator first
//         if (relatedskills && relatedskills.length > 0) {
//           user = await User.findOne({
//             role: "moderator",
//             skills: {
//               $elemMatch: {
//                 $regex: relatedskills.join("|"),
//                 $options: "i",
//               },
//             },
//           }).lean();
//         }

//         // Fallback 1: any moderator
//         if (!user) {
//           user = await User.findOne({ role: "moderator" }).lean();
//         }

//         // Fallback 2: admin
//         if (!user) {
//           user = await User.findOne({ role: "admin" }).lean();
//         }

//         // Fallback 3: first user in DB
//         if (!user) {
//           user = await User.findOne({}).lean();
//         }

//         await Ticket.findByIdAndUpdate(ticket._id, {
//           assignedTo: user?._id || null,
//         });

//         return user;
//       });

//       // Step 5: Send email
//       await step.run("send-email-notification", async () => {
//         if (moderator && moderator.email) {
//           const finalTicket = await Ticket.findById(ticket._id).lean();
//           await sendMail(
//             moderator.email,
//             "Ticket Assigned",
//             `A new ticket is assigned to you: ${finalTicket.title}`
//           );
//         }
//       });

//       return { success: true };
//     } catch (err) {
//       console.error("Error running the step", err.message);
//       return { success: false };
//     }
//   }
// );
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
      const { ticketId } = event.data;

      // Step 1: Fetch the ticket
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId).lean();
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      // Step 2: Analyze with AI
      const aiResponse = await step.run("analyze-ticket-with-ai", async () => {
        return await analyzeTicket(ticket);
      });

      // Step 3: Save AI result to DB
      const relatedskills = await step.run("ai-processing-and-update", async () => {
        let skills = [];
        if (aiResponse) {
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: !["low", "medium", "high"].includes(
              aiResponse.priority?.toLowerCase()
            )
              ? "medium"
              : aiResponse.priority.toLowerCase(),
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills || [],
          });
          skills = aiResponse.relatedSkills || [];
        }
        return skills;
      });

      // Step 4: FIXED - Assign moderator matching tech tags accurately
      const moderator = await step.run("assign-moderator-workflow", async () => {
        let user = null;

        // 1. Try skill-matched moderator ONLY if skills exist
        if (relatedskills && relatedskills.length > 0) {
          // Escape special characters (like transforming 'UI/UX' safely to 'UI\/UX' for regex syntax)
          const safeSkills = relatedskills.map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
          const regexPattern = safeSkills.join("|");

          user = await User.findOne({
            role: "moderator",
            skills: {
              $elemMatch: {
                $regex: regexPattern,
                $options: "i",
              },
            },
          }).lean();
        }

        // Fallback 1: If no skill match, grab ANY available moderator
        if (!user) {
          user = await User.findOne({ role: "moderator" }).lean();
        }

        // Fallback 2: If no moderators exist in the DB, assign to admin
        if (!user) {
          user = await User.findOne({ role: "admin" }).lean();
        }

        // Fallback 3: Absolute backup (first user in DB)
        if (!user) {
          user = await User.findOne({}).lean();
        }

        // Save selected overseer to the database ticket document
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      // Step 5: Send email
      await step.run("send-email-notification", async () => {
        if (moderator && moderator.email) {
          const finalTicket = await Ticket.findById(ticket._id).lean();
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket is assigned to you: ${finalTicket.title}`
          );
        }
      });

      return { success: true };
    } catch (err) {
      console.error("Error running the step", err.message);
      return { success: false };
    }
  }
);