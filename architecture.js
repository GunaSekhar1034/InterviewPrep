window.QB = window.QB || [];
QB.push({
  id: "architecture",
  name: "Medallion Architecture & Data Platform Design",
  icon: "\uD83C\uDFD7\uFE0F",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is the Medallion Architecture (Bronze/Silver/Gold)?",
      type: "concept",
      a: "Medallion architecture organizes a lakehouse into progressive quality layers:\n" +
         "• Bronze (raw) \u2014 exact copy of source, minimal transformation, append-only, audit trail, Delta format.\n" +
         "• Silver (cleansed/conformed) \u2014 cleaned, validated, deduplicated, standardized, joined; the 'single source of truth' for analytics/DS.\n" +
         "• Gold (business) \u2014 aggregated, enriched, business-ready (KPIs, star schemas) for BI/reporting.\n" +
         "Typical flow: ADLS \u2192 Databricks \u2192 Bronze \u2192 Silver \u2192 Gold \u2192 Power BI."
    },
    {
      q: "What is stored in each Medallion layer and in what format?",
      type: "concept",
      a: "• Bronze: raw as-is + metadata columns (load_date, ingestion_timestamp, source_file). Delta (converted from CSV/JSON/Parquet). No business transforms. Path e.g. /bronze/orders.\n" +
         "• Silver: validated, deduplicated, type-cast, joined, conformed data. Delta. /silver/orders_clean.\n" +
         "• Gold: business aggregates, KPIs, star-schema fact/dim tables. Delta (or Parquet for serving). /gold/daily_sales.\n" +
         "Always store transformed data as Delta for ACID, time travel, schema evolution, and MERGE."
    },
    {
      q: "Walk through an end-to-end Medallion implementation.",
      type: "concept",
      a: "1. Ingest \u2014 ADF / Auto Loader / COPY INTO lands raw files into ADLS Bronze as Delta (add metadata columns).\n" +
         "2. Transform to Silver \u2014 PySpark/DLT: cleanse, dedupe, cast types, standardize, apply DQ checks, join reference data; MERGE incrementally.\n" +
         "3. Build Gold \u2014 aggregate to KPI tables / star schema (facts + dims), apply SCD logic, partition by date.\n" +
         "4. Serve \u2014 Power BI/Tableau via SQL Warehouse; ML from Silver.\n" +
         "5. Govern \u2014 Unity Catalog for access, lineage, RLS/CLS; monitor with alerts + audit.\n" +
         "6. Orchestrate \u2014 Databricks Workflows / ADF with retries, parameterization, dev\u2192qa\u2192prod promotion."
    },
    {
      q: "What data validations do you perform on the Silver layer?",
      type: "concept",
      a: "• Schema/type validation \u2014 columns and types match expectations.\n" +
         "• Null checks on critical columns.\n" +
         "• Duplicate checks on business/primary keys.\n" +
         "• Range/domain validation (e.g., age 0\u2013150, valid enums).\n" +
         "• Referential integrity (child keys exist in parents via left anti join).\n" +
         "• Record-count reconciliation vs source/threshold.\n" +
         "• Business rules (end_date >= start_date).\n" +
         "Implement as DQ framework / DLT expectations; quarantine or fail on critical violations."
    },
    {
      q: "SCENARIO: Data moves from Silver to Gold. At what stage do you aggregate and why? How do you apply RLS/CLS there?",
      type: "scenario",
      a: "• Aggregate in the GOLD layer \u2014 Silver keeps granular, conformed data (reusable, single source of truth); Gold is purpose-built for BI with pre-computed aggregates (faster dashboards, smaller scans). Aggregating too early loses reusability.\n" +
         "• RLS/CLS: apply in Gold (and where sensitive columns exist) using Unity Catalog row filters and column masks so Power BI/Tableau consumers only see permitted rows/columns. Enforce centrally in UC, not in each report.\n" +
         "• Also restrict access via GRANTs on Gold tables/views."
    },
    {
      q: "When would you choose batch vs streaming processing?",
      type: "concept",
      a: "• Batch \u2014 scheduled, high-throughput, latency-tolerant: end-of-day reports, historical/backfill loads, month-end close, large transformations.\n" +
         "• Streaming \u2014 continuous, low-latency: fraud detection, IoT/telemetry, clickstream, real-time alerting/dashboards, CDC propagation.\n" +
         "Many platforms use a lambda-style hybrid: streaming for speed, batch for corrections/reprocessing."
    },
    {
      q: "How do you design a pipeline for incremental data loads?",
      type: "concept",
      a: "• Track a watermark (max updated_ts/ID) per table in a control table.\n" +
         "• Extract only records > watermark (predicate pushdown at source).\n" +
         "• Apply transforms; MERGE into the target (upsert; handle deletes via CDC if available).\n" +
         "• Update the watermark only after success.\n" +
         "• Handle late-arriving data (overlap window / reprocess) and ensure idempotency.\n" +
         "• Schedule/orchestrate via ADF or Databricks Workflows."
    },
    {
      q: "What is data quality and what are its dimensions?",
      type: "concept",
      a: "Data Quality = how fit data is for its intended use. Dimensions:\n" +
         "• Completeness (no missing required values)\n" +
         "• Accuracy (reflects reality)\n" +
         "• Consistency (same across systems)\n" +
         "• Timeliness (available when needed)\n" +
         "• Uniqueness (no duplicates)\n" +
         "• Validity (conforms to formats/rules).\n" +
         "Enforced via DLT expectations, Great Expectations, or custom PySpark checks; fail fast or quarantine bad records."
    },
    {
      q: "How do you handle bad/corrupt records?",
      type: "concept",
      a: "Never let bad records corrupt trusted layers. Options:\n" +
         "• Quarantine \u2014 write invalid rows to a separate bad-records table/path for triage.\n" +
         "• Rescue \u2014 Auto Loader's _rescued_data column keeps unmatched/corrupt values.\n" +
         "• Drop/log \u2014 expect_or_drop in DLT (log + drop) or filter with logging.\n" +
         "• Fail fast \u2014 expect_or_fail for critical rules (stop the pipeline).\n" +
         "• Schema handling \u2014 mode PERMISSIVE (keeps corrupt as null), DROPMALFORMED (drop), FAILFAST (error)."
    },
    {
      q: "What is the 'typical architecture' for an Azure data engineering project?",
      type: "concept",
      a: "Sources (SQL Server, APIs, CSV, SAP) \u2192 ADF (orchestration/ingestion) \u2192 ADLS Gen2 \u2192 Databricks (PySpark transformations) with Bronze/Silver/Gold Delta layers \u2192 serve to Power BI / Synapse.\n" +
         "Cross-cutting: Unity Catalog governance, Key Vault secrets, Azure Monitor/Log Analytics, CI/CD, and orchestration via ADF/Databricks Workflows."
    },
    {
      q: "How do you decide between partitioning, Z-ORDER, and Liquid Clustering?",
      type: "concept",
      a: "• Partitioning \u2014 low-cardinality columns (date, region, country) where each partition is \u2265 ~1 GB; enables partition pruning; avoid high cardinality/over-partitioning.\n" +
         "• Z-ORDER \u2014 high-cardinality filter/join columns (customer_id) on existing (often partitioned) tables; re-cluster on OPTIMIZE.\n" +
         "• Liquid Clustering \u2014 modern default for evolving queries; incremental auto re-clustering, no partition maintenance; can replace partition+Z-ORDER.\n" +
         "Decide by query filter patterns + table size + maintenance overhead."
    },
    {
      q: "How do you handle schema drift/evolution across the platform?",
      type: "concept",
      a: "• Detect: compare source vs expected schema (Get Metadata/Validate) or let reads report new columns.\n" +
         "• ADF: Allow schema drift in data flows; benign schema changes flow through.\n" +
         "• Auto Loader: schema inference + evolution (_rescued_data for mismatches).\n" +
         "• Delta: mergeSchema on write / delta.autoMerge; ALTER TABLE ADD COLUMN.\n" +
         "• Design Bronze to be schema-flexible (raw), enforce structure at Silver/Gold.\n" +
         "• Add alerts on drift so downstream contracts don't break silently."
    }
  ]
});
