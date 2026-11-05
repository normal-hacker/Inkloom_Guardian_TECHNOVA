const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check seeds
const seeds = ['ci-001', 'ci-002', 'ci-003', 'ci-004', 'ci-005'];
seeds.forEach(s => console.log('Seed ' + s + ':', html.includes(s) ? 'FOUND' : 'MISSING'));

const contentNames = ['Spring savings blog', 'Installer partnership post', 'SunLink launch', 'Homepage banner', 'Press note'];
contentNames.forEach(p => console.log('Content "' + p + '":', html.includes(p) ? 'FOUND' : 'MISSING'));

const workflowMarkers = ['canApprove', 'self-approval', 'in_review', 'changes_requested', 'audit_log'];
workflowMarkers.forEach(p => console.log('Workflow "' + p + '":', html.includes(p) ? 'FOUND' : 'MISSING'));

const insightMarkers = ['viewInsights', 'Top Violated', 'dismissed', 'overridden'];
insightMarkers.forEach(p => console.log('Insights "' + p + '":', html.includes(p) ? 'FOUND' : 'MISSING'));

const a11yMarkers = ['aria-label', 'aria-describedby', 'role="dialog"', 'tabindex', 'aria-live'];
a11yMarkers.forEach(p => console.log('A11y "' + p + '":', html.includes(p) ? 'FOUND' : 'MISSING'));

const devMarkers = ['Ugesh Kumar', 'Raghvendra Basarwar', 'Riya Sharma', 'Build Notes', 'deviation ledger'];
devMarkers.forEach(p => console.log('Dev "' + p + '":', html.includes(p) ? 'FOUND' : 'MISSING'));

console.log('\nFile size:', html.length, 'chars,', html.split('\n').length, 'lines');

