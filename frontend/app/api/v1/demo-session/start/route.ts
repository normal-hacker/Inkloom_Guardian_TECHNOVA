import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_EXPIRY_SECONDS } from '@/lib/auth/session';
import { SEED_WORKSPACE_ID, SEED_USERS } from '@/lib/db/seed';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { runCheckPipeline } from '@/lib/services/review';

export async function POST(req: NextRequest) {
  try {
    const demoSessionId = crypto.randomUUID();
    const contentItemId = crypto.randomUUID();

    // Create session token for Asha (Creator)
    const token = createSessionToken({
      sub: SEED_USERS.ASHA,
      wid: SEED_WORKSPACE_ID,
      email: 'asha@brightway.example',
      displayName: 'Asha (Creator)',
      role: 'creator',
      isDemo: true,
    });

    // Provision real content item and run initial checks if database is available
    try {
      const initialText =
        'Our solar panels are the best on the market today and we guarantee you will have zero electric bills ever again. Homeowners can enjoy up to 40% savings on their electric bill with Brightway solar cells.';

      await db.insert(schema.contentItems).values({
        id: contentItemId,
        workspaceId: SEED_WORKSPACE_ID,
        title: 'Brightway Solar Campaign Draft (Guided Demo)',
        contentType: 'ad',
        status: 'draft',
        ownerId: SEED_USERS.ASHA,
      });

      const versionId = crypto.randomUUID();
      await db.insert(schema.contentVersions).values({
        id: versionId,
        contentItemId,
        versionNo: 1,
        textBody: initialText,
        contentHash: crypto.createHash('sha256').update(initialText).digest('hex'),
        sourceKind: 'paste',
        createdBy: SEED_USERS.ASHA,
      });

      await db
        .update(schema.contentItems)
        .set({ currentVersionId: versionId })
        .where(eq(schema.contentItems.id, contentItemId));

      await runCheckPipeline({
        contentItemId,
        versionId,
        userId: SEED_USERS.ASHA,
        workspaceId: SEED_WORKSPACE_ID,
        enableAi: false,
      });
    } catch (dbErr) {
      console.warn('[demo-session/start] DB provisioning notice:', dbErr);
    }

    const res = NextResponse.json({
      success: true,
      demoSessionId,
      contentItemId,
      redirectUrl: `/demo/guided?session=${demoSessionId}&item=${contentItemId}`,
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });

    res.cookies.set({
      name: 'inkloom_has_session',
      value: '1',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_SECONDS,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'demo_session_creation_failed', message: error?.message || 'Failed to start demo session' } },
      { status: 500 }
    );
  }
}
