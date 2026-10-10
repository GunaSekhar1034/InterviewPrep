window.QB = window.QB || [];
QB.push({
  id: "cicd",
  name: "CI/CD, Orchestration & Production",
  icon: "\uD83D\uDE80",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "How do you implement CI/CD for Databricks?",
      type: "concept",
      a: "Pipeline (Azure DevOps / GitHub Actions):\n" +
         "• Source control \u2014 notebooks/code in Git (Azure Repos/GitHub) via Databricks Repos/Git folders.\n" +
         "• CI \u2014 run unit tests (pytest/nutter), lint, build artifacts (wheel/JAR).\n" +
         "• CD \u2014 deploy notebooks/jobs via Databricks CLI/REST API or databricks bundle deploy (Asset Bundles); promote DEV\u2192QA\u2192PROD.\n" +
         "• Use service principals for deployment auth; store secrets in Key Vault."
    },
    {
      q: "What are Databricks Asset Bundles (DAB)?",
      type: "concept",
      a: "DAB is an infrastructure-as-code way to define Databricks resources (jobs, pipelines, notebooks, clusters, permissions) in a databricks.yml bundle.\n" +
         "• Supports multiple targets (dev/qa/prod) and parameterization.\n" +
         "• Deploy with: databricks bundle deploy --target prod; run with databricks bundle run.\n" +
         "• Enables version-controlled, repeatable deployments across environments."
    },
    {
      q: "How do you orchestrate/schedule Databricks notebooks?",
      type: "concept",
      a: "• Databricks Workflows (Jobs) \u2014 native; multi-task jobs with dependencies, retries, alerting, repair-and-rerun; best for production.\n" +
         "• ADF \u2014 pipeline with Databricks Notebook activities chained on success; best when orchestrating across Azure services (ADB+SQL+Functions).\n" +
         "• dbutils.notebook.run() \u2014 simple chaining from a master notebook (pass args, get exit value).\n" +
         "Recommendation: use Workflows for production scheduling; ADF for cross-service orchestration."
    },
    {
      q: "Difference between %run and dbutils.notebook.run()?",
      type: "concept",
      a: "• %run \u2014 runs another notebook INLINE, sharing scope/variables/functions; no parameters (uses widget defaults); no return value. Use to share utility functions.\n" +
         "• dbutils.notebook.run() \u2014 runs in an ISOLATED context; pass a dict of parameters; returns a string via dbutils.notebook.exit(); has a timeout. Use to orchestrate sequential notebooks and pass/return data."
    },
    {
      q: "How do you promote code across Dev \u2192 QA \u2192 Prod in Databricks?",
      type: "concept",
      a: "• Separate workspaces (or catalogs/schemas) per environment attached to the same UC metastore.\n" +
         "• Parameterize storage paths, catalog/schema names, and cluster configs per environment.\n" +
         "• Use Git + CI/CD (Azure DevOps/GitHub Actions) with service principals to deploy bundles/jobs.\n" +
         "• Environment-specific config files (databricks.yml targets) or ADF global parameters/ARM params.\n" +
         "• Run tests in QA before promoting to Prod; keep secrets in Key Vault per environment."
    },
    {
      q: "For Dev/Test/Prod, should you use one metastore or multiple?",
      type: "concept",
      a: "Typical: ONE metastore per region, shared across Dev/Test/Prod workspaces; isolate environments using separate CATALOGS (dev_catalog, test_catalog, prod_catalog), schemas, and permissions.\n" +
         "Use SEPARATE metastores only for strong isolation: different regions, legal entities, compliance boundaries, or separate organizations."
    },
    {
      q: "How do you optimize cost in Databricks?",
      type: "concept",
      a: "• Use Job clusters (auto-terminate) for production; avoid idle All-Purpose clusters.\n" +
         "• Enable autoscaling; set auto-termination aggressively.\n" +
         "• Use instance pools and Spot instances where appropriate.\n" +
         "• Serverless/SQL Warehouse with auto-suspend for BI.\n" +
         "• Enable Photon + AQE + predictive optimization to reduce run time.\n" +
         "• OPTIMIZE/VACUUM to reduce storage/scan; delete temp tables; right-size clusters.\n" +
         "• Use cluster policies to cap sizes/costs; monitor DBU usage."
    },
    {
      q: "What are cluster policies?",
      type: "concept",
      a: "Cluster policies are admin-defined rules that constrain what cluster configurations users can create (max/min workers, VM types, allowed options, auto-terminate, tags).\n" +
         "Benefits: cost control, governance, standardization, and self-service within limits. Enforced via Unity Catalog/workspace admin settings."
    },
    {
      q: "How do you monitor production pipelines and handle failures?",
      type: "concept",
      a: "• Databricks Workflows \u2014 run history, task-level logs, notifications/alerts on success/failure/duration; repair-and-rerun for failed tasks.\n" +
         "• ADF \u2014 Monitor tab, Azure Monitor/Log Analytics + KQL, alerts via action groups.\n" +
         "• Audit tables \u2014 track load history/watermarks for traceability.\n" +
         "• DQ checks \u2014 fail fast on critical violations, alert the team.\n" +
         "• Foundation: idempotent MERGE + checkpoints so retries/recovery are safe."
    },
    {
      q: "How do you parameterize pipelines for reuse across environments?",
      type: "concept",
      a: "• ADF: pipeline parameters, variables, global parameters, parameterized datasets/linked services, ARM template overrides per environment.\n" +
         "• Databricks: widgets (dbutils.widgets.get), job/task parameters, DAB targets, and config files (paths, catalog/schema) per env.\n" +
         "• Keep environment-specific values (paths, secrets, hosts) OUT of code; inject at deploy/runtime."
    }
  ]
});

