#!/usr/bin/env python3
"""Ingest interview documents (PDF/DOCX/CSV/XLSX/TXT/MD, images) into the
topic-by-topic JSON database used by the Interview Prep web app.

Pipeline
--------
1. Read every supported document in a source folder (default:
   C:\\Users\\gunas\\Downloads\\interview).
2. Extract the raw text (PDF -> pdfplumber, DOCX -> python-docx,
   XLSX/CSV -> pandas, images -> pytesseract if installed).
3. Split the text into question/answer pairs.
4. Classify each pair into a CATEGORY (azure data engineer, databricks
   architect, data architect, ai data engineer) and a TOPIC (databricks,
   sql, python, adf, azure, architecture, cicd, scenario-based,
   microsoft fabric, ...).
5. Compare with the questions already in data/interview-db.json and only
   keep questions that are UNIQUE (normalised text match).
6. Write the merged database back to data/interview-db.json + .js.

Usage
-----
    python scripts/ingest_documents.py                 # default folder
    python scripts/ingest_documents.py "D:\\docs"       # custom folder
    python scripts/ingest_documents.py --dry-run       # report only
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
DB_JSON = APP_DIR / "data" / "interview-db.json"
DB_JS = APP_DIR / "data" / "interview-db.js"
DEFAULT_SRC = Path(r"C:\Users\gunas\Downloads\interview")

# ---------------------------------------------------------------------------
# Optional third-party readers. Missing ones are simply skipped.
# ---------------------------------------------------------------------------
try:
    import pdfplumber  # noqa: F401
except Exception:  # pragma: no cover
    pdfplumber = None
try:
    import docx  # python-docx
except Exception:  # pragma: no cover
    docx = None
try:
    import pandas as pd
except Exception:  # pragma: no cover
    pd = None
try:
    from PIL import Image  # noqa: F401
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None

SUPPORTED = {".pdf", ".docx", ".doc", ".csv", ".xlsx", ".xls", ".txt", ".md",
             ".json", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"}

# ---------------------------------------------------------------------------
# Category / topic classification keywords.
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS = {
    "ade": ["azure", "adf", "data factory", "synapse", "fabric", "databricks",
            "etl", "adls", "data lake", "sql", "pyspark", "spark", "delta"],
    "databricks-architect": ["architect", "cluster", "workspace", "unity catalog",
                             "design", "scalab", "cost", "governance", "photon"],
    "data-architect": ["architecture", "data model", "warehouse", "dimensional",
                       "medallion", "govern", "security", "lineage"],
    "ai-data-engineer": ["ai", "ml", "machine learning", "embedding", "vector",
                         "llm", "rag", "feature", "model", "genai", "openai"],
}

TOPIC_KEYWORDS = {
    "adf": ["adf", "data factory", "pipeline", "linked service", "dataset",
            "trigger", "copy activity", "integration runtime", "shir"],
    "spark": ["spark", "rdd", "dataframe", "catalyst", "tungsten", "dag",
              "stage", "shuffle", "executor", "driver", "aqe"],
    "delta": ["delta lake", "delta table", "acid", "time travel", "vacuum",
              "optimize", "z-order", "zorder", "merge", "transaction log",
              "liquid clustering", "cdf", "change data feed", "clone"],
    "pyspark": ["pyspark", "udf", "window function", "explode", "join",
                "python", "pandas", "dataframe api"],
    "sql": ["sql", "join", "where", "having", "group by", "cte", "window",
            "rank", "union", "stored procedure", "index"],
    "modeling": ["data model", "scd", "star schema", "snowflake", "dimension",
                 "fact", "surrogate", "normalization", "slowly changing"],
    "streaming": ["streaming", "kafka", "event hub", "auto loader", "cloudfiles",
                  "watermark", "checkpoint", "structured streaming", "dlt",
                  "real-time"],
    "governance": ["unity catalog", "governance", "access control", "rbac",
                   "acl", "mask", "row filter", "lineage", "audit", "security"],
    "architecture": ["architecture", "medallion", "bronze", "silver", "gold",
                     "data lake", "lakehouse", "design", "warehouse"],
    "architect": ["architect", "design", "scalability", "best practice",
                  "migration", "capacity", "consulting"],
    "cicd-fabric": ["ci/cd", "cicd", "azure devops", "github actions", "fabric",
                    "deploy", "bundle", "dab", "release", "devops", "power bi"],
    "scenario": ["scenario", "troubleshoot", "how would you", "what if",
                 "you need to", "you notice", "you are asked", "imagine"],
    "behavioral": ["tell me about", "your experience", "strength", "weakness",
                   "team", "conflict", "challenge", "achievement"],
    "azure": ["azure", "adls", "blob", "synapse", "data lake", "key vault",
              "service principal", "managed identity", "sql database"],
}


def norm_question(text):
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------
def extract_pdf(path):
    if not pdfplumber:
        return ""
    out = []
    try:
        with pdfplumber.open(str(path)) as doc:
            for page in doc.pages:
                t = page.extract_text()
                if t:
                    out.append(t)
    except Exception:
        return ""
    return "\n".join(out)


def extract_docx(path):
    if not docx:
        return ""
    try:
        d = docx.Document(str(path))
        return "\n".join(p.text for p in d.paragraphs if p.text)
    except Exception:
        return ""


def extract_table(path):
    if not pd:
        return ""
    try:
        if path.suffix.lower() == ".csv":
            df = pd.read_csv(path, dtype=str, engine="python", on_bad_lines="skip")
        else:
            df = pd.read_excel(path, dtype=str)
        lines = []
        for _, row in df.iterrows():
            vals = [str(v) for v in row.tolist() if v is not None and str(v) != "nan"]
            if vals:
                lines.append(" | ".join(vals))
        return "\n".join(lines)
    except Exception:
        return ""


def extract_image(path):
    if not pytesseract:
        return ""
    try:
        from PIL import Image
        return pytesseract.image_to_string(Image.open(path))
    except Exception:
        return ""


def extract_text(path):
    ext = path.suffix.lower()
    if ext == ".pdf":
        return extract_pdf(path)
    if ext in (".docx", ".doc"):
        return extract_docx(path)
    if ext in (".csv", ".xlsx", ".xls"):
        return extract_table(path)
    if ext in (".png", ".jpg", ".jpeg", ".bmp", ".tiff"):
        return extract_image(path)
    if ext in (".txt", ".md", ".json"):
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            return ""
    return ""


# ---------------------------------------------------------------------------
# Q&A parsing
# ---------------------------------------------------------------------------
Q_START = re.compile(
    r"^\s*(?:Q\s*\d*\s*[.):\-]|Q\s*[:.]|Question\s*\d*\s*[:.\-)]|\d{1,3}\s*[.):]\s+|[-*]\s+)?\s*(.*\?)\s*$",
    re.IGNORECASE)
ANY_Q = re.compile(
    r"^\s*(?:Q\s*\d*\s*[.):\-]|Q\s*[:.]|Question\s*\d*\s*[:.\-)]|\d{1,3}\s*[.):])\s*(.+)$",
    re.IGNORECASE)


def clean(s):
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def parse_qa(text):
    """Heuristic splitter: returns list of {q, a} pairs."""
    lines = [ln.rstrip() for ln in (text or "").splitlines()]
    pairs = []
    cur_q = None
    cur_a = []

    def flush():
        nonlocal cur_q, cur_a
        if cur_q:
            ans = clean(" ".join(cur_a))
            pairs.append({"q": clean(cur_q), "a": ans})
        cur_q, cur_a = None, []

    for ln in lines:
        if not ln.strip():
            if cur_a:
                cur_a.append("")
            continue
        m = ANY_Q.match(ln)
        is_q = False
        qtext = ""
        if m and len(m.group(1)) > 12:
            is_q = True
            qtext = m.group(1)
        elif ln.strip().endswith("?") and 12 < len(ln.strip()) < 300:
            is_q = True
            qtext = ln.strip()
        if is_q:
            flush()
            cur_q = qtext
        elif cur_q is not None:
            cur_a.append(ln.strip())
    flush()

    # Keep only pairs with a meaningful answer.
    good = []
    for p in pairs:
        if len(p["q"]) < 12:
            continue
        if len(p["a"]) < 3:
            p["a"] = ""
        p["a"] = re.sub(r"\s*\n\s*", "\n", p["a"]).strip()
        good.append(p)
    return good


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------
def classify(q, a):
    blob = (q + " " + a).lower()
    cat = "ade"
    best = 0
    for cid, keys in CATEGORY_KEYWORDS.items():
        score = sum(1 for k in keys if k in blob)
        if score > best:
            best, cat = score, cid
    topic = None
    best = 0
    for tid, keys in TOPIC_KEYWORDS.items():
        score = sum(1 for k in keys if k in blob)
        if score > best:
            best, topic = score, tid
    return cat, topic


def to_bullets(answer):
    """Turn a raw answer blob into short, crisp point-by-point bullets."""
    a = (answer or "").strip()
    if not a:
        return ""
    # Already bulleted?
    if re.search(r"(?m)^\s*[\u2022\-\*]\s+", a):
        return a
    # Split into sentences.
    parts = re.split(r"(?<=[.;])\s+(?=[A-Z0-9])", a)
    parts = [p.strip() for p in parts if len(p.strip()) > 3]
    if len(parts) <= 1:
        return a
    return "\n".join("\u2022 " + p.rstrip(".") for p in parts[:12])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def load_db():
    if DB_JSON.exists():
        return json.loads(DB_JSON.read_text(encoding="utf-8"))
    return {"version": 1, "updatedAt": 0, "categories": []}


def build_index(db):
    """Return (existing_norm_questions set, topic lookup)."""
    seen = set()
    topic_lookup = {}
    for cat in db["categories"]:
        for t in cat["topics"]:
            topic_lookup.setdefault(t["id"], (cat["id"], t))
            for q in t.get("questions", []):
                seen.add(norm_question(q.get("q", "")))
    return seen, topic_lookup


def ensure_topic(db, cat_id, topic_id, topic_name):
    """Find every topic entry with this id (topics are replicated across
    categories) and return them. Create one under cat_id if none exist."""
    targets = []
    for cat in db["categories"]:
        for t in cat["topics"]:
            if t["id"] == topic_id:
                targets.append(t)
    if targets:
        return targets
    for cat in db["categories"]:
        if cat["id"] == cat_id:
            t = {"id": topic_id, "name": topic_name, "icon": "\U0001F4C4",
                 "roles": ["ade", "architect"], "questions": []}
            cat["topics"].append(t)
            return [t]
    return []


def distribute(db, cat_id, topic_id, topic_name, qobj):
    """Add a question to every topic entry sharing this id (mirrors how the
    curated topics are replicated across categories). Returns #topics touched."""
    targets = ensure_topic(db, cat_id, topic_id, topic_name)
    for t in targets:
        t["questions"].append(dict(qobj))
    return len(targets)


