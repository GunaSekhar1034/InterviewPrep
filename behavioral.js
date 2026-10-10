window.QB = window.QB || [];
QB.push({
  id: "behavioral",
  name: "Behavioral, Project & HR",
  icon: "\uD83D\uDCAC",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "Tell me about yourself.",
      type: "concept",
      a: "Structure (present \u2192 past \u2192 future, 60\u201390 seconds):\n" +
         "• Present \u2014 current role, core stack (ADF, Databricks, PySpark, Delta, Azure), and what you build (ETL/ELT pipelines, lakehouse, real-time ingestion).\n" +
         "• Past \u2014 key experiences that built your skills (projects, scale, domains).\n" +
         "• Future \u2014 why this role excites you and how you add value.\n" +
         "Keep it relevant to data engineering; end with a hook for the interviewer."
    },
    {
      q: "Walk me through a complex data engineering project you built.",
      type: "concept",
      a: "Use STAR: Situation \u2192 Task \u2192 Action \u2192 Result.\n" +
         "• Situation: business problem + scale (data volume, sources, latency).\n" +
         "• Task: your responsibility/objective.\n" +
         "• Action: architecture (ADF \u2192 ADLS \u2192 Databricks Bronze/Silver/Gold), tools, transformations, governance, CI/CD, challenges you solved.\n" +
         "• Result: quantify (runtime reduced X%, cost saved, records processed, SLAs met, downtime avoided).\n" +
         "Mention one hard problem and how you solved it to show depth."
    },
    {
      q: "Describe a challenging problem you faced and how you resolved it.",
      type: "concept",
      a: "Pick ONE real technical challenge (e.g., data skew causing a 10h job, small-file explosion, schema drift breaking a pipeline).\n" +
         "• Context and impact.\n" +
         "• How you diagnosed it (Spark UI, logs, metrics).\n" +
         "• The fix (AQE/salting, OPTIMIZE/Auto Optimize, mergeSchema/rescued data, idempotent MERGE).\n" +
         "• Measurable outcome + what you learned / preventive measure.\n" +
         "Show systematic troubleshooting, not just luck."
    },
    {
      q: "How do you handle tight deadlines or changing requirements?",
      type: "concept",
      a: "• Clarify and prioritize with stakeholders (MVP first, iterate).\n" +
         "• Break work into deliverables; communicate risks early.\n" +
         "• Reuse existing frameworks/patterns (metadata-driven pipelines, templates) to move faster.\n" +
         "• Automate tests/CI-CD to reduce rework.\n" +
         "• Document assumptions and keep decisions transparent.\n" +
         "Example: delivered core pipeline first, added optimizations/DQ in later iterations."
    },
    {
      q: "Tell me about a time you disagreed with a stakeholder/teammate.",
      type: "concept",
      a: "Use a professional, data-driven approach.\n" +
         "• Explain the situation and the disagreement (e.g., aggressive SLA vs cluster cost).\n" +
         "• How you listened, gathered evidence (benchmarks/cost analysis), and proposed alternatives.\n" +
         "• Outcome: found a middle ground (tiered data, incremental processing, right-sized clusters).\n" +
         "• Emphasize respect, evidence, and shared goals \u2014 not 'I was right'."
    },
    {
      q: "Why are you looking for a change / why this company?",
      type: "concept",
      a: "• Change: growth (architect-level scope, modern stack, larger scale), not negativity about the current employer.\n" +
         "• This company: align their data challenges/tech (Azure, Databricks, lakehouse) with your skills; mention something specific (their domain, scale, modernization).\n" +
         "• Emphasize what you bring and how the role fits your growth.\n" +
         "Keep it positive and forward-looking."
    },
    {
      q: "What are your strengths and weaknesses?",
      type: "concept",
      a: "Strengths (2\u20133, with proof): e.g., end-to-end pipeline design, performance optimization (Spark/Delta), ownership/automation. Back each with an example.\n" +
         "Weakness (1, genuine + improving): e.g., used to over-engineering \u2192 now start simple and iterate; or delegation \u2192 actively mentoring/assigning. Show self-awareness and a concrete improvement action.\n" +
         "Avoid clichés and never use a disguised strength."
    },
    {
      q: "Where do you see yourself in 5 years?",
      type: "concept",
      a: "• Short term: master the current stack, deliver high-impact pipelines, deepen cloud/lakehouse expertise.\n" +
         "• Long term: grow into a lead/architect role \u2014 designing scalable data platforms, mentoring engineers, driving standards.\n" +
         "• Tie it to continuous learning (certifications, new tech like Fabric/Unity Catalog).\n" +
         "Show ambition that aligns with the company's path."
    },
    {
      q: "How do you keep your skills updated / how do you learn?",
      type: "concept",
      a: "• Hands-on labs and personal projects (build mini lakehouse, streaming demos).\n" +
         "• Official docs (Databricks, Microsoft Learn), certifications (DP-203, Databricks Data Engineer/Architect).\n" +
         "• Community: blogs, meetups, forums, release notes.\n" +
         "• Apply learning at work \u2014 e.g., piloted Auto Loader/DLT, shared findings with the team.\n" +
         "Emphasize applying, not just reading."
    },
    {
      q: "How do you estimate effort and prioritize tasks in a data project?",
      type: "concept",
      a: "• Break work into tasks; estimate by complexity/uncertainty (similar past work, spikes for unknowns).\n" +
         "• Prioritize by business value, dependencies, and risk (MoSCoW / value vs effort).\n" +
         "• Reserve buffer for data issues/integration surprises.\n" +
         "• Communicate timelines, track progress, and re-plan when blockers arise.\n" +
         "• Automate/testing reduces hidden effort rework."
    },
    {
      q: "What do you do when you are blocked on a task?",
      type: "concept",
      a: "• Investigate first \u2014 logs, docs, minimal reproduction (timeboxed).\n" +
         "• Try known solutions/search; check if others faced it.\n" +
         "• Communicate early with the team/lead; don't silently stall.\n" +
         "• Escalate with context: what you tried, the error, what you need.\n" +
         "• Document the fix for future reference.\n" +
         "Shows resourcefulness + teamwork."
    },
    {
      q: "How do you handle production incidents / on-call?",
      type: "concept",
      a: "• Triage: assess impact (SLA/customers) and severity.\n" +
         "• Mitigate first (restart/repair-and-rerun/failover) to restore service, then root-cause.\n" +
         "• Communicate status to stakeholders regularly.\n" +
         "• Post-incident: RCA, fix the root cause, add monitoring/alerts and DQ checks to prevent recurrence.\n" +
         "Emphasize calm, communication, and prevention."
    },
    {
      q: "Describe a time you automated a manual process.",
      type: "concept",
      a: "• Situation: repetitive manual task (e.g., manual file loads, hand-written SQL per table).\n" +
         "• Action: built metadata-driven ADF pipelines / parameterized Databricks notebooks, scheduled with Workflows, added logging and CI/CD.\n" +
         "• Result: saved X hours/week, reduced human error, freed the team for higher-value work.\n" +
         "Tie automation to reliability and cost savings."
    }
  ]
});
