window.QB = window.QB || [];
QB.push({
  id: "pyspark",
  name: "PySpark & Coding",
  icon: "\uD83D\uDC0D",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "Explain the difference between transformations and actions in PySpark.",
      type: "concept",
      a: "• Transformations \u2014 lazy; build a new DataFrame/plan. Narrow: select, filter, withColumn, union. Wide (shuffle): groupBy, join, distinct, repartition, orderBy.\n" +
         "• Actions \u2014 eager; trigger execution and return results/driver data or write output: count, show, collect, take, write, save, first.\n" +
         "Only actions trigger computation; the physical plan is optimized by Catalyst before execution."
    },
    {
      q: "What is the difference between Python UDFs and Spark built-in functions?",
      type: "concept",
      a: "• Built-in functions (pyspark.sql.functions) run natively in the JVM \u2192 Catalyst can optimize them, and they work with Tungsten/Photon.\n" +
         "• Python UDFs run row-by-row, serialize data between JVM and Python \u2192 large overhead, can't be optimized by Catalyst, slower.\n" +
         "Prefer built-ins; when Python logic is unavoidable use pandas UDFs (vectorized, Arrow-based) which are much faster.\n" +
         "Register: @udf(StringType()) or F.udf(f, StringType())."
    },
    {
      q: "Explain window functions in PySpark/SQL with an example.",
      type: "concept",
      a: "Window functions compute values across a set of related rows without collapsing them.\n" +
         "• Ranking: row_number(), rank(), dense_rank().\n" +
         "• Analytic: lead()/lag() for previous/next rows, running totals with sum() over unbounded window.\n" +
         "Spec = partitionBy + orderBy (+ rowsBetween).\n" +
         "Use case: find the latest/max record per group, top-N per category, running totals, month-over-month change.",
      code: "from pyspark.sql import Window\nfrom pyspark.sql.functions import row_number, col\nw = Window.partitionBy('dept').orderBy(col('salary').desc())\ndf.withColumn('rn', row_number().over(w)).filter('rn = 1').show()"
    },
    {
      q: "Difference between ROW_NUMBER, RANK, and DENSE_RANK?",
      type: "concept",
      a: "• ROW_NUMBER \u2014 unique sequential number; ties broken arbitrarily; no gaps.\n" +
         "• RANK \u2014 same rank for ties, then SKIPS numbers (1,2,2,4).\n" +
         "• DENSE_RANK \u2014 same rank for ties, NO gaps (1,2,2,3).\n" +
         "For 'top N per group' or finding the Nth salary, DENSE_RANK is usually the correct choice; ROW_NUMBER when you need exactly one row."
    },
    {
      q: "CODING: Find the highest salary per designation (PySpark).",
      type: "coding",
      a: "Use a window ranked by salary descending per designation and filter rank=1. Two common approaches below.",
      code: "from pyspark.sql import Window\nfrom pyspark.sql.functions import col, rank, max as spark_max\n\n# Method 1: window\nw = Window.partitionBy('designation').orderBy(col('salary').desc())\ndf.withColumn('rnk', rank().over(w)).filter(col('rnk')==1).show()\n\n# Method 2: self-join with max\nmx = df.groupBy('designation').agg(spark_max('salary').alias('m'))\ndf.join(mx, (df.designation==mx.designation) & (df.salary==mx.m)).select(df['*']).show()"
    },
    {
      q: "CODING: Find the second highest salary by department.",
      type: "coding",
      a: "dense_rank() = 2 per department. Subquery/self-join alternative also works.",
      code: "from pyspark.sql import Window\nfrom pyspark.sql.functions import dense_rank, col\nw = Window.partitionBy('dept').orderBy(col('salary').desc())\ndf.withColumn('rnk', dense_rank().over(w)).filter(col('rnk')==2).select('dept','name','salary').show()"
    },
    {
      q: "CODING: Find patients undergoing more than 2 different treatment types.",
      type: "coding",
      a: "Group by patient id, count DISTINCT treatments, filter > 2.",
      code: "from pyspark.sql.functions import countDistinct, col\nresult = (df.groupBy('pid')\n            .agg(countDistinct('treatment').alias('treatment_count'))\n            .filter(col('treatment_count') > 2)\n            .select('pid'))\nresult.show()"
    },
    {
      q: "CODING: Get the manager of each employee (self join, handle null manager).",
      type: "coding",
      a: "Alias the employee table twice; LEFT join employee to its manager so top-level employees (mgrid null) still appear.",
      code: "emp = df.alias('emp')\nmgr = df.alias('mgr')\nresult = (emp.join(mgr, col('emp.mgrid')==col('mgr.empid'), 'left')\n            .select(col('emp.empid').alias('employee_id'),\n                    col('emp.empname').alias('employee_name'),\n                    col('emp.mgrid').alias('manager_id'),\n                    col('mgr.empname').alias('manager_name')))\nresult.show()"
    },
    {
      q: "CODING: Split a comma-separated column into multiple rows.",
      type: "coding",
      a: "split() the string into an array, then explode() it into rows.",
      code: "from pyspark.sql.functions import split, explode, col\n# Input Col3 = 'G,Y,U' -> rows G, Y, U\nresult = df.withColumn('Col3', explode(split(col('Col3'), ',')))\nresult.show()\n\n# SQL\n# SELECT Col1, Col2, exploded_val AS Col3\n# FROM t LATERAL VIEW EXPLODE(SPLIT(Col3, ',')) tmp AS exploded_val"
    },
    {
      q: "CODING: Remove duplicate records (keep the latest).",
      type: "coding",
      a: "Use ROW_NUMBER over the business key ordered by a recency column (or a dedupe key set) and keep rn=1.",
      code: "from pyspark.sql import Window\nfrom pyspark.sql.functions import row_number, col\nw = Window.partitionBy('customer_id','name','email_id','order_date').orderBy(col('load_ts').desc())\ndf2 = df.withColumn('rn', row_number().over(w)).filter('rn = 1').drop('rn')\ndf2.show()\n\n# Simplest form when rows are identical:\n# df.dropDuplicates(['customer_id','order_date'])"
    },
    {
      q: "CODING: Calculate the total purchase amount for each customer.",
      type: "coding",
      a: "Group by customer and sum the purchase amount.",
      code: "from pyspark.sql.functions import sum as _sum, col\ndf.groupBy('customer_id').agg(_sum('purchase_amount').alias('total_amount')).orderBy(col('total_amount').desc()).show()"
    },
    {
      q: "CODING: Process a 100M-row CSV efficiently.",
      type: "coding",
      a: "Key points: define schema explicitly (avoid inferSchema), use Parquet/Delta, filter early, tune shuffle partitions + AQE, coalesce output.",
      code: "from pyspark.sql.functions import col, to_timestamp, sum as _sum\nfrom pyspark.sql.types import StructType, StructField, StringType, DoubleType\n\nspark = (SparkSession.builder.appName('LargeCSV')\n         .config('spark.sql.adaptive.enabled','true')\n         .config('spark.sql.shuffle.partitions','400').getOrCreate())\n\nschema = StructType([StructField('transaction_id',StringType(),True),\n                     StructField('customer_id',StringType(),True),\n                     StructField('transaction_date',StringType(),True),\n                     StructField('amount',DoubleType(),True),\n                     StructField('category',StringType(),True)])\n\ndf = (spark.read.option('header','true').option('mode','DROPMALFORMED')\n      .schema(schema).csv('/data/large_transactions.csv'))\ndf = df.dropna(subset=['transaction_id','customer_id','amount'])\ndf = df.withColumn('transaction_date', to_timestamp('transaction_date','yyyy-MM-dd HH:mm:ss'))\nagg = df.groupBy('category').agg(_sum('amount').alias('total_amount')).orderBy(col('total_amount').desc())\nagg.coalesce(1).write.option('header','true').mode('overwrite').csv('/output/revenue_by_category')"
    },
    {
      q: "CODING: Convert a Parquet file/folder into a Delta table.",
      type: "coding",
      a: "Read Parquet and write as Delta. Use CONVERT TO DELTA (SQL) to convert in place.",
      code: "# PySpark\ndf = spark.read.format('parquet').load('abfss://container@acct.dfs.core.windows.net/raw/')\ndf.write.format('delta').mode('overwrite').saveAsTable('bronze.raw_table')\n\n# In-place conversion (SQL)\n# CONVERT TO DELTA parquet.`abfss://container@acct.dfs.core.windows.net/raw/`;"
    },
    {
      q: "CODING: Read from Azure SQL via JDBC with an incremental predicate.",
      type: "coding",
      a: "Use spark.read.jdbc with a predicates list (pushed down to the source) and write to Delta with MERGE.",
      code: "jdbc = 'jdbc:sqlserver://srv.database.windows.net:1433;database=db'\nprops = {'user': dbutils.secrets.get('kv','sql-user'),\n         'password': dbutils.secrets.get('kv','sql-pwd'),\n         'driver': 'com.microsoft.sqlserver.jdbc.SQLServerDriver'}\nlast_wm = spark.sql(\"SELECT MAX(last_load_ts) FROM ctrl.watermark WHERE table_name='Customers'\").first()[0]\ndf = spark.read.jdbc(jdbc, 'dbo.Customers',\n        predicates=[f\"ModifiedDate > '{last_wm}'\"], properties=props)\ndf.createOrReplaceTempView('incr')\nspark.sql('''MERGE INTO silver.customers t USING incr s ON t.customer_id=s.customer_id\n             WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *''')"
    },
    {
      q: "CODING: Compute a running total (cumulative sum) per group.",
      type: "coding",
      a: "Window with partitionBy group and orderBy date, cumulating from unbounded preceding to current row.",
      code: "from pyspark.sql import Window\nfrom pyspark.sql.functions import sum as _sum, col\nw = Window.partitionBy('customer_id').orderBy('order_date').rowsBetween(Window.unboundedPreceding, Window.currentRow)\ndf.withColumn('running_total', _sum('amount').over(w)).show()"
    },
    {
      q: "How do you handle NULLs in PySpark?",
      type: "concept",
      a: "• Drop: df.dropna(); df.dropna(subset=['id','name']); df.dropna(how='all').\n" +
         "• Fill: df.fillna(0); df.fillna({'salary':0,'dept':'N/A'}); fill with mean/median.\n" +
         "• Conditional: withColumn('x', when(col('x').isNull(), lit(0)).otherwise(col('x'))).\n" +
         "• Forward fill: last('col', ignorenulls=True) over a window.\n" +
         "• Filter: df.filter(col('id').isNotNull()).\n" +
         "• coalesce(col1, col2) to pick the first non-null."
    },
    {
      q: "How do you read and flatten nested JSON / structs and arrays?",
      type: "concept",
      a: "• Access struct fields: df.select('col.field') or col('col')['field'].\n" +
         "• Explode arrays: explode(col('arr')) (one row per element) or explode_outer (keeps nulls).\n" +
         "• Flatten structs: select col('address.*') to promote nested fields.\n" +
         "• explode map: explode(map_col) \u2192 key/value rows.\n" +
         "• Define schema for nested reads, or let Auto Loader infer; use from_json() for JSON strings."
    },
    {
      q: "When do you use left anti join and left semi join?",
      type: "concept",
      a: "• LEFT ANTI \u2014 returns LEFT rows with NO match in the right table (like NOT EXISTS). Use for finding orphans/unmatched records. how='left_anti'.\n" +
         "• LEFT SEMI \u2014 returns LEFT rows that DO have a match in the right (no right columns returned). how='left_semi'. Use as an efficient EXISTS.\n" +
         "Both avoid duplicate rows from the right table (unlike a normal join).",
      code: "unmatched = orders.join(customers, 'customer_id', 'left_anti')\nexisting  = orders.join(customers, 'customer_id', 'left_semi')"
    },
    {
      q: "How do you pivot and unpivot data in PySpark?",
      type: "concept",
      a: "• Pivot: df.groupBy('dept').pivot('year').sum('salary') \u2014 rows \u2192 columns.\n" +
         "• Unpivot/stack: use stack() in SQL or create arrays/maps and explode, or use melt pattern:\n" +
         "  df.selectExpr(\"id\", \"stack(3,'A',A,'B',B,'C',C) as (key,value)\").\n" +
         "Common for turning wide reports into long format for aggregation."
    },
    {
      q: "What is the difference between union and unionByName?",
      type: "concept",
      a: "• union \u2014 combines DataFrames by POSITION; schemas must have the same column order/types or you get wrong/NULL results.\n" +
         "• unionByName \u2014 combines by column NAME; align columns correctly regardless of order; use allowMissingColumns=True to fill missing columns with null.\n" +
         "Prefer unionByName for safety when schemas may differ slightly."
    },
    {
      q: "How do you create a Spark session and read a DataFrame?",
      type: "coding",
      a: "Standard SparkSession pattern; in Databricks 'spark' already exists.",
      code: "from pyspark.sql import SparkSession\nspark = (SparkSession.builder.appName('App')\n         .config('spark.sql.adaptive.enabled','true').getOrCreate())\ndf = spark.read.format('parquet').option('header',True).load('/path')\ndf.printSchema(); df.show(5, truncate=False)"
    }
  ]
});
