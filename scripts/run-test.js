const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const profile = process.env.PROFILE || process.argv[2] || 'smoke';
const reportDir = path.join('reports', 'k6', profile);

// 1. Ensure report directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// 2. Resolve Test Bundle
let bundle = process.env.BUNDLE || process.argv[3];
if (bundle && !bundle.endsWith('.bundle.js')) {
  bundle = `${bundle}.bundle.js`;
}

if (!bundle) {
  const files = fs.readdirSync('dist').filter(f => f.endsWith('.bundle.js'));
  if (files.length > 0) bundle = files[0];
}

if (!bundle) {
  console.error('❌ Error: No test bundle found in "dist/".');
  process.exit(1);
}

const bundlePath = path.join('dist', bundle);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(` 🚀 k6 Runner: ${bundle}`);
console.log(` 📂 Profile: ${profile}`);
console.log(` 📂 Output:  ${reportDir}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

const syncOnly = process.argv.includes('--sync-only');

// 3. Execute k6
if (!syncOnly) {
  try {
    const envVars = [`PROFILE=${profile}`];
    if (process.env.BASE_URL) envVars.push(`BASE_URL=${process.env.BASE_URL}`);
    
    const envString = envVars.map(v => `-e ${v}`).join(' ');
    const summaryExport = `--summary-export=${path.join(reportDir, 'summary.json')}`;
    
    execSync(`k6 run ${envString} ${summaryExport} ${bundlePath}`, {
      stdio: 'inherit',
      shell: true,
    });
    
    // 4. Sync CSV Status after successful run
    syncCsvStatus(reportDir);

  } catch (error) {
    // Even on threshold failure, we want to sync the statuses we captured
    syncCsvStatus(reportDir);
    process.exit(1);
  }
} else {
  console.log(`\n🔄 Sync Mode: Processing existing reports for "${profile}"...`);
  syncCsvStatus(reportDir);
}

/**
 * syncCsvStatus - Parses k6 summary and updates TEST_CASES.csv
 */
function syncCsvStatus(dir) {
  const summaryPath = path.join(dir, 'summary.json');
  const csvPath = path.join('test-cases', 'TEST_CASES.csv');

  if (!fs.existsSync(summaryPath) || !fs.existsSync(csvPath)) {
    console.warn('⚠️  Warning: summary.json or TEST_CASES.csv not found. Skipping sync.');
    return;
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    let csvLines = fs.readFileSync(csvPath, 'utf8').split('\n');

    const resultsById = {};

    // Recursively extract checks from all groups
    const extract = (group) => {
      if (group.checks) {
        const checks = Array.isArray(group.checks) ? group.checks : Object.values(group.checks);
        checks.forEach(c => {
          const match = c.name.match(/\[(TC-[^\]]+)\]/);
          if (match) {
            const id = match[1];
            if (!resultsById[id]) resultsById[id] = { passes: 0, fails: 0 };
            resultsById[id].passes += c.passes;
            resultsById[id].fails += c.fails;
          }
        });
      }
      if (group.groups) {
        const groups = Array.isArray(group.groups) ? group.groups : Object.values(group.groups);
        groups.forEach(extract);
      }
    };

    extract(summary.root_group);

    // Update CSV lines
    const updatedLines = csvLines.map((line, idx) => {
      if (idx === 0 || !line.trim()) return line;
      const parts = line.split(',');
      if (parts.length < 4) return line;

      const id = parts[0].trim();
      if (resultsById[id]) {
        // Status is Pass only if 0 failures occurred for this ID
        parts[3] = resultsById[id].fails === 0 ? 'Pass' : 'Fail';
      }
      return parts.join(',');
    });

    fs.writeFileSync(csvPath, updatedLines.join('\n'));
    console.log(`\n✅ SQA Sync: TEST_CASES.csv updated with latest results.`);
  } catch (err) {
    console.error(`❌ SQA Sync Error: ${err.message}`);
  }
}
