import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAuth } from '@/lib/auth/guards';
import { apiError, ApiErrorCode } from '@/lib/api/errors';
import { extractTextFromFile, ExtractionError } from '@/lib/services/extract';
import { createContent } from '@/lib/services/content';
import { serverEnv } from '@/lib/env';

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = requireAuth(req);
  } catch (err: any) {
    return apiError(err.status || 401, err.code || 'unauthenticated', err.message, requestId);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || file?.name || 'Uploaded content';
    const contentType = (formData.get('contentType') as string) || 'blog';
    const imageAltText = (formData.get('imageAltText') as string) || undefined;
    const customTextBody = formData.get('textBody') as string | null;

    // Check if client requested extract-only mode
    const url = new URL(req.url);
    const extractOnly =
      url.searchParams.get('extractOnly') === 'true' ||
      formData.get('extractOnly') === 'true' ||
      req.headers.get('x-extract-only') === 'true';

    if (!file || typeof file.arrayBuffer !== 'function') {
      return apiError(400, 'bad_request', 'No file was provided.', requestId);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text and validate magic bytes
    const extraction = await extractTextFromFile(file.name, buffer, serverEnv.maxUploadMb);

    // If extract-only mode, return the extracted text immediately without writing to database
    if (extractOnly) {
      return NextResponse.json(
        {
          success: true,
          extractedText: extraction.textBody,
          filename: file.name,
          fileSize: file.size,
          sourceKind: extraction.sourceKind,
          suggestedTitle: file.name.replace(/\.[^/.]+$/, '').trim() || 'Uploaded Document',
          characterCount: extraction.textBody.length,
        },
        { status: 200, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Use edited text if the user reviewed and modified the extracted copy
    const finalContentText = (customTextBody !== null && customTextBody !== undefined && customTextBody.trim().length > 0)
      ? customTextBody
      : extraction.textBody;

    // If an image is uploaded, store base64 string
    const originalBytes = extraction.sourceKind === 'image' ? buffer.toString('base64') : undefined;

    const result = await createContent({
      workspaceId: session.wid,
      ownerId: session.sub,
      title: title.trim(),
      contentType,
      textBody: finalContentText,
      sourceKind: extraction.sourceKind,
      originalFilename: file.name,
      originalBytes,
      imageAltText,
    });

    return NextResponse.json(
      {
        itemId: result.itemId, // Top-level itemId for compatibility
        item: {
          id: result.itemId,
          title: title.trim(),
          contentType,
          status: 'draft',
          currentVersionId: result.versionId,
          versionNo: 1,
          contentHash: result.contentHash,
          sourceKind: extraction.sourceKind,
          textBody: finalContentText,
        },
        extractedText: finalContentText,
      },
      { status: 201, headers: { 'X-Request-ID': requestId } }
    );
  } catch (err: any) {
    if (err instanceof ExtractionError) {
      const code: ApiErrorCode =
        err.status === 413
          ? 'bad_request'
          : err.status === 415
          ? 'bad_request'
          : err.status === 422
          ? 'validation_error'
          : 'internal_error';
      return apiError(err.status, code, err.message, requestId);
    }
    return apiError(500, 'internal_error', err.message || 'Document extraction failed.', requestId);
  }
}
