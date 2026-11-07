import mammoth from 'mammoth';

export class ExtractionError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * Normalises CRLF (\r\n) and legacy CR (\r) newlines to standard LF (\n)
 */
export function normaliseNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Validates magic bytes for binary formats to prevent file spoofing
 */
export function validateMagicBytes(buffer: Buffer, extension: string): void {
  if (extension === 'pdf') {
    const isPdf = buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF';
    if (!isPdf) {
      throw new ExtractionError(415, 'unsupported_media_type', 'Unsupported file format or invalid PDF file header.');
    }
  } else if (extension === 'docx') {
    const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) {
      throw new ExtractionError(415, 'unsupported_media_type', 'Unsupported file format or invalid DOCX file header.');
    }
  } else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    const isPng = buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

    if (!isPng && !isJpg && !isWebp) {
      throw new ExtractionError(415, 'unsupported_media_type', 'Unsupported file format or invalid image file header.');
    }
  }
}

export async function extractTextFromFile(
  filename: string,
  buffer: Buffer,
  maxMb: number = 10
): Promise<{ textBody: string; sourceKind: string }> {
  // 1. File size check
  if (buffer.length > maxMb * 1024 * 1024) {
    throw new ExtractionError(
      413,
      'payload_too_large',
      `File exceeds maximum allowed upload size of ${maxMb} MB. File size exceeds the limit.`
    );
  }

  // 2. Empty file check
  if (!buffer || buffer.length === 0) {
    throw new ExtractionError(
      422,
      'no_text_found',
      'No readable text found. The uploaded document is empty.'
    );
  }

  const parts = filename.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts.pop()! : '';

  // 3. Supported extension check
  const allowedExtensions = ['txt', 'md', 'docx', 'pdf', 'png', 'jpg', 'jpeg', 'webp'];
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new ExtractionError(
      415,
      'unsupported_media_type',
      `Unsupported file format ".${ext}". Allowed formats are: .txt, .md, .docx, .pdf, and images (.png, .jpg, .webp).`
    );
  }

  // 4. Validate magic bytes for binary files
  validateMagicBytes(buffer, ext);

  // 5. Extract based on format
  if (ext === 'txt' || ext === 'md') {
    try {
      const raw = buffer.toString('utf8');
      const textBody = normaliseNewlines(raw);
      if (!textBody.trim()) {
        throw new ExtractionError(422, 'no_text_found', 'No readable text found in document.');
      }
      return {
        textBody,
        sourceKind: ext,
      };
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      throw new ExtractionError(422, 'failed_to_read', 'Failed to read document.');
    }
  }

  if (ext === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const textBody = normaliseNewlines(result.value || '');
      if (!textBody.trim()) {
        throw new ExtractionError(422, 'no_text_found', 'No readable text found in Word document.');
      }
      return {
        textBody,
        sourceKind: 'docx',
      };
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      throw new ExtractionError(422, 'docx_parse_error', 'Failed to read document. The Word document appears to be corrupted or invalid.');
    }
  }

  if (ext === 'pdf') {
    let instance: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require('pdf-parse');
      const PDFParser = pdfModule.PDFParse || pdfModule.default || pdfModule;

      let extractedText = '';
      if (typeof PDFParser === 'function') {
        try {
          instance = new PDFParser({ data: buffer });
          const res = await instance.getText();
          if (Array.isArray(res?.pages) && res.pages.length > 0) {
            extractedText = res.pages.map((p: any) => p.text || '').filter(Boolean).join('\n\n');
          } else if (res && typeof res.text === 'string') {
            extractedText = res.text.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
          } else if (typeof res === 'string') {
            extractedText = res;
          }
        } catch {
          const direct = await PDFParser(buffer);
          extractedText = direct?.text || '';
        }
      }

      const cleaned = (extractedText || '').trim();
      if (cleaned.length === 0) {
        throw new ExtractionError(
          422,
          'scanned_pdf_not_supported',
          'No readable text found. Scanned image-only PDF without embedded text layer is not supported. Please upload a text-based PDF or paste text.'
        );
      }
      return {
        textBody: normaliseNewlines(extractedText),
        sourceKind: 'pdf',
      };
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      throw new ExtractionError(
        422,
        'failed_to_read',
        'Failed to read document. The PDF file appears to be corrupted or unreadable.'
      );
    } finally {
      if (instance && typeof instance.destroy === 'function') {
        await instance.destroy().catch(() => {});
      }
    }
  }

  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return {
      textBody: '',
      sourceKind: 'image',
    };
  }

  throw new ExtractionError(
    415,
    'unsupported_media_type',
    'Unsupported file format.'
  );
}
