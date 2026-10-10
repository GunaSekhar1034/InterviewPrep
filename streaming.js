window.QB = window.QB || [];
QB.push({
  id: "streaming",
  name: "Streaming & Ingestion (Auto Loader, Event Hubs)",
  icon: "\uD83D\uDCE1",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "Difference between batch and streaming processing?",
      type: "concept",
      a: "• Batch \u2014 bounded dataset processed on a schedule (hourly/daily); high throughput, higher latency; tools: Spark batch, ADF, SSIS.\n" +
         "• Streaming \u2014 unbounded, continuously arriving data processed incrementally with low latency; tools: Spark Structured Streaming, Kafka, Event Hubs.\n" +
         "Choose batch for EOD reports/historical loads; streaming for fraud detection, IoT, clickstream, real-time dashboards."
    },
    {
      q: "What is Spark Structured Streaming?",
      type: "concept",
      a: "Structured Streaming is Spark's scalable, fault-tolerant stream engine built on the DataFrame/SQL API.\n" +
         "• You write the same DataFrame transformations; Spark runs them incrementally as new data arrives.\n" +
         "• Sources: Kafka, Event Hubs, Auto Loader (cloudFiles), Delta, files, sockets.\n" +
         "• Sinks: Delta tables, files, foreachBatch, Kafka.\n" +
         "• Guarantees: exactly-once via checkpointing + idempotent sinks.\n" +
         "Model: output modes append / update / complete; triggers processingTime or availableNow."
    },
    {
      q: "What is checkpointing and why is it important in streaming?",
      type: "concept",
      a: "Checkpointing persists stream progress (which offsets/data were processed) and state to durable storage (e.g., ADLS) so the stream can recover after failure and continue without reprocessing or losing data.\n" +
         "• Enables fault tolerance and exactly-once processing.\n" +
         "• option('checkpointLocation', '/ckpt/...').\n" +
         "• Each stream needs its own checkpoint location; changing the query requires a new checkpoint (or careful migration)."
    },
    {
      q: "What is watermarking in streaming?",
      type: "concept",
      a: "A watermark defines how long to wait for late-arriving events (bounded lateness). Spark retains state for aggregations/deduplication until the watermark passes, then drops old state to bound memory.\n" +
         "• withWatermark('eventTime','10 minutes').\n" +
         "• Events older than the watermark are treated as late and dropped from stateful ops.\n" +
         "• Balances correctness (waiting for late data) vs resource usage."
    },
    {
      q: "Difference between event time and processing time?",
      type: "concept",
      a: "• Event time \u2014 when the event actually occurred (timestamp in the data).\n" +
         "• Processing time \u2014 when Spark processes/receives it.\n" +
         "Streaming windows/watermarks should use EVENT time for correct results when data arrives out of order; processing time is simpler but inaccurate for late data."
    },
    {
      q: "Explain window operations in Structured Streaming.",
      type: "concept",
      a: "• Tumbling window \u2014 fixed-size, non-overlapping (e.g., every 1 minute): window('ts','1 minute').\n" +
         "• Sliding window \u2014 fixed-size, overlapping (e.g., 10-min window every 5 min): window('ts','10 minutes','5 minutes').\n" +
         "• Session window \u2014 gaps-based (Spark 3.2+).\n" +
         "Used with groupBy + watermark for time-based aggregation over event time."
    },
    {
      q: "What is Auto Loader (cloudFiles)?",
      type: "concept",
      a: "Auto Loader is a Structured Streaming source that incrementally and efficiently discovers and ingests NEW files from cloud storage into Delta.\n" +
         "• Scales to billions of files; processes each file once (tracked via checkpoint + rocksdb state).\n" +
         "• Schema inference + evolution; rescued data column captures malformed records.\n" +
         "• Two discovery modes: directory listing (default) or file notification (Event Grid/Queue) for lower cost at scale.\n" +
         "Typical: ADLS \u2192 Auto Loader \u2192 Bronze Delta \u2192 Silver \u2192 Gold.",
      code: "(spark.readStream.format('cloudFiles')\n  .option('cloudFiles.format','json')\n  .option('cloudFiles.schemaLocation','/ckpt/schema')\n  .load('abfss://container@acct.dfs.core.windows.net/landing/')\n  .writeStream.format('delta')\n  .option('checkpointLocation','/ckpt/bronze')\n  .trigger(availableNow=True)\n  .toTable('bronze.events'))"
    },
    {
      q: "What is the rescued data column in Auto Loader?",
      type: "concept",
      a: "When incoming data doesn't match the expected schema (type mismatch, corrupt record), Auto Loader doesn't lose it \u2014 it stores the raw value in a special rescued data column (_rescued_data) as JSON.\n" +
         "• Enables later triage/quarantine instead of dropping bad records.\n" +
         "• Set via schemaHints/schemaLocation; default column name _rescued_data (configurable)."
    },
    {
      q: "File notification vs directory listing in Auto Loader?",
      type: "concept",
      a: "• Directory listing (default) \u2014 periodically lists the directory to find new files; simple, no extra Azure setup; cost grows with directory size.\n" +
         "• File notification \u2014 subscribes to cloud events (Azure Event Grid + Storage Queue) to be notified of new files; more scalable and cheaper for high-volume/very large directories.\n" +
         "Choose notification for scale; listing for simplicity/small volumes."
    },
    {
      q: "How do you integrate Kafka or Event Hubs with Databricks?",
      type: "concept",
      a: "Both expose a Kafka-compatible endpoint; use Spark's Kafka source.\n" +
         "• readStream.format('kafka').option('kafka.bootstrap.servers',...).option('subscribe','topic').\n" +
         "• For Event Hubs: use the Kafka API with Event Hubs connection string/SASL (or the native Event Hubs connector).\n" +
         "• Parse the value (JSON) with from_json, then write to Delta with a checkpoint.\n" +
         "• Deliver exactly-once by using Delta as the sink + checkpointing."
    },
    {
      q: "How do you deduplicate streaming data?",
      type: "concept",
      a: "Use dropDuplicates on the streaming DataFrame with an event-time key, combined with a watermark to bound state:\n" +
         "df.withWatermark('event_ts','10 minutes').dropDuplicates(['id']).\n" +
         "For unbounded/all-time dedupe, use MERGE into a Delta table (whenNotMatchedInsert) or foreachBatch with a merge on the unique key."
    },
    {
      q: "What trigger modes does Structured Streaming support?",
      type: "concept",
      a: "• Default/processingTime \u2014 micro-batches at intervals (e.g., '1 minute', '5 seconds').\n" +
         "• availableNow \u2014 processes all available data as fast as possible then stops (efficient incremental batch; great for Auto Loader/COPY-style loads).\n" +
         "• once (deprecated) \u2014 similar to availableNow.\n" +
         "• continuous \u2014 experimental low-latency (~ms) mode with limited operators.\n" +
         "availableNow is commonly used for cost-efficient incremental ingestion."
    },
    {
      q: "What is foreachBatch and when do you use it?",
      type: "concept",
      a: "foreachBatch lets you run arbitrary logic on each micro-batch as a batch DataFrame.\n" +
         "• Use it when the sink isn't natively supported or you need MERGE/upsert, multiple sinks, or custom dedupe.\n" +
         "• It handles idempotency per batch (use batchId + MERGE).\n" +
         "Signature: df.writeStream.foreachBatch(lambda df, batch_id: ...)."
    },
    {
      q: "How do you achieve exactly-once processing in streaming?",
      type: "concept",
      a: "• Use checkpointing to track offsets/state.\n" +
         "• Use an idempotent/transactional sink \u2014 Delta Lake writes are atomic, so replay is safe.\n" +
         "• With foreachBatch, key the MERGE on a stable business key so re-processing the same batch doesn't duplicate.\n" +
         "• Combine replayable source (Kafka offsets) + atomic sink = exactly-once end-to-end."
    },
    {
      q: "What is DLT / Lakeflow Declarative Pipelines and what are its key features?",
      type: "concept",
      a: "Delta Live Tables (now Databricks Lakeflow Declarative Pipelines) is a declarative framework for building reliable pipelines with dependency management.\n" +
         "• Define @dlt.table functions; the engine builds the dependency graph automatically (no manual orchestration).\n" +
         "• Streaming tables (incremental) + materialized views (refreshed).\n" +
         "• Data quality EXPECTATIONS: expect, expect_or_drop, expect_or_fail.\n" +
         "• Auto retries, automatic lineage, schema evolution, and managed compute.\n" +
         "DLT evolved into Declarative Pipelines \u2014 same concepts, broader scope.",
      code: "import dlt\n@dlt.table\n@dlt.expect_or_drop('valid_amount', 'amount > 0')\ndef silver_orders():\n    return dlt.read_stream('bronze_orders').filter('status != \"CANCELLED\"')"
    },
    {
      q: "Difference between Delta Live Tables and Databricks Declarative Pipelines?",
      type: "concept",
      a: "• Delta Live Tables is the older name; Declarative Pipelines is the newer, broader framework from Databricks.\n" +
         "• Same core concepts (declarative @dlt tables, expectations, auto dependency, streaming tables + materialized views) with additional capabilities and general data-pipeline scope beyond ETL.\n" +
         "Simple answer: DLT has evolved into Databricks Declarative Pipelines."
    },
    {
      q: "How do you design a real-time analytics pipeline (Event Hubs \u2192 Databricks \u2192 Delta \u2192 BI)?",
      type: "scenario",
      a: "• Ingest: Spark Structured Streaming reads from Event Hubs/Kafka (Kafka API).\n" +
         "• Parse (from_json), apply watermarks + dedupe, transform aggregations.\n" +
         "• Write to a Bronze streaming Delta table (or DLT streaming table) with checkpointing for exactly-once.\n" +
         "• Silver cleans/enriches; Gold aggregates for serving.\n" +
         "• Serve to Power BI/Tableau via SQL Warehouse, or to Real-Time Analytics for millisecond dashboards.\n" +
         "• Monitor lag, throughput, and checkpoint health; tune triggers/partitions."
    },
    {
      q: "What are the modes for writing streaming data?",
      type: "concept",
      a: "• Append \u2014 only new rows (default; Delta table grows).\n" +
         "• Update \u2014 emit updated aggregation results (no full recompute).\n" +
         "• Complete \u2014 rewrite the entire result table each batch (for aggregations without watermark).\n" +
         "Most Delta streaming sinks use append; aggregations use update/complete."
    }
  ]
});
