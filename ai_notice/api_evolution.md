# Platform API Evolution: REST vs. GraphQL

## 1. Current State: RESTful Architecture
Our current system uses FastAPI with REST endpoints (`/auth`, `/social`, `/studio`, etc.).
- **Pros**: Simple to debug, excellent documentation (Swagger), low overhead for simple CRUD.
- **Cons**: Over-fetching (getting full objects when only IDs are needed), Under-fetching (requiring multiple calls to get friends + their status + latest messages).

## 2. Evaluation: Do we need GraphQL?

### Why GraphQL?
As the "AI-Factory as a Platform" grows with sub-projects (AI-Tarot, AI-Kitty, etc.), frontend requirements become diverse.
- **Client Flexibility**: AI-Tarot might only need a friend's nickname, while the Dashboard needs full stats. GraphQL allows querying specific fields.
- **Subscription Support**: Native support for real-time updates (replaces ad-hoc WebSocket logic).
- **Typed Schema**: Stronger contract between the Hub (Factory) and sub-projects.

### The Verdict
**Recommendation: Hybrid Evolution**
1. **Stay REST for Core Auth/System**: Keep login and low-level system orchestrations in REST for reliability.
2. **Move Social & Metadata to GraphQL**: Chat history and social graphs are complex networks where GraphQL excels.
3. **Implementation Plan**:
   - Introduce `strawberry-graphql` or `ariadne` into the existing FastAPI backend.
   - Start with a Social GraphQL endpoint alongside the REST ones.
   - Sub-projects can choose to migrate to GraphQL for complex data fetching.

## 3. Conclusion
REST is enough for now, but GraphQL is the **next logical step** for platform scalability. We will begin the transition by layering GraphQL over our Social services to allow sub-projects more granular data access.

---
*Technical Assessment by Antigravity*
