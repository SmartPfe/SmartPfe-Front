# Recreate the SmartPFE code graph on another PC

These are copies of the helper files used in this conversation. The tested
Graphify package version was `graphifyy==0.9.79`. No environment or interpreter
path from the original PC is included.

Arrange existing/cloned repositories under one parent folder:

```text
SmartPFE/
  SmartPfe-Front/
  SmartPfe-Backend/
  RAG-ingestion/       # optional, when working on ingestion
  graphify-code.ps1
  .graphifyignore
  AGENTS.md
  .graphify/
    finalize.py
    venv/
  graphify-out/        # generated locally
```

From that parent folder in PowerShell, copy the committed templates:

```powershell
$contextTemplates = '.\SmartPfe-Front\docs\conversation-context\graphify-setup'
New-Item -ItemType Directory -Path '.graphify', 'graphify-out' -Force | Out-Null
Copy-Item -LiteralPath "$contextTemplates\graphify-code.ps1" -Destination '.\graphify-code.ps1'
Copy-Item -LiteralPath "$contextTemplates\finalize.py" -Destination '.\.graphify\finalize.py'
Copy-Item -LiteralPath "$contextTemplates\.graphifyignore" -Destination '.\.graphifyignore'
# If this parent already has AGENTS.md, merge the instructions instead of replacing it.
# Otherwise copy workspace-AGENTS.md to the parent as AGENTS.md.
```

With Python available, create the isolated runtime:

```powershell
python -m venv .graphify\venv
& '.\.graphify\venv\Scripts\python.exe' -m pip install 'graphifyy==0.9.79'
$contextGraphPython = (Resolve-Path '.\.graphify\venv\Scripts\python.exe').Path
$contextGraphPython | Set-Content -LiteralPath '.\graphify-out\.graphify_python' -Encoding utf8
.\graphify-code.ps1 refresh
```

The helper resolves its workspace from its own location; put it in the parent,
not inside this templates folder. Refresh extracts code only, clusters without
LLM labels, generates filename-based community names and exports the HTML map.
It makes no model/API calls. Keep generated caches, environments and graphs local.

```powershell
.\graphify-code.ps1 query 'report rag retrieval' --budget 1500
.\graphify-code.ps1 explain 'getSectionRagContext'
.\graphify-code.ps1 refresh
```

Read `graphify-out/graph.json` through scoped queries, use `.vocab.txt` to find
symbol vocabulary, and verify source before making edits or runtime claims.
`graph.html` embeds the map but loads its visualization library from a CDN.
The old graph snapshot is not shipped because it includes references to local
uncommitted RAG experiments; rebuilding indexes exactly the files on this PC.

The helper templates are archived project tooling, not a promise that every
future Graphify release exposes the same internal report APIs. Use the pinned
version or validate any upgrade separately. No watcher, hook, semantic indexing
or additional service is needed.
