// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { SeverityBadge, StatusPill, RuleChip, OriginChip } from '../components/ui/badge';
import { Card, SectionLabel } from '../components/ui/card';
import { EmptyState, ErrorState } from '../components/ui/states';
import { Dialog, ConfirmDialog } from '../components/ui/dialog';

afterEach(() => {
  cleanup();
});

describe('Paper Brutalist Base Components Suite (§7)', () => {
  describe('Button', () => {
    it('renders with label and handles click', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);
      const btn = screen.getByRole('button', { name: 'Click me' });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state with disabledReason', () => {
      render(<Button disabledReason="Requires reviewer role">Action</Button>);
      const btn = screen.getByRole('button', { name: 'Action' });
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('Requires reviewer role')).toBeDefined();
    });

    it('renders loading state and prevents click', () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>Submit</Button>);
      const btn = screen.getByRole('button', { name: /loading/i });
      expect(btn.hasAttribute('disabled')).toBe(true);
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Input & Textarea', () => {
    it('renders Input with accessible label and hint', () => {
      render(
        <Input
          label="Title"
          hint="Must be concise"
          value=""
          onChange={() => {}}
        />
      );
      expect(screen.getByLabelText(/title/i)).toBeDefined();
      expect(screen.getByText('Must be concise')).toBeDefined();
    });

    it('renders Input with error message', () => {
      render(
        <Input
          label="Title"
          error="Title is required"
          value=""
          onChange={() => {}}
        />
      );
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('Title is required')).toBeDefined();
    });

    it('renders Textarea with accessible label and value change', () => {
      const onChange = vi.fn();
      render(<Textarea label="Body" onChange={onChange} />);
      const textarea = screen.getByLabelText(/body/i);
      fireEvent.change(textarea, { target: { value: 'New text' } });
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Badges and Chips', () => {
    it('renders SeverityBadge with correct accessible label and icon', () => {
      render(<SeverityBadge severity="blocker" />);
      expect(screen.getByLabelText('Severity: BLOCKER')).toBeDefined();
      expect(screen.getByText('BLOCKER')).toBeDefined();
    });

    it('renders StatusPill with status label', () => {
      render(<StatusPill status="in_review" />);
      expect(screen.getByLabelText('Status: In Review')).toBeDefined();
      expect(screen.getByText('In Review')).toBeDefined();
    });

    it('renders RuleChip and OriginChip', () => {
      render(
        <div>
          <RuleChip ruleKey="CLAIM-001" />
          <OriginChip origin="ai" confidence={0.95} />
        </div>
      );
      expect(screen.getByText('CLAIM-001')).toBeDefined();
      expect(screen.getByText('AI')).toBeDefined();
      expect(screen.getByText('(95%)')).toBeDefined();
    });
  });

  describe('Card & SectionLabel', () => {
    it('renders Card content and SectionLabel with number', () => {
      render(
        <Card>
          <SectionLabel number="01" title="Findings" />
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText('01')).toBeDefined();
      expect(screen.getByText('Findings')).toBeDefined();
      expect(screen.getByText('Card content')).toBeDefined();
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders EmptyState with next action', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="Nothing here yet"
          description="Submit your first content"
          actionLabel="New content"
          onAction={onAction}
        />
      );
      expect(screen.getByText('Nothing here yet')).toBeDefined();
      expect(screen.getByText('Submit your first content')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'New content' }));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with alert role and retry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          title="Failed to check"
          message="Connection timed out"
          requestId="req-123"
          onRetry={onRetry}
        />
      );
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('Connection timed out')).toBeDefined();
      expect(screen.getByText('req-123')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog & ConfirmDialog', () => {
    it('closes on Escape key press', () => {
      const onClose = vi.fn();
      render(
        <Dialog open={true} onClose={onClose} title="Test Dialog">
          <p>Dialog body</p>
        </Dialog>
      );
      expect(screen.getByRole('dialog', { name: 'Test Dialog' })).toBeDefined();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('enforces minimum reason length in ConfirmDialog', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      render(
        <ConfirmDialog
          open={true}
          onClose={onClose}
          onConfirm={onConfirm}
          title="Dismiss Blocker"
          description="Requires justification"
          requireReason={true}
          reasonMinLength={10}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmBtn.hasAttribute('disabled')).toBe(true);

      const textarea = screen.getByLabelText(/justification reason/i);
      fireEvent.change(textarea, { target: { value: 'Valid reason of sufficient length' } });

      expect(confirmBtn.hasAttribute('disabled')).toBe(false);
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledWith('Valid reason of sufficient length');
    });
  });
});
