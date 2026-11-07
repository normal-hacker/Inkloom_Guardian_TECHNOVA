'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Badge,
  SeverityBadge,
  StatusPill,
  RuleChip,
  OriginChip,
} from '@/components/ui/badge';
import { Card, SectionLabel } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { FileDrop } from '@/components/ui/file-drop';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { FileText, TriangleAlert, History } from 'lucide-react';

export default function StyleguidePage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<number | null>(0);

  const sampleTabs = [
    { id: 'content', title: 'Content', icon: FileText },
    { id: 'findings', title: 'Findings', icon: TriangleAlert, badge: 3 },
    { id: 'history', title: 'History', icon: History },
  ];

  return (
    <div className="w-full flex flex-col bg-paper min-h-screen text-ink pb-24">
      <PageHeader
        title="Paper Brutalist Styleguide"
        description="Design system tokens, typography, base components, and interactive states."
        chips={<span className="px-2 py-0.5 bg-ink text-surface font-mono text-xs font-bold uppercase">v2 LOCKED</span>}
      />

      <div className="max-w-[1280px] w-full mx-auto px-6 md:px-8 py-8 space-y-12">
        {/* 01. COLOR TOKENS */}
        <section className="space-y-4">
          <SectionLabel number="01" title="Color & Surface Tokens" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: '--paper', hex: '#F4F3EE', role: 'App Background', border: true },
              { name: '--surface', hex: '#FBFAF6', role: 'Cards / Inputs', border: true },
              { name: '--surface-2', hex: '#ECEAE3', role: 'Sidebar / Headers', border: true },
              { name: '--ink', hex: '#0A0A0A', role: 'Text / Borders', dark: true },
              { name: '--ink-2', hex: '#4A4A45', role: 'Secondary Text', dark: true },
              { name: '--rule', hex: '#D9D7CF', role: 'Hairline Divider', border: true },
              { name: '--accent', hex: '#2D2AE8', role: 'Primary Action', dark: true },
              { name: 'Blocker', hex: '#FF6B5E', role: 'Severity Fill', border: true },
              { name: 'Major', hex: '#FFC93C', role: 'Severity Fill', border: true },
              { name: 'Minor', hex: '#9CC2FF', role: 'Severity Fill', border: true },
              { name: 'Info', hex: '#E4E2DA', role: 'Severity Fill', border: true },
              { name: 'Approved', hex: '#86E3A9', role: 'Status Fill', border: true },
            ].map((token) => (
              <div
                key={token.name}
                className="p-3 border-2 border-ink bg-surface shadow-hard flex flex-col gap-2"
              >
                <div
                  className="w-full h-12 border-2 border-ink flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    backgroundColor: token.hex,
                    color: token.dark ? '#FFFFFF' : '#0A0A0A',
                  }}
                >
                  {token.hex}
                </div>
                <div>
                  <p className="font-mono text-xs font-bold text-ink">{token.name}</p>
                  <p className="text-[11px] text-ink-2 font-mono">{token.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 02. TYPOGRAPHY SCALE */}
        <section className="space-y-4">
          <SectionLabel number="02" title="Typography Scale (Geist & Geist Mono)" />
          <Card className="space-y-6">
            <div>
              <p className="text-xs font-mono text-ink-3 uppercase">Display Scale (clamp 3rem to 8rem, landing hero)</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink mt-1">
                Check before you publish.
              </h1>
            </div>
            <div>
              <p className="text-xs font-mono text-ink-3 uppercase">Page Title (clamp 1.875rem to 3rem)</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mt-1">
                Review Workspace
              </h2>
            </div>
            <div>
              <p className="text-xs font-mono text-ink-3 uppercase">Section Title (1.5rem, weight 600)</p>
              <h3 className="text-xl font-bold text-ink mt-1">
                Findings and Recommended Actions
              </h3>
            </div>
            <div>
              <p className="text-xs font-mono text-ink-3 uppercase">Body (16px / 1.6)</p>
              <p className="text-base text-ink max-w-2xl mt-1">
                Brand checks that cite the exact rule, explain the issue with clear rationale, and leave the final approval decision strictly to human reviewers.
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-ink-3 uppercase">Mono Label (12px, tracking +0.06em, weight 500)</p>
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink mt-1">
                RULE KEY: CLAIM-001 · CONFIDENCE 100% · SEED V3
              </p>
            </div>
          </Card>
        </section>

        {/* 03. BUTTON INVENTORY */}
        <section className="space-y-4">
          <SectionLabel number="03" title="Button Component (4 Variants, States & Sizes)" />
          <Card className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-rule">
              <Button size="sm">Small (36px)</Button>
              <Button size="md">Medium (44px target)</Button>
              <Button size="lg">Large (56px)</Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-rule">
              <Button loading>Loading</Button>
              <Button disabledReason="Requires reviewer or manager role">
                Disabled Action
              </Button>
            </div>
          </Card>
        </section>

        {/* 04. BADGES, CHIPS & SEVERITY PILLS */}
        <section className="space-y-4">
          <SectionLabel number="04" title="Badges, Severity Indicators & Status Pills" />
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity="blocker" />
              <SeverityBadge severity="major" />
              <SeverityBadge severity="minor" />
              <SeverityBadge severity="info" />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t-2 border-rule">
              <StatusPill status="draft" />
              <StatusPill status="checked" />
              <StatusPill status="in_review" />
              <StatusPill status="changes_requested" />
              <StatusPill status="approved" />
              <StatusPill status="rejected" />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t-2 border-rule">
              <RuleChip ruleKey="CLAIM-001" />
              <RuleChip ruleKey="NUM-001" />
              <OriginChip origin="rule" />
              <OriginChip origin="ai" confidence={0.92} />
              <Badge variant="ink">ACTIVE RULESET V3</Badge>
            </div>
          </Card>
        </section>

        {/* 05. FORM INPUTS */}
        <section className="space-y-4">
          <SectionLabel number="05" title="Form Controls (2px Ink Border, High-Contrast Focus)" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <Input
                label="Content Document Title"
                placeholder="e.g. Q3 Residential Solar Announcement"
                hint="Used across audit logs and review listings."
              />
              <Input
                label="Required Identifier"
                required
                defaultValue="INVALID_VALUE"
                error="Format must match approved standard alphanumeric."
              />
              <Select label="Target Channel" defaultValue="web">
                <option value="web">Web Landing Page</option>
                <option value="blog">Editorial Blog</option>
                <option value="press">Press Release</option>
              </Select>
            </Card>

            <Card className="space-y-4">
              <Textarea
                label="Content Text Body"
                rows={4}
                defaultValue="Our next-generation solar panels guarantee 40% immediate savings on your utility bills."
                hint="Enter full draft text for automated policy audit."
              />
              <FileDrop onFileSelect={() => {}} />
            </Card>
          </div>
        </section>

        {/* 06. IN-PAGE EXPANDABLE TABS */}
        <section className="space-y-4">
          <SectionLabel number="06" title="Boxy In-Page ExpandableTabs" />
          <Card>
            <ExpandableTabs
              tabs={sampleTabs}
              value={activeTab}
              onChange={(idx) => setActiveTab(idx)}
            />
            <p className="mt-4 text-xs font-mono text-ink-2">
              Current Tab Index: <span className="font-bold text-ink">{activeTab}</span>
            </p>
          </Card>
        </section>

        {/* 07. DATA TABLE */}
        <section className="space-y-4">
          <SectionLabel number="07" title="Data Table (48px Min Row Height, Mono Identifiers)" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Key</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono font-bold">CLAIM-001</TableCell>
                <TableCell><SeverityBadge severity="blocker" /></TableCell>
                <TableCell className="font-mono text-xs">claim</TableCell>
                <TableCell className="font-bold">Unsubstantiated performance guarantee</TableCell>
                <TableCell><StatusPill status="in_review" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-bold">NUM-001</TableCell>
                <TableCell><SeverityBadge severity="major" /></TableCell>
                <TableCell className="font-mono text-xs">fact</TableCell>
                <TableCell className="font-bold">Unapproved metric calculation</TableCell>
                <TableCell><StatusPill status="approved" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* 08. STATES & DIALOGS */}
        <section className="space-y-4">
          <SectionLabel number="08" title="System States & Modal Dialogs" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              title="No draft submissions pending"
              description="Upload or paste text in the intake workspace to generate findings."
              actionLabel="Create new content"
              onAction={() => alert('New Content Action')}
            />

            <ErrorState
              title="Verification Service Timeout"
              message="The engine took longer than expected to process the policy checks."
              requestId="req-8f92a10d"
              onRetry={() => alert('Retrying check run...')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Open Standard Dialog
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Open Reason Confirm Dialog
            </Button>
          </div>
        </section>
      </div>

      {/* Test Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Policy Reference Details"
        description="Brand Voice Guide v4 — Section 3.2 Tone & Substantiation"
      >
        <p className="text-sm text-ink mb-4">
          All external marketing claims referencing cost savings or energy output must link to verified third-party laboratory audits.
        </p>
        <Button variant="primary" onClick={() => setDialogOpen(false)}>
          Understood
        </Button>
      </Dialog>

      {/* Confirm Reason Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(reason) => alert(`Confirmed with reason: ${reason}`)}
        title="Dismiss Blocker Finding"
        description="Dismissing a blocker finding requires a verified audit justification of at least 10 characters."
        requireReason={true}
        variant="destructive"
        confirmLabel="Dismiss Blocker"
      />
    </div>
  );
}
