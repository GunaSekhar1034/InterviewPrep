#!/usr/bin/env node
/**
 * Rebuild data/interview-db.json (+ .js) from:
 *   - the curated topic files (window.QB.push(...))  -> authoritative topics/questions
 *   - data/hierarchy.json                            -> category -> topic mapping
 *   - the current data/interview-db.json             -> previously ingested questions
 *                                                       (those carrying a "source" field)
 *
 * Guarantees every topic present in the curated files keeps its real id, name,
 * roles and questions, and re-attaches any ingested questions to the right topic.
 */
const fs = require("fs");
const path = require("path");

const APP = path.resolve(__dirname, "..");
const HIER = path.join(APP, "data", "hierarchy.json");
const DB_JSON = path.join(APP, "data", "interview-db.json");
const DB_JS = path.join(APP, "data", "interview-db.js");
const BANK_JS = path.join(APP, "data", "question-bank.js");

const TOPIC_FILES = ["adf", "architect", "architecture", "behavioral", "cicd-fabric",
  "delta", "governance", "modeling", "pyspark", "scenario", "spark", "sql", "streaming"];

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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

// ---- 2. Load previously ingested questions (carry a "source") ----
const ALIASES = { "cicd-fabric": "cicd" };   // old hierarchy id -> curated id
const ingested = {};           // topicId -> [question]
let prev = { categories: [] };
if (fs.existsSync(DB_JSON)) prev = JSON.parse(fs.readFileSync(DB_JSON, "utf8"));
prev.categories.forEach(c => (c.topics || []).forEach(t => {
  const id = ALIASES[t.id] || t.id;
  (t.questions || []).forEach(q => {
    if (q && q.source) (ingested[id] = ingested[id] || []).push(q);
  });
}));

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
    (cur.questions || []).forEach(q => { const n = norm(q.q); if (n && !seen[n]) { seen[n] = 1; questions.push(q); } });
    (ingested[id] || []).forEach(q => { const n = norm(q.q); if (n && !seen[n]) { seen[n] = 1; questions.push(q); } });
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
  bank[id] = { id: id, name: curated[id].name, icon: curated[id].icon, roles: curated[id].roles, questions: curated[id].questions };
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
console.log("categories:", db.categories.length,
  "| topic entries:", db.categories.reduce((a, c) => a + c.topics.length, 0),
  "| question slots:", slots, "| unique:", uniq.size);
const missingRoles = Object.keys(idRoles).filter(id => !idRoles[id] || !idRoles[id].length);
console.log("topics with empty roles:", missingRoles.length ? missingRoles.join(", ") : "(none)");
