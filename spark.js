window.QB = window.QB || [];
QB.push({
  id: "spark",
  name: "Apache Spark & Databricks Fundamentals",
  icon: "\u26A1",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "Explain the Apache Spark architecture.",
      type: "concept",
      a: "Spark uses a master-worker (driver-executor) model:\n" +
         "• Driver \u2014 runs the user code, builds the DAG (logical plan), creates SparkContext, schedules tasks, collects results.\n" +
         "• Cluster Manager \u2014 allocates resources (Standalone / YARN / Kubernetes / Mesos). In Databricks it's managed.\n" +
         "• Executors \u2014 JVM processes on worker nodes that run tasks and cache partitions in memory/disk.\n" +
         "• Task \u2014 smallest unit of work (one per partition).\n" +
         "• Stage \u2014 set of tasks with no shuffle boundary. Job \u2014 triggered by an action.\n" +
         "Flow: action \u2192 Driver \u2192 DAG Scheduler splits into stages at shuffles \u2192 Task Scheduler sends tasks to executors \u2192 results returned."
    },
    {
      q: "Explain DAG, Jobs, Stages, and Tasks in Spark.",
      type: "concept",
      a: "• DAG (Directed Acyclic Graph) \u2014 the logical execution plan of transformations; built lazily.\n" +
         "• Job \u2014 created when an action is called; a DAG broken at shuffle boundaries.\n" +
         "• Stage \u2014 a set of transformations that can run without a shuffle (narrow pipeline); shuffle starts a new stage.\n" +
         "• Task \u2014 one task per partition per stage; executes on an executor core.\n" +
         "So: 1 action \u2192 1+ Jobs \u2192 each Job has Stages \u2192 each Stage has Tasks (= number of partitions)."
    },
    {
      q: "What is the difference between narrow and wide transformations?",
      type: "concept",
      a: "• Narrow \u2014 each input partition contributes to exactly one output partition; no shuffle. Examples: map, filter, select, withColumn, union, mapPartitions. Data stays local \u2192 fast.\n" +
         "• Wide \u2014 data from many input partitions must be reorganized into output partitions via a shuffle. Examples: groupBy/aggregate, join (non-broadcast), distinct, repartition, orderBy, sort.\n" +
         "Rule: wide transformations cause shuffles \u2192 new stages \u2192 usually the performance bottleneck."
    },
    {
      q: "What is lazy evaluation in Spark and why is it useful?",
      type: "concept",
      a: "Spark does not execute transformations immediately; it records them and builds a logical plan (DAG). Execution happens only when an action is called.\n" +
         "• Transformations (lazy): filter, select, join, groupBy, withColumn.\n" +
         "• Actions (trigger execution): count, collect, show, write, save, take.\n" +
         "Benefits: the Catalyst optimizer can optimize the whole plan (predicate pushdown, column pruning, join reordering), fewer passes over data, and avoids unnecessary computation."
    },
    {
      q: "On what basis does Spark create stages?",
      type: "concept",
      a: "Stages are split at shuffle boundaries.\n" +
         "• A stage = a sequence of narrow transformations that can be pipelined together without moving data across the network.\n" +
         "• A new stage begins whenever a wide transformation (shuffle) is needed \u2014 e.g., groupBy, sort, non-broadcast join, repartition.\n" +
         "• DAG Scheduler creates stages; each stage is submitted as a set of tasks (one per partition) to the Task Scheduler.\n" +
         "Minimizing shuffles (fewer stages) is a key optimization goal."
    },
    {
      q: "What is the Catalyst optimizer and how does it optimize queries?",
      type: "concept",
      a: "Catalyst is Spark's rule-based query optimizer for SQL/DataFrames. Phases:\n" +
         "1. Analysis \u2014 resolves columns/tables and validates schema.\n" +
         "2. Logical optimization \u2014 rule-based: predicate pushdown, constant folding, column pruning, filter reordering, join reorder.\n" +
         "3. Physical planning \u2014 chooses join strategy (broadcast/sort-merge) and operators based on cost/stats.\n" +
         "4. Code generation \u2014 Whole-Stage CodeGen / Tungsten emits optimized JVM bytecode.\n" +
         "Inspect with df.explain(True) or explain('formatted'). Using built-in functions (not UDFs) lets Catalyst optimize them."
    },
    {
      q: "What is Tungsten in Spark?",
      type: "concept",
      a: "Tungsten is Spark's execution engine focused on CPU/memory efficiency:\n" +
         "• Off-heap binary memory management (reduces GC overhead).\n" +
         "• Cache-aware computation and explicit memory layout.\n" +
         "• Whole-Stage Code Generation \u2014 fuses operators into a single optimized function, avoiding virtual function calls.\n" +
         "Result: much faster execution and lower memory usage than the original Spark engine."
    },
    {
      q: "What is the difference between RDD, DataFrame, and Dataset?",
      type: "concept",
      a: "• RDD \u2014 low-level, untyped distributed collection; full control, no schema; no Catalyst optimization; slowest but most flexible.\n" +
         "• DataFrame \u2014 distributed table with named columns + schema; runs through Catalyst + Tungsten; best for structured data (Python/Scala/Java/R).\n" +
         "• Dataset \u2014 typed JVM objects (Scala/Java only); compile-time type safety + Catalyst; Python has no Dataset (uses DataFrame).\n" +
         "Prefer DataFrames/Datasets over RDDs for performance; use RDDs only for fine-grained control."
    },
    {
      q: "What are the main Databricks cluster types?",
      type: "concept",
      a: "• All-Purpose (interactive) \u2014 development, notebooks, ad-hoc; shared; billed while running.\n" +
         "• Job (automated) \u2014 created for a job, terminates on completion; cheapest for production pipelines.\n" +
         "• High Concurrency \u2014 many concurrent users/BI; user isolation; SQL/Python/R (not Scala).\n" +
         "• Single Node \u2014 driver only, no workers; dev/testing/small data.\n" +
         "• SQL Warehouse \u2014 optimized for Databricks SQL/BI (Power BI, Tableau); serverless/pro/classic.\n" +
         "• Serverless \u2014 fully managed compute, no cluster config.\n" +
         "Best practice: Job clusters for production, All-Purpose for dev, SQL Warehouse for BI."
    },
    {
      q: "Difference between All-Purpose Cluster and Job Cluster?",
      type: "concept",
      a: "• All-Purpose: manually started, stays up (auto-terminate 30\u2013120 min), shared by multiple users/notebooks, warm, higher cost. For interactive development.\n" +
         "• Job: created automatically from job config, fresh environment each run, isolated, terminated after completion (no idle cost). For scheduled/production jobs.\n" +
         "Use Job clusters for all production pipelines to control cost and ensure clean, isolated runs."
    },
    {
      q: "SCENARIO: You have a single-node cluster with 16 cores. What issues might occur?",
      type: "scenario",
      a: "• No distributed processing \u2014 one machine is both driver and worker.\n" +
         "• Driver bottleneck \u2014 it coordinates AND executes, so it's overloaded.\n" +
         "• Memory pressure \u2014 large datasets/joins can exceed node memory (OOM/spill).\n" +
         "• CPU saturation \u2014 all tasks compete for the same 16 cores; long runtimes.\n" +
         "• No fault tolerance \u2014 if the node fails, the whole workload fails.\n" +
         "Suitable only for dev/testing/small data \u2014 not for production ETL."
    },
    {
      q: "What is the Databricks Runtime (DBR)?",
      type: "concept",
      a: "DBR is Databricks' optimized, curated software stack for clusters. It bundles:\n" +
         "• Apache Spark (specific version), Delta Lake, and performance optimizations (Photon).\n" +
         "• Language runtimes: Python, Scala, Java, R, SQL.\n" +
         "• Optimized libraries and security patches.\n" +
         "Variants: Standard, ML, GPU, Photon, and LTS (Long-Term Support). Prefer LTS in production for stability/longer support."
    },
    {
      q: "Difference between repartition and coalesce?",
      type: "concept",
      a: "• repartition(n) \u2014 full shuffle; can increase OR decrease partitions; even distribution; expensive. Use to fix skew or before heavy joins/aggregations.\n" +
         "• coalesce(n) \u2014 reduces partitions WITHOUT a full shuffle (merges local partitions); cheap; used after filtering to reduce small files. Cannot increase partitions.\n" +
         "• repartition(n, col) \u2014 hash-partition by column to co-locate join keys.\n" +
         "Example: df.repartition(200, 'customer_id'); df.coalesce(4)."
    },
    {
      q: "What is the default partition size and default number of shuffle partitions?",
      type: "concept",
      a: "• Target partition/file size in Spark/Delta \u2014 ~128 MB (block/file size).\n" +
         "• Default shuffle partitions \u2014 spark.sql.shuffle.partitions = 200.\n" +
         "• Default parallelism \u2014 equals the number of executor cores.\n" +
         "Tune shuffle partitions to data size (too few \u2192 huge tasks/OOM; too many \u2192 tiny tasks/overhead). AQE can coalesce partitions automatically at runtime."
    },
    {
      q: "Difference between cache() and persist()?",
      type: "concept",
      a: "• cache() \u2014 stores the DataFrame/RDD using MEMORY_AND_DISK storage level; lazy (materializes on first action).\n" +
         "• persist(level) \u2014 same but you choose the storage level: MEMORY_ONLY, MEMORY_AND_DISK, DISK_ONLY, MEMORY_AND_DISK_SER, etc.\n" +
         "Both are lazy transformations; trigger with an action (count/write). Use when a DataFrame is reused 2+ times (iterative ML, repeated joins).\n" +
         "Always unpersist() when done to free memory."
    },
    {
      q: "What is a broadcast join and when is it used?",
      type: "concept",
      a: "A broadcast join replicates a SMALL table to every executor so the large table doesn't need to be shuffled.\n" +
         "• Use when one side is small (< ~10 MB default autoBroadcastJoinThreshold, up to ~200 MB feasible).\n" +
         "• Eliminates the shuffle of the big table \u2192 big performance gain and also mitigates skew.\n" +
         "PySpark: large_df.join(broadcast(small_df), 'id'); SQL: /*+ BROADCAST(small) */.\n" +
         "Typical for joining a fact with a small lookup/dimension table."
    },
    {
      q: "What is data skew and how do you detect and fix it?",
      type: "concept",
      a: "Skew = uneven data distribution across partitions so a few tasks process far more data (stragglers).\n" +
         "Detect: Spark UI shows one/few tasks much longer, uneven shuffle read sizes, one executor overloaded while others idle.\n" +
         "Fix:\n" +
         "• Salting \u2014 add a random prefix/suffix to the skewed key to spread it.\n" +
         "• Enable AQE skew join (spark.sql.adaptive.skewJoin.enabled=true) \u2014 splits skewed partitions automatically.\n" +
         "• Broadcast join for the small side.\n" +
         "• Repartition on a better/more even key; filter early.\n" +
         "• Isolate and process the hot key separately.",
      code: "spark.conf.set('spark.sql.adaptive.enabled','true')\nspark.conf.set('spark.sql.adaptive.skewJoin.enabled','true')\n# Salting\ndf = df.withColumn('salt', (F.rand()*10).cast('int'))\ndf = df.withColumn('salted_key', F.concat(col('key'), F.lit('_'), col('salt')))"
    },
    {
      q: "What is bucketing and when would you use it?",
      type: "concept",
      a: "Bucketing pre-shuffles data into a fixed number of buckets by hash of a column, persisted with the table (e.g., bucketBy(50,'customer_id').saveAsTable(...)).\n" +
         "• Benefit: repeated joins/aggregations on the bucketed key avoid shuffles (sort-merge join becomes shuffle-free).\n" +
         "• Differs from partitioning: partitioning creates directories (low cardinality); bucketing creates fixed files (higher cardinality, even distribution).\n" +
         "Use for large, frequently joined tables on the same key. In Databricks, Liquid Clustering is now often preferred over manual bucketing/partitioning."
    },
    {
      q: "What is a shuffle and how do you reduce it?",
      type: "concept",
      a: "Shuffle = redistribution of data across executors (network + disk I/O) for wide transformations like join, groupBy, distinct, sort.\n" +
         "Reduce it by: broadcast joins for small tables, filtering/aggregating before joins, bucketing on join keys, using map-side partial aggregation (reduceByKey over groupByKey), avoiding unnecessary repartition/distinct, and enabling AQE.\n" +
         "Watch shuffle read/write metrics in the Spark UI \u2014 it's usually the top cost."
    },
    {
      q: "What is Adaptive Query Execution (AQE) and its benefits?",
      type: "concept",
      a: "AQE re-optimizes the physical plan at runtime using actual statistics gathered after each stage. Benefits:\n" +
         "• Dynamically coalesces shuffle partitions (reduces tiny tasks).\n" +
         "• Switches join strategies (e.g., sort-merge \u2192 broadcast) based on actual sizes.\n" +
         "• Detects and splits skewed partitions (skew join handling).\n" +
         "Enable: spark.sql.adaptive.enabled=true (plus skewJoin + coalescePartitions). Default on in Spark 3.x/Databricks runtime."
    },
    {
      q: "What is Photon?",
      type: "concept",
      a: "Photon is Databricks' vectorized C++ query engine. It replaces the JVM execution for many SQL/DataFrame operators with native, columnar, vectorized execution.\n" +
         "• Delivers ~3\u201310x speedups for SQL/scan/aggregation/join-heavy workloads.\n" +
         "• Drop-in: enable in cluster config; no code changes.\n" +
         "• Best for SQL and Delta workloads; some UDF-heavy or non-supported ops fall back to the JVM."
    },
    {
      q: "How do you use the Spark UI to troubleshoot performance?",
      type: "concept",
      a: "• Jobs/Stages tabs \u2014 find slow stages; check task durations and counts.\n" +
         "• Tasks \u2014 spot skew (one task far longer), spill to disk, retries.\n" +
         "• SQL/DataFrame tab \u2014 inspect the physical plan, exchanges (shuffles), and per-operator metrics.\n" +
         "• Storage tab \u2014 what's cached and its size.\n" +
         "• Executors tab \u2014 memory/GC, shuffle read/write, disk spill.\n" +
         "Use these to decide: broadcast, repartition, AQE, more partitions, or bigger cluster."
    },
    {
      q: "How do you decide the size of a Databricks cluster?",
      type: "concept",
      a: "Cluster sizing depends on data volume, number of files, transformation complexity, SLA, and concurrency \u2014 it can't be predicted, so iterate:\n" +
         "1. Start with a medium cluster (2\u20138 nodes) matching the workload class (F/DSv2 for ETL, DSv2 for ML, L for analytics).\n" +
         "2. Run end-to-end on representative data; measure CPU, memory, I/O, shuffle.\n" +
         "3. Remove bottlenecks: CPU-bound \u2192 add nodes/cores; network-bound \u2192 fewer bigger SSD machines; disk/spill-bound \u2192 more memory.\n" +
         "4. Repeat 3\u20134 times on increasing data sizes; prefer fewer big instances over many small (1 executor/machine) for batch ETL, enable autoscaling.\n" +
         "First guess: scale linearly from a small test (e.g., 5 nodes for 100 TB \u2248 50 nodes for 1 PB), then refine."
    },
    {
      q: "What are the key cluster configuration options in Databricks?",
      type: "concept",
      a: "• Cluster mode: Single Node / Standard / High Concurrency (or Serverless).\n" +
         "• Runtime version (prefer LTS, e.g., 15.4 LTS).\n" +
         "• Driver + worker VM types (workers can be sized independently).\n" +
         "• Worker count with autoscaling (min/max) or fixed.\n" +
         "• Photon on/off; instance pools for fast start.\n" +
         "• Auto-termination (idle timeout).\n" +
         "• Access mode / Unity Catalog mode (Single user, Shared, No isolation).\n" +
         "• Cluster policies, tags, init scripts, and Spark configs."
    },
    {
      q: "SCENARIO: A Databricks job that normally finishes quickly is now taking far longer. How do you investigate?",
      type: "scenario",
      a: "• Open the job run \u2192 Spark UI; find the slow stage and inspect task times.\n" +
         "• Check for data skew (one task much longer), shuffle size, and spill-to-disk in the Tasks/Executors tabs.\n" +
         "• Check input data volume/growth and partition count; look for small-file explosion.\n" +
         "• Check cluster health \u2014 resource contention (shared cluster), GC, executor loss, autoscaling lag.\n" +
         "• Compare the current physical plan vs a known-good run; check join strategy changes (broadcast vs sort-merge).\n" +
         "• Look for recently changed code (new joins/UDFs), source schema changes, or upstream backlog.\n" +
         "• Remedy: tune partitions, enable AQE/Photon, broadcast small tables, salt skewed keys, scale cluster, OPTIMIZE tables."
    },
    {
      q: "What is the difference between Spark SQL, DataFrame API, and RDD API?",
      type: "concept",
      a: "• RDD API \u2014 lowest level, no schema, no Catalyst; maximum control but least optimization.\n" +
         "• DataFrame API \u2014 structured, schema-aware, optimized by Catalyst/Tungsten; expressive transforms.\n" +
         "• Spark SQL \u2014 declarative SQL strings over the same engine (also Catalyst-optimized); easy for analysts and interop.\n" +
         "All compile to the same optimized plan; use DataFrames/SQL for day-to-day, RDDs only for niche low-level needs."
    },
    {
      q: "Why is PySpark used and how does it interface with the JVM?",
      type: "concept",
      a: "PySpark is Spark's Python API. Spark is written in Scala and runs on the JVM; PySpark uses Py4J to let Python code call JVM objects.\n" +
         "• Benefits: Python ecosystem (pandas, ML libs), ease of use, distributed processing across a cluster.\n" +
         "• Note: Python UDFs incur serialization overhead (row-by-row), so prefer Spark built-in functions / pandas UDFs (vectorized) for performance.\n" +
         "• Needs Java installed alongside Python and Spark for local development."
    }
  ]
});
