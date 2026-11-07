'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, SectionLabel } from '@/components/ui/card';
import { FileDrop } from '@/components/ui/file-drop';
import { FileText, UploadCloud, ArrowRight, Loader2, OctagonX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewContentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = React.useState('');
  const [contentType, setContentType] = React.useState('blog');
  const [textBody, setTextBody] = React.useState(
    'Our panels are the best on the market and guarantee 40% savings! Call today for clean energy.'
  );
  const [isMono, setIsMono] = React.useState(false);

  // File upload state
  const [file, setFile] = React.useState<File | null>(null);
  const [imageAltText, setImageAltText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let contentItemId = '';

      if (activeTab === 'paste') {
        if (!textBody.trim()) {
          setError('Content text is required.');
          setLoading(false);
          return;
        }

        setLoadingStep('Saving draft…');
        const res = await fetch('/api/v1/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Untitled Content',
            contentType,
            textBody,
            sourceKind: 'paste',
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Failed to create content.');
        }
        contentItemId = data.itemId;
      } else {
        // Upload flow
        if (!file) {
          setError('Please select a file to upload.');
          setLoading(false);
          return;
        }

        const isImage = file.type.startsWith('image/');
        if (isImage && (!imageAltText || imageAltText.trim().length < 5)) {
          setError('Images require descriptive alt text (at least 5 characters) for accessibility.');
          setLoading(false);
          return;
        }

        setLoadingStep('Extracting document content…');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim() || file.name);
        formData.append('contentType', contentType);
        if (isImage) {
          formData.append('imageAltText', imageAltText.trim());
        }

        const res = await fetch('/api/v1/content/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Failed to upload and extract file.');
        }
        contentItemId = data.itemId;
      }

      // Automatically run checks on intake
      setLoadingStep('Rules ✓ · AI … · Validating');
      await fetch(`/api/v1/content/${contentItemId}/check`, {
        method: 'POST',
      });

      // Navigate to review workspace
      router.push(`/content/${contentItemId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process content.');
      setLoading(false);
      setLoadingStep(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-paper text-ink min-h-full pb-36">
      <PageHeader
        title="Submit Content"
        description="Paste marketing copy or upload documents to audit against approved brand guidelines."
      />

      <form onSubmit={handleSubmit} className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-8 space-y-8 flex-1">
        {error && (
          <div
            role="alert"
            className="p-4 border-2 border-ink bg-severity-blocker text-ink text-xs font-mono font-medium flex items-center gap-3 shadow-hard"
          >
            <OctagonX className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Boxy Segmented Switcher (Paste | Upload) */}
        <div className="space-y-2">
          <SectionLabel number="01" title="Intake Method" />
          <div className="inline-flex border-2 border-ink bg-surface p-1 shadow-hard">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={cn(
                'px-5 py-2.5 font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 select-none border-2',
                activeTab === 'paste'
                  ? 'bg-ink text-surface border-ink shadow-hard-sm'
                  : 'bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-surface-2'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={cn(
                'px-5 py-2.5 font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 select-none border-2',
                activeTab === 'upload'
                  ? 'bg-ink text-surface border-ink shadow-hard-sm'
                  : 'bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-surface-2'
              )}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <SectionLabel number="02" title="Document Details" />
            <Input
              label="Document Title"
              placeholder="e.g. Q3 Residential Solar Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              hint="Descriptive name visible in dashboard and audit trails."
            />

            <Select
              label="Content Type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="blog">Editorial Blog</option>
              <option value="social">Social Media Post</option>
              <option value="ad">Paid Advertisement / Ad Copy</option>
              <option value="web">Web Landing Page</option>
              <option value="press">Press Release</option>
              <option value="other">Other Document</option>
            </Select>
          </Card>

          <Card className="space-y-4">
            <SectionLabel number="03" title="Target Channel & Policy" />
            <div className="p-4 bg-surface-2 border-2 border-ink space-y-2 text-xs font-mono text-ink">
              <p className="font-bold uppercase text-ink">Active Brand Rule Set: Brightway Solar v3</p>
              <p className="text-ink-2">
                Automated checks evaluate tone, prohibited superlative terminology, substantiated metrics, and accessibility standards.
              </p>
            </div>
          </Card>
        </div>

        {/* Content Body / Upload Zone */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel number="04" title={activeTab === 'paste' ? 'Text Body' : 'File Upload'} />
            {activeTab === 'paste' && (
              <button
                type="button"
                onClick={() => setIsMono(!isMono)}
                className="text-xs font-mono font-bold uppercase text-ink-2 hover:text-ink underline"
              >
                {isMono ? 'Standard Font' : 'Monospace Editor'}
              </button>
            )}
          </div>

          {activeTab === 'paste' ? (
            <Textarea
              rows={8}
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder="Paste content to check against guidelines…"
              className={cn(isMono ? 'font-mono' : '', 'max-h-[50vh] overflow-y-auto')}
              required
            />
          ) : (
            <FileDrop
              onFileSelect={(selectedFile, alt) => {
                setFile(selectedFile);
                if (alt) setImageAltText(alt);
              }}
            />
          )}
        </Card>

        {/* Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t-2 border-ink px-6 md:px-8 py-4 shadow-hard-lg">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-mono text-ink-2 text-center sm:text-left">
              Text is stored in the demo database. AI checks receive a redacted copy.
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-ink" />
                    <span>{loadingStep || 'Checking content…'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Save & check</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
