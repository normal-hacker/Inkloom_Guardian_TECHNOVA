import { describe, it, expect } from 'vitest';
import {
  inspectBanner,
  calculateContrastRatio,
  BannerInspectionInput,
} from '../src/lib/engine/banner';

describe('2.3 Banner & Visual Compliance Inspection (6 Fixture Test)', () => {
  // Helper to build synthetic fixture buffer with embedded color marker [0xCA, 0xFE, R1, G1, B1, R2, G2, B2]
  function createSyntheticFixture(
    fg: { r: number; g: number; b: number },
    bg: { r: number; g: number; b: number }
  ): Buffer {
    // 8-byte PNG header + embedded color marker
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0xca, 0xfe,
      fg.r, fg.g, fg.b,
      bg.r, bg.g, bg.b,
    ]);
  }

  const fixture1_Pass: BannerInspectionInput = {
    filename: 'banner_pass_high_contrast.png',
    fileBuffer: createSyntheticFixture({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }),
    altText: 'Brightway residential solar installation on pitched roof',
    disclaimerText: 'Terms apply. Savings based on 2025 regional customer study.',
  };

  const fixture2_Pass: BannerInspectionInput = {
    filename: 'banner_pass_navy_on_cream.png',
    fileBuffer: createSyntheticFixture({ r: 15, g: 23, b: 42 }, { r: 248, g: 250, b: 252 }),
    altText: 'SunLink home battery array installed in modern garage',
    disclaimerText: 'Subject to regional grid interconnection conditions and inspection.',
  };

  const fixture3_Pass: BannerInspectionInput = {
    filename: 'banner_pass_dark_green.png',
    fileBuffer: createSyntheticFixture({ r: 20, g: 83, b: 45 }, { r: 255, g: 255, b: 255 }),
    altText: 'Clean solar panels operating on sunny suburban home',
    disclaimerText: 'Standard 25-year manufacturer warranty terms apply.',
  };

  const fixture4_Fail_LowContrast: BannerInspectionInput = {
    filename: 'banner_fail_low_contrast.png',
    fileBuffer: createSyntheticFixture({ r: 170, g: 170, b: 170 }, { r: 255, g: 255, b: 255 }),
    altText: 'Low contrast solar panel banner with pale silver text',
    disclaimerText: 'Terms apply. Subject to utility rules.',
  };

  const fixture5_Fail_MissingAltText: BannerInspectionInput = {
    filename: 'banner_fail_missing_alt.png',
    fileBuffer: createSyntheticFixture({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }),
    altText: '', // empty / missing alt text
    disclaimerText: 'Terms apply. Based on verified customer study.',
  };

  const fixture6_Fail_MissingDisclaimer: BannerInspectionInput = {
    filename: 'banner_fail_no_disclaimer.png',
    fileBuffer: createSyntheticFixture({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }),
    altText: 'Brightway solar promotion hero graphic',
    disclaimerText: '', // missing mandatory disclaimer
  };

  const fixtures = [
    { input: fixture1_Pass, expectedPass: true, label: 'Fixture 1 (Pass - High contrast black/white)' },
    { input: fixture2_Pass, expectedPass: true, label: 'Fixture 2 (Pass - Navy on cream)' },
    { input: fixture3_Pass, expectedPass: true, label: 'Fixture 3 (Pass - Dark green on white)' },
    { input: fixture4_Fail_LowContrast, expectedPass: false, label: 'Fixture 4 (Fail - Contrast ratio < 4.5:1)' },
    { input: fixture5_Fail_MissingAltText, expectedPass: false, label: 'Fixture 5 (Fail - Missing alt text)' },
    { input: fixture6_Fail_MissingDisclaimer, expectedPass: false, label: 'Fixture 6 (Fail - Missing disclaimer)' },
  ];

  it('correctly classifies all 6 fixture images (3 pass, 3 fail) with 100% accuracy on the 6-set', () => {
    let correctCount = 0;

    fixtures.forEach(({ input, expectedPass, label }) => {
      const result = inspectBanner(input);

      // Verify severity is strictly ADVISORY on every finding
      result.findings.forEach((f) => {
        expect(f.severity).toBe('advisory');
      });

      expect(result.overallPassed, `${label} overallPassed check`).toBe(expectedPass);
      if (result.overallPassed === expectedPass) {
        correctCount++;
      }
    });

    expect(correctCount).toBe(6);
    const measuredAccuracy = (correctCount / fixtures.length) * 100;
    expect(measuredAccuracy).toBe(100);
  });

  it('accurately detects WCAG contrast failure on low-contrast text', () => {
    const res = inspectBanner(fixture4_Fail_LowContrast);
    const contrastFinding = res.findings.find((f) => f.check === 'contrast_ratio');
    expect(contrastFinding?.passed).toBe(false);
    expect(contrastFinding?.message).toContain('fails WCAG AA');
  });

  it('accurately detects missing alt-text advisory', () => {
    const res = inspectBanner(fixture5_Fail_MissingAltText);
    const altFinding = res.findings.find((f) => f.check === 'alt_text');
    expect(altFinding?.passed).toBe(false);
    expect(altFinding?.message).toContain('Missing descriptive alt text');
  });

  it('accurately detects missing legal disclaimer advisory', () => {
    const res = inspectBanner(fixture6_Fail_MissingDisclaimer);
    const disclaimerFinding = res.findings.find((f) => f.check === 'disclaimer_text');
    expect(disclaimerFinding?.passed).toBe(false);
    expect(disclaimerFinding?.message).toContain('lacks required legal disclaimer');
  });
});

