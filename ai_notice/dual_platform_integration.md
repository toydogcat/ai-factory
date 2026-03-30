# AI-Factory & AI-Tarot Dual-Platform Integration Plan

## 1. Overview
Currently, AI-Factory and AI-Tarot coexist as separate codebases. To ensure stability while leveraging shared services, we adopt a **"Shared Source of Truth"** model. AI-Factory acts as the central hub for Identity, Social, and Economy, while AI-Tarot maintains its specialized divination logic.

## 2. Integration Architecture

### Phase 1: Shared Database (Current)
- **Identity**: Both platforms point to the same PostgreSQL `mentors` table.
- **Social**: Friends, Chat, and Notifications are handled by AI-Factory's `social.py` backend.
- **Economy**: Points are managed centrally in the `mentors` table by AI-Factory.

### Phase 2: Backend Synchronization
- **WebSocket Gateway**: Centralized in AI-Factory. AI-Tarot clients connect to AI-Factory's WS manager for social updates (friend requests, chat).
- **Pub/Sub Sync**: PostgreSQL `LISTEN/NOTIFY` ensures that actions taken in AI-Tarot (e.g., sending a friend request) are immediately visible in AI-Factory's dashboard.

### Phase 3: Gradual API Migration
- AI-Tarot will replace its local social/auth logic with calls to AI-Factory endpoints.
- **Auth**: AI-Tarot uses AI-Factory's `/api/v1/auth` for login/registration.
- **Social**: AI-Tarot uses AI-Factory's `/api/v1/social` for chat and friend management.

## 3. Development Guidelines
1. **Model Hierarchy**: Any changes to core models (`Mentor`, `Friend`, `Message`) MUST be applied to the shared PostgreSQL schema via Migration scripts.
2. **Endpoint Consistency**: Sub-projects (like AI-Tarot) should treat AI-Factory as a Service Provider.
3. **PWA & Assets**: Share the same iconography and design tokens to maintain a unified brand feel across platforms.

---
*Created by Antigravity for AI-Factory Platform v1.0*