DEFAULT_TOPIC = ("ade", "imported", "Imported from Documents")

# Friendly names for topics that may be created fresh during ingestion.
TOPIC_NAMES = {
    "adf": "Azure Data Factory (ADF)",
    "azure": "Azure Services",
    "cicd-fabric": "CI/CD, Orchestration & Microsoft Fabric",
    "delta": "Delta Lake",
    "governance": "Unity Catalog, Governance & Security",
    "modeling": "Data Modeling & SCD",
    "pyspark": "PySpark & Python",
    "scenario": "Scenario-Based & Troubleshooting",
    "spark": "Apache Spark & Databricks Fundamentals",
    "sql": "SQL & Query Optimization",
    "streaming": "Streaming & Ingestion",
    "architecture": "Medallion Architecture & Data Platform Design",
    "behavioral": "Behavioral, Project & HR",
    "architect": "Databricks Architect Design & Consulting",
    "imported": "Imported from Documents",
}


def run(src_dir, dry_run=False):
    db = load_db()
    seen, _ = build_index(db)
    if not any(c["id"] == "ade" for c in db["categories"]):
        db["categories"].append({"id": "ade", "name": "Azure Data Engineer",
                                 "description": "", "topics": []})

    files = [p for p in sorted(Path(src_dir).rglob("*"))
             if p.is_file() and p.suffix.lower() in SUPPORTED]
    print("Found %d document(s) in %s" % (len(files), src_dir))

    added = 0
    per_topic = {}
    for f in files:
        text = extract_text(f)
        if not text.strip():
            continue
        pairs = parse_qa(text)
        for p in pairs:
            nq = norm_question(p["q"])
            if not nq or nq in seen:
                continue
            seen.add(nq)
            cat_id, topic_id = classify(p["q"], p["a"])
            qobj = {
                "q": p["q"][:300],
                "type": "scenario" if "scenario" in p["q"].lower() else "concept",
                "a": to_bullets(p["a"]),
                "source": f.name,
            }
            if topic_id:
                name = TOPIC_NAMES.get(topic_id, topic_id.title())
                distribute(db, cat_id, topic_id, name, qobj)
            else:
                distribute(db, *DEFAULT_TOPIC, qobj)
                topic_id = "imported"
            added += 1
            per_topic[topic_id] = per_topic.get(topic_id, 0) + 1

    print("New unique questions: %d" % added)
    for name, n in sorted(per_topic.items(), key=lambda x: -x[1]):
        print("  %-22s %d" % (name, n))

    if dry_run:
        print("(dry run - database not written)")
        return added

    db["updatedAt"] = int(__import__("time").time() * 1000)
    DB_JSON.write_text(json.dumps(db, indent=2, ensure_ascii=False), encoding="utf-8")
    DB_JS.write_text("window.INTERVIEW_DB = " + json.dumps(db, ensure_ascii=False) + ";\n",
                     encoding="utf-8")
    print("Wrote %s" % DB_JSON)
    return added


def main():
    ap = argparse.ArgumentParser(description="Ingest interview documents into the DB")
    ap.add_argument("src", nargs="?", default=str(DEFAULT_SRC),
                    help="source folder with documents")
    ap.add_argument("--dry-run", action="store_true", help="report only")
    args = ap.parse_args()
    if not Path(args.src).exists():
        print("Source folder not found: %s" % args.src)
        sys.exit(1)
    run(args.src, args.dry_run)


if __name__ == "__main__":
    main()
