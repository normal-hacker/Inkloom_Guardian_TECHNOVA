CREATE OR REPLACE FUNCTION prevent_update_or_delete()
RETURNS trigger AS $$
BEGIN
  -- Allow review_runs to finalize from running to complete/error, then freeze forever
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'review_runs' AND OLD.status = 'running' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Table % is append-only: UPDATE and DELETE operations are forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER no_update_delete_content_versions
BEFORE UPDATE OR DELETE ON "content_versions"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();
--> statement-breakpoint
CREATE TRIGGER no_update_delete_review_runs
BEFORE UPDATE OR DELETE ON "review_runs"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();
--> statement-breakpoint
CREATE TRIGGER no_update_delete_finding_decisions
BEFORE UPDATE OR DELETE ON "finding_decisions"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();
--> statement-breakpoint
CREATE TRIGGER no_update_delete_approvals
BEFORE UPDATE OR DELETE ON "approvals"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();
--> statement-breakpoint
CREATE TRIGGER no_update_delete_audit_log
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();

