import * as moment from 'moment-timezone';
import { DEFAULT_FORMAT_DATETIME_WITH_SECONDS } from './constants';

export function parseInput(flags: any, argv: string[]) {
  const parsedFlags: string[] = [];
  Object.keys(flags).forEach((e) => {
    parsedFlags.push(`--${flags[e].name}`);
    parsedFlags.push(`-${flags[e].char}`);
  });
  return argv.filter((arg) => !parsedFlags.includes(arg));
}

export function validateFunctionName(functionName) {
  if (/^\w+$/.test(functionName)) {
    return true;
  }
  return 'Invalid name only A-Z, 0-9, _ allowed!';
}

export function validateFunctionDescription(description) {
  if (description !== '') {
    return true;
  }
  return 'Description cannot be empty!';
}

export function transformToCSV(metrics, headerLabels) {
  const replacer = (_: any, value: null) => (value === null ? '' : value);
  const headers = Object.keys(metrics[0]);
  const csv = [
    headerLabels
      ? headers.map((header) => headerLabels[header] || 'MISSING HEADER LABEL')
      : headers.join(','),
    ...metrics.map((row) =>
      headers
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(','),
    ),
  ].join('\r\n');
  return csv;
}

export function formatDate(date: string): string {
  const timezone = moment.tz.guess(true);
  return moment(date).tz(timezone).format(DEFAULT_FORMAT_DATETIME_WITH_SECONDS);
}
