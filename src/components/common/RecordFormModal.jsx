/**
 * RecordFormModal — Schema-driven Add / Edit form for any module.
 * Enhanced with:
 * - Option 1: Company Name Search Picker for Company ID & Auto-Generated Opportunity ID
 * - Option 2: Categorized, labeled section tabs (Role & Company, Eligibility, Package & Dates)
 * - Option 3: Quick-click stream chips for Eligible Streams (Finance, Marketing, HR, MCA, Analytics)
 * - Option 4: Live CTC / Salary format & LPA preview
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, PlusCircle, Edit3, AlertCircle, Search,
  GraduationCap, Building2, Check, ChevronDown, Sparkles, UserCheck, Briefcase, ExternalLink,
  IndianRupee, Tag, CheckCircle2
} from 'lucide-react';

const QUICK_STREAMS = ['Finance', 'Marketing', 'HR', 'Business Analyst', 'MCA', 'All Streams'];

const OPPORTUNITY_TABS = [
  {
    id: 'role',
    label: '🏢 Role & Company',
    keys: ['Opportunity ID', 'Company ID', 'Role Title', 'Opportunity Type', 'Location', 'Work Mode', 'Openings Count', 'Number of Openings']
  },
  {
    id: 'eligibility',
    label: '🎓 Eligibility & Streams',
    keys: ['Eligible Programme', 'Eligible Streams', 'Required Skills', 'Eligibility Criteria', 'Target Batch', 'Backlogs Allowed']
  },
  {
    id: 'package',
    label: '💰 Package & Key Dates',
    keys: ['Total CTC', 'Offered CTC / Stipend', 'Fixed Pay', 'Variable Pay', 'Salary Period/Currency', 'Opportunity Status', 'Open Date', 'Drive Date', 'Deadline', 'Application Deadline', 'JD URL', 'Application URL', 'Application URL / Link', 'Placement Owner', 'Last Verified On', 'Additional Perks', 'Bond/Service Agreement Details', 'Selection Process']
  },
  {
    id: 'jd',
    label: '📖 Job Description (JD)',
    keys: ['JD Description']
  }
];

const APPLICATION_TABS = [
  {
    id: 'mapping',
    label: '📋 Candidate & Job Mapping',
    keys: ['Application ID', 'Student ID', 'Opportunity ID', 'Current Stage', 'Applied On', 'Application Channel']
  },
  {
    id: 'interview',
    label: '🎙️ Interview & Actions',
    keys: ['Next Action', 'Next Action Date', 'Next Action Owner', 'Stage Updated On']
  },
  {
    id: 'verification',
    label: '🔍 Verification & Resume',
    keys: ['Eligibility Checked', 'Student Interest Confirmed', 'Resume File ID Used']
  },
  {
    id: 'offer',
    label: '💼 Offer & Joining Details',
    keys: ['Final Outcome', 'Rejection/Withdrawal Reason', 'Offer Date', 'Offered Fixed Pay', 'Offered Variable Pay', 'Offered CTC', 'Offer Response', 'Expected Joining Date', 'Actual Joining Date']
  }
];

function buildEmptyRecord(columns) {
  const rec = {};
  columns.forEach(col => {
    rec[col.key] = col.type === 'number' || col.type === 'currency' ? '' : '';
  });
  return rec;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const match = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === match[2].toLowerCase());
    if (monthIdx >= 0) {
      const month = String(monthIdx + 1).padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}

function fromIsoDate(iso) {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthNum = parseInt(match[2], 10);
    const day = match[3];
    const monthName = MONTH_NAMES[monthNum - 1] || 'Jan';
    return `${day}-${monthName}-${year}`;
  }
  return iso;
}

/**
 * Searchable Student Picker component
 */
