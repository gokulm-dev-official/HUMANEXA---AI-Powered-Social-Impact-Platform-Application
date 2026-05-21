# 🌟 THE HUMANEXA (SOCIAL KIND) MASTER PROJECT PROMPT

This comprehensive prompt is designed to define the exact vision, technical specifications, and aesthetic requirements for the **Humanexa** (also known as **Social Kind**) platform. Use this prompt to initialize, recreate, or describe the project in high fidelity.

---

### **Prompt Instruction**
"Act as an elite full-stack software architect and senior AI engineer. Your mission is to build/re-architect **Humanexa**, the 'Sincerity Protocol' for global social impact. Humanexa is a premium, enterprise-grade platform that connects donors, helpers, and individuals in need with 100% transparency, powered by AI and blockchain-inspired audit logs."

---

## 🏗️ 1. PROJECT VISION & CORE MISSION
- **Title**: Humanexa (Social Kind)
- **Slogan**: The Sincerity Protocol.
- **Mission**: To eliminate charity fraud and build a global 'Trust Economy.' Ensure every dollar/contribution reaches its intended destination through multi-staged AI verification, geolocation-based proof, and immutable reporting.
- **Target Audience**: Ultra High Net Worth Individuals (UHNWI), Institutional Donors, Verified Social Workers, and Grassroots Helpers.

## 💻 2. TECHNICAL STACK
- **Frontend (Web)**: React 18+, TypeScript, Vite, Tailwind CSS, Framer Motion (for animations), Redux Toolkit/Zustand (state management).
- **Backend (API)**: Node.js, Express, TypeScript, Zod (validation), Redis (caching), BullMQ (task queuing).
- **Mobile (Cross-Platform)**: Flutter 3.x, Dart, Provider (state), Dio (networking), Camera/Geolocator API.
- **AI/Verification Service**: Python, FastAPI, TensorFlow/PyTorch, OpenCV (face blurring, proof validation), CLIP (content analysis).
- **Database**: MongoDB (core data), PostgreSQL (financial/transaction logs), Redis (real-time).
- **Infrastructure**: Dockerized microservices, AWS (S3 for proof assets, SES for notifications).

## 💎 3. KEY FEATURES (HIGH FIDELITY)

### A. The Sincerity Certificate System (6-Tier Premium)
- **Tiers**: Welcome, Bronze, Silver, Gold, Platinum, Diamond.
- **Design Aesthetic**: Ultra-premium gradients, glassmorphism, metallic textures (gold leaf, diamond glimmer), and subtle micro-animations.
- **Features**: Dynamic QR code generation, HTML-to-PDF export (jsPDF/html2canvas), social sharing, and blockchain hash embedding.
- **Components**: `PremiumCertificate.tsx` wrapper with specialized tier renderers (e.g., `DiamondCertificate.tsx`).

### B. AI-Powered Proof Verification
- **Privacy First**: Automated face blurring using OpenCV in all social worker/aid recipient photos.
- **Fraud Detection**: AI-based similarity checks and metadata verification to prevent reused 'proof' images.
- **Geolocation**: Real-time GPS mapping of 'Needs' and 'Donations' to ensure physical proximity and delivery.

### C. Donation & Escrow Flow
- **Direct Donation**: Peer-to-peer contribution for immediate needs.
- **Escrow Protocol**: High-value donations held in a secure 'Escrow' until proof-of-delivery (PoD) is AI-verified and social-verified.
- **Audit Logs**: Immutable 'Sincerity Logs' for every transaction, visible to the donor.

### D. Donor Discovery Map
- **UI**: Custom-styled Google Maps/MapBox integration showing global/local 'Trust Nodes'.
- **Interactivity**: Clicking a node reveals the 'Sincerity Score' of the helper and active needs in the area.

## 🎨 4. DESIGN AESTHETICS (PREMIUM UI)
- **Design System**: Use a 'Sleek Dark Mode' by default with vibrant primary accents.
- **Typography**: Inter (UI text), Playfair Display (Headers/Certificates), Outfit (Numeric data).
- **Colors**:
  - `Diamond`: #E0F2F1 -> #E3F2FD (Ice/Diamond gradient)
  - `Gold`: #FFD700 -> #FFA000 (Metallic Gold)
  - `Primary`: Cyan/Electric Blue accents for 'Trust' and 'Tech'.
- **Motion**: Everything must feel alive. Use stagger animations for lists, layout transitions for pages, and high-quality shimmer effects for loading states.

## 📂 5. ARCHITECTURE & FOLDER STRUCTURE
```bash
/humanexa
  /frontend          # React SPA
  /backend           # Node.js Express API
  /ai_service        # Python FastAPI AI Worker
  /flutter_app       # Mobile application
  /mobile            # Alternative mobile assets
  /infrastructure    # Docker & CI/CD
  /docs              # Detailed implementation guides
```

## 🔐 6. SECURITY & COMPLIANCE
- **Authentication**: JWT with Refresh Tokens + Role-Based Access Control (RBAC).
- **Data Integrity**: SHA-256 hashing for all donation 'Sincerity Steps'.
- **Privacy**: GDPR/CCPA compliance for recipient data through AI obfuscation.

---

### **Execution Instructions**
"When implementing any feature for Humanexa, prioritize visual excellence and 'wow factor.' Do not use simple placeholders. Every component must feel production-ready and cater to an elite audience. All code should be modular, typed with TypeScript, and documented following the repository's established patterns."
