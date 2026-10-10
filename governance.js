window.QB = window.QB || [];
QB.push({
  id: "governance",
  name: "Unity Catalog, Governance & Security",
  icon: "\uD83D\uDD10",
  roles: ["ade", "architect"],
  questions: [
    {
      q: "What is Unity Catalog and what problem does it solve?",
      type: "concept",
      a: "Unity Catalog is Databricks' unified governance layer for data and AI assets across all workspaces in an account.\n" +
         "• Centralized access control (ACLs on catalogs, schemas, tables, columns, rows).\n" +
         "• 3-level namespace: catalog.schema.table.\n" +
         "• Built-in data lineage (column-level), audit logs, and Delta Sharing.\n" +
         "• External locations + storage credentials for governed cloud storage access.\n" +
         "• Row-level security (row filters) and column masking.\n" +
         "Solves per-workspace (Hive metastore) silos with account-level governance and fine-grained security."
    },
    {
      q: "Explain the Unity Catalog object hierarchy.",
      type: "concept",
      a: "Metastore (top-level, one per region) \u2192 Catalog \u2192 Schema (database) \u2192 objects (tables, views, volumes, functions, models).\n" +
         "• Metastore stores metadata + permissions for all workspaces attached to it.\n" +
         "• Permissions flow downward (grant at a higher level, inherits lower).\n" +
         "• Example: SELECT * FROM prod_catalog.sales_schema.orders.\n" +
         "Related objects: storage credentials, external locations, shares."
    },
    {
      q: "Managed vs external tables AND managed vs external volumes in Unity Catalog?",
      type: "concept",
      a: "• Managed table \u2014 UC manages data lifecycle/location; DROP deletes metadata AND data.\n" +
         "• External table \u2014 references a location you own (external location); DROP removes only metadata, files remain.\n" +
         "• Managed volume \u2014 UC-managed storage for non-tabular files (images, PDFs, CSV); deleted with the volume.\n" +
         "• External volume \u2014 references existing cloud storage you manage (via external location); files remain after dropping the volume.\n" +
         "Volumes are like managed/external tables but for files."
    },
    {
      q: "What are storage credentials and external locations in Unity Catalog?",
      type: "concept",
      a: "• Storage credential \u2014 a UC securable that holds cloud auth (managed identity / service principal / access connector) to access storage; no secrets in code.\n" +
         "• External location \u2014 combines a cloud storage URL (abfss://...) with a storage credential, granting governed access to that path.\n" +
         "• Access Connector \u2014 an Azure resource providing managed-identity access from Databricks to ADLS.\n" +
         "Together they let UC govern who can read/write specific storage paths."
    },
    {
      q: "How do you implement row-level and column-level security in Databricks?",
      type: "concept",
      a: "• Column-level: dynamic column masks \u2014 a UDF masks sensitive values based on IS_ACCOUNT_GROUP_MEMBER / current_user(): ALTER TABLE t ALTER COLUMN ssn SET MASK mask_fn.\n" +
         "• Row-level: row filter functions \u2014 ALTER TABLE t SET ROW FILTER filter_fn ON (region); returns only rows the user is allowed to see.\n" +
         "• Unity Catalog enforces them centrally; also table/column GRANT/REVOKE.\n" +
         "Legacy: table ACLs / AAD credential passthrough (being replaced by UC)."
    },
    {
      q: "Difference between Unity Catalog and Hive Metastore?",
      type: "concept",
      a: "• Scope: Hive = per-workspace; UC = account-level across all workspaces.\n" +
         "• Namespace: Hive 2-level (db.table); UC 3-level (catalog.schema.table).\n" +
         "• Governance: Hive basic ACLs, no column/row security; UC fine-grained (row filters, column masks), lineage, audit logs.\n" +
         "• Sharing: Hive none; UC Delta Sharing built-in.\n" +
         "• UC is the current standard; Hive is legacy/being replaced."
    },
    {
      q: "What is Delta Sharing?",
      type: "concept",
      a: "Delta Sharing is an open protocol to securely share data (and AI assets) across organizations/workspaces/business units WITHOUT copying data.\n" +
         "• A provider shares a subset of tables/volumes; recipients read via the share (Databricks-to-Databricks or open recipients like Power BI/pandas).\n" +
         "• Governance and audit are maintained; recipients only see what's shared.\n" +
         "Scenario: 3 business units with separate workspaces share data through Delta Sharing instead of duplicating into each workspace."
    },
    {
      q: "SCENARIO: Three business units have separate workspaces. How do you share data between them?",
      type: "scenario",
      a: "Option A \u2014 Unity Catalog + Delta Sharing: publish selected tables as a share from the provider workspace; grant recipients access; they read without copying. Centralized governance/audit.\n" +
         "Option B \u2014 one UC metastore per region attached to all workspaces with catalogs per BU and GRANTs (cross-workspace access within the same account).\n" +
         "Choose Delta Sharing for cross-org/cross-cloud or strict isolation; UC catalogs when all workspaces share an account/metastore."
    },
    {
      q: "How do you secure access to ADLS from Databricks?",
      type: "concept",
      a: "• Authentication: Service Principal (app registration) + Storage Blob Data Contributor, or Managed Identity / Access Connector (no secrets), or account key (avoid).\n" +
         "• Secrets: store SPN keys in Azure Key Vault + Databricks secret scope; read via dbutils.secrets.\n" +
         "• RBAC: Storage Blob Data Reader/Contributor/Owner.\n" +
         "• POSIX ACLs (ADLS Gen2 HNS): file/folder-level rwx with masks + defaults.\n" +
         "• Unity Catalog: external locations + storage credentials + GRANTs (preferred).\n" +
         "• Network: private endpoints/service endpoints/firewall.\n" +
         "• Encryption: SSE at rest (Microsoft-managed or CMK), TLS in transit.\n" +
         "• Avoid mounting with keys; prefer UC or OAuth."
    },
    {
      q: "What are service principals, managed identities, and secrets in Databricks?",
      type: "concept",
      a: "• Service principal \u2014 a non-human identity (app registration) used by pipelines/CI-CD for automated auth.\n" +
         "• Managed identity \u2014 Azure-managed identity so resources authenticate without storing credentials (via Access Connector to ADLS).\n" +
         "• Secrets \u2014 Databricks secret scopes (backed by Azure Key Vault) store passwords/tokens/keys; accessed with dbutils.secrets.get().\n" +
         "Best practice: least privilege, no secrets in code, rotate regularly."
    },
    {
      q: "How do you audit who accessed what data in Databricks?",
      type: "concept",
      a: "• Unity Catalog audit logs capture user actions (logins, cluster/job runs, permission changes, data access) and column-level lineage.\n" +
         "• Enable diagnostic logging to a storage account / Log Analytics; query with KQL.\n" +
         "• Lineage shows how data flows between tables/columns/notebooks/jobs.\n" +
         "• Combine with Azure Monitor for alerting on suspicious access."
    },
    {
      q: "What is the difference between RBAC and ACL in the lakehouse?",
      type: "concept",
      a: "• RBAC (Role-Based Access Control) \u2014 permissions granted to roles/principals at the control/service level (e.g., Azure roles on storage, workspace admin roles).\n" +
         "• ACLs (Access Control Lists) \u2014 fine-grained permissions on specific objects (tables, columns, files/folders via POSIX ACLs).\n" +
         "Both are used together: RBAC for broad access, UC ACLs/GRANTs for fine-grained data-level control."
    },
    {
      q: "What is least-privilege design and how do you apply it?",
      type: "concept",
      a: "Grant users/apps only the minimum permissions needed.\n" +
         "• Use groups (not individual users) and grant at the highest sensible level.\n" +
         "• Use read-only roles where possible; scope service principals to specific storage/workspaces.\n" +
         "• Apply column masks/row filters for sensitive data.\n" +
         "• Separate prod/dev credentials; audit and rotate regularly."
    }
  ]
});
