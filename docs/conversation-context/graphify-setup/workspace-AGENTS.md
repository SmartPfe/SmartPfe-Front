# SmartPFE workspace

Use the existing SmartPfe-Front, SmartPfe-Backend and optional RAG-ingestion
checkouts. Preserve unrelated uncommitted work.

Read each repository's CONVERSATION_HANDOFF.md for completed translation work,
checkpoints, tests and the independent UI/content-language contract.

If graphify-out/graph.json exists in this parent, start feature/architecture
navigation with a scoped query from this parent:

```powershell
.\graphify-code.ps1 query 'report rag retrieval' --budget 1500
```

Then inspect source. The graph is a navigation aid, not runtime proof. Narrow
queries when truncated and use targeted rg when extraction misses something.
Refresh using the same helper after relevant source edits/pulls/branch switches.
Keep extraction code-only; do not add semantic indexing, hooks or watchers.
If the graph has not been recreated, use scoped source searches and consult the
committed Graphify setup instructions before indexing.
