import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'metrics.csv');

// Initialize the file with headers if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'timestamp,type,metric,value,details\n');
}

export const logMetric = (type, metric, value, details = '') => {
  const timestamp = Date.now();
  // Format: Timestamp, Category, Specific Metric, Number Value, Extra Info
  const line = `${timestamp},${type},${metric},${value},${details}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (err) {
    console.error('Failed to write metric:', err);
  }
};