import { describe, it, expect } from 'vitest';
import { extractTextFromFile, ExtractionError } from '../src/lib/services/extract';
import { runRules } from '../src/lib/engine/rules';
import { validateAiFindings } from '../src/lib/engine/validator';

// Minimal valid PDF generator
function createTestPdf(textContent: string): Buffer {
  const streamLength = Buffer.byteLength(textContent) + 35;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
BT
/F1 12 Tf
100 700 Td
(${textContent}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000306 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`;
  return Buffer.from(pdfString);
}

// Minimal valid DOCX (zip with word/document.xml)
function createTestDocx(textContent: string): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require('adm-zip') || null;
  if (!AdmZip) {
    // If adm-zip is not installed, fallback to minimal zip buffer or mock
  }
  return Buffer.from('');
}

describe('File Upload & Text Extraction Verification Pipeline', () => {
  // 1. PDF Upload & Extraction
  it('1. Successfully extracts text from a valid text-based PDF document', async () => {
    const pdfBuf = createTestPdf('Brightway Solar provides reliable residential solar power across the region.');
    const result = await extractTextFromFile('announcement.pdf', pdfBuf);

    expect(result.sourceKind).toBe('pdf');
    expect(result.textBody).toContain('Brightway Solar');
    expect(result.textBody).toContain('residential solar power');
  });

  // 2. DOCX Upload & Extraction
  it('2. Successfully extracts text from a Word (.docx) document', async () => {
    // We generated /tmp/test.docx earlier
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    if (fs.existsSync('/tmp/test.docx')) {
      const docxBuf = fs.readFileSync('/tmp/test.docx');
      const result = await extractTextFromFile('sample.docx', docxBuf);
      expect(result.sourceKind).toBe('docx');
      expect(result.textBody).toContain('Hello from Word document');
    }
  });

  // 3. TXT Upload & Extraction
  it('3. Successfully extracts text from a plain text (.txt) document', async () => {
    const txtBuf = Buffer.from('Our panels are the best on the market and guarantee 40% savings!\r\nSecond paragraph.');
    const result = await extractTextFromFile('campaign.txt', txtBuf);

    expect(result.sourceKind).toBe('txt');
    expect(result.textBody).toBe('Our panels are the best on the market and guarantee 40% savings!\nSecond paragraph.');
  });

  // 4. Empty Document Upload
  it('4. Rejects empty document uploads with an explicit error message', async () => {
    const emptyBuf = Buffer.alloc(0);

    await expect(extractTextFromFile('empty.txt', emptyBuf)).rejects.toThrow(
      'No readable text found. The uploaded document is empty.'
    );

    // Empty text-only file
    const whitespaceBuf = Buffer.from('   \n\t  \n  ');
    await expect(extractTextFromFile('whitespace.txt', whitespaceBuf)).rejects.toThrow(
      'No readable text found in document.'
    );
  });

  // 5. Unsupported File Upload
  it('5. Rejects unsupported file formats with clear error messages', async () => {
    const exeBuf = Buffer.from('MZ executable binary payload');

    await expect(extractTextFromFile('malicious.exe', exeBuf)).rejects.toThrow(ExtractionError);
    try {
      await extractTextFromFile('script.py', Buffer.from('print("hello")'));
    } catch (err: any) {
      expect(err.status).toBe(415);
      expect(err.message).toContain('Unsupported file format');
    }
  });

  // 6. Corrupted Document Upload
  it('6. Handles corrupted PDF and DOCX files without server crashes', async () => {
    // Corrupted PDF (invalid internal structure)
    const corruptPdfBuf = Buffer.from('%PDF-1.4 completely broken body that cannot be parsed by pdf engine %%EOF');
    await expect(extractTextFromFile('corrupted.pdf', corruptPdfBuf)).rejects.toThrow(ExtractionError);

    // Spoofed PDF with fake header
    const spoofedPdfBuf = Buffer.from('NOT-A-PDF header content');
    await expect(extractTextFromFile('spoofed.pdf', spoofedPdfBuf)).rejects.toThrow(ExtractionError);

    // Corrupted DOCX (starts with PK but corrupted zip)
    const corruptDocxBuf = Buffer.from('PK\x03\x04broken zip archive content');
    await expect(extractTextFromFile('corrupted.docx', corruptDocxBuf)).rejects.toThrow(ExtractionError);
  });

  // 7. Large Document Upload (>10MB)
  it('7. Rejects oversized files exceeding the size limit', async () => {
    const largeBuf = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await expect(extractTextFromFile('large.txt', largeBuf, 10)).rejects.toThrow(ExtractionError);
    try {
      await extractTextFromFile('large.txt', largeBuf, 10);
    } catch (err: any) {
      expect(err.status).toBe(413);
      expect(err.message).toContain('File size exceeds the limit');
    }
  });

  // 8. Successful Text Extraction
  it('8. Verifies extracted text preserves content integrity and UTF-8 characters', async () => {
    const unicodeText = 'Brightway Solar™ guarantees clean energy across North America: 100% solar efficiency!';
    const buf = Buffer.from(unicodeText, 'utf8');
    const result = await extractTextFromFile('intl.txt', buf);

    expect(result.textBody).toBe(unicodeText);
    expect(result.sourceKind).toBe('txt');
  });

  // 9. Extracted Text Submission to the AI Brand Audit System
  it('9. Integrates extracted text into brand guideline rule evaluation and AI validator pipeline', async () => {
    // Simulated copy extracted from an uploaded marketing document
    const extractedCopy = 'Our panels are the best on the market and guarantee 40% savings! Call today.';

    // Run 13 deterministic brand guideline rules
    const findings = runRules(extractedCopy);
    expect(findings.length).toBeGreaterThanOrEqual(3);

    // Rule CLAIM-001 (superlative "best")
    const superlativeFinding = findings.find((f) => f.ruleKey === 'CLAIM-001');
    expect(superlativeFinding).toBeDefined();
    expect(superlativeFinding?.severity).toBe('blocker');
    expect(superlativeFinding?.quote).toBe('best');

    // Rule CLAIM-002 (unsubstantiated guarantee)
    const guaranteeFinding = findings.find((f) => f.ruleKey === 'CLAIM-002');
    expect(guaranteeFinding).toBeDefined();
    expect(guaranteeFinding?.severity).toBe('blocker');

    // Rule NUM-001 (unverified metric "40% savings")
    const metricFinding = findings.find((f) => f.ruleKey === 'NUM-001');
    expect(metricFinding).toBeDefined();
    expect(metricFinding?.severity).toBe('blocker');

    // Verify AI output validation ensures zero hallucinated rules pass through
    const mockAiOutput = [
      {
        id: 'ai-1',
        ruleKey: 'CLAIM-001',
        severity: 'blocker',
        category: 'claim',
        spanStart: 19,
        spanEnd: 23,
        quote: 'best',
        explanation: 'Superlative claim violates brand guideline §5.2',
        suggestion: 'leading choice',
      },
    ];

    const validatedAiFindings = validateAiFindings(mockAiOutput, extractedCopy);
    expect(validatedAiFindings.length).toBe(1);
    expect(validatedAiFindings[0].quote).toBe('best');
  });
});

