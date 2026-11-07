// Auto-generated database bootstrap schema statements
import type pg from 'pg';
import { getPool, getDb } from './client';
import { seedDatabase, SEED_WORKSPACE_ID } from './seed';

export const SCHEMA_STATEMENTS: string[] = [
  "CREATE TABLE \"ai_calls\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"review_run_id\" uuid NOT NULL,\n\t\"provider\" text,\n\t\"model\" text,\n\t\"input_sha256\" varchar(64),\n\t\"input_tokens\" integer,\n\t\"output_tokens\" integer,\n\t\"latency_ms\" integer,\n\t\"status\" text,\n\t\"raw_output\" text,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
  "CREATE TABLE \"approvals\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"content_version_id\" uuid NOT NULL,\n\t\"review_run_id\" uuid NOT NULL,\n\t\"decision\" text NOT NULL,\n\t\"decided_by\" uuid NOT NULL,\n\t\"note\" text,\n\t\"content_hash\" varchar(64),\n\t\"rule_set_id\" uuid,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"chk_approvals_decision\" CHECK (\"approvals\".\"decision\" IN ('approved', 'changes_requested', 'rejected'))\n);",
  "CREATE TABLE \"approved_facts\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"key\" text,\n\t\"statement\" text NOT NULL,\n\t\"numeric_values\" jsonb,\n\t\"valid_from\" timestamp with time zone,\n\t\"valid_until\" timestamp with time zone,\n\t\"source_id\" uuid,\n\t\"search_vector\" text,\n\tCONSTRAINT \"uq_approved_facts_workspace_key\" UNIQUE(\"workspace_id\",\"key\")\n);",
  "CREATE TABLE \"audit_log\" (\n\t\"id\" bigserial PRIMARY KEY NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"actor_id\" uuid,\n\t\"action\" text NOT NULL,\n\t\"entity_type\" text,\n\t\"entity_id\" uuid,\n\t\"content_hash\" varchar(64),\n\t\"rule_set_id\" uuid,\n\t\"detail\" jsonb DEFAULT '{}'::jsonb NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\"prev_hash\" varchar(64),\n\t\"row_hash\" varchar(64)\n);",
  "CREATE TABLE \"comments\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"content_item_id\" uuid NOT NULL,\n\t\"content_version_id\" uuid,\n\t\"finding_id\" uuid,\n\t\"author_id\" uuid NOT NULL,\n\t\"body\" text NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
  "CREATE TABLE \"content_items\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"title\" text NOT NULL,\n\t\"content_type\" text NOT NULL,\n\t\"status\" text NOT NULL,\n\t\"owner_id\" uuid NOT NULL,\n\t\"current_version_id\" uuid,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\"updated_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"chk_content_items_content_type\" CHECK (\"content_items\".\"content_type\" IN ('blog', 'social', 'ad', 'web', 'press', 'other')),\n\tCONSTRAINT \"chk_content_items_status\" CHECK (\"content_items\".\"status\" IN ('draft', 'checked', 'in_review', 'changes_requested', 'approved', 'rejected', 'needs_review'))\n);",
  "CREATE TABLE \"content_versions\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"content_item_id\" uuid NOT NULL,\n\t\"version_no\" integer NOT NULL,\n\t\"text_body\" text NOT NULL,\n\t\"content_hash\" varchar(64) NOT NULL,\n\t\"source_kind\" text DEFAULT 'paste' NOT NULL,\n\t\"original_filename\" text,\n\t\"original_bytes\" text,\n\t\"image_alt_text\" text,\n\t\"change_note\" text,\n\t\"created_by\" uuid,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"uq_content_versions_item_version\" UNIQUE(\"content_item_id\",\"version_no\")\n);",
  "CREATE TABLE \"finding_decisions\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"finding_id\" uuid NOT NULL,\n\t\"decided_by\" uuid NOT NULL,\n\t\"decision\" text NOT NULL,\n\t\"reason\" text,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"chk_finding_decisions_decision\" CHECK (\"finding_decisions\".\"decision\" IN ('fixed', 'dismissed', 'overridden', 'reopened'))\n);",
  "CREATE TABLE \"findings\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"review_run_id\" uuid NOT NULL,\n\t\"origin\" text NOT NULL,\n\t\"category\" text NOT NULL,\n\t\"severity\" text NOT NULL,\n\t\"rule_id\" uuid,\n\t\"fact_id\" uuid,\n\t\"span_start\" integer NOT NULL,\n\t\"span_end\" integer NOT NULL,\n\t\"quote\" text NOT NULL,\n\t\"explanation\" text NOT NULL,\n\t\"suggestion\" text,\n\t\"confidence\" numeric(3, 2) DEFAULT '1.00' NOT NULL,\n\t\"status\" text DEFAULT 'open' NOT NULL,\n\tCONSTRAINT \"chk_findings_origin\" CHECK (\"findings\".\"origin\" IN ('rule', 'ai')),\n\tCONSTRAINT \"chk_findings_category\" CHECK (\"findings\".\"category\" IN ('tone', 'terminology', 'messaging', 'claim', 'fact', 'accessibility', 'visual', 'confidentiality')),\n\tCONSTRAINT \"chk_findings_severity\" CHECK (\"findings\".\"severity\" IN ('blocker', 'major', 'minor', 'info')),\n\tCONSTRAINT \"chk_findings_status\" CHECK (\"findings\".\"status\" IN ('open', 'fixed', 'dismissed', 'overridden')),\n\tCONSTRAINT \"chk_findings_grounding\" CHECK (\"findings\".\"rule_id\" IS NOT NULL OR \"findings\".\"fact_id\" IS NOT NULL)\n);",
  "CREATE TABLE \"glossary_terms\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"term\" text NOT NULL,\n\t\"kind\" text NOT NULL,\n\t\"preferred_alternative\" text,\n\t\"case_sensitive\" boolean DEFAULT false NOT NULL,\n\t\"note\" text,\n\t\"source_id\" uuid,\n\tCONSTRAINT \"chk_glossary_terms_kind\" CHECK (\"glossary_terms\".\"kind\" IN ('preferred', 'banned', 'discouraged'))\n);",
  "CREATE TABLE \"guideline_sources\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"title\" text NOT NULL,\n\t\"version_label\" text,\n\t\"kind\" text NOT NULL,\n\t\"body_markdown\" text,\n\t\"uploaded_by\" uuid,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"chk_guideline_sources_kind\" CHECK (\"guideline_sources\".\"kind\" IN ('guideline', 'terminology', 'fact_sheet', 'asset_policy'))\n);",
  "CREATE TABLE \"review_runs\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"content_version_id\" uuid NOT NULL,\n\t\"rule_set_id\" uuid NOT NULL,\n\t\"status\" text NOT NULL,\n\t\"ai_provider\" text,\n\t\"ai_model\" text,\n\t\"started_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\"finished_at\" timestamp with time zone,\n\t\"counts\" jsonb DEFAULT '{}'::jsonb NOT NULL,\n\t\"error_detail\" text,\n\tCONSTRAINT \"chk_review_runs_status\" CHECK (\"review_runs\".\"status\" IN ('running', 'complete', 'rules_only_ai_failed', 'error'))\n);",
  "CREATE TABLE \"rule_sets\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"version\" integer NOT NULL,\n\t\"status\" text NOT NULL,\n\t\"notes\" text,\n\t\"created_by\" uuid,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\t\"activated_at\" timestamp with time zone,\n\tCONSTRAINT \"uq_rule_sets_workspace_version\" UNIQUE(\"workspace_id\",\"version\"),\n\tCONSTRAINT \"chk_rule_sets_status\" CHECK (\"rule_sets\".\"status\" IN ('draft', 'active', 'archived'))\n);",
  "CREATE TABLE \"rules\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"rule_set_id\" uuid NOT NULL,\n\t\"key\" text NOT NULL,\n\t\"category\" text NOT NULL,\n\t\"severity\" text NOT NULL,\n\t\"title\" text NOT NULL,\n\t\"definition\" jsonb NOT NULL,\n\t\"explanation\" text NOT NULL,\n\t\"suggestion_hint\" text,\n\t\"source_id\" uuid,\n\t\"source_section\" text,\n\t\"enabled\" boolean DEFAULT true NOT NULL,\n\tCONSTRAINT \"uq_rules_rule_set_key\" UNIQUE(\"rule_set_id\",\"key\"),\n\tCONSTRAINT \"chk_rules_category\" CHECK (\"rules\".\"category\" IN ('tone', 'terminology', 'messaging', 'claim', 'fact', 'accessibility', 'visual', 'confidentiality')),\n\tCONSTRAINT \"chk_rules_severity\" CHECK (\"rules\".\"severity\" IN ('blocker', 'major', 'minor', 'info'))\n);",
  "CREATE TABLE \"users\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"workspace_id\" uuid NOT NULL,\n\t\"email\" text NOT NULL,\n\t\"display_name\" text NOT NULL,\n\t\"password_hash\" text,\n\t\"role\" text NOT NULL,\n\t\"is_demo\" boolean DEFAULT false NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL,\n\tCONSTRAINT \"users_email_unique\" UNIQUE(\"email\"),\n\tCONSTRAINT \"chk_users_role\" CHECK (\"users\".\"role\" IN ('creator', 'reviewer', 'manager'))\n);",
  "CREATE TABLE \"workspaces\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"name\" text NOT NULL,\n\t\"confidential_terms\" text[] DEFAULT '{}'::text[] NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
  "ALTER TABLE \"ai_calls\" ADD CONSTRAINT \"ai_calls_review_run_id_review_runs_id_fk\" FOREIGN KEY (\"review_run_id\") REFERENCES \"public\".\"review_runs\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"approvals\" ADD CONSTRAINT \"approvals_content_version_id_content_versions_id_fk\" FOREIGN KEY (\"content_version_id\") REFERENCES \"public\".\"content_versions\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"approvals\" ADD CONSTRAINT \"approvals_review_run_id_review_runs_id_fk\" FOREIGN KEY (\"review_run_id\") REFERENCES \"public\".\"review_runs\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"approvals\" ADD CONSTRAINT \"approvals_decided_by_users_id_fk\" FOREIGN KEY (\"decided_by\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"approvals\" ADD CONSTRAINT \"approvals_rule_set_id_rule_sets_id_fk\" FOREIGN KEY (\"rule_set_id\") REFERENCES \"public\".\"rule_sets\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"approved_facts\" ADD CONSTRAINT \"approved_facts_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"approved_facts\" ADD CONSTRAINT \"approved_facts_source_id_guideline_sources_id_fk\" FOREIGN KEY (\"source_id\") REFERENCES \"public\".\"guideline_sources\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"audit_log\" ADD CONSTRAINT \"audit_log_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"audit_log\" ADD CONSTRAINT \"audit_log_actor_id_users_id_fk\" FOREIGN KEY (\"actor_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"audit_log\" ADD CONSTRAINT \"audit_log_rule_set_id_rule_sets_id_fk\" FOREIGN KEY (\"rule_set_id\") REFERENCES \"public\".\"rule_sets\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"comments\" ADD CONSTRAINT \"comments_content_item_id_content_items_id_fk\" FOREIGN KEY (\"content_item_id\") REFERENCES \"public\".\"content_items\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"comments\" ADD CONSTRAINT \"comments_content_version_id_content_versions_id_fk\" FOREIGN KEY (\"content_version_id\") REFERENCES \"public\".\"content_versions\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"comments\" ADD CONSTRAINT \"comments_finding_id_findings_id_fk\" FOREIGN KEY (\"finding_id\") REFERENCES \"public\".\"findings\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"comments\" ADD CONSTRAINT \"comments_author_id_users_id_fk\" FOREIGN KEY (\"author_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"content_items\" ADD CONSTRAINT \"content_items_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"content_items\" ADD CONSTRAINT \"content_items_owner_id_users_id_fk\" FOREIGN KEY (\"owner_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"content_versions\" ADD CONSTRAINT \"content_versions_content_item_id_content_items_id_fk\" FOREIGN KEY (\"content_item_id\") REFERENCES \"public\".\"content_items\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"content_versions\" ADD CONSTRAINT \"content_versions_created_by_users_id_fk\" FOREIGN KEY (\"created_by\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"finding_decisions\" ADD CONSTRAINT \"finding_decisions_finding_id_findings_id_fk\" FOREIGN KEY (\"finding_id\") REFERENCES \"public\".\"findings\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"finding_decisions\" ADD CONSTRAINT \"finding_decisions_decided_by_users_id_fk\" FOREIGN KEY (\"decided_by\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"findings\" ADD CONSTRAINT \"findings_review_run_id_review_runs_id_fk\" FOREIGN KEY (\"review_run_id\") REFERENCES \"public\".\"review_runs\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"findings\" ADD CONSTRAINT \"findings_rule_id_rules_id_fk\" FOREIGN KEY (\"rule_id\") REFERENCES \"public\".\"rules\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"findings\" ADD CONSTRAINT \"findings_fact_id_approved_facts_id_fk\" FOREIGN KEY (\"fact_id\") REFERENCES \"public\".\"approved_facts\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"glossary_terms\" ADD CONSTRAINT \"glossary_terms_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"glossary_terms\" ADD CONSTRAINT \"glossary_terms_source_id_guideline_sources_id_fk\" FOREIGN KEY (\"source_id\") REFERENCES \"public\".\"guideline_sources\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"guideline_sources\" ADD CONSTRAINT \"guideline_sources_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"guideline_sources\" ADD CONSTRAINT \"guideline_sources_uploaded_by_users_id_fk\" FOREIGN KEY (\"uploaded_by\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"review_runs\" ADD CONSTRAINT \"review_runs_content_version_id_content_versions_id_fk\" FOREIGN KEY (\"content_version_id\") REFERENCES \"public\".\"content_versions\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"review_runs\" ADD CONSTRAINT \"review_runs_rule_set_id_rule_sets_id_fk\" FOREIGN KEY (\"rule_set_id\") REFERENCES \"public\".\"rule_sets\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"rule_sets\" ADD CONSTRAINT \"rule_sets_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"rule_sets\" ADD CONSTRAINT \"rule_sets_created_by_users_id_fk\" FOREIGN KEY (\"created_by\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"rules\" ADD CONSTRAINT \"rules_rule_set_id_rule_sets_id_fk\" FOREIGN KEY (\"rule_set_id\") REFERENCES \"public\".\"rule_sets\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "ALTER TABLE \"rules\" ADD CONSTRAINT \"rules_source_id_guideline_sources_id_fk\" FOREIGN KEY (\"source_id\") REFERENCES \"public\".\"guideline_sources\"(\"id\") ON DELETE no action ON UPDATE no action;",
  "ALTER TABLE \"users\" ADD CONSTRAINT \"users_workspace_id_workspaces_id_fk\" FOREIGN KEY (\"workspace_id\") REFERENCES \"public\".\"workspaces\"(\"id\") ON DELETE cascade ON UPDATE no action;",
  "CREATE UNIQUE INDEX \"idx_rule_sets_active_workspace\" ON \"rule_sets\" USING btree (\"workspace_id\") WHERE \"rule_sets\".\"status\" = 'active';",
  "CREATE OR REPLACE FUNCTION prevent_update_or_delete()\nRETURNS trigger AS $$\nBEGIN\n  -- Allow review_runs to finalize from running to complete/error, then freeze forever\n  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'review_runs' AND OLD.status = 'running' THEN\n    RETURN NEW;\n  END IF;\n  RAISE EXCEPTION 'Table % is append-only: UPDATE and DELETE operations are forbidden.', TG_TABLE_NAME;\nEND;\n$$ LANGUAGE plpgsql;",
  "CREATE TRIGGER no_update_delete_content_versions\nBEFORE UPDATE OR DELETE ON \"content_versions\"\nFOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();",
  "CREATE TRIGGER no_update_delete_review_runs\nBEFORE UPDATE OR DELETE ON \"review_runs\"\nFOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();",
  "CREATE TRIGGER no_update_delete_finding_decisions\nBEFORE UPDATE OR DELETE ON \"finding_decisions\"\nFOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();",
  "CREATE TRIGGER no_update_delete_approvals\nBEFORE UPDATE OR DELETE ON \"approvals\"\nFOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();",
  "CREATE TRIGGER no_update_delete_audit_log\nBEFORE UPDATE OR DELETE ON \"audit_log\"\nFOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();",
  "CREATE TABLE \"idempotency_keys\" (\n\t\"id\" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,\n\t\"user_id\" uuid NOT NULL,\n\t\"key\" text NOT NULL,\n\t\"endpoint\" text NOT NULL,\n\t\"response_status\" integer NOT NULL,\n\t\"response_body\" jsonb NOT NULL,\n\t\"created_at\" timestamp with time zone DEFAULT now() NOT NULL\n);",
  "CREATE UNIQUE INDEX \"idx_idempotency_user_key\" ON \"idempotency_keys\" (\"user_id\", \"key\");",
  "ALTER TABLE \"idempotency_keys\" ADD CONSTRAINT \"idempotency_keys_user_id_users_id_fk\" FOREIGN KEY (\"user_id\") REFERENCES \"public\".\"users\"(\"id\") ON DELETE cascade ON UPDATE no action;"
];

