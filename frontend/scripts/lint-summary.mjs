import { ESLint } from 'eslint';

async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['.']);

  const byRule = {};
  const byFile = {};
  let totalWarnings = 0;
  let totalErrors = 0;

  for (const file of results) {
    if (file.messages.length === 0) continue;
    const relPath = file.filePath.replace(/\\/g, '/').split('/frontend/')[1] || file.filePath;

    byFile[relPath] = [];

    for (const msg of file.messages) {
      if (msg.severity === 2) totalErrors++;
      if (msg.severity === 1) totalWarnings++;

      const rule = msg.ruleId || 'syntax';
      byRule[rule] = (byRule[rule] || 0) + 1;

      byFile[relPath].push({
        line: msg.line,
        rule,
        message: msg.message,
      });
    }
  }

  console.log('=== ESLINT SUMMARY ===');
  console.log(`Total Errors: ${totalErrors}, Total Warnings: ${totalWarnings}`);
  console.log('\n--- BY RULE ---');
  for (const [rule, count] of Object.entries(byRule)) {
    console.log(`${rule}: ${count}`);
  }

  console.log('\n--- BY FILE ---');
  for (const [file, msgs] of Object.entries(byFile)) {
    console.log(`\n${file} (${msgs.length} warnings):`);
    msgs.forEach((m) => console.log(`  Line ${m.line}: [${m.rule}] ${m.message}`));
  }
}

main().catch(console.error);

