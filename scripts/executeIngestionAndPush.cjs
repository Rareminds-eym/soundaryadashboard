const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function main() {
  console.log('--- Starting Student Company Mapping Ingestion ---');

  const mockDataPath = path.resolve('src/data/mockData.json');
  const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

  const excelPath = path.resolve('Student Profile and Portfolio registartion (1).xlsx');
  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets['student company mapping'];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });

  console.log(`Loaded ${rows.length} rows from Excel sheet "student company mapping"`);

  // 1. Students
  const students = [...mockData.students];
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const studentMap = new Map();
  students.forEach(s => studentMap.set(norm(s['Full Name']), s));

  // Handle aliases
  const chaithraMarketing = students.find(s => s['Student ID'] === 'P03KU24M015049');
  if (chaithraMarketing) {
    studentMap.set(norm('Chaithra N - marketing'), chaithraMarketing);
  }

  let createdStudentsCount = 0;
  if (!studentMap.has(norm('Harsha'))) {
    const harsha = {
      'Student ID': 'P03KU24M015012',
      'College Registration/USN': 'P03KU24M015012',
      'Full Name': 'Harsha',
      Programme: 'MBA',
      Batch: '2024-26',
      'Primary Specialisation': 'HR',
      'Secondary Specialisation': null,
      'Assigned Training Stream': 'HR',
      Email: 'harsha.sims@gmail.com',
      Mobile: '9880000001',
      'Registration Date': '03-Sep-2026',
      'Internship Status': 'In Progress',
      'Training Participation Status': 'Registered',
      'Placement Interest': 'Seeking Placement',
      'Record Updated On': null
    };
    students.push(harsha);
    studentMap.set(norm('Harsha'), harsha);
    createdStudentsCount++;
    console.log(`Created student: Harsha (P03KU24M015012)`);
  }

  if (!studentMap.has(norm('Likhitha B'))) {
    const likhitha = {
      'Student ID': 'P03KU24M015086',
      'College Registration/USN': 'P03KU24M015086',
      'Full Name': 'Likhitha B',
      Programme: 'MBA',
      Batch: '2024-26',
      'Primary Specialisation': 'HR',
      'Secondary Specialisation': null,
      'Assigned Training Stream': 'HR',
      Email: 'likhitha.b.sims@gmail.com',
      Mobile: '9880000002',
      'Registration Date': '03-Sep-2026',
      'Internship Status': 'In Progress',
      'Training Participation Status': 'Registered',
      'Placement Interest': 'Seeking Placement',
      'Record Updated On': null
    };
    students.push(likhitha);
    studentMap.set(norm('Likhitha B'), likhitha);
    createdStudentsCount++;
    console.log(`Created student: Likhitha B (P03KU24M015086)`);
  }

  // 2. Companies
  const companies = [...mockData.companies];
  const companyMap = new Map();
  companies.forEach(c => companyMap.set(norm(c['Company Name']), c));

  let createdCompaniesCount = 0;
  const ensureCompany = (cName, industry, stream, role, jd) => {
    let cNorm = norm(cName);
    if (companyMap.has(cNorm)) return companyMap.get(cNorm);

    const maxId = companies
      .map(c => parseInt(c['Company ID'].replace('COMP-', ''), 10))
      .filter(n => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
    const newId = `COMP-${String(maxId + 1).padStart(3, '0')}`;

    const newComp = {
      'Company ID': newId,
      'Company Name': cName,
      Industry: industry,
      Website: null,
      Location: 'Bengaluru',
      'Relationship Owner': 'Rareminds Corporate Relations',
      'Recruiter Name': null,
      'Recruiter Email': null,
      'Recruiter Phone': null,
      'Relationship Status': 'Active',
      'Last Contact Date': null,
      'Next Follow-up': null,
      'Mapped Stream': stream,
      'Job Role': role,
      JD: jd
    };
    companies.push(newComp);
    companyMap.set(cNorm, newComp);
    createdCompaniesCount++;
    console.log(`Created new company: ${newId} - ${cName}`);
    return newComp;
  };

  const compPfc = ensureCompany('PFC', 'Financial Services & Energy', 'Finance', 'Finance Executive / Analyst', 'EXP-MBA-PFC');
  const compLegion = ensureCompany('Legion Energy', 'Renewable Energy & Power', 'HR', 'Management Trainee', 'EXP-MBA-LEGION');
  const compMona = ensureCompany('Mona Cream Jobs', 'Staffing & Recruiting', 'HR', 'HR & Marketing Associate', 'EXP-MBA-MONA');

  // 3. Opportunities
  const opportunities = [...mockData.opportunities];
  const oppMap = new Map();
  opportunities.forEach(o => {
    if (o['Opportunity ID']) oppMap.set(o['Opportunity ID'], o);
    if (o['Company ID']) oppMap.set(`comp_${o['Company ID']}`, o);
  });

  let createdOppsCount = 0;
  const ensureOpportunity = (oppId, comp, title, stream) => {
    if (oppMap.has(oppId)) return oppMap.get(oppId);

    const newOpp = {
      'Opportunity ID': oppId,
      'Company ID': comp['Company ID'],
      'Role Title': title,
      'Opportunity Type': 'Job',
      'Eligible Programme': 'MBA',
      'Eligible Streams': stream,
      'Required Skills': 'Communication, Domain knowledge, Problem Solving',
      'Eligibility Criteria': 'MBA candidates with relevant specialisation',
      Location: 'Bengaluru',
      'Work Mode': 'Onsite',
      'Fixed Pay': 350000,
      'Variable Pay': 50000,
      'Total CTC': 400000,
      'Salary Period/Currency': 'INR per annum',
      'Openings Count': 5,
      'JD URL': null,
      'Application URL': null,
      'Open Date': '15-Sep-2026',
      Deadline: '31-Oct-2026',
      'Opportunity Status': 'Open',
      'Placement Owner': 'Rareminds Corporate Placement Cell',
      'Last Verified On': '15-Oct-2026',
      'JD Description': `Job opportunity with ${comp['Company Name']} for ${title}.`,
      'Company Name': comp['Company Name']
    };
    opportunities.push(newOpp);
    oppMap.set(oppId, newOpp);
    oppMap.set(`comp_${comp['Company ID']}`, newOpp);
    createdOppsCount++;
    console.log(`Created new opportunity: ${oppId} for ${comp['Company Name']}`);
    return newOpp;
  };

  ensureOpportunity('EXP-MBA-PFC', compPfc, 'Finance Executive / Analyst', 'Finance');
  ensureOpportunity('EXP-MBA-LEGION', compLegion, 'Management Trainee', 'HR');
  ensureOpportunity('EXP-MBA-MONA', compMona, 'HR & Marketing Associate', 'HR');
  const compJmr = companyMap.get(norm('JMR'));
  if (compJmr) {
    ensureOpportunity('EXP-MBA-JMR', compJmr, 'Business Operations Associate', 'Finance');
  }

  // 4. Applications
  const applications = [...mockData.applications];
  const appKeyMap = new Map();
  applications.forEach(a => {
    const sNorm = norm(a['Student Name']);
    let cNorm = norm(a['Company Name']);
    if (cNorm.includes('jpmorgan')) cNorm = 'jpmorgan';
    if (cNorm.includes('citrine')) cNorm = 'citrineadvisory';
    appKeyMap.set(`${sNorm}__${cNorm}`, a);
  });

  function mapStageAndOutcome(company, appVal, statVal, interviewStatus, finalStatus) {
    let stage = 'Applied';
    let outcome = 'Ongoing';
    let offerResponse = 'Pending';
    let nextAction = 'Review Profile';

    const isRareminds = (company === 'Rareminds');

    const effStat = (statVal || '').trim();
    const effFinal = (finalStatus || '').trim();
    const effInterview = (interviewStatus || '').trim();

    if (isRareminds) {
      const combined = `${effFinal} ${effInterview} ${effStat}`.toLowerCase();
      if (combined.includes('selected') || combined.includes('select') || combined.includes('ready to join') || combined.includes('can join')) {
        stage = 'Offered';
        outcome = 'Offer Extended';
        offerResponse = (combined.includes('ready to join') || combined.includes('can join')) ? 'Accepted' : 'Pending';
        nextAction = 'Offer Letter Issuance';
      } else if (combined.includes('reject') || combined.includes('drop')) {
        stage = 'Rejected';
        outcome = combined.includes('drop') ? 'Withdrawn' : 'Rejected';
        nextAction = 'Closed';
      } else if (combined.includes('hold')) {
        stage = 'On Hold';
        outcome = 'Ongoing';
        nextAction = 'Under Review';
      } else {
        stage = 'Interview';
        outcome = 'Ongoing';
        nextAction = 'Interview Assessment';
      }
      return { stage, outcome, offerResponse, nextAction };
    }

    const statLower = effStat.toLowerCase();
    const appLower = (appVal || '').trim().toLowerCase();

    if (statLower.includes('reject') || statLower.includes('drop')) {
      stage = 'Rejected';
      outcome = statLower.includes('drop') ? 'Withdrawn' : 'Rejected';
      nextAction = 'Closed';
    } else if (statLower.includes('selected') || statLower.includes('select')) {
      stage = 'Offered';
      outcome = 'Offer Extended';
      nextAction = 'Offer Letter Issuance';
    } else if (statLower.includes('hold') || appLower.includes('hold')) {
      stage = 'On Hold';
      outcome = 'Ongoing';
      nextAction = 'Under Review';
    } else if (statLower.includes('shortlist') || appLower.includes('shortlist')) {
      stage = 'Shortlisted';
      outcome = 'Ongoing';
      nextAction = 'Interview Schedule Confirmation';
    } else if (statLower.includes('interview') || appLower.includes('interview') || statLower.includes('reschedule')) {
      stage = 'Interview';
      outcome = 'Ongoing';
      nextAction = 'Interview Schedule Confirmation';
    } else if (statLower.includes('feedback awaited') || appLower.includes('applied') || appLower.includes('profile shared')) {
      stage = 'Applied';
      outcome = 'Ongoing';
      nextAction = 'Awaiting Recruiter Feedback';
    } else if (appLower.includes('mapped')) {
      stage = 'Shortlisted';
      outcome = 'Ongoing';
      nextAction = 'Interview Schedule Confirmation';
    }

    return { stage, outcome, offerResponse, nextAction };
  }

  function parseCtc(ctcStr) {
    if (!ctcStr) return 0;
    const match = ctcStr.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      let num = parseFloat(match[1]);
      if (num < 100) num = num * 100000;
      return num;
    }
    return 0;
  }

  const compCols = [
    { key: 'JP Morgan', compCol: 'JP Morgan ', statCol: 'JP MORGAN-Company status' },
    { key: 'Dell', compCol: 'Dell ', statCol: 'Dell company status ' },
    { key: 'JMR', compCol: 'JMR ', statCol: 'JMR status' },
    { key: 'Citrine - Advisory', compCol: 'Citrine ', statCol: 'Citrine Status ' },
    { key: 'Apollo', compCol: 'Apollo ', statCol: 'Apollo Status' },
    { key: 'Diageo', compCol: 'Diageo', statCol: 'Diageo Status' },
    { key: 'PFC', compCol: 'PFC', statCol: 'PFC Status ' },
    { key: 'Radiall', compCol: 'Radial ', statCol: 'Radial Status ' },
    { key: 'Sutherland', compCol: 'Sutherland', statCol: 'Sutherland status' },
    { key: 'Legion Energy', compCol: 'Legion - chintamani ', statCol: 'Legion  status' },
    { key: 'Rareminds', compCol: 'Rareminds', statCol: 'Raraminds Status update ' }
  ];

  let maxAppNum = applications
    .map(a => parseInt((a['Application ID'] || '').replace('APP-', ''), 10))
    .filter(n => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);

  let updatedAppsCount = 0;
  let createdAppsCount = 0;

  rows.forEach((r, idx) => {
    const rawStudentName = (r['Student name '] || r['Student name'] || '').trim();
    if (!rawStudentName) return;

    const student = studentMap.get(norm(rawStudentName));
    if (!student) {
      console.warn(`Student not found for "${rawStudentName}"`);
      return;
    }

    const spec = (r['Specialization'] || '').trim();
    const ctc = (r['CTC'] || '').trim();
    const remark = (r['Remark'] || '').trim();
    const offerLetter = (r['Offer Letter'] || '').trim();
    const finalInterviewComp = (r['Final interview-15 oct 26'] || '').trim();
    const interviewStatus = (r['Interview Status'] || '').trim();
    const finalStatus = (r['Final Status'] || '').trim();
    const compMapped = (r['Company Mapped'] || '').trim();
    const compShortlists = (r['Company Shortlists'] || '').trim();

    let companiesFoundInRow = new Set();

    const processMapping = (companyName, appVal, statVal) => {
      let compObj = companyMap.get(norm(companyName));
      if (!compObj) {
        if (companyName.includes('Radiall') || companyName.includes('Radial')) compObj = companyMap.get(norm('Radiall'));
        if (companyName.includes('Citrine')) compObj = companyMap.get(norm('Citrine - Advisory'));
      }
      if (!compObj) {
        console.warn(`Company object not found: ${companyName}`);
        return;
      }

      const oppObj = opportunities.find(o => o['Company ID'] === compObj['Company ID']);
      const oppId = oppObj ? oppObj['Opportunity ID'] : (compObj['JD'] || 'EXP-GEN-001');

      const stageInfo = mapStageAndOutcome(compObj['Company Name'], appVal, statVal, interviewStatus, finalStatus);
      const numCtc = parseCtc(ctc);

      let cNorm = norm(compObj['Company Name']);
      if (cNorm.includes('jpmorgan')) cNorm = 'jpmorgan';
      if (cNorm.includes('citrine')) cNorm = 'citrineadvisory';
      const sNorm = norm(student['Full Name']);

      const appKey = `${sNorm}__${cNorm}`;
      const existing = appKeyMap.get(appKey);

      if (existing) {
        existing['Current Stage'] = stageInfo.stage;
        existing['Final Outcome'] = stageInfo.outcome;
        existing['Stage Updated On'] = '21-Oct-2026';
        existing['Next Action'] = stageInfo.nextAction;
        if (stageInfo.offerResponse === 'Accepted') {
          existing['Offer Response'] = 'Accepted';
        }
        if (numCtc > 0) {
          existing['Offered Fixed Pay'] = numCtc;
          existing['Offered CTC'] = numCtc;
        }
        if (stageInfo.stage === 'Offered' && !existing['Offer Date']) {
          existing['Offer Date'] = '15-Oct-2026';
        }
        if (remark && !existing['Rejection/Withdrawal Reason']) {
          existing['Rejection/Withdrawal Reason'] = remark;
        }
        updatedAppsCount++;
      } else {
        maxAppNum++;
        const newAppId = `APP-${String(maxAppNum).padStart(4, '0')}`;
        const newApp = {
          'Application ID': newAppId,
          'Student ID': student['Student ID'],
          'Opportunity ID': oppId,
          'Eligibility Checked': 'Yes',
          'Student Interest Confirmed': 'Yes',
          'Applied On': '21-Sep-2026',
          'Application Channel': 'Campus Placement Drive',
          'Resume File ID Used': null,
          'Current Stage': stageInfo.stage,
          'Stage Updated On': '21-Oct-2026',
          'Next Action': stageInfo.nextAction,
          'Next Action Owner': 'Rareminds Placement Cell',
          'Next Action Date': '25-Oct-2026',
          'Final Outcome': stageInfo.outcome,
          'Rejection/Withdrawal Reason': stageInfo.outcome === 'Rejected' || stageInfo.outcome === 'Withdrawn' ? (remark || 'Not shortlisted / Dropped') : null,
          'Offer Date': stageInfo.stage === 'Offered' ? '15-Oct-2026' : null,
          'Offered Fixed Pay': numCtc,
          'Offered Variable Pay': 0,
          'Offered CTC': numCtc,
          'Offer Response': stageInfo.offerResponse,
          'Expected Joining Date': (remark.includes('November') ? '02-Nov-2026' : null),
          'Actual Joining Date': null,
          'Student Name': student['Full Name'],
          'Company Name': compObj['Company Name'],
          Specialization: student['Primary Specialisation'] || spec || 'MBA'
        };
        applications.push(newApp);
        appKeyMap.set(appKey, newApp);
        createdAppsCount++;
      }
    };

    // 1. Specific columns
    compCols.forEach(c => {
      const val = (r[c.compCol] || '').trim();
      const stat = (r[c.statCol] || '').trim();
      if (val || stat) {
        companiesFoundInRow.add(c.key);
        processMapping(c.key, val, stat);
      }
    });

    // 2. Final interview company
    if (finalInterviewComp) {
      let normFinal = '';
      if (/rareminds/i.test(finalInterviewComp)) normFinal = 'Rareminds';
      if (normFinal && !companiesFoundInRow.has(normFinal)) {
        companiesFoundInRow.add(normFinal);
        processMapping(normFinal, 'Interview Scheduled', '');
      }
    }

    // 3. Mapped / shortlists
    const generalNames = [compMapped, compShortlists].filter(Boolean);
    generalNames.forEach(rawC => {
      const parts = rawC.split(/[+,/]/).map(p => p.trim()).filter(Boolean);
      parts.forEach(p => {
        let matchedComp = '';
        if (/jp\s*morgan/i.test(p)) matchedComp = 'Jp Morgan';
        else if (/dell/i.test(p)) matchedComp = 'Dell';
        else if (/diageo/i.test(p)) matchedComp = 'Diageo';
        else if (/rad/i.test(p)) matchedComp = 'Radiall';
        else if (/rareminds/i.test(p) || /raraminds/i.test(p)) matchedComp = 'Rareminds';
        else if (/sutherland/i.test(p)) matchedComp = 'Sutherland';
        else if (/legion/i.test(p)) matchedComp = 'Legion Energy';
        else if (/citrine/i.test(p)) matchedComp = 'Citrine - Advisory';
        else if (/apollo/i.test(p)) matchedComp = 'Apollo';
        else if (/pfc/i.test(p)) matchedComp = 'PFC';
        else if (/jmr/i.test(p)) matchedComp = 'JMR';
        else if (/brickwork/i.test(p)) matchedComp = 'Brickwork India';
        else if (/mona/i.test(p)) matchedComp = 'Mona Cream Jobs';
        else if (p !== 'Profile shared' && p !== 'Shortlisted') matchedComp = p;

        if (matchedComp && !companiesFoundInRow.has(matchedComp)) {
          companiesFoundInRow.add(matchedComp);
          processMapping(matchedComp, 'Mapped', 'Shortlisted');
        }
      });
    });
  });

  // Save to mockData.json
  const updatedDb = {
    ...mockData,
    students,
    companies,
    opportunities,
    applications
  };

  fs.writeFileSync(mockDataPath, JSON.stringify(updatedDb, null, 2), 'utf8');
  console.log(`Saved updated database to ${mockDataPath}`);

  // Summary counts
  console.log('\n================ SUMMARY COUNTS ================');
  console.log(`Students: ${students.length} (${createdStudentsCount} created)`);
  console.log(`Companies: ${companies.length} (${createdCompaniesCount} newly created)`);
  console.log(`Opportunities: ${opportunities.length} (${createdOppsCount} newly created)`);
  console.log(`Applications: ${applications.length} total (${createdAppsCount} newly created, ${updatedAppsCount} updated)`);

  const stageCounts = {};
  applications.forEach(a => {
    stageCounts[a['Current Stage']] = (stageCounts[a['Current Stage']] || 0) + 1;
  });
  console.log('Application Stages breakdown:', stageCounts);

  // Push to Google Sheet Web App
  console.log('\n--- Pushing Updated Database to Google Sheet Web App ---');
  const webAppUrl = 'https://script.google.com/a/macros/rareminds.in/s/AKfycbzXQyoMC1eGKNj_31WGVulHBnJM5P5-SdwoB6jNPjZBVXV7EkCE8I6ESLvPRwA28EpI/exec';

  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'pushAll',
        data: updatedDb
      })
    });
    console.log(`Push HTTP status: ${res.status}`);
    const resText = await res.text();
    console.log(`Push response: ${resText.slice(0, 300)}`);
  } catch (err) {
    console.error('Error during push to Google Sheet:', err.message);
  }

  console.log('--- Ingestion & Push Finished ---');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
