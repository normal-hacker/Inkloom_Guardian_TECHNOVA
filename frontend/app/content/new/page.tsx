'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/../components/Navbar';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileText, Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

export default function NewContentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [textBody, setTextBody] = useState(
    'Our panels are the best on the market and guarantee 40% savings! Call today for clean energy.'
  );

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [imageAltText, setImageAltText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await fetch(`/api/v1/content/${contentItemId}/check`, {
        method: 'POST',
      });

      // Navigate to review workspace
      router.push(`/content/${contentItemId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process content.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <PageHeader
        title="New Content Intake"
        description="Paste or upload content and run a brand check"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Content Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Residential Solar Landing Page Q1"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="contentType" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Content Type
              </label>
              <select
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="blog">Blog Post</option>
                <option value="social">Social Media</option>
                <option value="ad">Ad Copy</option>
                <option value="web">Website / Landing</option>
                <option value="press">Press Release</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Intake Tabs (Paste / Upload) */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'paste'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Paste Text</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document (.txt, .md, .docx, .pdf, images)</span>
              </button>
            </div>

            {activeTab === 'paste' ? (
              <div>
                <label htmlFor="textBody" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Draft Copy
                </label>
                <textarea
                  id="textBody"
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={8}
                  placeholder="Paste marketing copy here…"
                  required
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Choose a file to extract</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports .txt, .md, .docx, .pdf, and PNG/JPEG/WebP images up to 10MB
                  </p>
                  <input
                    type="file"
                    accept=".txt,.md,.docx,.pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {file && (
                    <p className="mt-2 text-xs font-bold text-indigo-700">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {file && file.type.startsWith('image/') && (
                  <div>
                    <label htmlFor="altText" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Image Alt Text (Required for accessibility)
                    </label>
                    <input
                      id="altText"
                      type="text"
                      value={imageAltText}
                      onChange={(e) => setImageAltText(e.target.value)}
                      placeholder="e.g. Modern residential rooftop with 12 SunLink solar panels"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Copy…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit & Check Brand Rules</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
