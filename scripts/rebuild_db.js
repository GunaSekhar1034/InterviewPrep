#!/usr/bin/env node
/**
 * Rebuild data/interview-db.json (+ .js) from the curated topic files
 * (window.QB.push(...)) using data/hierarchy.json for category -> topic mapping.
 *
 * By default this keeps ONLY the hand-written (curated) Q&A and drops any
 * previously ingested / imported questions (those carrying a "source" field),
 * and normalises each answer into clean bullet points. Set KEEP_INGESTED=true
 * (env) to re-attach ingested questions instead.
 */
const fs = require("fs");
const path = require("path");

const APP = path.resolve(__dirname, "..");
const HIER = path.join(APP, "data", "hierarchy.json");
const DB_JSON = path.join(APP, "data", "interview-db.json");
const DB_JS = path.join(APP, "data", "interview-db.js");
const BANK_JS = path.join(APP, "data", "question-bank.js");

const KEEP_INGESTED = String(process.env.KEEP_INGESTED || "").toLowerCase() === "true";

const TOPIC_FILES = ["adf", "architect", "architecture", "behavioral", "cicd-fabric",
  "delta", "governance", "modeling", "pyspark", "scenario", "spark", "sql", "streaming"];

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Normalise an answer into tidy bullet points. Code fences are left untouched,
// numbered list items ("1.", "2)") become "• " bullets, and blank runs collapse.
function formatAnswer(a) {
  if (!a) return "";
  const lines = String(a).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  for (const raw of lines) {
    const ln = raw.replace(/[ \t]+$/, "");
    if (/^\s*```/.test(ln)) { inCode = !inCode; out.push(ln); continue; }
    if (inCode) { out.push(ln); continue; }
    const t = ln.trim();
    if (!t) { if (out.length && out[out.length - 1] !== "") out.push(""); continue; }
    const numbered = t.match(/^\(?\d{1,2}[.)]\s+(.+)$/);
    if (numbered) { out.push("\u2022 " + numbered[1].trim()); continue; }
    const bullet = t.match(/^[\u2022\-\*]\s*(.+)$/);
    if (bullet) { out.push("\u2022 " + bullet[1].trim()); continue; }
    out.push(t);
  }
  // drop trailing blank lines and collapse 3+ newlines
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function formatQuestion(q) {
  return String(q || "").replace(/\s+/g, " ").trim();
}

function cleanItem(q) {
  const out = { q: formatQuestion(q.q) };
  if (q.type) out.type = q.type;
  if (q.a) out.a = formatAnswer(q.a);
  if (q.code) out.code = q.code;
  if (q.cat) out.cat = q.cat;
  return out;
}

// ---- 1. Load curated topics (every QB.push across all files) ----
const sandbox = { window: {} };
sandbox.window.QB = [];
sandbox.QB = sandbox.window.QB;
for (const f of TOPIC_FILES) {
  const src = fs.readFileSync(path.join(APP, f + ".js"), "utf8");
  const fn = new Function("window", "QB", src + "\n");
  fn(sandbox.window, sandbox.QB);
}
const curated = {};
(sandbox.window.QB || []).forEach(t => { curated[t.id] = t; });

// ---- 2. Optionally load previously ingested questions (carry a "source") ----
const ALIASES = { "cicd-fabric": "cicd" };   // old hierarchy id -> curated id
const ingested = {};           // topicId -> [question]
if (KEEP_INGESTED && fs.existsSync(DB_JSON)) {
  const prev = JSON.parse(fs.readFileSync(DB_JSON, "utf8"));
  prev.categories.forEach(c => (c.topics || []).forEach(t => {
    const id = ALIASES[t.id] || t.id;
    (t.questions || []).forEach(q => {
      if (q && q.source) (ingested[id] = ingested[id] || []).push(q);
    });
  }));
}

// ---- 3. Build each category from the hierarchy ----
const hierarchy = JSON.parse(fs.readFileSync(HIER, "utf8"));
const db = { version: 2, updatedAt: Date.now(), categories: [] };

hierarchy.categories.forEach(cat => {
  const topics = [];
  (cat.topics || []).forEach(ref => {
    const id = ref.id;
    const cur = curated[id] || {};
    const questions = [];
    const seen = {};
    (cur.questions || []).forEach(q => {
      const item = cleanItem(q);
      const n = norm(item.q);
      if (n && !seen[n]) { seen[n] = 1; questions.push(item); }
    });
    (ingested[id] || []).forEach(q => {
      const item = cleanItem(q);
      const n = norm(item.q);
      if (n && !seen[n]) { seen[n] = 1; questions.push(item); }
    });
    if (!questions.length) return;   // skip topics with no questions (avoids empty "azure"/"imported")
    topics.push({
      id: id,
      name: ref.name || cur.name || id,
      icon: cur.icon || ref.icon || "\u2022",
      roles: (cur.roles && cur.roles.length) ? cur.roles : (ref.roles || ["ade", "architect"]),
      questions: questions
    });
  });
  db.categories.push({ id: cat.id, name: cat.name, description: cat.description || "", topics: topics });
});

// ---- 4. Regenerate data/question-bank.js for completeness ----
const bank = {};
Object.keys(curated).forEach(id => {
  const qs = (curated[id].questions || []).map(cleanItem);
  if (!qs.length) return;
  bank[id] = { id: id, name: curated[id].name, icon: curated[id].icon, roles: curated[id].roles, questions: qs };
});
fs.writeFileSync(BANK_JS, "window.QUESTION_BANK = " + JSON.stringify(bank) + ";\n", "utf8");

// ---- 5. Write DB ----
fs.writeFileSync(DB_JSON, JSON.stringify(db, null, 2), "utf8");
fs.writeFileSync(DB_JS, "window.INTERVIEW_DB = " + JSON.stringify(db) + ";\n", "utf8");

// ---- 6. Report ----
let slots = 0; const uniq = new Set(); const idRoles = {};
db.categories.forEach(c => c.topics.forEach(t => {
  slots += t.questions.length;
  idRoles[t.id] = t.roles;
  t.questions.forEach(q => uniq.add(norm(q.q)));
}));
console.log("keepIngested:", KEEP_INGESTED);
console.log("categories:", db.categories.length,
  "| topic entries:", db.categories.reduce((a, c) => a + c.topics.length, 0),
  "| question slots:", slots, "| unique:", uniq.size);
const missingRoles = Object.keys(idRoles).filter(id => !idRoles[id] || !idRoles[id].length);
console.log("topics with empty roles:", missingRoles.length ? missingRoles.join(", ") : "(none)");
console.log("categories/topics:", db.categories.map(c => c.id + "(" + c.topics.length + ")").join(", "));
