# SmartPFE frontend context

Read CONVERSATION_HANDOFF.md before broad exploration. The EN/FR interface
migration is complete through Stage 9; the handoff contains checkpoints,
validation, architecture and the user's requirements. Do not restart it.

UI language en/fr is independent of project/generation English/French/Arabic.
Preserve canonical values, request bodies, business logic, credits, user content,
exports, unsaved edits and active generation/recording when changing display text.
Keep French concise and natural, with essential financial details intact.

Use the existing checkout and preserve unrelated uncommitted changes. When a
parent code-only Graphify index exists, query it with a small budget first, then
verify source. Setup templates are in docs/conversation-context/graphify-setup.
Keep indexing code-only, with no added hooks/watchers/semantic extraction.

Frontend checks: npm run test:i18n, npm run lint, npm run build. Follow the user's
current scope for commits and pushes; historical permission is not deployment
authorization. Do not mix unrelated backend RAG experiments into translation work.
