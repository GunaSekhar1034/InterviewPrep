(function () {
  "use strict";

  var CATEGORY_KEYWORDS = {
    "ade": ["azure", "adf", "data factory", "synapse", "fabric", "databricks", "etl", "adls", "data lake", "sql", "pyspark", "spark", "delta"],
    "databricks-architect": ["architect", "cluster", "workspace", "unity catalog", "design", "scalab", "cost", "governance", "photon"],
    "data-architect": ["architecture", "data model", "warehouse", "dimensional", "medallion", "govern", "security", "lineage"],
    "ai-data-engineer": ["ai", "ml", "machine learning", "embedding", "vector", "llm", "rag", "feature", "model", "genai", "openai"],
  };

  var TOPIC_KEYWORDS = {
    "adf": ["adf", "data factory", "pipeline", "linked service", "dataset", "trigger", "copy activity", "integration runtime", "shir"],
    "spark": ["spark", "rdd", "dataframe", "catalyst", "tungsten", "dag", "stage", "shuffle", "executor", "driver", "aqe"],
    "delta": ["delta lake", "delta table", "acid", "time travel", "vacuum", "optimize", "z-order", "zorder", "merge", "transaction log", "liquid clustering", "cdf", "change data feed", "clone"],
    "pyspark": ["pyspark", "udf", "window function", "explode", "join", "python", "pandas", "dataframe api"],
    "sql": ["sql", "join", "where", "having", "group by", "cte", "window", "rank", "union", "stored procedure", "index"],
    "modeling": ["data model", "scd", "star schema", "snowflake", "dimension", "fact", "surrogate", "normalization", "slowly changing"],
    "streaming": ["streaming", "kafka", "event hub", "auto loader", "cloudfiles", "watermark", "checkpoint", "structured streaming", "dlt", "real-time"],
    "governance": ["unity catalog", "governance", "access control", "rbac", "acl", "mask", "row filter", "lineage", "audit", "security"],
    "architecture": ["architecture", "medallion", "bronze", "silver", "gold", "data lake", "lakehouse", "design", "warehouse"],
    "architect": ["architect", "design", "scalability", "best practice", "migration", "capacity", "consulting"],
    "cicd-fabric": ["ci/cd", "cicd", "azure devops", "github actions", "fabric", "deploy", "bundle", "dab", "release", "devops", "power bi"],
    "scenario": ["scenario", "troubleshoot", "how would you", "what if", "you need to", "you notice", "you are asked", "imagine"],
    "behavioral": ["tell me about", "your experience", "strength", "weakness", "team", "conflict", "challenge", "achievement"],
    "azure": ["azure", "adls", "blob", "synapse", "data lake", "key vault", "service principal", "managed identity", "sql database"],
  };

  var TOPIC_NAMES = {
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
  };

  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function toBullets(a) {
    a = clean(a);
    if (!a) return "";
    if (/^\s*[\u2022\-\*]/m.test(a)) return a;
    var parts = a.split(/(?<=[.;])\s+(?=[A-Z0-9])/).map(function (p) { return p.trim().replace(/\.$/, ""); }).filter(function (p) { return p.length > 4; });
    if (parts.length <= 1) return a;
    return parts.slice(0, 12).map(function (p) { return "\u2022 " + p; }).join("\n");
  }
  function anyQre() { return /^\s*(?:Q\s*\d*\s*[.):\-]|Q\s*[:.]|Question\s*\d*\s*[:.\-)]|\d{1,3}\s*[.):])\s*(.+)$/i; }
  function parseQA(text) {
    var lines = String(text || "").split(/\r?\n/);
    var pairs = [], curQ = null, curA = [];
    function flush() { if (curQ) { pairs.push({ q: clean(curQ), a: clean(curA.join(" ")) }); } curQ = null; curA = []; }
    var anyQ = anyQre();
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (!ln.trim()) { if (curA.length) curA.push(""); continue; }
      var m = anyQ.exec(ln);
      var isQ = false, qtext = "";
      if (m && m[1].length > 12) { isQ = true; qtext = m[1]; }
      else if (ln.trim().endsWith("?") && ln.trim().length > 12 && ln.trim().length < 300) { isQ = true; qtext = ln.trim(); }
      if (isQ) { flush(); curQ = qtext; } else if (curQ !== null) { curA.push(ln.trim()); }
    }
    flush();
    return pairs.filter(function (p) { return p.q.length >= 12; });
  }
  function classify(q, a) {
    var blob = norm(q + " " + a);
    var cat = "ade", best = 0;
    for (var cid in CATEGORY_KEYWORDS) { var keys = CATEGORY_KEYWORDS[cid]; var s = 0; for (var j = 0; j < keys.length; j++) { if (blob.indexOf(keys[j]) !== -1) s++; } if (s > best) { best = s; cat = cid; } }
    var topic = null, best2 = 0;
    for (var tid in TOPIC_KEYWORDS) { var keys2 = TOPIC_KEYWORDS[tid]; var s2 = 0; for (var j = 0; j < keys2.length; j++) { if (blob.indexOf(keys2[j]) !== -1) s2++; } if (s2 > best2) { best2 = s2; topic = tid; } }
    return { cat: cat, topic: topic };
  }
  function topicNameForId(tid) {
    if (TOPIC_NAMES[tid]) return TOPIC_NAMES[tid];
    return tid ? tid.charAt(0).toUpperCase() + tid.slice(1) : "";
  }
  function findTopicName(knownNames, tid) { return topicNameForId(tid); }

  // expose minimal helpers
  window.IPImport = {
    norm: norm,
    parseQA: parseQA,
    toBullets: toBullets,
    classify: classify,
    topicNameForId: topicNameForId,
  };

  // wire modal/button on DOM ready
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var openBtn = document.getElementById("importOpen");
    var modal = document.getElementById("importModal");
    var close = document.getElementById("importClose");
    var input = document.getElementById("importFile");
    var process = document.getElementById("importProcess");
    var status = document.getElementById("importStatus");
    var countOut = document.getElementById("importCount");
    var result = document.getElementById("importResult");
    if (openBtn) openBtn.addEventListener("click", function () { if (modal) modal.hidden = false; });
    if (close) close.addEventListener("click", function () { if (modal) modal.hidden = true; });
    if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) modal.hidden = true; });

    function setStat(msg, type) { if (!status) return; status.hidden = false; status.textContent = msg; status.className = "add-status" + (type ? " " + type : ""); }
    function clearStat() { if (!status) return; status.hidden = true; status.textContent = ""; }

    if (process) process.addEventListener("click", function () {
      if (!input || !input.files || !input.files.length) { setStat("Select one or more files first.", "error"); return; }
      if (!window.IPApp) { setStat("IPApp not ready.", "error"); return; }
      var known = window.IPApp.knownCount ? " (" + window.IPApp.knownCount() + " existing)" : "";
      setStat("Processing " + input.files.length + " file(s)..." + known, "");
      var items = [];
      var pending = input.files.length;
      function doneFile() { pending--; if (pending === 0) finish(); }
      function finish() {
        if (items.length === 0) { setStat("No Q&A extracted from files (check file types and content).", "error"); if (countOut) countOut.textContent = "0 pairs ready"; return; }
        if (countOut) countOut.textContent = items.length + " pairs ready";
        setStat("Reviewing for duplicates and classifying...", "");
        // classify + add
        var classified = [];
        var db = (window.INTERVIEW_DB && window.INTERVIEW_DB.categories) ? window.INTERVIEW_DB : null;
        var idToName = {};
        if (db) { db.categories.forEach(function (c) { (c.topics || []).forEach(function (t) { if (!idToName[t.id]) idToName[t.id] = t.name; }); }); }
        for (var k = 0; k < items.length; k++) {
          var p = items[k];
          var cl = classify(p.q, p.a);
          var tname = (cl.topic && (idToName[cl.topic] || TOPIC_NAMES[cl.topic])) || "My Questions";
          classified.push({ q: p.q, a: p.a, type: cl.topic === "scenario" ? "scenario" : "concept", category: tname });
        }
        var res = window.IPApp.addImported(classified);
        setStat("Done. Added " + res.added + ", skipped " + res.skipped + ".", "info");
        if (result && res.byTopic) { result.textContent = Object.keys(res.byTopic).map(function (x) { return x + ": +" + res.byTopic[x]; }).join(" | "); result.hidden = false; }
      }
      function readText(f, cb) { var r = new FileReader(); r.onload = function () { cb(String(r.result || "")); }; r.onerror = function () { cb(""); }; r.readAsText(f); }
      function readBin(f, cb) { var r = new FileReader(); r.onload = function () { cb(r.result); }; r.onerror = function () { cb(null); }; r.readAsArrayBuffer(f); }
      for (var i = 0; i < input.files.length; i++) {
        (function (f) {
          var ext = (f.name || "").split(".").pop().toLowerCase();
          if (ext === "pdf") { loadPDF(f, doneFile, items); }
          else if (ext === "docx" || ext === "doc") { loadDOCX(f, doneFile, items); }
          else if (ext === "xlsx" || ext === "xls") { loadXLSX(f, doneFile, items); }
          else if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "bmp" || ext === "tiff") { loadIMG(f, doneFile, items); }
          else { readText(f, function (txt) { Array.prototype.push.apply(items, parseQA(txt)); doneFile(); }); }
        })(input.files[i]);
      }
    });
  });

  function loadScript(src, onload, onerr) {
    var s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = onload; s.onerror = onerr || function () {};
    document.head.appendChild(s);
  }
  function loadPDF(f, done, items) {
    readBin(f, function (buf) {
      if (!buf) { done(); return; }
      if (window.pdfjsLib) { parsePDF(buf, done, items); return; }
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", function () {
        try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; } catch (e) {}
        parsePDF(buf, done, items);
      }, function () { done(); });
    });
  }
  function parsePDF(buf, done, items) {
    try {
      window.pdfjsLib.getDocument({ data: buf }).promise.then(function (doc) {
        var all = []; var np = doc.numPages;
        function next(p) { if (p > np) { items.push.apply(items, parseQA(all.join("\n\n"))); done(); return; } doc.getPage(p).then(function (pg) { return pg.getTextContent(); }).then(function (tc) { var parts = []; (tc.items || []).forEach(function (it) { if (it.str) parts.push(it.str); }); all.push(parts.join(" ")); next(p + 1); }); }
        next(1);
      }).catch(function () { done(); });
    } catch (e) { done(); }
  }
  function loadDOCX(f, done, items) {
    readBin(f, function (buf) {
      if (!buf) { done(); return; }
      if (window.mammoth) { parseDOCX(buf, done, items); return; }
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js", function () { parseDOCX(buf, done, items); }, function () { done(); });
    });
  }
  function parseDOCX(buf, done, items) {
    try {
      window.mammoth.extractRawText({ arrayBuffer: buf }).then(function (r) { items.push.apply(items, parseQA(r.value)); done(); }).catch(function () { done(); });
    } catch (e) { done(); }
  }
  function loadXLSX(f, done, items) {
    readBin(f, function (buf) {
      if (!buf) { done(); return; }
      if (window.XLSX) { parseXLSX(buf, done, items); return; }
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", function () { parseXLSX(buf, done, items); }, function () { done(); });
    });
  }
  function parseXLSX(buf, done, items) {
    try {
      var wb = window.XLSX.read(buf, { type: "array" });
      var txt = [];
      for (var s = 0; s < wb.SheetNames.length; s++) {
        var ws = wb.Sheets[wb.SheetNames[s]];
        var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i].filter(function (x) { return String(x).trim() !== ""; });
          if (r.length) txt.push(r.join(" | "));
        }
      }
      items.push.apply(items, parseQA(txt.join("\n")));
      done();
    } catch (e) { done(); }
  }
  function loadIMG(f, done, items) {
    if (window.Tesseract) { parseIMG(f, done, items); return; }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js", function () { parseIMG(f, done, items); }, function () { done(); });
  }
  function parseIMG(f, done, items) {
    try {
      window.Tesseract.recognize(f, "eng", { logger: function () {} }).then(function (r) { items.push.apply(items, parseQA(r.data.text)); done(); }).catch(function () { done(); });
    } catch (e) { done(); }
  }
})();