QB.push({
  id: "fabric",
  name: "Microsoft Fabric",
  icon: "\uD83E\uDDF5",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is Microsoft Fabric?",
      type: "concept",
      a: "Microsoft Fabric is an end-to-end, SaaS-based analytics platform that unifies data engineering, data science, real-time analytics, data warehousing, and BI (Power BI) in one experience.\n" +
         "• Built on OneLake (single, unified lake) using Delta Parquet.\n" +
         "• Integrates Power BI, Azure Synapse, and Data Factory.\n" +
         "• Capacity-based SaaS: no infrastructure to manage."
    },
    {
      q: "How does Microsoft Fabric differ from Azure Synapse?",
      type: "concept",
      a: "• Architecture: Fabric is SaaS (unified, one platform); Synapse is PaaS (manual provisioning of pools/workspaces).\n" +
         "• Storage: Fabric uses OneLake (unified lakehouse); Synapse uses dedicated SQL pools + data lakes (separate).\n" +
         "• Compute/pricing: Fabric is capacity-based (F SKUs); Synapse is pay-per-query/provisioned.\n" +
         "• Integration: Fabric natively integrates Power BI/Azure AI; Synapse needs connectors.\n" +
         "Fabric is the newer consolidated experience."
    },
    {
      q: "What are the core components/workloads of Fabric?",
      type: "concept",
      a: "• Data Factory \u2014 data integration/pipelines.\n" +
         "• Synapse Data Engineering \u2014 Spark-based lakehouse, notebooks.\n" +
         "• Synapse Data Science \u2014 ML/AI workloads.\n" +
         "• Synapse Data Warehousing \u2014 managed T-SQL warehouse.\n" +
         "• Real-Time Analytics \u2014 Kusto-based streaming/event processing.\n" +
         "• Power BI \u2014 visualization/reporting.\n" +
         "• OneLake \u2014 unified storage underpinning everything."
    },
    {
      q: "What is OneLake?",
      type: "concept",
      a: "OneLake is the single, unified, logically-centralized storage layer for all Fabric workloads (like OneDrive for data).\n" +
         "• Stores data in open Delta Parquet format.\n" +
         "• One copy of data, accessed by all engines (Spark, SQL, KQL, Power BI) \u2014 no duplication/silos.\n" +
         "• Supports shortcuts to external storage (ADLS/S3) without copying."
    },
    {
      q: "What is Direct Lake mode in Power BI/Fabric?",
      type: "concept",
      a: "Direct Lake lets Power BI read Delta tables in OneLake directly without importing/caching data, giving near import-level performance with real-time freshness.\n" +
         "• No data duplication; no scheduled refresh needed for base data.\n" +
         "• Compare: Import mode (copies/caches data, fast but stale), DirectQuery (queries source live, slower, no cache).\n" +
         "Direct Lake blends the speed of Import with the freshness of DirectQuery."
    },
    {
      q: "How does Fabric handle security and governance?",
      type: "concept",
      a: "• Authentication: Microsoft Entra ID (Azure AD).\n" +
         "• Authorization: RBAC at workspace/item level; Row-Level Security (RLS) and Object-Level Security (OLS) in the semantic model/warehouse.\n" +
         "• Governance: Microsoft Purview for discovery, cataloging, lineage, classification, and policy enforcement across Fabric.\n" +
         "• Sensitivity labels/endorsements for items."
    },
    {
      q: "Describe the Fabric capacity/licensing model and SKUs.",
      type: "concept",
      a: "Fabric uses capacity-based licensing: you buy Fabric Capacity Units (CUs) as an F-SKU (F2, F4, F8, ... higher = more compute/storage).\n" +
         "• Capacity provides fixed compute + storage quotas shared across workloads.\n" +
         "• Workloads consume the capacity; you can pause/resume to save cost.\n" +
         "• Premium/Embedded P/EM SKUs can also power Fabric features.\n" +
         "Contrast with per-service/per-query pricing."
    },
    {
      q: "How does Fabric support real-time analytics?",
      type: "concept",
      a: "Fabric Real-Time Analytics (based on the Kusto engine) ingests and processes high-throughput streaming data (Eventstreams/Event Hubs/Kafka) and provides low-latency KQL queries and real-time dashboards.\n" +
         "• Use Eventstream for no-code ingestion/transformation.\n" +
         "• KQL databases for fast time-series/event queries.\n" +
         "• Integrates with Power BI for live dashboards."
    },
    {
      q: "How does Fabric support ETL/ELT?",
      type: "concept",
      a: "• Dataflows Gen2 (Power Query) for low-code ELT.\n" +
         "• Data Factory pipelines (copy activities + orchestration) for ETL/ELT.\n" +
         "• Spark notebooks (Synapse Data Engineering) for code-based transforms.\n" +
         "• Lakehouse/warehouse shortcuts and ingestion for ELT into OneLake.\n" +
         "You can mix low-code and code."
    },
    {
      q: "SCENARIO: How would you migrate an existing data warehouse to Fabric?",
      type: "scenario",
      a: "1. Export/convert existing data to Delta Lake format.\n" +
         "2. Load into OneLake (Lakehouse or Warehouse).\n" +
         "3. Rework queries for the Fabric Warehouse / Direct Lake mode for performance.\n" +
         "4. Rebuild BI reports in Power BI using Direct Lake.\n" +
         "5. Apply governance (Purview), RLS/OLS, and workspace RBAC; validate and cut over.\n" +
         "Consider shortcuts for existing ADLS data to avoid copying."
    }
  ]
});
