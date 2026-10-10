window.QB = window.QB || [];
QB.push({
  id: "delta",
  name: "Delta Lake",
  icon: "\uD83D\uDDC4\uFE0F",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is Delta Lake / a Delta table and what problems does it solve?",
      type: "concept",
      a: "Delta Lake is an open-source storage layer that sits on top of Parquet in cloud storage and adds: ACID transactions, a transaction log (_delta_log), schema enforcement & evolution, time travel, UPSERT/MERGE, and unified batch + streaming reads/writes.\n" +
         "It brings reliability and warehouse-like guarantees to a data lake (the 'lakehouse'), fixing typical data-lake issues: no ACID, no schema control, slow updates, and small-file problems."
    },
    {
      q: "Explain ACID properties in Delta Lake and the transaction log.",
      type: "concept",
      a: "• Atomicity \u2014 a commit fully succeeds or fully fails (no partial writes).\n" +
         "• Consistency \u2014 schema enforcement keeps data valid.\n" +
         "• Isolation \u2014 snapshot isolation for concurrent reads/writes.\n" +
         "• Durability \u2014 committed data persists even after failures.\n" +
         "The _delta_log is an ordered set of JSON commits recording every change (add/remove files, metadata, protocol). Each read reconstructs the table state from the log; the log is the source of truth and enables time travel and atomic operations."
    },
    {
      q: "What are the file types inside the _delta_log folder?",
      type: "concept",
      a: "• .json \u2014 incremental transaction files, one per commit (AddFile, RemoveFile, metadata, protocol). No actual data.\n" +
         "• .checkpoint.parquet \u2014 a snapshot of table state every ~10 commits so readers don't replay all JSON files.\n" +
         "• .compacted.json \u2014 combines multiple small JSON commits to speed up log reads.\n" +
         "• .crc \u2014 checksum/integrity file for checkpoints; on corruption Spark falls back to the previous valid checkpoint.\n" +
         "Together they keep metadata reads fast and reliable."
    },
    {
      q: "What is Delta table metadata log management and how does it become a bottleneck?",
      type: "concept",
      a: "Every commit adds a JSON file to _delta_log; over time this grows and slows query planning. Mitigation:\n" +
         "• Checkpoints (every 10 commits) collapse state so readers load 1 checkpoint + recent JSONs.\n" +
         "• delta.logRetentionDuration (default 30 days) \u2014 old JSON commits are pruned once a checkpoint exists.\n" +
         "• Compacted JSON files reduce the number of individual commits.\n" +
         "• OPTIMIZE compacts the underlying Parquet data files (not the log).\n" +
         "Note: copying the log elsewhere doesn't fix performance \u2014 checkpointing + retention does."
    },
    {
      q: "How does time travel work in Delta Lake?",
      type: "concept",
      a: "Delta keeps every version in the log, so you can query historical snapshots:\n" +
         "• By version: SELECT * FROM t VERSION AS OF 5 (or option('versionAsOf',5)).\n" +
         "• By timestamp: SELECT * FROM t TIMESTAMP AS OF '2025-01-01'.\n" +
         "• DESCRIBE HISTORY t shows the commit history (operations, versions, timestamps).\n" +
         "Use cases: audit, reproduce past results, recover from bad writes (RESTORE TABLE t TO VERSION AS OF n).\n" +
         "Limitation: time travel is bounded by VACUUM retention \u2014 once old files are removed, those versions are gone."
    },
    {
      q: "Difference between schema enforcement and schema evolution in Delta?",
      type: "concept",
      a: "• Schema enforcement (validation) \u2014 by default Delta rejects writes whose schema doesn't match the table, protecting data integrity.\n" +
         "• Schema evolution \u2014 you can intentionally allow new/changed columns:\n" +
         "  – df.write.option('mergeSchema','true').mode('append')\n" +
         "  – SET spark.databricks.delta.schema.autoMerge.enabled = true\n" +
         "  – ALTER TABLE ... ADD COLUMN ...\n" +
         "  – COPY INTO ... COPY_OPTIONS ('mergeSchema'='true')\n" +
         "• overwriteSchema replaces the whole schema (use with caution)."
    },
    {
      q: "How do you implement MERGE (UPSERT) in Delta?",
      type: "concept",
      a: "MERGE matches source to target and conditionally updates/inserts/deletes \u2014 the standard upsert pattern for incremental/CDC loads.\n" +
         "Example:\n" +
         "target.alias('t').merge(incremental_df.alias('s'), 't.id = s.id').whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()\n" +
         "SQL: MERGE INTO t USING s ON t.id=s.id WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *;\n" +
         "Supports whenMatchedDelete, conditional updates, and partial column updates. Requires the join condition to be on key columns for efficiency."
    },
    {
      q: "What does OPTIMIZE do?",
      type: "concept",
      a: "OPTIMIZE compacts many small Parquet files into fewer, larger (~1 GB) files to improve read performance and reduce metadata overhead (fixes the small-file problem).\n" +
         "• OPTIMIZE table; or OPTIMIZE table WHERE date >= '2026-01-01' (target recent partitions).\n" +
         "• OPTIMIZE table ZORDER BY (col) adds clustering for data skipping.\n" +
         "Run after bulk loads / daily ETL. Target file size is configurable via delta.optimize.maxFileSize. Auto Optimize can do this automatically."
    },
    {
      q: "What is Z-ORDER and how does it improve performance?",
      type: "concept",
      a: "Z-ORDER co-locates related rows into the same files by reordering data across multiple columns (multi-dimensional clustering).\n" +
         "• Delta's data-skipping uses file min/max stats to skip files that can't match a filter; good clustering means fewer files to scan.\n" +
         "• Best on HIGH-cardinality columns used frequently in WHERE/JOIN (customer_id, transaction_id, date).\n" +
         "• Syntax: OPTIMIZE t ZORDER BY (customer_id, txn_date).\n" +
         "• It's expensive \u2014 apply to the most queried columns only. Don't combine with auto compaction."
    },
    {
      q: "Difference between OPTIMIZE, Z-ORDER, and Liquid Clustering?",
      type: "concept",
      a: "• OPTIMIZE \u2014 compacts small files into bigger files; no sorting; always useful for small-file cleanup.\n" +
         "• Z-ORDER \u2014 does the compaction AND sorts/clusters data by column values within files for data skipping; best for high-cardinality filter columns; requires re-running to stay fresh.\n" +
         "• Liquid Clustering \u2014 dynamic, incremental clustering on chosen keys; Databricks re-clusters new data automatically, no partition maintenance, works with evolving workloads; replaces partition+z-order.\n" +
         "Modern guidance: prefer Liquid Clustering; use OPTIMIZE (with ZORDER) on legacy partitioned tables."
    },
    {
      q: "What is Liquid Clustering?",
      type: "concept",
      a: "Liquid Clustering is a Databricks Delta feature that organizes data by clustering keys without traditional Hive partitioning.\n" +
         "• Define keys once: ALTER TABLE t CLUSTER BY (customer_id, txn_date) (or CLUSTER BY AUTO).\n" +
         "• Databricks incrementally re-clusters new data; keys can change without rewriting the whole table.\n" +
         "• Removes partition-column cardinality pitfalls and small-file issues; improves data skipping.\n" +
         "• No need to run Z-ORDER manually; useful for evolving/changing query patterns."
    },
    {
      q: "What is VACUUM and why is it needed?",
      type: "concept",
      a: "VACUUM permanently deletes data files that are no longer referenced by the Delta log and are past the retention period (default 7 days).\n" +
         "• Reduces storage cost and scan overhead.\n" +
         "• VACUUM t RETAIN 168 HOURS; add DRY RUN to see what would be deleted.\n" +
         "• Warning: vacuuming deletes old versions, so you LOSE time travel beyond the retention. Lowering retention below 7 days requires disabling the safety check (risky \u2014 can corrupt concurrent readers)."
    },
    {
      q: "What is Change Data Feed (CDF) and how does it differ from CDC?",
      type: "concept",
      a: "• CDF (Delta feature) \u2014 records row-level changes (insert, update_preimage, update_postimage, delete) in a Delta table so downstream can read changes incrementally.\n" +
         "  Enable: ALTER TABLE t SET TBLPROPERTIES (delta.enableChangeDataFeed=true); read with readChangeFeed=true + startingVersion.\n" +
         "  Extra columns: _change_type, _commit_version, _commit_timestamp.\n" +
         "• CDC \u2014 the broader process of capturing INSERT/UPDATE/DELETE from a SOURCE system (via log-based tools like Debezium, Azure SQL CDC, triggers, or timestamp polling).\n" +
         "In short: CDC captures changes at the source; CDF propagates Delta table changes downstream. CDF is a Delta-native way to consume changes."
    },
    {
      q: "What are Deletion Vectors?",
      type: "concept",
      a: "Deletion Vectors mark deleted rows in a bitmap rather than immediately rewriting the entire Parquet file.\n" +
         "• Makes DELETE/UPDATE/MERGE much faster (avoids rewriting whole files).\n" +
         "• Readers transparently respect the deletion vector; compacted later by OPTIMIZE.\n" +
         "• Enable via table property delta.enableDeletionVectors=true. Trade-off: slight read overhead until optimized."
    },
    {
      q: "Difference between DEEP CLONE and SHALLOW CLONE?",
      type: "concept",
      a: "• DEEP CLONE \u2014 copies the data files AND the metadata/history to a new location; fully independent; supports time travel on the clone; used for migration/backup/experimentation.\n" +
         "• SHALLOW CLONE \u2014 copies only the metadata and references the original data files (no data copy); fast/cheap; if the source files are vacuumed or changed, the clone breaks (depends on source).\n" +
         "Use deep clone for independent copies; shallow clone for quick test/dev without data duplication.\n" +
         "Syntax: CREATE TABLE dest DEEP|SHALLOW CLONE source."
    },
    {
      q: "Difference between managed (internal) and external tables in Databricks?",
      type: "concept",
      a: "• Managed table \u2014 Databricks manages the storage location and lifecycle; DROP TABLE deletes BOTH metadata AND data files. Default format is Delta. Best for lakehouse/DW tables.\n" +
         "• External table \u2014 you specify the storage location (ADLS/S3); DROP TABLE deletes only metadata, data files REMAIN. Shared across tools.\n" +
         "Production rule: use external tables (or Unity Catalog managed with careful governance) on ADLS so a drop can't accidentally destroy data."
    },
    {
      q: "SCENARIO: You need to move/copy a Delta table to another location. What options do you have?",
      type: "scenario",
      a: "• Read + write new location: spark.read.format('delta').load(src).write.format('delta').save(dest).\n" +
         "• DEEP CLONE \u2014 preserves data + history/metadata to a new path (independent).\n" +
         "• SHALLOW CLONE \u2014 metadata-only, references original files (fast/cheap).\n" +
         "• Export to Parquet/CSV for external consumption.\n" +
         "Choose deep clone for a full copy, shallow clone for a quick reference."
    },
    {
      q: "SCENARIO: A managed table was dropped and, after the retention period, the files were permanently removed. Can you recreate it?",
      type: "scenario",
      a: "No \u2014 not from Delta alone. Time travel and RESTORE depend on the transaction log AND the underlying data files still existing. Once both are permanently deleted, recovery options are:\n" +
         "• Restore from backup/DR copy.\n" +
         "• Reload from the source system and reprocess.\n" +
         "• Recover via cloud storage versioning/soft-delete if enabled.\n" +
         "Lesson: use external tables (or backups) in production so a DROP doesn't destroy data."
    },
    {
      q: "SCENARIO: The CRC file is corrupted. What happens?",
      type: "scenario",
      a: "• The .crc file validates checkpoint integrity. If the CRC check fails, Spark gracefully falls back to the PREVIOUS valid checkpoint and uses the recent JSON commits to rebuild current state.\n" +
         "• So reads typically still succeed \u2014 the corrupted checkpoint is simply skipped.\n" +
         "• Fix root cause (e.g., partial/interrupted write). Delta is resilient because the log + checkpoints are redundant; you can also force a new checkpoint with OPTIMIZE or Spark actions."
    },
    {
      q: "What are Delta table optimization techniques?",
      type: "concept",
      a: "• OPTIMIZE \u2014 compact small files.\n" +
         "• Z-ORDER / Liquid Clustering \u2014 co-locate related data for data skipping.\n" +
         "• Partitioning \u2014 on low-cardinality columns (date/region) where partitions are ~1 GB+.\n" +
         "• Auto Optimize (optimizeWrite + autoCompact) \u2014 automatic file sizing.\n" +
         "• VACUUM \u2014 remove stale files.\n" +
         "• Deletion Vectors \u2014 fast deletes/updates.\n" +
         "• Predictive Optimization (UC) \u2014 automatic maintenance.\n" +
         "• Right file size (~128 MB\u20131 GB), avoid over-partitioning, use Photon + AQE, and keep statistics for data skipping."
    },
    {
      q: "What is the small-file problem and how do you fix it in Delta?",
      type: "concept",
      a: "Streaming/micro-batch or many small writes create thousands of tiny files, causing high metadata/listing overhead and slow reads.\n" +
         "Fix:\n" +
         "• OPTIMIZE to compact into larger files; run on a schedule.\n" +
         "• Enable Auto Optimize (optimizeWrite + autoCompact) for automatic compaction.\n" +
         "• Use trigger(availableNow=True) or larger micro-batches in streaming; consider foreachBatch with repartition.\n" +
         "• Liquid Clustering / right partition strategy.\n" +
         "• Set a target file size and coalesce before writes."
    },
    {
      q: "How do COPY INTO and Auto Loader differ for ingestion?",
      type: "concept",
      a: "• COPY INTO \u2014 SQL-based, idempotent batch ingestion of files from cloud storage into a Delta table; tracks already-loaded files; good for scheduled/batch loads.\n" +
         "• Auto Loader (cloudFiles) \u2014 Structured Streaming source that incrementally and continuously discovers new files (file notification or directory listing); scalable, handles schema inference/evolution and rescued data; best for high-volume, near-real-time ingestion.\n" +
         "Use COPY INTO for simple batch; Auto Loader for continuous/scalable incremental ingestion."
    }
  ]
});
