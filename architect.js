window.QB = window.QB || [];
QB.push({
  id: "architect",
  name: "Databricks Architect \u2014 Design & Consulting",
  icon: "\uD83C\uDFDB\uFE0F",
  roles: ["architect"],
  questions: [
    {
      q: "How would you design a data platform for 10 data teams that need to share data but have different access requirements?",
      type: "scenario",
      a: "This is an ORGANIZATION design problem, not just a tech one. Cover:\n" +
         "• Catalog structure by domain \u2014 a central 'enterprise' catalog for shared/curated (Gold) data, plus team-specific catalogs for team-owned data. Teams produce to their own catalog and consume from enterprise + granted peers.\n" +
         "• Unity Catalog for account-level governance, lineage, and grants to groups (from the IdP), not individuals.\n" +
         "• Data ownership model \u2014 each team owns its domain data (data-as-a-product); clear producers vs consumers.\n" +
         "• Access requirements \u2014 row filters/column masks for sensitive data; GRANTs per catalog/schema.\n" +
         "• Governance process \u2014 a data council for cross-team standards, naming, contracts, and conflict resolution.\n" +
         "• Self-service enablement \u2014 templates, CI/CD, cluster policies so teams move fast safely.\n" +
         "Interviewers test whether you design for people and process, not just tables."
    },
    {
      q: "SCENARIO: You inherit a Databricks platform spending $50k/month. How do you reduce it by 40% without breaking things?",
      type: "scenario",
      a: "Business-impact, leadership answer (not just tactics):\n" +
         "1. Attribute cost first \u2014 use system.billing.usage + system tables to break spend by workspace/team/job (chargeback model). You can't optimize what you can't see.\n" +
         "2. Eliminate waste \u2014 idle interactive clusters (auto-terminate), oversized clusters, always-on SQL warehouses (auto-suspend), runaway jobs.\n" +
         "3. Right-size compute \u2014 Job clusters vs All-Purpose, autoscaling, Spot instances for batch, instance pools.\n" +
         "4. Optimize workloads \u2014 Photon, AQE, predictive optimization, liquid clustering, eliminate full reprocessing with incremental loads.\n" +
         "5. Governance \u2014 cluster policies to cap sizes, budgets/alerts, and shift accountability to teams.\n" +
         "6. Track results and communicate savings; iterate. Emphasize 80/20 (a few workloads drive most cost)."
    },
    {
      q: "How do you approach a large warehouse-to-lakehouse migration?",
      type: "scenario",
      a: "Phased, low-risk migration:\n" +
         "• Assess \u2014 inventory workloads, query patterns, SLAs, data volumes, dependencies; identify quick wins and high-risk areas.\n" +
         "• Choose pattern \u2014 lift-and-shift (fast, minimal refactor) vs refactor/re-architect (better long-term). Often hybrid.\n" +
         "• Land data \u2014 ingest into Bronze; model in Medallion; convert to Delta.\n" +
         "• Workload-by-workload cutover \u2014 migrate the least critical/simplest first; validate outputs vs source (reconciliation).\n" +
         "• Optimize \u2014 liquid clustering/Z-ORDER, partitioning, Photon; rebuild BI on Databricks SQL / Direct Lake.\n" +
         "• Govern \u2014 Unity Catalog, RLS/CLS, lineage.\n" +
         "• Run parallel until confidence; then decommission. Track business outcomes and communicate with stakeholders."
    },
    {
      q: "How do you architect a high-concurrency, low-latency data warehouse on Databricks?",
      type: "scenario",
      a: "Focus on the levers that drive concurrency and latency:\n" +
         "• Compute \u2014 serverless SQL Warehouses with autoscaling + Intelligent Workload Management; separate workloads (BI vs ETL vs ad hoc).\n" +
         "• Data layout \u2014 liquid clustering (over Hive partitioning/Z-ORDER) for data skipping; right-size files via predictive optimization; collect stats.\n" +
         "• Query engine \u2014 Photon (vectorized C++ engine), AQE, caching, range join optimization.\n" +
         "• Modeling \u2014 star schema Gold tables, pre-aggregations/materialized views for dashboards.\n" +
         "• Concurrency \u2014 scale warehouses, connection pooling from BI tools, result caching.\n" +
         "• Governance/monitoring \u2014 query history, system tables, budgets and alerts.\n" +
         "Frame trade-offs: latency vs concurrency vs cost; iterate with real workloads, don't over-provision up front."
    },
    {
      q: "Describe the Databricks Well-Architected Framework pillars and how they guide design.",
      type: "concept",
      a: "The well-architected lakehouse framework has these pillars:\n" +
         "• Operational Excellence \u2014 automation, CI/CD, observability, incident response.\n" +
         "• Security, Privacy & Compliance \u2014 identity, Unity Catalog, network isolation, encryption, least privilege.\n" +
         "• Reliability \u2014 resilience, fault tolerance, DR, idempotency, retries, checkpointing.\n" +
         "• Performance Efficiency \u2014 right-sizing, Photon/AQE, liquid clustering, serverless, workload design.\n" +
         "• Cost Optimization \u2014 job clusters, Spot, auto-terminate, system table cost attribution.\n" +
         "• Data & AI Governance \u2014 catalogs, lineage, quality, sharing.\n" +
         "Use them as a checklist in reviews and to balance competing concerns (e.g., performance vs cost)."
    },
    {
      q: "Centralized data platform vs data mesh \u2014 how do you decide?",
      type: "scenario",
      a: "• Centralized \u2014 one team/platform owns pipelines and data; simpler governance, faster to standardize; can become a bottleneck as domains grow.\n" +
         "• Data mesh \u2014 domain teams own and publish data products with self-serve platform + federated governance; scales org-wide but demands maturity, standards, and a strong platform team.\n" +
         "Decision factors: org size, number of domains, data literacy, governance maturity, need for speed vs control.\n" +
         "Practical answer: a hybrid \u2014 central platform/standards (Unity Catalog + templates) with domain ownership of data products. Databricks enables this via UC catalogs per domain + Delta Sharing between domains."
    },
    {
      q: "How do you design for disaster recovery and business continuity on Databricks?",
      type: "scenario",
      a: "• Data \u2014 Delta in ADLS with geo-redundant storage (GRS/RA-GRS); replicate to a secondary region; external tables + UC so metadata follows data.\n" +
         "• Metastore \u2014 account-level Unity Catalog supports failover to a secondary workspace/metastore in another region.\n" +
         "• Compute \u2014 reproducible via Asset Bundles/IaC so you can stand up compute in DR region quickly.\n" +
         "• RPO/RTO \u2014 define targets; Delta time travel + copy for point-in-time recovery; streaming checkpoint restart from replicated storage.\n" +
         "• Testing \u2014 run DR drills; document runbooks; automate failover where possible.\n" +
         "Discuss cost trade-off: active-active is expensive; often warm standby or backup/restore meets the requirement."
    },
    {
      q: "When do you choose serverless compute vs classic clusters?",
      type: "concept",
      a: "• Serverless (SQL warehouses, jobs, notebooks) \u2014 instant start, no infra management, auto-scaling, ideal for BI, short/elastic workloads, and reducing ops overhead; pay only for use.\n" +
         "• Classic clusters \u2014 needed for custom libraries/init scripts, specific runtime/VM types, GPU/ML, VNet-injected/private networking, or when you want instance pools for steady heavy workloads.\n" +
         "Decision: default to serverless for simplicity and elasticity; use classic when you need customization, isolation, specialized hardware, or predictable cost at constant high utilization."
    },
    {
      q: "How do you design the DEV / QA / PROD environment topology?",
      type: "concept",
      a: "• Workspaces \u2014 separate workspaces per environment (isolation) attached to one Unity Catalog metastore (per region).\n" +
         "• Data isolation \u2014 separate catalogs/schemas per env (dev_catalog, qa_catalog, prod_catalog) with grants; never point dev at prod data.\n" +
         "• Config \u2014 parameterize paths, catalog/schema, cluster sizes per env (DAB targets, ADF global params).\n" +
         "• Delivery \u2014 Git + CI/CD (Azure DevOps/GitHub Actions) deploying bundles/jobs with service principals; promote artifacts, not manual changes.\n" +
         "• Governance \u2014 limit prod permissions; enforce cluster policies; separate service principal per env.\n" +
         "Consider more granularity (feature branches/preview) only if the team is mature."
    },
    {
      q: "How do you perform capacity planning and cost attribution at platform scale?",
      type: "concept",
      a: "• Cost attribution \u2014 system.billing.usage joined with system.billing.list_prices and workspace/job metadata; tag clusters/jobs by team/project.\n" +
         "• Chargeback/showback \u2014 dashboards per team so consumers own their spend.\n" +
         "• Right-sizing \u2014 analyze run history, peak vs average utilization, autoscaling behavior; avoid over-provisioning.\n" +
         "• Forecast \u2014 model growth (data volume, users, jobs) and reserve capacity for spikes.\n" +
         "• Optimize \u2014 predictive optimization, Photon, incremental processing, Spot.\n" +
         "• Govern \u2014 budgets + alerts, cluster policies with max sizes, review regularly with stakeholders."
    },
    {
      q: "What is the Databricks Photon engine and when does it help?",
      type: "concept",
      a: "Photon is Databricks' native, vectorized query engine written in C++ that processes data in columnar batches rather than row-by-row (like the JVM-based engine).\n" +
         "• Accelerates SQL and DataFrame (Spark) workloads \u2014 often 2\u20138x faster, especially scans, joins, aggregations, and wide transformations.\n" +
         "• Enabled on compatible runtimes; transparent to your code.\n" +
         "• Helps most when CPU-bound; less benefit for I/O-bound or tiny workloads. Consider cost vs speed trade-off."
    },
    {
      q: "What is Predictive Optimization?",
      type: "concept",
      a: "Predictive Optimization is a Databricks feature for Unity Catalog managed tables that automatically runs maintenance \u2014 OPTIMIZE (compaction), VACUUM, and ANALYZE (statistics) \u2014 based on observed usage patterns.\n" +
         "• Removes the need to manually schedule and tune table maintenance.\n" +
         "• Reduces storage and improves query performance (data skipping) with fewer small files.\n" +
         "• Operates on UC managed tables; a key 'cost & performance optimization' answer for architect-level design."
    },
    {
      q: "What is the range join optimization and when do you use it?",
      type: "concept",
      a: "Range join optimization speeds up joins where the predicate is a point-in-interval or interval-overlap condition (e.g., fact.timestamp BETWEEN dim.start AND dim.end \u2014 classic SCD2 lookups).\n" +
         "• Databricks can bin the interval into a range and use a bucket join, giving order-of-magnitude improvements.\n" +
         "• Requires manual tuning (range level/bins) and is used for large fact \u2194 dimension interval joins.\n" +
         "Architect relevance: choosing it for SCD2/validity joins instead of exploding joins or UDFs."
    },
    {
      q: "How do you design an ML/AI platform on Databricks?",
      type: "scenario",
      a: "Unified data + ML on the lakehouse:\n" +
         "• Data \u2014 Bronze/Silver/Gold with a Feature Store (feature tables, online/offline parity).\n" +
         "• Experiments \u2014 MLflow tracking for params/metrics/artifacts across teams.\n" +
         "• Training \u2014 GPU clusters; AutoML; distributed training; manage dependencies.\n" +
         "• Registry \u2014 MLflow Model Registry for versioning/staging/production with approvals.\n" +
         "• Serving \u2014 Model Serving (serverless endpoints), batch scoring, or feature lookups; monitor drift.\n" +
         "• Governance \u2014 Unity Catalog for models/functions, lineage, and access.\n" +
         "• For GenAI \u2014 RAG with Vector Search, embeddings, Foundation Model APIs, and governed data.\n" +
         "Emphasize reuse of governed data and closed-loop monitoring."
    },
    {
      q: "How do you standardize governance across many teams without blocking them?",
      type: "concept",
      a: "Federated governance with guardrails:\n" +
         "• Central standards, local ownership \u2014 Unity Catalog gives account-level policy; teams own their catalogs/schemas.\n" +
         "• Least privilege via IdP groups, not individuals; grant at the highest sensible level.\n" +
         "• Policies as code \u2014 cluster policies, tagging standards, budgets enforced centrally but consumed self-service.\n" +
         "• Templates/golden paths \u2014 CI/CD bundles, pipeline templates, DQ frameworks teams adopt.\n" +
         "• Sensitive data \u2014 column masks + row filters; classification via Purview.\n" +
         "• Audit & visibility \u2014 audit logs, lineage, cost dashboards; a data council resolves conflicts.\n" +
         "Balance control with developer velocity."
    },
    {
      q: "A customer insists on an open-source, self-built Spark platform over Databricks. How do you respond?",
      type: "scenario",
      a: "Consultative, no hard sell \u2014 compare on total cost of ownership and outcomes:\n" +
         "• Acknowledge strengths of OSS Spark (no license, flexibility, no lock-in with open formats like Delta/Parquet).\n" +
         "• Surface hidden costs of self-managed \u2014 cluster management, upgrades, security, governance, on-call, GPU/DBA effort; slow time-to-value.\n" +
         "• Databricks advantages \u2014 managed + serverless, Photon performance, Unity Catalog governance, Delta/Lakeflow/MLflow, built-in reliability and observability.\n" +
         "• De-risk \u2014 start with a proof-of-concept on ONE workload, measure performance/TCO, then scale what wins.\n" +
         "• Keep it objective and tied to the customer's business goals; avoid competitor bashing."
    },
    {
      q: "How do you design security and network isolation for Databricks?",
      type: "scenario",
      a: "• Identity \u2014 Entra ID SSO; SCIM provisioning; groups for access.\n" +
         "• Network \u2014 VNet injection (customer-managed VNet, subnets, NSGs); Private Link/private endpoints for control plane and storage; no-public-IP workspaces; firewall.\n" +
         "• Data at rest \u2014 SSE (Microsoft-managed or customer-managed keys); Unity Catalog + external locations restrict path access.\n" +
         "• Secrets \u2014 Azure Key Vault via Databricks secret scopes; managed identities/Access Connector; no keys in code.\n" +
         "• Access control \u2014 UC GRANTs, row filters, column masks, least privilege.\n" +
         "• Monitoring \u2014 audit logs to Log Analytics, alerting.\n" +
         "Map each control to compliance requirements (HIPAA/PCI/etc.)."
    },
    {
      q: "How do you handle data contracts and data quality at platform scale?",
      type: "concept",
      a: "• Data contracts \u2014 agreed schema/semantics + SLAs between producer and consumer; enforce via schema validation and versioned interfaces.\n" +
         "• Quality framework \u2014 DLT expectations / declarative expectations, or Great Expectations; classify rules as fail / drop / warn.\n" +
         "• Quarantine \u2014 route bad records to a bad-data store with reasons for triage.\n" +
         "• Observability \u2014 DQ metrics dashboards, alerting on breaches, lineage to trace impact.\n" +
         "• Governance \u2014 data owners per domain; contracts reviewed in the data council.\n" +
         "Principle: shift quality left (validate on ingest) and make failures visible and recoverable."
    },
    {
      q: "How do you migrate from Hive/legacy tables to Unity Catalog?",
      type: "scenario",
      a: "• Inventory \u2014 Hive Metastore tables, views, permissions, and dependencies.\n" +
         "• Upgrade \u2014 use the UC upgrade wizard / SYNC command to register Hive tables into UC (managed vs external handling).\n" +
         "• Access \u2014 recreate grants; map legacy ACLs to UC GRANTs; validate per group.\n" +
         "• Paths \u2014 ensure external locations + storage credentials cover the data paths.\n" +
         "• Validate \u2014 compare row counts/checksums; test representative queries; monitor for broken jobs.\n" +
         "• Cut over gradually \u2014 per catalog/domain; keep Hive read-only during transition; then decommission.\n" +
         "Communicate, automate, and rehearse rollback."
    },
    {
      q: "Walk through how you would size and choose clusters for a mix of workloads.",
      type: "scenario",
      a: "Match compute to workload:\n" +
         "• BI/SQL \u2014 serverless SQL warehouse with autoscaling and IWM; size by concurrency, not volume.\n" +
         "• ETL/batch \u2014 Job clusters (auto-terminate), memory-optimized VMs for joins/aggregations, autoscaling, Spot for cost; Photon for speed.\n" +
         "• Streaming \u2014 always-on job clusters; size for throughput + state; consider serverless.\n" +
         "• ML \u2014 GPU clusters, single-node for driver-heavy work.\n" +
         "• Guidance \u2014 prefer fewer larger workers over many small (less shuffle overhead); iterate with monitoring; use instance pools for warm start; enforce limits via cluster policies.\n" +
         "Trade-off: performance vs cost vs concurrency."
    },
    {
      q: "How do you build observability for pipelines and the platform?",
      type: "concept",
      a: "• Workload monitoring \u2014 Databricks Workflows run history, alerts, repair-and-rerun; query history; Spark UI for bottlenecks.\n" +
         "• System tables \u2014 system.billing.usage (cost), system.access.audit (activity), system.lakeflow.* (jobs), lineage \u2014 queryable via SQL for dashboards.\n" +
         "• Logging \u2014 diagnostic logs + cluster logs to ADLS/Log Analytics; KQL queries and alerts.\n" +
         "• DQ + freshness \u2014 expectation metrics, SLA/freshness checks, alerting.\n" +
         "• Lineage \u2014 Unity Catalog column-level lineage to trace downstream impact.\n" +
         "Goal: detect, diagnose, and alert fast; make cost and reliability visible to owners."
    },
    {
      q: "What is Delta Sharing and where would an architect use it?",
      type: "concept",
      a: "Delta Sharing is an open protocol to share live data (and AI assets) across organizations, clouds, or business units WITHOUT copying it.\n" +
         "• Provider publishes a share (subset of tables/volumes); recipients read via the share \u2014 Databricks-to-Databricks or open recipients (Power BI, pandas).\n" +
         "• Governance and audit remain with the provider.\n" +
         "Architect use cases: B2B data exchange, cross-region/cross-org sharing, marketplace, or when copying data is undesirable/expensive. Complements UC (grants) for internal access."
    },
    {
      q: "How do you present and defend an architecture decision to stakeholders?",
      type: "concept",
      a: "Use an Architecture Decision Record (ADR) mindset:\n" +
         "• Context \u2014 the business problem and constraints (budget, SLA, compliance, scale).\n" +
         "• Options \u2014 2\u20133 realistic alternatives with trade-offs.\n" +
         "• Decision + rationale \u2014 what you chose and why, tied to business outcomes.\n" +
         "• Consequences \u2014 cost, performance, risk, and what you'd revisit.\n" +
         "• Communicate in business terms (cost, time-to-market, risk), not just tech; use diagrams.\n" +
         "• Be open to challenge; show you weighed alternatives. Interviewers want structured trade-off thinking."
    },
    {
      q: "Why do you want to be a Databricks/Azure Data Architect, and how do you keep growing?",
      type: "concept",
      a: "• Motivation \u2014 you enjoy end-to-end problem solving, designing scalable platforms, and multiplying impact across teams (not just writing code).\n" +
         "• Evidence \u2014 examples where you designed, optimized, or governed a platform and delivered measurable outcomes.\n" +
         "• Growth \u2014 certifications (Databricks Data Engineer/Architect, DP-203/DP-700), hands-on labs, keeping up with features (Lakeflow, Declarative Pipelines, Unity Catalog, serverless, Fabric), community, mentoring.\n" +
         "• Value \u2014 you bridge engineering and business, reduce cost/risk, and raise the team's standards.\n" +
         "Keep it concrete and forward-looking."
    }
  ]
});
