import * as XLSX from 'xlsx';
import { MODULES_CONFIG } from '@/config/modulesConfig';
import { initialDatabase, MODULE_DATA_KEY_MAP } from '@/data/mockData';

/**
 * Fallback sample records for modules that might not have mock data (e.g., applicationHistory)
 */
const FALLBACK_MODULE_SAMPLES = {
  'application-history': [
    {
      'Event ID': 'EVT-0001',
      'Application ID': 'APP-0001',
      'Event Date': '15-Aug-2026',
      'Previous Stage': 'Applied',
      'New Stage': 'Shortlisted',
      'Interview Round': 'Resume Screening',
      'Interview Date': '18-Aug-2026',
      'Result': 'Shortlisted',
      'Feedback': 'Strong academic background and core problem solving skills.',
      'Evidence URL': 'https://example.com/resumes/screening_001.pdf',
      'Updated By': 'Placement Team',
      'Next Action': 'Schedule Technical Interview',
      'Next Action Date': '20-Aug-2026'
    },
    {
      'Event ID': 'EVT-0002',
      'Application ID': 'APP-0002',
      'Event Date': '22-Aug-2026',
      'Previous Stage': 'Shortlisted',
      'New Stage': 'Interview',
      'Interview Round': 'Round 1 Technical',
      'Interview Date': '25-Aug-2026',
      'Result': 'Cleared',
      'Feedback': 'Cleared technical assessment with distinction; good system design concept.',
      'Evidence URL': 'https://example.com/interviews/tech_eval_002.pdf',
      'Updated By': 'Technical Panel',
      'Next Action': 'Schedule HR Round',
      'Next Action Date': '28-Aug-2026'
    },
    {
      'Event ID': 'EVT-0003',
      'Application ID': 'APP-0003',
      'Event Date': '01-Sep-2026',
      'Previous Stage': 'Interview',
      'New Stage': 'Offered',
      'Interview Round': 'HR & Culture Fit',
      'Interview Date': '03-Sep-2026',
      'Result': 'Selected',
      'Feedback': 'Excellent culture fit; compensation package approved and released.',
      'Evidence URL': 'https://example.com/offers/offer_letter_003.pdf',
      'Updated By': 'Head of Placements',
      'Next Action': 'Candidate Acceptance',
      'Next Action Date': '10-Sep-2026'
    }
  ]
};

/**
 * Extract or generate exactly 3 sample records for a given module matching its column schema
 * @param {string} moduleId 
 * @param {Array|object} customData Optional module data or db object
 * @returns {Array} Array of 3 sample record objects
 */
export function getSampleRecordsForModule(moduleId, customData) {
  const moduleConfig = MODULES_CONFIG[moduleId] || MODULES_CONFIG['students'];
  if (!moduleConfig) return [];

  const columns = moduleConfig.columns || [];
  const expectedHeaders = columns.map(c => c.key);

  // Determine source data
  let sourceList = [];
  if (Array.isArray(customData) && customData.length > 0) {
    sourceList = customData;
  } else if (customData && typeof customData === 'object') {
    const key = MODULE_DATA_KEY_MAP[moduleId];
    if (key && Array.isArray(customData[key])) {
      sourceList = customData[key];
    }
  }

  if (sourceList.length === 0) {
    const key = MODULE_DATA_KEY_MAP[moduleId];
    if (key && Array.isArray(initialDatabase[key])) {
      sourceList = initialDatabase[key];
    }
  }

  // Fallbacks if available
  if (sourceList.length === 0 && FALLBACK_MODULE_SAMPLES[moduleId]) {
    sourceList = FALLBACK_MODULE_SAMPLES[moduleId];
  }

  const sampleRows = [];
  for (let i = 0; i < 3; i++) {
    const rawRecord = sourceList[i] || sourceList[0] || {};
    const row = {};

    columns.forEach(col => {
      const key = col.key;
      let val = rawRecord[key];

      // Provide sensible sample default if undefined or blank
      if (val === undefined || val === null || val === '') {
        if (col.isPrimary) {
          const prefix = (moduleConfig.primaryId || 'ID').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
          val = `${prefix}-${String(i + 1).padStart(4, '0')}`;
        } else if (col.type === 'number') {
          val = (i + 1) * 10;
        } else if (col.type === 'date') {
          val = `2026-09-0${i + 1}`;
        } else if (col.type === 'boolean') {
          val = 'Yes';
        } else if (col.options && col.options.length > 0) {
          val = col.options[i % col.options.length];
        } else if (col.type === 'email') {
          val = `student${i + 1}@soundarya.edu.in`;
        } else if (col.type === 'phone') {
          val = `+91 98765 4321${i}`;
        } else {
          val = `Sample ${col.label || key} ${i + 1}`;
        }
      }

      row[key] = val;
    });

    sampleRows.push(row);
  }

  return sampleRows;
}

/**
 * Generate and trigger download of a formatted Sample Import Excel (.xlsx) file
 * with 3 realistic sample data rows matching the module's exact columns.
 * @param {string} moduleId 
 * @param {Array|object} customData Optional existing records to sample from
 */
export function downloadSampleImportExcel(moduleId, customData) {
  const moduleConfig = MODULES_CONFIG[moduleId] || MODULES_CONFIG['students'];
  if (!moduleConfig) return;

  const expectedHeaders = moduleConfig.columns.map(c => c.key);
  const sampleRows = getSampleRecordsForModule(moduleId, customData);

  // Convert to SheetJS worksheet with explicit header order
  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: expectedHeaders });

  // Calculate dynamic column widths for clean readability
  worksheet['!cols'] = expectedHeaders.map(header => {
    let maxLen = header.length;
    sampleRows.forEach(row => {
      const valStr = String(row[header] !== undefined && row[header] !== null ? row[header] : '');
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
  });

  // Create workbook and append sheet (Excel sheet names limited to 31 chars)
  const workbook = XLSX.utils.book_new();
  const sheetName = (moduleConfig.sheetName || moduleConfig.title || 'Data').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate binary output and trigger browser download
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Sample_Import_${moduleConfig.sheetName || moduleId}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
