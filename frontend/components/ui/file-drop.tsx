import * as React from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Input } from './input';

export interface FileDropProps {
  onFileSelect: (file: File, altText?: string) => void;
  onFileClear?: () => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
}

export function FileDrop({
  onFileSelect,
  onFileClear,
  onError,
  acceptedTypes = ['.txt', '.md', '.docx', '.pdf', 'image/*'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
}: FileDropProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isImage = selectedFile?.type.startsWith('image/') || false;

  const validateAndHandle = (file: File) => {
    setError(null);

    // 1. Check size limit
    if (file.size > maxSizeBytes) {
      const msg = 'File size exceeds the limit.';
      setError(msg);
      onError?.(msg);
      return;
    }

    // 2. Check empty document
    if (file.size === 0) {
      const msg = 'No readable text found. The uploaded document is empty.';
      setError(msg);
      onError?.(msg);
      return;
    }

    // 3. Check allowed format extension
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : '';
    const fileIsImage = file.type.startsWith('image/');

    const isAllowed = acceptedTypes.some((t) => {
      if (t === 'image/*' && fileIsImage) return true;
      return t.toLowerCase() === ext;
    });

    if (!isAllowed) {
      const msg = `Unsupported file format. Please upload a .pdf, .docx, .txt, or .md file.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file, altText);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndHandle(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      validateAndHandle(e.target.files[0]);
    }
  };

  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAltText(val);
    if (selectedFile) {
      onFileSelect(selectedFile, val);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setAltText('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileClear?.();
  };

  return (
    <div className={cn('w-full flex flex-col gap-3', className)}>
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full p-8 border-2 border-dashed border-ink bg-surface text-ink flex flex-col items-center justify-center text-center cursor-pointer transition-colors',
            isDragging ? 'bg-surface-2 border-accent' : 'hover:bg-surface-2/60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
          />
          <div className="w-12 h-12 border-2 border-ink bg-surface-2 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6 text-ink" aria-hidden="true" />
          </div>
          <p className="font-bold text-sm text-ink">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-ink-2 font-mono">
            Supported: .txt, .md, .docx, .pdf, images (up to 10MB)
          </p>
        </div>
      ) : (
        <div className="p-4 border-2 border-ink bg-surface flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 border-2 border-ink bg-surface-2 flex items-center justify-center">
                {isImage ? (
                  <ImageIcon className="w-4 h-4 text-ink" />
                ) : (
                  <FileText className="w-4 h-4 text-ink" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{selectedFile.name}</p>
                <p className="text-xs font-mono text-ink-3">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="w-7 h-7 border-2 border-ink bg-surface flex items-center justify-center hover:bg-surface-2"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5 text-ink" />
            </button>
          </div>

          {isImage && (
            <Input
              label="Image Accessibility Alt-Text"
              placeholder="Describe the image content for accessibility checks..."
              value={altText}
              onChange={handleAltTextChange}
              hint="Required for ACC-001 accessibility check rule."
            />
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-mono text-severity-blocker font-bold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

