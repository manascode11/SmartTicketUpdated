# SmartTicket TMS: AI-Powered Asynchronous Triage & Resource Management Platform

An enterprise-grade, event-driven IT Service Management (ITSM) and Ticket Management System (TMS) built for high-throughput engineering environments. This platform bridges the gap between raw infrastructure error telemetry and technical support workflows. It utilizes an **Asynchronous Distributed Task Runner (Inngest)** to execute compute-heavy operations completely off the main HTTP routing thread and hooks into a pluggable **AI Co-Pilot Cluster (Gemini API)** to extract log insights. Once analyzed, a dynamic **Round-Robin Workload Scheduler** automatically routes the incident to the optimal human developer based on skill matching and real-time operational capacity.

---

## 🏗️ System Architecture & Data Flow

Traditional ticketing platforms create system bottlenecks by running slow AI diagnostics synchronously or overload individual engineers by defaulting to a static database search (`.findOne()`). 

This platform utilizes an asynchronous, event-driven microservices pattern to maintain a sub-10ms request-response time loop:
[ Frontend Client UI ]
│  (Action: Select AI Engine & Submit Ticket)
▼
[ Express API Gateway ] ──(Saves Draft Ticket Document to MongoDB)
│
├─► [ 201 Response Dispatched Instantly back to UI View ]
│
└─► [ Event Trigger Emitted to Inngest Hub: "ticket/created" ]
│
▼
┌────────────────────────────────────────────────────────┐
│ Inngest Background Worker Engine Pipeline              │
├────────────────────────────────────────────────────────┤
│ 🔹 Step 1: Fetch Ticket Snapshot Document              │
│ 🔹 Step 2: Query Selected AI Engine (Flash / Pro / R1) │
│ 🔹 Step 3: Save AI Diagnostic Runbook & Skill Tags     │
│ 🔹 Step 4: Run Workload Aggregation Pipeline Query    │
│ 🔹 Step 5: Nodemailer SMTP Dispatch out to Mailtrap    │
└────────────────────────────────────────────────────────┘


---

## 🚀 Key Feature Highlights

### 1. Pluggable Multi-Engine AI Toggle Switch
Supports real-time runtime model selection directly from the ticket creation layout. This allows the system to scale its computing resource intelligently based on problem severity:
* **Gemini 2.5 Flash:** Default engine optimized for sub-second log classification, automated skill tag mining, and high-volume cost efficiency.
* **Gemini 2.5 Pro:** Advanced reasoning engine leveraged for multi-layer infrastructure failures, algorithmic telemetry diagnostics, and complex code snippets.
* **DeepSeek R1 (Extensible Loop):** Integration slot for open-source verification and alternative cluster comparison pipelines.

### 2. Asynchronous Task Orchestration (Inngest)
Instead of keeping live HTTP sockets hanging while waiting on third-party APIs or database counts, Express controllers publish event payload records (`"user/signup"`, `"ticket/created"`) straight to **Inngest**. The worker engine manages transactional step isolation, deterministic data checkpoints, and exponential-backoff retry layers completely independently.

### 3. Workload-Balanced Round-Robin Resource Routing
To prevent race conditions and ensure an even distribution of support queue responsibilities, the platform uses a **MongoDB Aggregation Pipeline** (`$match` -> `$group` -> ascending calculation). It scans the operational database, identifies all moderators holding skills matching the AI-extracted metadata tags, tallies their active open items, and routes the new ticket to the least busy engineer.

### 4. Dynamic Data Serialization Boundaries
Eliminates structural execution errors and payload drops by strictly adhering to **primitive string data communication** between independent async execution checkpoints. The state pipeline passes explicit strings (like database `_id` paths or verified `email` indexes) rather than bloated Mongoose documents, maintaining structural safety over the wire.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend:** React (Vite), Tailwind CSS, DaisyUI Component Suite, React Router DOM, React Markdown.
* **Backend Runtime:** Node.js, Express.js, Mongoose ODM, MongoDB Atlas Cluster Array.
* **Orchestration Layer:** Inngest SDK Serverless Architecture & Developer CLI.
* **Core Utilities:** Google Gen AI SDK (`@google/genai`), Nodemailer Engine Core.

---

## 🗂️ Core Project Directory Tree

```text
├── backend/
│   ├── config/             # Connection Clients (db.js)
│   ├── controllers/        # Express Route Handlers (auth.controller.js, ticket.controller.js)
│   ├── models/             # Mongoose Strict Schemas (user.js, ticket.js)
│   ├── routes/             # Express API Endpoints (auth.routes.js, ticket.routes.js)
│   ├── utils/              # Third-Party Framework Connectors (ai.js, mailer.js)
│   └── Inngest/            # Event-Driven Microservices Hub
│       ├── client.js       # Inngest Instance Config Initialization
│       ├── on-signup.js    # Onboarding Lifecycle Step Routine
│       └── on-ticket.js    # AI Runbook Triage & Automated Dispatch Loop
└── frontend/
    ├── src/
    │   ├── components/     # Reusable Presentation Component Cards
    │   ├── pages/          # Views (Tickets.jsx, TicketDetailsPage.jsx)
    │   └── main.jsx        # App Core Entry Context Node
⚙️ Environment Configuration
Create a .env file within your backend root directory and configure the following variables:

Code snippet
# Network Interface Bindings
PORT=3000
VITE_SERVER_URL=http://localhost:3000

# Core Cluster Databases & Security Keys
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tms
JWT_SECRET=your_secure_jwt_token_secret_key_here
STAFF_SIGNUP_TOKEN=your_internal_company_moderator_passcode

# Google Gen AI Platform Credentials
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# Mailtrap Developer SMTP Sandbox Credentials
MAILTRAP_SMTP_HOST=
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your_mailtrap_user_id
MAILTRAP_SMTP_PASS=your_mailtrap_password