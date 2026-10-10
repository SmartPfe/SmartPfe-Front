"""Name graph communities from filenames and render reports without model calls."""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from networkx.readwrite import json_graph
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.cluster import score_all
from graphify.detect import detect
from graphify.diagnostics import diagnose_extraction
from graphify.report import generate

root = Path(__file__).resolve().parents[1]
out = root / "graphify-out"
data = json.loads((out / "graph.json").read_text(encoding="utf-8"))
communities = defaultdict(list)
for node in data["nodes"]:
    communities[node["community"]].append(node["id"])
by_id = {n["id"]: n for n in data["nodes"]}
labels = {}
for cid, ids in communities.items():
    sources = Counter(by_id[n].get("source_file", "") for n in ids if by_id[n].get("source_file"))
    source = sources.most_common(1)[0][0] if sources else "External dependencies"
    path = Path(source)
    name = path.stem
    if name == "index":
        name = path.parent.name
    name = re.sub(r"^use(?=[A-Z])", "", name)
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", name)
    name = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name).replace("_", " ").replace("-", " ")
    name = name[:1].upper() + name[1:]
    name = re.sub(r"\bRag\b", "RAG", name)
    area = "Frontend" if "SmartPfe-Front/" in source else "Backend" if "SmartPfe-Backend/" in source else "Ingestion" if "RAG-ingestion/" in source else "Shared"
    labels[cid] = f"{area}: {name} [{cid}]"
for node in data["nodes"]:
    node["community_name"] = labels[node["community"]]
(out / "graph.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
(out / ".graphify_labels.json").write_text(json.dumps(labels, ensure_ascii=False, indent=2), encoding="utf-8")

G = json_graph.node_link_graph(data, edges="links")
detection = detect(root)
code = detection["files"].get("code", [])
detection["total_files"] = len(code)
detection["total_words"] = sum(len(Path(f).read_text(encoding="utf-8", errors="replace").split()) for f in code)
detection["warning"] = None
questions = suggest_questions(G, communities, labels)
report = generate(G, communities, score_all(G, communities), labels, god_nodes(G), surprising_connections(G, communities), detection, {"input": 0, "output": 0}, str(root), suggested_questions=questions)
health = diagnose_extraction(data, directed=data.get("directed", False), root=str(root))
report += "\n## SmartPFE index notes\n\n"
report += "- Code-only extraction; no document/media extraction or model/API calls.\n"
report += "- Community names are navigation hints derived from dominant source filenames.\n"
report += f"- Raw graph retains {len(data['links']):,} relationship records; the simple graph view displays {G.number_of_edges():,} connections.\n"
report += f"- Integrity: {health['missing_endpoint_edges']} missing endpoints; {health['dangling_endpoint_edges']} dangling endpoints; {health['self_loop_edges']} self-loops.\n"
report += f"- Graph health limitation: {health['undirected_same_endpoint_collapsed_edges']} same-endpoint relationship records combine in the simple graph view (e.g. calls and uses). Verify relation-sensitive answers against source.\n"
report += "- Six scanned code files produced no symbols on the initial build; this is a navigation index, not complete runtime analysis.\n"
report += "- Refresh using `graphify-code.ps1 refresh`; query output uses a token budget.\n"
(out / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
(out / "health.json").write_text(json.dumps(health, ensure_ascii=False, indent=2), encoding="utf-8")
vocab = set()
for node in data["nodes"]:
    for chunk in re.findall(r"[^\W\d_]+", node.get("label", ""), re.UNICODE):
        for part in re.findall(r"[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+", chunk) or [chunk]:
            if 3 <= len(part) <= 30:
                vocab.add(part.lower())
(out / ".vocab.txt").write_text("\n".join(sorted(vocab)), encoding="utf-8")
print(f"Finalized {G.number_of_nodes():,} nodes, {G.number_of_edges():,} connections, {len(communities)} named communities; no model calls.")