declare global {
  // eslint-disable-next-line no-var
  var __inkloomDbInitialized: boolean | undefined;
}

let initPromise: Promise<{ initialized: boolean; seeded: boolean; message: string }> | null = null;

export async function ensureDatabaseInitialized(customPool?: pg.Pool): Promise<{
  initialized: boolean;
  seeded: boolean;
  message: string;
}> {
  if (globalThis.__inkloomDbInitialized) {
    return { initialized: true, seeded: true, message: 'Already initialized in-memory' };
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = customPool || getPool();

    // 1. Check if core tables exist
    let hasTables = false;
    try {
      const checkRes = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_items' LIMIT 1;"
      );
      hasTables = (checkRes.rows?.length ?? 0) > 0;
    } catch (checkErr: any) {
      console.warn('[DB Init] Check query failed:', checkErr.message);
    }

    let tablesCreated = false;
    if (!hasTables) {
      console.log('[DB Init] Tables missing in database. Running schema creation...');
      for (const rawStatement of SCHEMA_STATEMENTS) {
        const statement = rawStatement.trim();
        if (!statement) continue;
        try {
          // If it's a trigger creation, drop if exists first
          const triggerMatch = statement.match(/CREATE TRIGGERs+(w+)s+BEFORE.*ONs+"(w+)"/i);
          if (triggerMatch) {
            const [, trigName, tblName] = triggerMatch;
            await pool.query(`DROP TRIGGER IF EXISTS ${trigName} ON "${tblName}";`);
          }
          await pool.query(statement);
        } catch (err: any) {
          const isIgnorable =
            err.code === '42710' || // duplicate_object
            err.code === '42P07' || // duplicate_table
            err.message?.includes('already exists');
          if (!isIgnorable) {
            console.warn('[DB Init] Warning executing statement:', err.message);
          }
        }
      }
      tablesCreated = true;
      console.log('[DB Init] Schema creation complete.');
    }

    // 2. Check if seed workspace exists
    let seedRan = false;
    try {
      const wsCheck = await pool.query(
        "SELECT id FROM workspaces WHERE id = $1 LIMIT 1;",
        [SEED_WORKSPACE_ID]
      );
      if ((wsCheck.rows?.length ?? 0) === 0) {
        console.log('[DB Init] Default workspace missing. Running seed...');
        await seedDatabase(getDb());
        seedRan = true;
        console.log('[DB Init] Seed complete.');
      }
    } catch (seedErr: any) {
      console.warn('[DB Init] Seed check/run warning:', seedErr.message);
      // Attempt seed anyway if table was just created
      if (tablesCreated) {
        try {
          await seedDatabase(getDb());
          seedRan = true;
        } catch (e: any) {
          console.error('[DB Init] Seed fallback error:', e.message);
        }
      }
    }

    globalThis.__inkloomDbInitialized = true;
    return {
      initialized: true,
      seeded: hasTables ? seedRan : true,
      message: tablesCreated ? 'Tables created and seeded' : 'Database ready',
    };
  })().finally(() => {
    initPromise = null;
  });

  return initPromise;
}
