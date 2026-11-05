import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';

export async function getAuditLogs(params: {
  workspaceId: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}) {
  const { workspaceId, actorId, action, entityType, limit = 50, offset = 0 } = params;

  const conditions = [eq(schema.auditLog.workspaceId, workspaceId)];

  if (actorId) conditions.push(eq(schema.auditLog.actorId, actorId));
  if (action) conditions.push(eq(schema.auditLog.action, action));
  if (entityType) conditions.push(eq(schema.auditLog.entityType, entityType));

  const whereClause = and(...conditions);

  const [totalRes] = await db
    .select({ count: count() })
    .from(schema.auditLog)
    .where(whereClause);

  const rows = await db
    .select({
      id: schema.auditLog.id,
      timestamp: schema.auditLog.createdAt,
      action: schema.auditLog.action,
      actorId: schema.auditLog.actorId,
      actorEmail: schema.users.email,
      actorRole: schema.users.role,
      entityType: schema.auditLog.entityType,
      entityId: schema.auditLog.entityId,
      contentHash: schema.auditLog.contentHash,
      ruleSetId: schema.auditLog.ruleSetId,
      detail: schema.auditLog.detail,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.auditLog.actorId, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.auditLog.id))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: totalRes?.count ?? 0,
    limit,
    offset,
  };
}

export async function exportAuditCsv(workspaceId: string): Promise<string> {
  const rows = await db
    .select({
      id: schema.auditLog.id,
      timestamp: schema.auditLog.createdAt,
      action: schema.auditLog.action,
      actorEmail: schema.users.email,
      actorRole: schema.users.role,
      entityType: schema.auditLog.entityType,
      entityId: schema.auditLog.entityId,
      contentHash: schema.auditLog.contentHash,
      ruleSetId: schema.auditLog.ruleSetId,
      detail: schema.auditLog.detail,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.auditLog.actorId, schema.users.id))
    .where(eq(schema.auditLog.workspaceId, workspaceId))
    .orderBy(desc(schema.auditLog.id));

  const headers = [
    'id',
    'timestamp',
    'action',
    'actor_email',
    'actor_role',
    'entity_type',
    'entity_id',
    'content_hash',
    'rule_set_id',
    'detail',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.timestamp ? new Date(r.timestamp).toISOString() : '',
        escapeCsv(r.action),
        escapeCsv(r.actorEmail || 'system'),
        escapeCsv(r.actorRole || ''),
        escapeCsv(r.entityType || ''),
        escapeCsv(r.entityId || ''),
        escapeCsv(r.contentHash || ''),
        escapeCsv(r.ruleSetId || ''),
        escapeCsv(r.detail),
      ].join(',')
    );
  }

  return lines.join('\n');
}
