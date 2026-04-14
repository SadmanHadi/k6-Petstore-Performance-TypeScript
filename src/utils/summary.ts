// @ts-ignore
import { textSummary } from '../vendor/k6-summary.js';
// @ts-ignore
import { htmlReport } from '../vendor/k6-reporter.js';

export function generateReports(data: any, profileName: string) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`reports/k6/${profileName}/summary.json`]: JSON.stringify(data),
    [`reports/k6/${profileName}/report.html`]: htmlReport(data),
  };
}
