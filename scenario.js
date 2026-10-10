window.QB = window.QB || [];
QB.push({
  id: "scenario",
  name: "Scenario-Based & Troubleshooting",
  icon: "\uD83E\uDDE9",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "SCENARIO: A pipeline that usually completes in 10 hours is still running into the next day. How do you troubleshoot?",
      type: "scenario",
      a: "1. Check the ADF/Databricks Monitor + Spark UI \u2014 identify which stage/activity is slow.\n" +
         "2. Spark UI: look for data skew (one task far longer), large shuffle read/write, spill to disk, uneven partitions.\n" +
         "3. Compare current vs normal run: input volume growth, small-file explosion, lost broadcast (join strategy change), schema changes.\n" +
         "4. Check cluster health: resource contention (shared cluster), executor loss/GC, autoscaling limits, pool starvation.\n" +
         "5. Check upstream source latency/backlog and IR throughput.\n" +
         "Remedies: AQE/skew handling, salt skewed keys, broadcast small tables, repartition, OPTIMIZE small files, scale cluster, fix bad join, restore filters/column pruning."
    },
    {
      q: "SCENARIO: A notebook that completes in 15 minutes took 50 minutes today. How do you find the root cause?",
      type: "scenario",
      a: "• Open the run in Spark UI; find the slow stage and compare task durations \u2192 look for skew/spill.\n" +
         "• Check executor memory/GC and shuffle metrics; look for OOM-ish behavior or spilling.\n" +
         "• Check cluster: shared usage/contention, autoscaling didn't scale, fewer/larger tasks.\n" +
         "• Check data: more files/small files, larger volume, changed partitioning, source lag.\n" +
         "• Check code changes: new join, UDF, missing filter, cartesian, broadcast removed.\n" +
         "• Fix: repartition/broadcast, enable AQE/Photon, OPTIMIZE, cache reused DataFrames, scale cluster."
    },
    {
      q: "SCENARIO: Your Databricks pipeline suddenly fails. What steps do you take to identify and fix it?",
      type: "scenario",
      a: "1. Open the job run \u2192 failed task \u2192 read the error/log (driver + executor logs).\n" +
         "2. Classify: data-related (schema drift, new nulls/bad records), infra (cluster/OOM/network), dependency (upstream table missing), or code (bug).\n" +
         "3. Reproduce on a small sample; check recent code or source changes (git diff).\n" +
         "4. Verify upstream data availability, credentials/Key Vault, and table/permission changes.\n" +
         "5. Apply fix, use repair-and-rerun (only failed tasks) for idempotent pipelines.\n" +
         "6. Add guardrails: DQ checks, retries, alerts, schema drift handling."
    },
    {
      q: "SCENARIO: Source data changed structurally (new column added / datatype changed). How do you detect and handle it without breaking pipelines?",
      type: "scenario",
      a: "Detect: schema validation step in the pipeline (expected vs actual), or Auto Loader schema evolution / rescued data column.\n" +
         "Handle:\n" +
         "• ADF: allow schema drift; parameterize mapping.\n" +
         "• Ingest raw into Bronze as schema-flexible; add new columns automatically (mergeSchema / autoMerge).\n" +
         "• For datatype change: cast/map in Silver, keep raw value in Bronze, quarantine incompatible rows.\n" +
         "• Alert on drift and keep downstream consumers informed; evolve Delta schema explicitly (ALTER TABLE ADD COLUMN).\n" +
         "Design principle: raw layer tolerant, curated layers strict."
    },
    {
      q: "SCENARIO: You notice data skew in a large join. How do you confirm and fix it?",
      type: "scenario",
      a: "Confirm: Spark UI shows a few tasks with much larger shuffle read and longer duration; one executor overloaded.\n" +
         "Fix:\n" +
         "• Enable AQE skew join (auto-splits skewed partitions).\n" +
         "• Salt the skewed key (add random suffix), join, then aggregate.\n" +
         "• Broadcast the smaller table if it fits.\n" +
         "• Repartition on a better/more even key or by range.\n" +
         "• Filter reduce before the join; isolate the hot key and process separately."
    },
    {
      q: "SCENARIO: Your Delta table has thousands of small files and reads are slow. What do you do?",
      type: "scenario",
      a: "• Run OPTIMIZE to compact into larger (~1 GB) files; schedule it after loads.\n" +
         "• Enable Auto Optimize (optimizeWrite + autoCompact) to prevent small files going forward.\n" +
         "• Use availableNow trigger / larger micro-batches in streaming or foreachBatch with repartition.\n" +
         "• Adopt Liquid Clustering / right partition strategy; coalesce before writes.\n" +
         "• Set a target file size and monitor file counts."
    },
    {
      q: "SCENARIO: Duplicate records are appearing in your Silver table. How do you fix it?",
      type: "scenario",
      a: "• Deduplicate on business key + recency: ROW_NUMBER() over key ordered by load_ts desc, keep rn=1.\n" +
         "• Use dropDuplicates on the natural key.\n" +
         "• For incremental loads, MERGE on the key (whenMatchedUpdate) so re-runs don't insert duplicates.\n" +
         "• Add a DQ check that fails/alerts if duplicates exceed a threshold.\n" +
         "• Identify the source (idempotency, retries, CDC reprocessing) and fix upstream."
    },
    {
      q: "SCENARIO: You need to process millions/billions of records. What's your approach?",
      type: "scenario",
      a: "• Store in columnar Delta/Parquet with partitioning/Clustering; avoid CSV/JSON for large scale.\n" +
         "• Define explicit schemas; filter/aggregate early; select only needed columns.\n" +
         "• Use broadcast joins for small dims; AQE + skew handling; right-size shuffle partitions.\n" +
         "• Use Photon; cache reused DataFrames; avoid UDFs.\n" +
         "• Scale the cluster (workers/VM type) and use autoscaling; use Job clusters.\n" +
         "• Incremental processing (watermark/MERGE) to avoid full reprocessing."
    },
    {
      q: "SCENARIO: A memory/OOM error occurs during a large join/aggregation. How do you resolve it?",
      type: "scenario",
      a: "• Reduce data early (filter, select needed columns, aggregate before join).\n" +
         "• Broadcast the small side instead of shuffling the huge side.\n" +
         "• Increase shuffle partitions to make tasks smaller; use AQE.\n" +
         "• Fix skew (salting/AQE) so one task doesn't blow up.\n" +
         "• Use bigger memory VMs / more nodes; avoid collect()/large driver operations.\n" +
         "• Use persist(MEMORY_AND_DISK) instead of MEMORY_ONLY if needed."
    },
    {
      q: "SCENARIO: Compare these two queries and explain when to use each. Q1: SELECT emp_id, SUM(salary) FROM salary_table WHERE salary>5000 GROUP BY emp_id; Q2: SELECT emp_id, SUM(salary) FROM salary_table GROUP BY emp_id HAVING SUM(salary)>5000;",
      type: "scenario",
      a: "• Q1 (WHERE) filters individual ROWS before aggregation \u2014 only salaries > 5000 are summed per employee.\n" +
         "• Q2 (HAVING) aggregates ALL rows, then keeps employees whose TOTAL salary > 5000.\n" +
         "They give different results. Use WHERE to filter rows cheaply before grouping; use HAVING to filter on aggregate results. You can combine both."
    },
    {
      q: "SCENARIO: Design a POD-level ADF pipeline that feeds a Databricks job. How do you configure Linked Services, Datasets, and pipeline properties?",
      type: "scenario",
      a: "• Linked Services: ADLS (Azure IR), Databricks workspace (with access token from Key Vault), source DB (SHIR if on-prem).\n" +
         "• Datasets: parameterized source/sink datasets (schema/table/path) so one pipeline handles many tables.\n" +
         "• Pipeline: Get Metadata/Lookup \u2192 ForEach (metadata-driven) \u2192 Databricks Notebook activity; pass parameters (run_date, table).\n" +
         "• Properties: set ForEach degree of parallelism, Copy DIUs, batch count for data flows, retry + timeout, and Tumbling Window trigger.\n" +
         "• Balance throughput vs cost: use Job clusters, avoid over-parallelizing the source, scale SHIR/DIUs as needed."
    },
    {
      q: "SCENARIO: A production job reading secrets from Key Vault starts failing intermittently. How do you diagnose it?",
      type: "scenario",
      a: "• Check Key Vault access: is the secret still present/permitted; is the managed identity/SPN expired or the secret rotated?\n" +
         "• Check the Integration Runtime: is the SHIR online, throttled, or hitting network/timeouts?\n" +
         "• Check pipeline config: correct secret scope/key, correct vault URI, no hard-coded expiry.\n" +
         "• Look at error messages (AAD auth vs 403 vs timeout) and correlate with time of day (throttling).\n" +
         "• Fix: renew/rotate credentials, add retry with backoff, monitor Key Vault diagnostics, add alerts."
    },
    {
      q: "SCENARIO: A Databricks cluster fails to start due to resource limitations. What do you do?",
      type: "scenario",
      a: "• Free up resources: terminate idle clusters and release the quota/cores.\n" +
         "• Request a quota increase (vCPU/cores) in the subscription.\n" +
         "• Reduce min workers/VM size, or use instance pools / serverless.\n" +
         "• Check for subnet/network (no available IPs) or policy restrictions.\n" +
         "• Retry after cleanup; use cluster policies to prevent oversized requests."
    },
    {
      q: "SCENARIO: You must do real-time analysis on a streaming dataset in Databricks. How?",
      type: "scenario",
      a: "• Read with Spark Structured Streaming from Event Hubs/Kafka (Kafka API).\n" +
         "• Parse JSON (from_json), apply watermark + windowed aggregation, dedupe.\n" +
         "• Write to a Delta table with checkpointing (exactly-once); use update/append mode.\n" +
         "• Optionally use DLT streaming tables for managed reliability + expectations.\n" +
         "• Serve to Power BI/Real-Time Analytics; monitor lag and checkpoint health."
    },
    {
      q: "What are the common challenges you've faced in pipelines (and fixes)?",
      type: "scenario",
      a: "• Data skew \u2192 AQE/salting/broadcast.\n" +
         "• Schema drift \u2192 mergeSchema/schema drift/Auto Loader rescued data.\n" +
         "• Duplicates \u2192 dedupe + idempotent MERGE.\n" +
         "• OOM/memory \u2192 filter early, partition, right-size cluster, persist(MEMORY_AND_DISK).\n" +
         "• Small-file problem \u2192 OPTIMIZE / Auto Optimize.\n" +
         "• Slow large-large joins \u2192 broadcast/bucketing.\n" +
         "• Connection timeouts \u2192 retry/backoff, connection pooling, scale IR.\n" +
         "• Datatype mismatch \u2192 explicit schema + validation.\n" +
         "• Incremental load failures \u2192 reliable watermark in a control table.\n" +
         "• Late-arriving data \u2192 overlap window / reprocess."
    }
  ]
});
