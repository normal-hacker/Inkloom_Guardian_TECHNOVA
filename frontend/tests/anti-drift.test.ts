import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
// @ts-expect-error script has no types declaration
import { checkRoutes } from '../scripts/check-routes.mjs';
// @ts-expect-error script has no types declaration
import { checkTokens } from '../scripts/check-tokens.mjs';
// @ts-expect-error script has no types declaration
import { checkTypes } from '../scripts/check-types.mjs';

describe('Anti-Drift Scripts Suite (FRAMEWORK §5)', () => {
  describe('check-routes', () => {
    it('passes when done routes match actual app pages', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-pass-'));
      const sitemap = path.join(tempDir, 'SITEMAP.md');
      const appDir = path.join(tempDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });

      // Create test page
      fs.writeFileSync(path.join(appDir, 'page.tsx'), 'export default function Page() {}');

      // Create test sitemap with / marked done and /other marked todo
      fs.writeFileSync(
        sitemap,
        `| # | Route | Purpose | Key content | Data | Status |\n| P1 | \`/\` | Landing | Hero | none | done |\n| P2 | \`/other\` | Other | Test | none | todo |\n`
      );

      const res = checkRoutes({ rootDir: tempDir, sitemapPath: sitemap, appDir });
      expect(res.success).toBe(true);
      expect(res.errors.length).toBe(0);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('fails when a route marked done is missing from app', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-fail-'));
      const sitemap = path.join(tempDir, 'SITEMAP.md');
      const appDir = path.join(tempDir, 'app');
      fs.mkdirSync(appDir, { recursive: true });

      // /missing marked done but no file created
      fs.writeFileSync(
        sitemap,
        `| # | Route | Purpose | Key content | Data | Status |\n| P1 | \`/missing\` | Missing | None | none | done |\n`
      );

      const res = checkRoutes({ rootDir: tempDir, sitemapPath: sitemap, appDir });
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toMatch(/does not exist/i);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('check-tokens', () => {
    it('passes on compliant token usage', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-pass-'));
      const file = path.join(tempDir, 'Component.tsx');
      fs.writeFileSync(file, `export function Component() { return <div className="bg-paper text-ink p-4" />; }`);

      const res = checkTokens({ rootDir: tempDir, targetDirs: [tempDir] });
      expect(res.success).toBe(true);
      expect(res.errors.length).toBe(0);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('fails when raw hex color or arbitrary pixel class is used', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-fail-'));
      const file = path.join(tempDir, 'BadComponent.tsx');
      fs.writeFileSync(
        file,
        `export function Bad() { return <div className="w-[283px]" style={{ color: '#123456' }} />; }`
      );

      const res = checkTokens({ rootDir: tempDir, targetDirs: [tempDir] });
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(1);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('check-types', () => {
    it('passes when no restricted domain type is locally declared', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'types-pass-'));
      const file = path.join(tempDir, 'service.ts');
      fs.writeFileSync(file, `export interface LocalServiceConfig { timeout: number; }`);

      const res = checkTypes({ rootDir: tempDir, targetDirs: [tempDir] });
      expect(res.success).toBe(true);
      expect(res.errors.length).toBe(0);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('fails when a restricted domain type is locally re-declared', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'types-fail-'));
      const file = path.join(tempDir, 'bad-finding.ts');
      fs.writeFileSync(file, `export interface FindingView { id: string; }`);

      const res = checkTypes({ rootDir: tempDir, targetDirs: [tempDir] });
      expect(res.success).toBe(false);
      expect(res.errors.length).toBe(1);
      expect(res.errors[0].typeName).toBe('FindingView');

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
