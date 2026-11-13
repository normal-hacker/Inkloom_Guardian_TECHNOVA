import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';
import { Textarea } from './textarea';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first actionable control on open, or the modal container if none
    const timer = setTimeout(() => {
      if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
        const focusable = dialogRef.current.querySelector<HTMLElement>(
          'textarea:not([disabled]), input:not([disabled]), button:not([aria-label="Close dialog"]):not([disabled])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 20);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative w-full max-w-lg bg-surface text-ink border-2 border-ink p-6 md:p-8 rounded-none shadow-hard-lg z-10 focus-visible:outline-none',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="dialog-title" className="text-xl font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id="dialog-description" className="mt-1 text-sm text-ink-2">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 border-2 border-ink bg-surface flex items-center justify-center text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'destructive';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonMinLength?: number;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Please explain the rationale (minimum 10 characters)...',
  reasonMinLength = 10,
}: ConfirmDialogProps) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (requireReason) {
      if (reason.trim().length < reasonMinLength) {
        setError(`A justification of at least ${reasonMinLength} characters is required.`);
        return;
      }
    }
    onConfirm(requireReason ? reason : undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="space-y-4">
        {requireReason && (
          <Textarea
            label="Justification Reason"
            required
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error && e.target.value.trim().length >= reasonMinLength) {
                setError('');
              }
            }}
            placeholder={reasonPlaceholder}
            hint={`Required for audit compliance (min ${reasonMinLength} chars).`}
            error={error}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={requireReason && reason.trim().length < reasonMinLength}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

