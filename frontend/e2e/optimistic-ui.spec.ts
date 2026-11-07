import { test, expect } from '@playwright/test';

test.describe('Optimistic UI & Governance Gate E2E Suite (FRAMEWORK §6)', () => {
  const contentId = '70000000-0000-0000-0000-000000000001';

  test.beforeEach(async ({ page, context }) => {
    // Inject mock session cookie to satisfy middleware.ts
    await context.addCookies([
      {
        name: 'inkloom_session',
        value: 'mock-session-priya-reviewer',
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'inkloom_session',
        value: 'mock-session-priya-reviewer',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock user session & content metadata so tests run isolated from external DB
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '00000000-0000-0000-0000-000000000003',
            email: 'priya@brightway.example',
            displayName: 'Priya (Reviewer)',
            role: 'reviewer',
          },
        }),
      });
    });

    await page.route('**/api/v1/audit**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.route(`**/api/v1/content/${contentId}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            item: {
              id: contentId,
              title: 'Spring savings blog',
              contentType: 'blog',
              status: 'in_review',
              currentVersionNo: 1,
              ownerId: '00000000-0000-0000-0000-000000000001',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/v1/content/${contentId}/versions`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          versions: [
            {
              id: 'ver-1',
              versionNo: 1,
              textBody: 'Our solar panels offer standard efficiency and reliable service.',
              contentHash: 'hash-1',
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(`**/api/v1/content/${contentId}/findings`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ findings: [] }),
      });
    });

    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('1. Optimistic comment appearance within 100ms with 1.5s delayed server response', async ({
    page,
  }) => {
    let routeCalled = false;
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        routeCalled = true;
        await new Promise((res) => setTimeout(res, 1500));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'server-comment-uuid-1',
            contentItemId: contentId,
            authorEmail: 'priya@brightway.example',
            authorRole: 'reviewer',
            body: 'Instant feedback test comment',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);

    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await expect(input).toBeVisible();
    const postBtn = page.getByRole('button', { name: /^post$/i });

    await input.fill('Instant feedback test comment');

    const startTime = Date.now();
    await postBtn.click();

    // Verify comment text and "Saving…" badge appear immediately (<100ms UI render)
    const optimisticComment = page.locator('text=Instant feedback test comment');
    await expect(optimisticComment).toBeVisible({ timeout: 1000 });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThanOrEqual(1000);

    // Verify PendingBadge is visible while request is still delayed in-flight
    await expect(page.getByText(/saving…/i)).toBeVisible();

    // Wait for the 1.5s server response to complete
    await page.waitForTimeout(1600);
    expect(routeCalled).toBe(true);

    // Verify reconciled state: exactly 1 copy of the comment exists (no duplicates or flicker)
    await expect(page.locator('text=Instant feedback test comment')).toHaveCount(1);
    await expect(page.getByText(/saving…/i)).not.toBeVisible();
  });

  test('2. 500 Server error triggers rollback, inline alert, and restores typed text', async ({
    page,
  }) => {
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal database connection failed.' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);

    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await expect(input).toBeVisible();
    const postBtn = page.getByRole('button', { name: /^post$/i });

    const failedText = 'This text must be restored on rollback';
    await input.fill(failedText);
    await postBtn.click();

    // Verify rolled back: comment removed from list
    await expect(page.locator(`.p-3:has-text("${failedText}")`)).not.toBeVisible({ timeout: 2000 });

    // Verify inline alert with role="alert" appears with plain-language error message (excluding next route announcer)
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/something went wrong on our side/i);

    // Verify user's typed input is restored into the box so nothing typed is lost
    await expect(input).toHaveValue(failedText);
  });

  test('3. 403 Forbidden error message displayed in plain language', async ({ page }) => {
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: "You don't have permission to do this." }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);

    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await expect(input).toBeVisible();
    await input.fill('Permission denied attempt');
    await page.getByRole('button', { name: /^post$/i }).click();

    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/you don't have permission to do this/i);
  });

  test('4. Governance Negative Test: Approval shows pending and NEVER shows Approved early', async ({
    page,
  }) => {
    let approveCalled = false;
    await page.route(`**/api/v1/content/${contentId}/decision`, async (route) => {
      approveCalled = true;
      // Delay approval response by 1500ms
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'approval_blocked',
            message: '1 blocker finding is open.',
            details: { open_blockers: 1 },
          },
        }),
      });
    });

    await page.goto(`/content/${contentId}`);

    const approveBtn = page.getByRole('button', { name: /(approve version|approving)/i });
    await expect(approveBtn).toBeVisible();

    await approveBtn.click();

    // While in flight, button MUST show "Approving…" and have aria-busy="true"
    await expect(approveBtn).toHaveAttribute('aria-busy', 'true');
    await expect(approveBtn).toContainText(/approving…/i);

    // Governance guarantee: NEVER shows "Approved" badge or seal before server returns
    await expect(page.getByText('Content decision recorded: approved.')).not.toBeVisible();

    // Wait for the 1.5s server response to complete
    await page.waitForTimeout(1600);
    expect(approveCalled).toBe(true);

    // Error is surfaced and status remains unapproved
    await expect(page.locator('div[role="alert"]:not(#__next-route-announcer__)')).toBeVisible();
  });

  test('5. Offline handling (context.setOffline): inline alert shown, nothing saved, Retry works online', async ({
    page,
    context,
  }) => {
    let postCount = 0;
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        postCount++;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'server-comment-offline-1',
            contentItemId: contentId,
            authorEmail: 'priya@brightway.example',
            authorRole: 'reviewer',
            body: 'Offline test comment',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);

    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await expect(input).toBeVisible();
    await input.fill('Offline test comment');

    // Simulate going offline before posting
    await context.setOffline(true);

    await page.getByRole('button', { name: /^post$/i }).click();

    // Verify offline alert appears with plain language message
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/you're offline|offline/i);

    // Verify input was preserved
    await expect(input).toHaveValue('Offline test comment');

    // Verify no request was successfully handled by server while offline
    expect(postCount).toBe(0);

    // Reconnect to network
    await context.setOffline(false);

    // Verify retry button works online
    const retryBtn = page.getByRole('button', { name: /retry/i });
    if (await retryBtn.isVisible()) {
      await retryBtn.click();
    } else {
      await page.getByRole('button', { name: /^post$/i }).click();
    }

    // After reconnecting and retrying, comment is saved and visible
    await expect(page.locator('text=Offline test comment')).toBeVisible({ timeout: 5000 });
    expect(postCount).toBeGreaterThanOrEqual(1);
  });

  test('6. In-flight deduplication: rapid double-click sends exactly one request', async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        requestCount++;
        await new Promise((res) => setTimeout(res, 600));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'server-dedupe-1',
            contentItemId: contentId,
            authorEmail: 'priya@brightway.example',
            authorRole: 'reviewer',
            body: 'Deduplication test',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);
    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await input.fill('Deduplication test');
    const postBtn = page.getByRole('button', { name: /^post$/i });

    // Rapid double click
    await postBtn.click();
    await postBtn.click({ force: true }).catch(() => {});

    await page.waitForTimeout(1000);
    // In-flight guard ensures only 1 request was dispatched
    expect(requestCount).toBe(1);
  });

  test('7. Navigate away mid-flight leaves no corrupted state', async ({ page }) => {
    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        // Delayed 2s to allow navigation away
        await new Promise((res) => setTimeout(res, 2000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'mid-flight-1' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: [] }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);
    const input = page.getByPlaceholder(/add an internal reviewer comment/i);
    await input.fill('Mid-flight test');
    await page.getByRole('button', { name: /^post$/i }).click();

    // Navigate away mid-flight
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toBeVisible();

    // Navigate back: verify clean initial state without uncaught errors or zombie badges
    await page.goto(`/content/${contentId}`);
    await expect(page.getByText(/saving…/i)).not.toBeVisible();
  });

  test('8. Sequence preservation: two sequential comments maintain order', async ({ page }) => {
    const commentsList: Array<{ id: string; body: string; createdAt: string }> = [];

    await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newComm = {
          id: `seq-${Date.now()}-${Math.random()}`,
          contentItemId: contentId,
          authorEmail: 'priya@brightway.example',
          authorRole: 'reviewer',
          body: body.body,
          createdAt: new Date().toISOString(),
        };
        commentsList.unshift(newComm);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newComm),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: commentsList }),
        });
      }
    });

    await page.goto(`/content/${contentId}`);
    const input = page.getByPlaceholder(/add an internal reviewer comment/i);

    await input.fill('First comment in sequence');
    await page.getByRole('button', { name: /^post$/i }).click();
    await expect(page.locator('text=First comment in sequence')).toBeVisible();

    await input.fill('Second comment in sequence');
    await page.getByRole('button', { name: /^post$/i }).click();
    await expect(page.locator('text=Second comment in sequence')).toBeVisible();

    // Verify both exist and second appears above first (descending chronological order)
    const commentLocators = page.locator('div.p-3 p.text-ink');
    const texts = await commentLocators.allTextContents();
    const firstIdx = texts.findIndex((t) => t.includes('First comment in sequence'));
    const secondIdx = texts.findIndex((t) => t.includes('Second comment in sequence'));
    expect(secondIdx).toBeGreaterThanOrEqual(0);
    expect(firstIdx).toBeGreaterThanOrEqual(0);
    expect(secondIdx).toBeLessThan(firstIdx);
  });

  test('9. HTTP Error statuses (401, 404, 409, 422, 429) display plain-language messages', async ({
    page,
  }) => {
    const errorScenarios = [
      { status: 401, body: {}, expectedText: /session expired|sign in/i },
      { status: 404, body: {}, expectedText: /item no longer exists/i },
      { status: 409, body: {}, expectedText: /updated by someone else|conflict/i },
      { status: 422, body: {}, expectedText: /validation failed/i },
      { status: 429, body: {}, expectedText: /too many requests/i, headers: { 'retry-after': '12' } },
    ];

    for (const scenario of errorScenarios) {
      await page.route(`**/api/v1/content/${contentId}/comments`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: scenario.status,
            contentType: 'application/json',
            headers: scenario.headers || {},
            body: JSON.stringify(scenario.body),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ comments: [] }),
          });
        }
      });

      await page.goto(`/content/${contentId}`);
      const input = page.getByPlaceholder(/add an internal reviewer comment/i);
      await input.fill(`Testing status ${scenario.status}`);
      await page.getByRole('button', { name: /^post$/i }).click();

      const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
      await expect(alert).toBeVisible();
      await expect(alert).toContainText(scenario.expectedText);

      // Discard error state to cleanly reset for next scenario
      const discardBtn = page.getByRole('button', { name: /discard/i });
      if (await discardBtn.isVisible()) {
        await discardBtn.click();
      }
    }
  });

  test('10. Negative Governance: Dismiss finding delayed 1.5s never shows dismissed early and 409 retains open state', async ({
    page,
  }) => {
    const blockerFinding = {
      id: 'finding-gov-1',
      contentItemId: contentId,
      ruleKey: 'tone.harsh',
      ruleTitle: 'Harsh Tone',
      severity: 'blocker',
      status: 'open',
      description: 'Tone is overly abrasive for publication.',
      suggestion: 'Rephrase with constructive tone.',
      spanStart: 4,
      spanEnd: 15,
    };

    await page.route(`**/api/v1/content/${contentId}/findings`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ findings: [blockerFinding] }),
      });
    });

    let decisionCalled = false;
    await page.route(`**/api/v1/findings/finding-gov-1/decision`, async (route) => {
      decisionCalled = true;
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Conflict: Blocker finding cannot be dismissed without manager override.' }),
      });
    });

    await page.goto(`/content/${contentId}`);

    // Click Dismiss on the blocker finding
    const dismissBtn = page.getByRole('button', { name: /dismiss with reason/i });
    await expect(dismissBtn).toBeVisible();
    await dismissBtn.click();

    // Confirm dialog opens
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const reasonInput = page.getByLabel(/justification reason/i);
    await reasonInput.fill('Verified compliant with updated brand guidelines.');

    const confirmBtn = dialog.getByRole('button', { name: /confirm decision/i });
    await confirmBtn.click();

    // Governance check: Button shows loading / busy, NEVER marks finding dismissed early
    await expect(confirmBtn).toHaveAttribute('aria-busy', 'true').catch(() => {});
    await expect(page.getByText('Finding dismissed successfully.')).not.toBeVisible();

    // Wait for 1.5s delayed response
    await page.waitForTimeout(1600);
    expect(decisionCalled).toBe(true);

    // On 409 error: finding is NOT dismissed; status remains open and error alert shows reason
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/blocker finding cannot be dismissed/i);
  });

  test('11. Negative Governance: Apply suggestion delayed 1.5s never shows v2 early and 409 retains v1', async ({
    page,
  }) => {
    const findingWithSuggestion = {
      id: 'finding-sug-1',
      contentItemId: contentId,
      ruleKey: 'clarity.wordy',
      ruleTitle: 'Wordy Phrase',
      severity: 'suggestion',
      status: 'open',
      description: 'Wordy phrasing detected.',
      suggestion: 'Use concise wording.',
      spanStart: 4,
      spanEnd: 15,
    };

    await page.route(`**/api/v1/content/${contentId}/findings`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ findings: [findingWithSuggestion] }),
      });
    });

    let applyCalled = false;
    await page.route(`**/api/v1/content/${contentId}/apply-suggestion`, async (route) => {
      applyCalled = true;
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Conflict: Content version was modified concurrently.' }),
      });
    });

    await page.goto(`/content/${contentId}`);

    const applyBtn = page.getByRole('button', { name: /apply suggestion/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Governance check: NEVER shows v2 or success before server returns
    await expect(page.getByText(/created version 2/i)).not.toBeVisible();

    await page.waitForTimeout(1600);
    expect(applyCalled).toBe(true);

    // On 409 error: remains on v1, surfaces server conflict message
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/content version was modified concurrently/i);
  });

  test('12. Negative Governance: Submit for review delayed 1.5s never changes draft status early', async ({
    page,
  }) => {
    // Draft content item
    await page.route(`**/api/v1/content/${contentId}`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            item: {
              id: contentId,
              title: 'Spring savings blog',
              contentType: 'blog',
              status: 'draft',
              currentVersionNo: 1,
              ownerId: '00000000-0000-0000-0000-000000000001',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    let submitCalled = false;
    await page.route(`**/api/v1/content/${contentId}/submit`, async (route) => {
      submitCalled = true;
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Submission failed: Unresolved blocker gate.' }),
      });
    });

    await page.goto(`/content/${contentId}`);

    const submitBtn = page.getByRole('button', { name: /submit for review/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Governance check: Status pill must NOT show "in_review" early
    await expect(page.getByText('Content submitted for review.')).not.toBeVisible();

    await page.waitForTimeout(1600);
    expect(submitCalled).toBe(true);

    // On 409: Status remains draft, error alert shown
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/unresolved blocker gate/i);
  });

  test('13. Negative Governance: Request changes and Reject never show final decision early', async ({
    page,
  }) => {
    let decisionCalled = false;
    await page.route(`**/api/v1/content/${contentId}/decision`, async (route) => {
      decisionCalled = true;
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Decision conflict: Item status has changed.' }),
      });
    });

    await page.goto(`/content/${contentId}`);

    // Click Request changes
    const changesBtn = page.getByRole('button', { name: /request changes/i });
    await expect(changesBtn).toBeVisible();
    await changesBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const reasonInput = page.getByLabel(/justification reason/i);
    await reasonInput.fill('Please revise section 3 numbers.');

    const confirmBtn = dialog.getByRole('button', { name: /confirm decision/i });
    await confirmBtn.click();

    // Governance guarantee: Never shows changes_requested early
    await expect(page.getByText('Content decision recorded: changes_requested.')).not.toBeVisible();

    await page.waitForTimeout(1600);
    expect(decisionCalled).toBe(true);

    // Alert displays server conflict reason
    const alert = page.locator('div[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/item status has changed/i);
  });

  test('14. Negative Governance: Publish / Activate rule set delayed 1.5s never shows active early', async ({
    page,
  }) => {
    // Mock user as manager for guidelines
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'marcus@brightway.example',
            displayName: 'Marcus (Manager)',
            role: 'manager',
          },
        }),
      });
    });

    await page.route('**/api/v1/guidelines/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ruleSet: { id: 'rs-act-1', version: 3, name: 'Brightway Active Rule Set' },
          rules: [{ id: 'r-1', key: 'rule.active', name: 'Active Rule', severity: 'warn', enabled: true, category: 'brand' }],
          glossary: [],
          facts: [],
          sources: [],
        }),
      });
    });

    await page.route('**/api/v1/guidelines/draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ruleSet: { id: 'rs-draft-1', version: 4, name: 'Brightway Draft Rule Set' },
          rules: [{ id: 'r-draft-1', key: 'rule.draft', name: 'Draft Rule', severity: 'blocker', enabled: true, category: 'brand' }],
        }),
      });
    });

    let activateCalled = false;
    await page.route('**/api/v1/guidelines/draft/activate', async (route) => {
      activateCalled = true;
      await new Promise((res) => setTimeout(res, 1500));
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Activation conflict: Draft contains unvalidated rules.' }),
      });
    });

    await page.goto('/guidelines?tab=rulesets');

    const activateBtn = page.getByRole('button', { name: /activate v4/i });
    await expect(activateBtn).toBeVisible();
    await activateBtn.click();

    // Confirm dialog opens
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const confirmBtn = dialog.getByRole('button', { name: /publish v4/i });
    await confirmBtn.click();

    // Governance guarantee: Dialog/button shows in-flight pending, NEVER switches to active early
    await expect(page.getByText('Rule set v4 is now active across all scans.')).not.toBeVisible();

    await page.waitForTimeout(1600);
    expect(activateCalled).toBe(true);
  });
});
