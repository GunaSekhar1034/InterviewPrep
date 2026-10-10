window.QB = window.QB || [];
QB.push({
  id: "modeling",
  name: "Data Modeling & SCD",
  icon: "\uD83D\uDCD0",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is a data model? Explain star vs snowflake vs galaxy schema.",
      type: "concept",
      a: "A data model defines how data is structured, related, and constrained.\n" +
         "• Star schema \u2014 one central FACT table surrounded by denormalized DIMENSION tables. Simple queries, fast aggregations, BI-friendly. Slight redundancy. Most common in data warehouses.\n" +
         "• Snowflake schema \u2014 dimensions normalized into sub-dimensions (less redundancy, more joins, slower).\n" +
         "• Galaxy / fact constellation \u2014 multiple fact tables sharing conformed dimensions.\n" +
         "Example: Fact_Sales(sale_id,date_key,product_key,customer_key,amount,qty) + Dim_Date, Dim_Product, Dim_Customer."
    },
    {
      q: "What are the SCD types (0,1,2,3,4,6)?",
      type: "concept",
      a: "• Type 0 \u2014 never update (static).\n" +
         "• Type 1 \u2014 overwrite the value; no history.\n" +
         "• Type 2 \u2014 add a new row on change; keep full history with start/end dates + current flag (most common in interviews).\n" +
         "• Type 3 \u2014 add a column to store current + previous value only (1 version back).\n" +
         "• Type 4 \u2014 keep current in main table, history in a separate history table.\n" +
         "• Type 6 \u2014 hybrid (1+2+3): full history rows PLUS a current flag and a current-value column."
    },
    {
      q: "Explain SCD Type 2 in detail and how you implement it.",
      type: "concept",
      a: "SCD Type 2 preserves history by inserting a NEW row whenever a tracked attribute changes; the natural key stays the same, a surrogate key identifies each version.\n" +
         "Columns: start_date, end_date, is_current (active flag), surrogate key.\n" +
         "Steps (Delta MERGE):\n" +
         "1. Expire the current row if tracked columns changed: set end_date = yesterday, is_current = 0.\n" +
         "2. Insert a new row for the change: start_date = today, end_date = NULL, is_current = 1.\n" +
         "3. Insert brand-new keys as-is.\n" +
         "Only one active row per business key at any time."
    },
    {
      q: "CODING: Implement SCD Type 2 in PySpark using a hash/flag approach.",
      type: "coding",
      a: "Read history + daily data, compute a hash of tracked columns, split into unchanged / updated / new, expire updates, insert new + updates, then union.",
      code: "from pyspark.sql.functions import col, sha2, concat_ws, lit, current_date, when\n\nTRACK = ['name','city']\n\ndef with_hash(df):\n    return df.withColumn('row_hash', sha2(concat_ws('||', *[col(c) for c in TRACK]), 256))\n\nhist = with_hash(history_df)         # has start/end/is_current\nincr = with_hash(daily_df)\n\ncur = hist.filter(col('is_current')==1)\n\n# rows that changed\nupdates = (incr.alias('s').join(cur.alias('t'), 'customer_id')\n           .filter(col('s.row_hash') != col('t.row_hash'))\n           .select('customer_id', *TRACK))\n\n# new keys\nnew = incr.join(cur, 'customer_id', 'left_anti').select('customer_id', *TRACK)\n\n# expire old current rows for changed keys\nexpired = cur.join(updates, 'customer_id').withColumn('end_date', current_date()).withColumn('is_current', lit(0))\nno_change = cur.join(updates, 'customer_id', 'left_anti')\n\n# new versions of changed + brand new\ninserts = (updates.unionByName(new)\n           .withColumn('start_date', current_date())\n           .withColumn('end_date', lit(None).cast('date'))\n           .withColumn('is_current', lit(1)))\n\nfinal = no_change.unionByName(expired).unionByName(inserts)\nfinal.write.format('delta').mode('overwrite').saveAsTable('dim_customer')"
    },
    {
      q: "What is incremental loading and what approaches exist?",
      type: "concept",
      a: "Incremental loading processes only new/changed data since the last load instead of a full reload.\n" +
         "• Timestamp/watermark \u2014 load where updated_at > last_run_timestamp; track a high-watermark in a control table.\n" +
         "• CDC \u2014 capture inserts/updates/deletes from the source (log-based, e.g., Debezium/Azure SQL CDC).\n" +
         "• Delta MERGE (UPSERT) \u2014 merge changes into the target.\n" +
         "Benefits: faster, cheaper, less source load. Watch for late-arriving data and reliable watermark updates."
    },
    {
      q: "Difference between full load and incremental load?",
      type: "concept",
      a: "• Full load \u2014 reload all data every run; simple; high source impact and long runtime; used for first load/small tables.\n" +
         "• Incremental \u2014 load only new/changed records; needs watermark/CDC; low source impact, fast; for large tables. Risk: must handle late-arriving data and deletes."
    },
    {
      q: "Difference between CDC and incremental load?",
      type: "concept",
      a: "• Incremental load \u2014 a loading strategy: only bring in new/changed data (often timestamp-based).\n" +
         "• CDC \u2014 a mechanism that captures row-level INSERT/UPDATE/DELETE from the source (log-based/trigger-based), so it can also capture deletes and provide before/after images.\n" +
         "CDC is a superset that feeds richer incremental loads; plain timestamp incremental usually can't detect deletes."
    },
    {
      q: "Which table loads first, fact or dimension? How do you relate them?",
      type: "concept",
      a: "Dimensions load FIRST \u2014 facts reference dimension surrogate keys, so the dimensions (and their keys) must exist before the fact rows can resolve those keys.\n" +
         "Relation: fact tables store foreign keys pointing to dimension surrogate keys; the join is fact.dim_key = dim.surrogate_key.\n" +
         "Often a 'late-arriving dimension' pattern is used: insert a placeholder (unknown) dimension row if a fact arrives before its dimension."
    },
    {
      q: "What is the difference between a surrogate key and a natural key?",
      type: "concept",
      a: "• Natural (business) key \u2014 a meaningful identifier from the source (e.g., customer_id, SSN).\n" +
         "• Surrogate key \u2014 a system-generated integer uniquely identifying each DIMENSION VERSION (used in SCD2 to distinguish versions).\n" +
         "Facts join to dimensions on surrogate keys; the natural key links versions of the same entity."
    },
    {
      q: "What are late-arriving dimensions/facts and how do you handle them?",
      type: "concept",
      a: "• Late-arriving dimension \u2014 a fact arrives referencing a dimension that hasn't loaded yet.\n" +
         "• Late-arriving fact \u2014 a fact arrives after its expected processing window.\n" +
         "Handling: insert a placeholder/inferred dimension row (unknown key) and update it when the real record arrives; or defer fact loading until the dimension exists; use watermark + reprocessing and idempotent MERGE so late facts are picked up on the next run."
    },
    {
      q: "What is a slowly changing dimension and why is it needed?",
      type: "concept",
      a: "SCD manages dimension attributes that change slowly over time (e.g., customer address, department). The type chosen controls how (and whether) history is preserved \u2014 so reports can reflect either the current value or the value as of a point in time."
    }
  ]
});
