# AI-Factory Platform Development Guide 👏

To avoid engineering duplication and maintain a scalable architecture, all future sub-projects (AI-Tarot, AI-Kitty, etc.) must follow these "Platform-First" guidelines.

## 1. Responsibility Division

### AI-Factory (The Platform/PaaS)
- **Identity (SSO)**: Managing login, JWT issuance, and mentor roles.
- **Social Infrastructure**: Real-time chat, friend management, and notifications.
- **Economic System**: Centralized "Points" and credit validation.
- **Orchestration**: Docker lifecycle management and public tunnel (Traefik) routing.

### Sub-Projects (The Clients/Runtimes)
- **Pure Logic**: Specific AI inference (e.g., Tarot spreads, Kitty dialogue).
- **UI Presentation**: Their own unique frontend layouts and branding.
- **Data Consumption**: Fetching user info and points from Factory APIs.

## 2. Platform Development Protocol

### [MUST] Use Centralized Auth
Sub-projects **must not** implement their own user/password tables. They must verify JWT tokens issued by AI-Factory via `GET /api/v1/auth/me`.

### [MUST] Use Centralized Social
Notifications and group chat must be handled via the Factory WebSocket. Sub-projects should include the `SocialPanel` component to provide a unified social experience.

### [MUST] Standardize Point Consumption
Any point extraction must call the AI-Factory `/api/v1/studio/launch/` or a dedicated `billing` endpoint to ensure the transaction is recorded in the master ledger.

## 3. Predicted Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Monolithic Risk** | Implement aggressive error handling and circuit breakers so that Project A crashing doesn't kill Project B. |
| **Custom Data Needs** | Use a `metadata` JSON field in the Factory DB to store project-specific user settings without changing the core schema. |
| **High Latency** | Use the existing Conda + Traefik internal networking to keep API calls between Factory and projects fast. |

## 4. Long-term Developer Rules
1. **No Code Duplication**: If a logic (e.g., point deduction) can be shared, it belongs in AI-Factory.
2. **Standardized UI**: Layouts should respect the Glassmorphism CSS tokens defined in `index.css`.
3. **Internal Tunneling**: Use sub-domains (e.g., `tarot.localhost`) for local development to simulate production routing early.

---
**Closing Rule**: AI-Factory is the foundation. Every sub-project is a guest in its ecosystem. 👏🚀
