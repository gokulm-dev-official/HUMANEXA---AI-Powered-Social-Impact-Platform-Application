# 🛠️ HUMANEXA: DETAILED FEATURE-SPECIFIC PROMPTS

Use these highly granular prompts to focus on specific modules of the Humanexa ecosystem.

---

### **1. THE PREMIUM CERTIFICATE ENGINE (Tiered Reward System)**
**Context**: Recreate or expand the 6-tier certificate system.
**Prompt**:
"Develop a React-based Premium Certificate System for Humanexa. The system must support six tiers: Welcome, Bronze, Silver, Gold, Platinum, and Diamond.
- **Diamond Tier**: Must feature a 'Diamond Shimmer' CSS animation, glassmorphic layout, and high-fidelity typography (Playfair Display).
- **Functionality**: Implement a `useCertificateExport` hook using `jsPDF` and `html2canvas` for high-resolution PDF generation. Include absolute positioning for a dynamic QR code that links to the verification portal.
- **Constraints**: Use the design tokens defined in `certificateDesign.ts`. Ensure the 'Seal of Sincerity' is rendered with SVG and features a metallic gradient."

---

### **2. AI-POWERED PRIVACY PROTOCOLS (FastAPI-OpenCV)**
**Context**: Implement or refine the automated face-blurring service.
**Prompt**:
"Build a FastAPI service for Humanexa that processes help-proof images.
- **Processing**: Use OpenCV (Haar Cascades or MediaPipe) to detect all human faces in an uploaded image.
- **Privacy Enforcement**: Apply a Gaussian blur (kernel size 51x51) to all detected faces to ensure recipient anonymity while keeping the background context (proof of help) clear.
- **Validation**: Output a JSON response with the S3 URL of the blurred image and a 'PrivacyScore' based on the visibility of identifying features.
- **Security**: The endpoint must be protected by an API Key shared with the Node.js backend."

---

### **3. ESCROW & DIRECT DONATION LOGIC (Smart Contracts/Backend)**
**Context**: The logic for high-trust donation handling.
**Prompt**:
"Implement the `DonationController` in the Node.js backend using TypeScript.
- **Escrow Logic**: For donations > $500, flag for 'Escrow.' Store the funds in a secure state until three 'Sincerity Milestones' are confirmed by the Social Worker and verified by the Humanexa AI.
- **State Machine**: Use a Zod-validated state machine to handle transitions: `PENDING` -> `FUNDS_HELD` -> `IN_PROGRESS` -> `VERIFYING` -> `RELEASED`.
- **Transparency**: Every state change must write a log to the `TransactionAudit` collection in MongoDB, including a SHA-256 hash of the previous state."

---

### **4. THE DONOR DISCOVERY MAP (Geo-Visualization)**
**Context**: Interactive map of needs.
**Prompt**:
"Create an interactive Map component using `react-google-maps` for the Humanexa Dashboard.
- **Styling**: Apply a custom 'Midnight Trust' JSON style to the map (dark blues, desaturated greens).
- **Cluster Management**: Use `MarkerClusterer` to handle high densities of 'Needs' in urban areas.
- **Popup UI**: When a marker is clicked, show a glassmorphic popup containing: Need Title, Urgency Level (Red/Amber/Green), and a 'Quick Donate' button.
- **Real-time**: Sync with the backend via Socket.io to show new 'Needs' appearing live on the map."

---

### **5. MOBILE SYNC & SINCERITY LOGS (Flutter)**
**Context**: Providing a secure logging interface for field workers.
**Prompt**:
"Extend the Social Kind Flutter app to include the 'Sincerity Logger.'
- **Offline First**: Use Hive for local storage to allow helpers in remote areas to log 'Step Completion' without internet.
- **Sync Engine**: On reconnection, batch-sync all local logs to the backend via Dio.
- **Camera Integration**: Use the `camera` package to force a 'Live Photo' (disallowing gallery uploads) for authentic proof-of-delivery."
