window.QB = window.QB || [];
QB.push({
  id: "sql",
  name: "SQL & Query Optimization",
  icon: "\uD83D\uDDC3\uFE0F",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is the difference between WHERE and HAVING?",
      type: "concept",
      a: "• WHERE filters rows BEFORE grouping/aggregation; cannot use aggregate functions.\n" +
         "• HAVING filters groups AFTER GROUP BY; can use aggregates.\n" +
         "• A query can have both: WHERE to reduce rows, then GROUP BY, then HAVING to filter groups.\n" +
         "Example: SELECT emp, SUM(sal) FROM t WHERE dept='IT' GROUP BY emp HAVING SUM(sal) > 5000."
    },
    {
      q: "Explain INNER, LEFT, RIGHT, FULL, CROSS, LEFT SEMI, and LEFT ANTI joins.",
      type: "concept",
      a: "• INNER \u2014 only matching rows from both tables.\n" +
         "• LEFT \u2014 all left rows + matches; unmatched right = NULL.\n" +
         "• RIGHT \u2014 all right rows + matches; unmatched left = NULL.\n" +
         "• FULL OUTER \u2014 all rows from both; NULLs where no match.\n" +
         "• CROSS \u2014 cartesian product (every combination).\n" +
         "• LEFT SEMI \u2014 left rows with a match in right (no right columns).\n" +
         "• LEFT ANTI \u2014 left rows with NO match in right.\n" +
         "LEFT JOIN A,B = RIGHT JOIN B,A."
    },
    {
      q: "CODING: Total revenue per month.",
      type: "coding",
      a: "Group by the formatted month and sum amounts.",
      code: "SELECT DATE_FORMAT(order_date,'yyyy-MM') AS year_month,\n       SUM(amount) AS total_revenue\nFROM orders\nGROUP BY DATE_FORMAT(order_date,'yyyy-MM')\nORDER BY year_month;"
    },
    {
      q: "CODING: Customers who ordered in both January AND February 2025.",
      type: "coding",
      a: "Group by customer and count distinct months; keep those with 2. INTERSECT is an alternative.",
      code: "SELECT customer_id\nFROM orders\nWHERE order_date BETWEEN '2025-01-01' AND '2025-02-28'\n  AND MONTH(order_date) IN (1,2)\nGROUP BY customer_id\nHAVING COUNT(DISTINCT MONTH(order_date)) = 2;\n\n-- Alternative\nSELECT customer_id FROM orders WHERE order_date >= '2025-01-01' AND order_date < '2025-02-01'\nINTERSECT\nSELECT customer_id FROM orders WHERE order_date >= '2025-02-01' AND order_date < '2025-03-01';"
    },
    {
      q: "CODING: Customers who ordered in 3 consecutive months.",
      type: "coding",
      a: "Use LAG to look back two months and compare the dates.",
      code: "WITH m AS (\n  SELECT customer_id, DATE_TRUNC('month', order_date) AS mth\n  FROM orders GROUP BY customer_id, DATE_TRUNC('month', order_date)\n),\nl AS (\n  SELECT customer_id, mth,\n         LAG(mth,1) OVER (PARTITION BY customer_id ORDER BY mth) AS prev1,\n         LAG(mth,2) OVER (PARTITION BY customer_id ORDER BY mth) AS prev2\n  FROM m\n)\nSELECT DISTINCT customer_id\nFROM l\nWHERE ADD_MONTHS(prev2,1) = prev1 AND ADD_MONTHS(prev1,1) = mth;"
    },
    {
      q: "CODING: Total order amount per customer (join + aggregation).",
      type: "coding",
      a: "Inner join customers to orders and sum.",
      code: "SELECT c.CustomerID, c.Name, SUM(o.Amount) AS TotalAmount\nFROM Customer c\nINNER JOIN Orders o ON c.CustomerID = o.CustomerID\nGROUP BY c.CustomerID, c.Name;"
    },
    {
      q: "CODING: Delete duplicate records keeping one row.",
      type: "coding",
      a: "Assign row numbers per duplicate key and delete rn>1 (or rebuild the table).",
      code: "WITH cte AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id,name,email_id,order_date ORDER BY customer_id) rn\n  FROM customer\n)\nDELETE FROM cte WHERE rn > 1;\n\n-- Delta-friendly rebuild\nCREATE OR REPLACE TABLE customer AS\nSELECT * FROM (\n  SELECT *, ROW_NUMBER() OVER (\n     PARTITION BY customer_id,name,email_id,order_date ORDER BY customer_id) rn\n  FROM customer) WHERE rn = 1;"
    },
    {
      q: "How would you optimize a slow SQL query?",
      type: "scenario",
      a: "• Read the execution plan (EXPLAIN) to find the bottleneck (scans, shuffles, spills).\n" +
         "• Filter as early as possible; avoid SELECT * (select needed columns only).\n" +
         "• Ensure joins/filters use indexed or partition columns.\n" +
         "• Avoid functions on indexed columns in WHERE (e.g., YEAR(date)=2025) \u2014 use range predicates for partition pruning.\n" +
         "• Use proper join types and broadcast hints for small tables.\n" +
         "• Replace correlated subqueries with joins; use CTEs to avoid repeated work.\n" +
         "• Update statistics; partition large tables; avoid unnecessary DISTINCT.\n" +
         "• Compare plans/times before and after."
    },
    {
      q: "How does partition pruning work and how do you enable it?",
      type: "concept",
      a: "Partition pruning means the engine reads only the partitions matching the filter, skipping the rest.\n" +
         "• Filter directly on the partition column with range/equality predicates (WHERE order_date BETWEEN '2025-01-01' AND '2025-12-31').\n" +
         "• Avoid wrapping the partition column in functions (WHERE YEAR(order_date)=2025 disables pruning).\n" +
         "• In Spark/Delta, this avoids reading irrelevant files/folders \u2192 big speedup."
    },
    {
      q: "What is the difference between UNION and UNION ALL?",
      type: "concept",
      a: "• UNION \u2014 removes duplicate rows (implies a distinct/sort \u2192 more expensive).\n" +
         "• UNION ALL \u2014 keeps all rows including duplicates (faster).\n" +
         "Use UNION ALL by default and de-duplicate only when needed."
    },
    {
      q: "What is a CTE and when do you use it?",
      type: "concept",
      a: "A Common Table Expression (WITH clause) is a named temporary result set that makes complex queries readable and avoids repeating subqueries. It's not materialized by default in many engines (each reference may re-execute), but improves clarity and can be chained. Use for multi-step logic: dedupe \u2192 join \u2192 aggregate."
    },
    {
      q: "CODING: Find the manager of each employee using a self join (SQL).",
      type: "coding",
      a: "Self join employee to itself; LEFT join so top-level employees (null manager) are kept.",
      code: "SELECT e.empid AS employee_id, e.empname AS employee_name,\n       e.mgrid AS manager_id, m.empname AS manager_name\nFROM employee e\nLEFT JOIN employee m ON e.mgrid = m.empid;"
    },
    {
      q: "What are aggregate functions and how do they differ from window functions?",
      type: "concept",
      a: "• Aggregates (SUM/COUNT/AVG/MIN/MAX) collapse multiple rows into one row per group \u2014 you lose individual rows.\n" +
         "• Window functions compute across a set of rows but KEEP every row (add a computed column).\n" +
         "Aggregate example: SUM(sal) per dept. Window example: SUM(sal) OVER (PARTITION BY dept) alongside each row."
    },
    {
      q: "How do you implement SCD Type 1 and Type 2 in SQL?",
      type: "coding",
      a: "Type 1 overwrites; Type 2 expires the old row and inserts a new version with effective dates + current flag.",
      code: "-- SCD Type 1 (overwrite)\nMERGE INTO dim_customer t USING staging s ON t.customer_id=s.customer_id\nWHEN MATCHED THEN UPDATE SET t.name=s.name, t.email=s.email, t.updated_at=CURRENT_TIMESTAMP\nWHEN NOT MATCHED THEN INSERT (customer_id,name,email,updated_at) VALUES (s.customer_id,s.name,s.email,CURRENT_TIMESTAMP);\n\n-- SCD Type 2 (expire + insert)\nMERGE INTO dim_customer t USING staging s\nON t.customer_id = s.customer_id AND t.is_current = 1\nWHEN MATCHED AND (t.name<>s.name OR t.city<>s.city) THEN\n  UPDATE SET t.end_date = CURRENT_DATE - INTERVAL 1 DAY, t.is_current = 0;\n\nINSERT INTO dim_customer (customer_id,name,city,start_date,end_date,is_current)\nSELECT s.customer_id, s.name, s.city, CURRENT_DATE, NULL, 1\nFROM staging s\nWHERE NOT EXISTS (SELECT 1 FROM dim_customer d WHERE d.customer_id=s.customer_id AND d.is_current=1);"
    },
    {
      q: "How would you find the Nth highest salary?",
      type: "concept",
      a: "Use DENSE_RANK (handles ties) or a correlated subquery.\n" +
         "• Window: SELECT * FROM (SELECT *, DENSE_RANK() OVER (ORDER BY salary DESC) rk FROM emp) WHERE rk = N.\n" +
         "• Subquery: SELECT MAX(salary) FROM emp WHERE salary < (SELECT MAX(salary) FROM emp) [repeat for Nth].\n" +
         "DENSE_RANK is cleaner and scales to any N."
    }
  ]
});