function StudentPicker({ value, allStudents = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedStudent = useMemo(() => {
    if (!value) return null;
    return allStudents.find(
      s => s['Student ID'] === value || s['College Registration/USN'] === value
    ) || null;
  }, [value, allStudents]);

  const matches = useMemo(() => {
    if (!query.trim()) return allStudents;
    const q = query.toLowerCase();
    return allStudents.filter(s =>
      String(s['Full Name'] || s['Student Name'] || '').toLowerCase().includes(q) ||
      String(s['Student ID'] || '').toLowerCase().includes(q) ||
      String(s['College Registration/USN'] || '').toLowerCase().includes(q)
    );
  }, [query, allStudents]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedStudent) {
    return (
      <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedStudent['Full Name'] || selectedStudent['Student Name']}
            </div>
            <div className="text-[10px] text-blue-700 font-mono font-medium truncate">
              {selectedStudent['Student ID']} • {selectedStudent['Programme']} {selectedStudent['Primary Specialisation'] ? `(${selectedStudent['Primary Specialisation']})` : ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect('', null);
            setQuery('');
            setIsOpen(true);
          }}
          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-100/70 border border-blue-200 px-2 py-1 rounded-md transition-colors shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search student by name, USN, or ID..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto z-50 p-1 divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
            <span>All Students ({matches.length})</span>
            <span className="text-[9px] font-normal text-slate-400">Scroll to view all</span>
          </div>
          {matches.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No students found for "{query}".
            </div>
          ) : (
            matches.map(s => {
              const name = s['Full Name'] || s['Student Name'];
              const id = s['Student ID'];
              const usn = s['College Registration/USN'];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelect(id, s);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full p-2 text-left hover:bg-blue-50 rounded-lg flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                        {name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {id} {usn && usn !== id ? `• ${usn}` : ''} • {s['Programme']} {s['Primary Specialisation'] || ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 shrink-0 pl-2">
                    Select →
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Searchable Company Picker component (for Company ID)
 */
function CompanyPicker({ value, allCompanies = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedCompany = useMemo(() => {
    if (!value) return null;
    return allCompanies.find(c => c['Company ID'] === value || c['Company Name'] === value) || null;
  }, [value, allCompanies]);

  const matches = useMemo(() => {
    if (!query.trim()) return allCompanies;
    const q = query.toLowerCase();
    return allCompanies.filter(c =>
      String(c['Company Name'] || '').toLowerCase().includes(q) ||
      String(c['Company ID'] || '').toLowerCase().includes(q) ||
      String(c['Industry'] || '').toLowerCase().includes(q)
    );
  }, [query, allCompanies]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCompany) {
    return (
      <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {selectedCompany['Company Name']}
            </div>
            <div className="text-[10px] text-indigo-700 font-mono font-medium truncate">
              {selectedCompany['Company ID']} {selectedCompany['Industry'] ? `• ${selectedCompany['Industry']}` : ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect('', null);
            setQuery('');
            setIsOpen(true);
          }}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-100/70 border border-indigo-200 px-2 py-1 rounded-md transition-colors shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search company by name, industry, or ID (e.g. Dell, Radiall, JMR)..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto z-50 p-1 divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
            <span>All Companies ({matches.length})</span>
            <span className="text-[9px] font-normal text-slate-400">Scroll to view all</span>
          </div>
          {matches.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No companies found for "{query}".
            </div>
          ) : (
            matches.map(c => {
              const compName = c['Company Name'];
              const compId = c['Company ID'];
              const industry = c['Industry'];
              return (
                <button
                  key={compId}
                  type="button"
                  onClick={() => {
                    onSelect(compId, c);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full p-2 text-left hover:bg-indigo-50 rounded-lg flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                        {compName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {compId} {industry ? `• ${industry}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 shrink-0 pl-2">
                    Select →
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Searchable Opportunity Picker component (for Foreign Key mapping in applications)
 */
function OpportunityPicker({ value, allOpportunities = [], allCompanies = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOpp = useMemo(() => {
    if (!value) return null;
    return allOpportunities.find(o => o['Opportunity ID'] === value) || null;
  }, [value, allOpportunities]);

  const matches = useMemo(() => {
    if (!query.trim()) return allOpportunities;
    const q = query.toLowerCase();
    return allOpportunities.filter(o =>
      String(o['Company Name'] || '').toLowerCase().includes(q) ||
      String(o['Opportunity ID'] || '').toLowerCase().includes(q) ||
      String(o['Role Title'] || o['Role'] || '').toLowerCase().includes(q)
    );
  }, [query, allOpportunities]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedOpp) {
    const compName = selectedOpp['Company Name'] || 'Company';
    const roleTitle = selectedOpp['Role Title'] || selectedOpp['Role'] || 'Role';
    return (
      <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {compName}
            </div>
            <div className="text-[10px] text-indigo-700 font-mono font-medium truncate">
              {selectedOpp['Opportunity ID']} • {roleTitle}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect('', null);
            setQuery('');
            setIsOpen(true);
          }}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-100/70 border border-indigo-200 px-2 py-1 rounded-md transition-colors shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search opportunity by company, role, or ID (e.g. Dell, Radiall)..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto z-50 p-1 divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
            <span>All Companies & Opportunities ({matches.length})</span>
            <span className="text-[9px] font-normal text-slate-400">Scroll to view all</span>
          </div>
          {matches.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No opportunities found for "{query}".
            </div>
          ) : (
            matches.map(o => {
              const comp = o['Company Name'] || 'Company';
              const role = o['Role Title'] || o['Role'] || 'Role';
              const oppId = o['Opportunity ID'];
              return (
                <button
                  key={oppId}
                  type="button"
                  onClick={() => {
                    onSelect(oppId, o);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full p-2 text-left hover:bg-indigo-50 rounded-lg flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                        {comp}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {oppId} • {role}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 shrink-0 pl-2">
                    Select →
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export const RecordFormModal = ({
  isOpen,
  onClose,
  moduleConfig,
  existingRecord,
  onSave,
  allStudents = [],
  allStudentFiles = [],
  allCompanies = [],
  allOpportunities = [],
  allRecords = [],
}) => {
  const isEditMode = Boolean(existingRecord);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(0);

  const prevIsOpenRef = useRef(false);
  const prevRecordKeyRef = useRef(null);

  const primaryColKey = moduleConfig?.primaryId || 'id';
  const recordKey = existingRecord ? existingRecord[primaryColKey] : '__new__';

  // Compute tabs based on module
  const tabs = useMemo(() => {
    if (moduleConfig.id === 'opportunities') return OPPORTUNITY_TABS;
    if (moduleConfig.id === 'applications') return APPLICATION_TABS;

    // Default: group columns into sections of 10
    const total = Math.ceil(moduleConfig.columns.length / 10);
    return Array.from({ length: total }, (_, i) => ({
      id: `section_${i}`,
      label: total === 1 ? 'Record Details' : `Section ${i + 1}`,
      keys: moduleConfig.columns.slice(i * 10, (i + 1) * 10).map(c => c.key)
    }));
  }, [moduleConfig]);

  // Initialize form data ONLY when modal is newly opened or switched to a different record
  useEffect(() => {
    if (isOpen) {
      const isNewlyOpened = !prevIsOpenRef.current;
      const isDifferentRecord = isEditMode && recordKey !== prevRecordKeyRef.current;

      if (isNewlyOpened || isDifferentRecord) {
        if (isEditMode && existingRecord) {
          setFormData({ ...existingRecord });
        } else {
          const initial = buildEmptyRecord(moduleConfig.columns);

          // Auto-generate Application ID if creating a new application record
          if (moduleConfig.id === 'applications') {
            let maxNum = 0;
            (allRecords || []).forEach(r => {
              const match = String(r['Application ID'] || '').match(/APP-(\d+)/i);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
              }
            });
            initial['Application ID'] = `APP-${String(maxNum + 1).padStart(4, '0')}`;
            initial['Applied On'] = fromIsoDate(new Date().toISOString().split('T')[0]);
            initial['Current Stage'] = 'Applied';
            initial['Eligibility Checked'] = 'Yes';
            initial['Student Interest Confirmed'] = 'Yes';
          }

          // Auto-generate Opportunity ID if creating a new opportunity record (Option 1)
          if (moduleConfig.id === 'opportunities') {
            let maxNum = 0;
            (allRecords || []).forEach(r => {
              const match = String(r['Opportunity ID'] || '').match(/EXP-(\d+)/i);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
              }
            });
            initial['Opportunity ID'] = `EXP-${String(maxNum + 1).padStart(3, '0')}`;
            initial['Opportunity Status'] = 'Open';
            initial['Opportunity Type'] = 'Full-time Placement';
            initial['Work Mode'] = 'Onsite';
            initial['Eligible Programme'] = 'Both MBA & MCA';
            initial['Location'] = 'Bengaluru';
          }

          setFormData(initial);
        }
        setErrors({});
        setPage(0);
      }
    }
    prevIsOpenRef.current = isOpen;
    prevRecordKeyRef.current = recordKey;
  }, [isOpen, isEditMode, recordKey, moduleConfig, allRecords]);

  if (!isOpen) return null;

  const currentTab = tabs[page] || tabs[0];
  const currentPageCols = moduleConfig.columns.filter(c => currentTab.keys.includes(c.key));
  // If on the last tab, also include any columns that were not explicitly categorized
  if (page === tabs.length - 1) {
    const allAssigned = tabs.flatMap(t => t.keys);
    const unassigned = moduleConfig.columns.filter(c => !allAssigned.includes(c.key));
    currentPageCols.push(...unassigned);
  }

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    const primaryCol = moduleConfig.columns.find(
      c => c.isPrimary || c.key === moduleConfig.primaryId
    );
    if (primaryCol) {
      const val = formData[primaryCol.key];
      if (!val || String(val).trim() === '') {
        newErrors[primaryCol.key] = `${primaryCol.label} is required (Primary ID).`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      const primaryCol = moduleConfig.columns.find(
        c => c.isPrimary || c.key === moduleConfig.primaryId
      );
      if (primaryCol) {
        const tabIdx = tabs.findIndex(t => t.keys.includes(primaryCol.key));
        if (tabIdx >= 0) setPage(tabIdx);
      }
      return;
    }
    onSave({ ...formData });
    onClose();
  };

  const renderFieldInput = (col) => {
    const baseClass = 'w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
    const value = formData[col.key];

    // Special: Student Picker for Student ID
    if (col.key === 'Student ID') {
      return (
        <StudentPicker
          value={value}
          allStudents={allStudents}
          onSelect={(id, studentObj) => {
            handleFieldChange('Student ID', id);
            if (studentObj) {
              handleFieldChange('Student Name', studentObj['Full Name'] || studentObj['Student Name'] || '');
              if (studentObj['Primary Specialisation']) {
                handleFieldChange('Specialization', studentObj['Primary Specialisation']);
              }
              // Automatically map the student's Resume File ID
              const studentResume = (allStudentFiles || []).find(
                f => (f['Student ID'] === id || f['Student ID'] === studentObj['Student ID']) &&
                /resume/i.test(f['File Type'] || f['File Name'] || '')
              ) || (allStudentFiles || []).find(
                f => f['Student ID'] === id || f['Student ID'] === studentObj['Student ID']
              );

              if (studentResume && studentResume['File ID']) {
                handleFieldChange('Resume File ID Used', studentResume['File ID']);
              }
            }
          }}
        />
      );
    }

    // Special: Company Picker for Company ID (Option 1)
    if (col.key === 'Company ID') {
      return (
        <CompanyPicker
          value={value}
          allCompanies={allCompanies}
          onSelect={(compId, compObj) => {
            handleFieldChange('Company ID', compId);
            if (compObj) {
              handleFieldChange('Company Name', compObj['Company Name'] || '');
            }
          }}
        />
      );
    }

    // Special: Opportunity Picker for Opportunity ID (When mapping in applications)
    if (col.key === 'Opportunity ID' && moduleConfig.id !== 'opportunities') {
      return (
        <OpportunityPicker
          value={value}
          allOpportunities={allOpportunities}
          allCompanies={allCompanies}
          onSelect={(oppId, oppObj) => {
            handleFieldChange('Opportunity ID', oppId);
            if (oppObj) {
              handleFieldChange('Company Name', oppObj['Company Name'] || '');
            }
          }}
        />
      );
    }

    // Special: Auto-generated Opportunity ID indicator (Option 1)
    if (col.key === 'Opportunity ID' && moduleConfig.id === 'opportunities') {
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={value ?? ''}
            onChange={e => handleFieldChange(col.key, e.target.value)}
            placeholder="e.g. EXP-0858"
            className={`${baseClass} font-mono font-bold text-blue-700 bg-blue-50/40`}
          />
          {!isEditMode && (
            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Auto-generated sequential ID (editable if desired)
            </span>
          )}
        </div>
      );
    }

    // Special: Next Action / Interview Round with Quick Select Chips & Preset List
    if (col.key === 'Next Action' && moduleConfig.id === 'applications') {
      const interviewRounds = [
        'Technical Round 1',
        'Technical Round 2',
        'Group Discussion (GD)',
        'Technical & GD Interview',
        'Aptitude / Screening',
        'HR Interview',
        'Final Management Round'
      ];
      return (
        <div className="space-y-1.5">
          <input
            type="text"
            list="interview-rounds-list"
            value={value ?? ''}
            onChange={e => handleFieldChange(col.key, e.target.value)}
            placeholder="Select round or type next action (e.g. Technical Round 1)"
            className={baseClass}
          />
          <datalist id="interview-rounds-list">
            {interviewRounds.map(r => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Rounds:</span>
            {['Technical Round 1', 'Group Discussion (GD)', 'HR Interview'].map(round => {
              const isSelected = value === round;
              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => handleFieldChange(col.key, round)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isSelected ? `✓ ${round}` : `+ ${round}`}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Special: Quick Stream Chips for Eligible Streams (Option 3)
    if (col.key === 'Eligible Streams') {
      return (
        <div className="space-y-1.5">
          <input
            type="text"
            value={value ?? ''}
            onChange={e => handleFieldChange(col.key, e.target.value)}
            placeholder="Enter Eligible Streams (e.g. Finance, Marketing, MCA)"
            className={baseClass}
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Select:</span>
            {QUICK_STREAMS.map(stream => {
              const currentVal = String(value || '');
              const isSelected = stream === 'All Streams'
                ? ['Finance', 'Marketing', 'HR', 'Business Analyst', 'MCA'].every(s => currentVal.includes(s))
                : currentVal.toLowerCase().includes(stream.toLowerCase());

              return (
                <button
                  key={stream}
                  type="button"
                  onClick={() => {
                    let parts = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
                    if (stream === 'All Streams') {
                      if (isSelected) {
                        parts = [];
                      } else {
                        parts = ['Finance', 'Marketing', 'HR', 'Business Analyst', 'MCA'];
                      }
                    } else {
                      if (parts.some(p => p.toLowerCase() === stream.toLowerCase())) {
                        parts = parts.filter(p => p.toLowerCase() !== stream.toLowerCase());
                      } else {
                        parts.push(stream);
                      }
                    }
                    handleFieldChange(col.key, parts.join(', '));
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isSelected ? `✓ ${stream}` : `+ ${stream}`}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Special: Resume File ID Used Auto-Mapped Selector / Preview
    if (col.key === 'Resume File ID Used') {
      const studentId = formData['Student ID'];
      const studentFilesList = (allStudentFiles || []).filter(
        f => f['Student ID'] === studentId
      );
      const currentFile = (allStudentFiles || []).find(f => f['File ID'] === value);

      return (
        <div className="space-y-1.5">
          {studentFilesList.length > 0 ? (
            <select
              value={value ?? ''}
              onChange={e => handleFieldChange(col.key, e.target.value)}
              className={baseClass}
            >
              <option value="">— Select Student File / Resume —</option>
              {studentFilesList.map(f => (
                <option key={f['File ID']} value={f['File ID']}>
                  {f['File ID']} — {f['File Name'] || f['File Type'] || 'Resume'} {f['Version'] ? `(v${f['Version']})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value ?? ''}
              onChange={e => handleFieldChange(col.key, e.target.value)}
              placeholder="Enter Resume File ID (e.g. FILE-0001)"
              className={baseClass}
            />
          )}

          {value && (
            <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg shadow-2xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Auto-mapped: <strong className="font-mono">{value}</strong>
                  {currentFile?.['File Name'] ? ` (${currentFile['File Name']})` : ''}
                </span>
              </div>
              {currentFile?.['File URL'] && (
                <a
                  href={currentFile['File URL']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold underline shrink-0 inline-flex items-center gap-0.5 ml-2"
                >
                  <span>View</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}
        </div>
      );
    }

    if (col.type === 'enum' && col.options && col.options.length > 0) {
      return (
        <select
          value={value ?? ''}
          onChange={e => handleFieldChange(col.key, e.target.value)}
          className={baseClass}
        >
          <option value="">— Select {col.label} —</option>
          {col.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'date') {
      return (
        <input
          type="date"
          value={toIsoDate(value)}
          onChange={e => {
            const iso = e.target.value;
            handleFieldChange(col.key, iso ? fromIsoDate(iso) : null);
          }}
          className={baseClass}
        />
      );
    }

    if (col.type === 'time') {
      return (
        <input
          type="time"
          value={value ?? ''}
          onChange={e => handleFieldChange(col.key, e.target.value)}
          className={baseClass}
        />
      );
    }

    // Special: Currency / CTC / Salary with Live Formatter Preview (Option 4)
    if (col.type === 'number' || col.type === 'currency' || col.key.includes('CTC') || col.key.includes('Pay') || col.key.includes('Stipend')) {
      const numVal = Number(value);
      const isSalary = col.type === 'currency' || col.key.includes('CTC') || col.key.includes('Pay') || col.key.includes('Stipend');

      return (
        <div className="space-y-1">
          <input
            type="number"
            step={col.type === 'currency' ? '0.01' : '1'}
            min="0"
            value={value ?? ''}
            onChange={e => handleFieldChange(col.key, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={col.type === 'currency' ? '0.00' : '0'}
            className={baseClass}
          />
          {isSalary && numVal > 0 && (
            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
              <IndianRupee className="w-3 h-3 text-emerald-600" />
              <span>₹ {numVal.toLocaleString('en-IN')}</span>
              {numVal >= 100000 && (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1 rounded">
                  {(numVal / 100000).toFixed(2)} LPA
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    // Special: Multiline Job Description (JD) Area
    if (col.key === 'JD Description') {
      return (
        <div className="space-y-1.5">
          <textarea
            rows={10}
            value={value ?? ''}
            onChange={e => handleFieldChange(col.key, e.target.value)}
            placeholder="Paste complete Job Description, Role Overview, Key Responsibilities, Qualifications, etc..."
            className={`${baseClass} resize-y font-normal leading-relaxed text-xs`}
          />
          <p className="text-[11px] text-slate-500">
            This will be displayed in the Opportunity Details Drawer under &quot;Job Description &amp; Responsibilities&quot;.
          </p>
        </div>
      );
    }

    // Long text fields: Eligibility Criteria, Required Skills, Selection Process, Details, Perks
    if (
      ['Eligibility Criteria', 'Required Skills', 'Selection Process', 'Bond/Service Agreement Details', 'Additional Perks'].includes(col.key) ||
      col.key.toLowerCase().includes('criteria') ||
      col.key.toLowerCase().includes('reason')
    ) {
      return (
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={e => handleFieldChange(col.key, e.target.value)}
          placeholder={`Enter ${col.label}...`}
          className={`${baseClass} resize-y font-normal leading-relaxed text-xs`}
        />
      );
    }

    if (col.type === 'url') {
      return (
        <input
          type="url"
          value={value ?? ''}
          onChange={e => handleFieldChange(col.key, e.target.value)}
          placeholder="https://"
          className={baseClass}
        />
      );
    }

    return (
      <input
        type="text"
        value={value ?? ''}
        onChange={e => handleFieldChange(col.key, e.target.value)}
        placeholder={`Enter ${col.label}`}
        className={baseClass}
      />
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        <div className="min-h-screen px-4 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isEditMode ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isEditMode ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode ? 'Edit Record' : 'Add New Record'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {moduleConfig.title} — {moduleConfig.id === 'opportunities' ? 'Corporate Opportunity Entry' : moduleConfig.id === 'applications' ? 'Student & Placement Mapping' : 'Entry Form'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categorized Tabs (Option 2) */}
            {tabs.length > 1 && (
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {tabs.map((tab, idx) => {
                  const isActive = idx === page;
                  const hasTabError = tab.keys.some(k => Boolean(errors[k]));
                  return (
                    <button
                      key={tab.id || idx}
                      type="button"
                      onClick={() => setPage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {hasTabError && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Form Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentPageCols.map(col => {
                  const isPrimary = col.isPrimary || col.key === moduleConfig.primaryId;
                  const hasError = Boolean(errors[col.key]);
                  const isWideCol = col.key === 'Student ID' || col.key === 'Company ID' || col.key === 'Opportunity ID' || col.key === 'Eligible Streams' || col.key === 'Resume File ID Used' || col.key === 'Next Action' || col.key.includes('Criteria') || col.key.includes('Skills') || col.key.includes('Details') || col.key.includes('Process') || col.key.includes('JD') || col.key.includes('Description');

                  return (
                    <div key={col.key} className={`space-y-1 ${hasError || isWideCol ? 'col-span-full' : ''}`}>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <span>{col.label}</span>
                        {isPrimary && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase tracking-wide">
                            Primary ID
                          </span>
                        )}
                        {col.isForeignKey && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded uppercase tracking-wide">
                            FK
                          </span>
                        )}
                      </label>
                      {renderFieldInput(col)}
                      {hasError && (
                        <div className="flex items-center gap-1 text-xs text-rose-600">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{errors[col.key]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {page > 0 && (
                  <button
                    type="button"
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    ← Previous Tab
                  </button>
                )}
                {page < tabs.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Next Tab →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                    isEditMode
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isEditMode ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
