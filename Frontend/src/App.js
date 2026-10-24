import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';

import Header from './components/common/header';
import { SchoolOverviewTab } from './components/SchoolOverviewTab';
import { SchoolDetailTab } from './components/SchoolDetailTab';
import { fetchAndParseExcel } from './utils/excelLoader';
import { normalizeSchoolHeadRemarks } from './data/schoolHeadRemarks';
import { getSchoolSearchLabel } from './utils/schoolSearch';

const SIPAT_WORKBOOK_URL = 'https://s3-deped-laguna-sipat.s3.ap-southeast-2.amazonaws.com/1+SIPAT+Database.xlsx';

export const getSchoolHeadDesignation = (schoolHead, personnelRecords, fallbackDesignation = '') => {
  const headNameParts = String(schoolHead || '').toUpperCase().match(/[A-Z0-9]+/g) || [];
  if (headNameParts.length < 2) return fallbackDesignation;

  const firstName = headNameParts[0];
  const surname = headNameParts[headNameParts.length - 1];
  const schoolHeadRecord = personnelRecords.find((person) => {
    const personnelNameParts = String(person.nameOfPersonnel || person.name_of_personnel || person.name || '')
      .toUpperCase()
      .match(/[A-Z0-9]+/g) || [];
    return personnelNameParts.includes(firstName) && personnelNameParts.includes(surname);
  });
  const personnelDesignation = String(schoolHeadRecord?.designation || '')
    .trim()
    .replace(/^school\s+/i, '')
    .replace(/\b([A-Z]+)\b/g, (word) => (
      word.length <= 3 ? word : `${word[0]}${word.slice(1).toLowerCase()}`
    ));

  return personnelDesignation || fallbackDesignation;
};

const INITIAL_FALLBACK_SCHOOLS = [
  {
    id: 'SCH-001',
    name: 'Lincoln High School',
    type: 'Public',
    region: 'North District',
    studentsCount: 1450,
    teachersCount: 85,
    gradRate: 94.2,
    avgSat: 1280,
    budget: '$4.2M',
    rating: 4.8,
    performanceGrade: 'A+',
    principal: 'Dr. Eleanor Vance',
    address: '742 Evergreen Terrace, Springfield, IL',
    phone: '(555) 234-5678',
    website: 'www.lincolnhigh.edu',
    founded: 1965,
    programs: ['STEM Academy', 'AP Honors', 'Robotics', 'Debate Club'],
    gradeDistribution: { A: 42, B: 38, C: 15, D: 5 },
  },
  {
    id: 'SCH-002',
    name: 'St. Jude International Academy',
    type: 'Private',
    region: 'Central District',
    studentsCount: 820,
    teachersCount: 62,
    gradRate: 98.5,
    avgSat: 1390,
    budget: '$6.8M',
    rating: 4.9,
    performanceGrade: 'A+',
    principal: 'Father Michael Ross',
    address: '108 Ocean Drive, Metropolis, NY',
    phone: '(555) 876-5432',
    website: 'www.stjudeacademy.org',
    founded: 1982,
    programs: ['IB Diploma', 'Biomedical Research', 'Orchestra', 'Model UN'],
    gradeDistribution: { A: 58, B: 32, C: 8, D: 2 },
  },
  {
    id: 'SCH-003',
    name: 'Oakridge Technology Charter',
    type: 'Charter',
    region: 'East District',
    studentsCount: 960,
    teachersCount: 54,
    gradRate: 89.0,
    avgSat: 1190,
    budget: '$3.1M',
    rating: 4.2,
    performanceGrade: 'B+',
    principal: 'Marcus Brody, M.Ed.',
    address: '404 Innovation Way, Techville, CA',
    phone: '(555) 345-6789',
    website: 'www.oakridgetech.org',
    founded: 2010,
    programs: ['Cybersecurity', 'AI & Data Science', '3D Fabrication', 'E-Sports'],
    gradeDistribution: { A: 31, B: 45, C: 18, D: 6 },
  },
];

const normalizeExcelRow = (row, index) => {
  const getVal = (keys) => {
    for (const key of keys) {
      const match = Object.keys(row).find((rk) => rk.toLowerCase().trim() === key.toLowerCase().trim());
      if (match && row[match] !== undefined && row[match] !== null) {
        return row[match];
      }
    }
    return null;
  };

  const id = String(getVal(['id', 'school id', 'school_id', 'code']) || `SCH-${String(index + 1).padStart(3, '0')}`);
  const name = String(getVal(['name', 'school name', 'school_name', 'school']) || `School #${index + 1}`);
  const type = String(getVal(['type', 'school type', 'category']) || 'Public');
  const region = String(getVal(['region', 'district', 'location']) || 'Main District');
  const studentsCount = Number(getVal(['studentscount', 'students', 'enrollment', 'total students']) || 500);
  const teachersCount = Number(getVal(['teacherscount', 'teachers', 'faculty', 'staff']) || 30);
  const gradRate = Number(getVal(['gradrate', 'graduation rate', 'grad rate', 'passing rate']) || 85.0);
  const avgSat = Number(getVal(['avgsat', 'sat score', 'avg sat', 'sat']) || 1100);
  const budget = String(getVal(['budget', 'annual budget', 'funding']) || '$2.5M');
  const rating = Number(getVal(['rating', 'score', 'stars']) || 4.0);
  const performanceGrade = String(getVal(['performancegrade', 'grade', 'rating grade', 'status']) || 'A');
  const principal = String(getVal(['principal', 'headmaster', 'director']) || 'School Principal');
  const address = String(getVal(['address', 'location address', 'city']) || 'District Campus Address');
  const phone = String(getVal(['phone', 'contact', 'telephone']) || '(555) 000-0000');
  const website = String(getVal(['website', 'url', 'web']) || 'www.school.edu');
  const founded = Number(getVal(['founded', 'est', 'year founded']) || 2000);
  const schoolHeadRemarks = normalizeSchoolHeadRemarks(
    getVal(['sh_remarks', 'schoolhead remarks', 'remarks from schoolhead'])
  );

  const rawPrograms = getVal(['programs', 'clubs', 'offered programs']);
  let programs = ['STEM', 'Arts', 'Athletics'];
  if (Array.isArray(rawPrograms)) {
    programs = rawPrograms;
  } else if (typeof rawPrograms === 'string') {
    programs = rawPrograms.split(/[,;|]/).map((item) => item.trim());
  }

  return {
    id,
    name,
    type,
    region,
    studentsCount,
    teachersCount,
    gradRate,
    avgSat,
    budget,
    rating,
    performanceGrade,
    principal,
    address,
    phone,
    website,
    founded,
    programs,
    schoolHeadRemarks,
    gradeDistribution: { A: 40, B: 35, C: 20, D: 5 },
    rawRow: row,
  };
};

export const buildSchoolRecordsFromWorkbook = (workbook) => {
  if (!workbook || !workbook.SheetNames) return [];

  const toJsonSheet = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  };

  const schoolRows = toJsonSheet('schools');
  const personnelRows = toJsonSheet(workbook.Sheets.sch_personnel ? 'sch_personnel' : 'personnel');
  const teachingItemRows = toJsonSheet(workbook.Sheets.item_classification ? 'item_classification' : 'teaching_items');
  const enrollmentRows = toJsonSheet('enrollment');
  const classroomRows = toJsonSheet('classroom');
  const mooeRows = toJsonSheet('mooe');
  const teacherReqRows = toJsonSheet('teacher_reqt');
  const schoolHeadRows = toJsonSheet('schoolhead');
  const subOfficeRows = toJsonSheet('suboffices');
  const personnelClassifications = new Map(
    teachingItemRows
      .filter((row) => row.designation && row.classification)
      .map((row) => [String(row.designation).trim().toLowerCase(), String(row.classification).trim()])
  );
  const typeClassifications = { T: 'Teaching', TR: 'Teaching-Related', NT: 'Non-Teaching' };

  const schoolMap = new Map();

  schoolRows.forEach((school, index) => {
    const schoolId = String(school.sch_id ?? school.school_id ?? school.id ?? index + 1);
    const schoolName = school.school_name || school.name || `School #${index + 1}`;
    const schoolPersonnelRows = personnelRows
      .filter((row) => String(row.sch_id ?? row.school_id) === schoolId);
    const schoolHeadInfo = schoolHeadRows.find((row) => String(row.sch_id ?? row.school_id) === schoolId) || {};
    const schoolContext = schoolPersonnelRows[0] || {};
    const subOffice = school.sub_office ?? school.district ?? schoolHeadInfo.district
      ?? schoolContext.sub_office ?? schoolContext.district ?? '';
    const subOfficeInfo = subOfficeRows.find((row) => (
      String(row.district ?? row.suboffice ?? row.sub_office ?? '').trim().toLowerCase()
      === String(subOffice).trim().toLowerCase()
    )) || {};
    const classroomInfo = classroomRows.find((row) => String(row.school_id ?? row.sch_id) === schoolId) || {};
    const mooeInfo = mooeRows.find((row) => String(row.school_id ?? row.sch_id) === schoolId) || {};
    const teacherReqInfo = teacherReqRows.find((row) => String(row.sch_id ?? row.school_id) === schoolId) || {};
    const schoolPersonnel = schoolPersonnelRows
      .map((row) => {
        const designation = row.designation || '';
        const type = String(row.TYPE || row.type || '').trim().toUpperCase();
        return {
        subOffice: row.sub_office || row.district || '',
        schoolId: row.sch_id ?? schoolId,
        schoolName: row.sch_name || schoolName,
        coc: row.coc || '',
        tin: row.tin || '',
        nameOfPersonnel: row.name_of_personnel || row['name_of_personnel'] || row.name || '',
        gender: row.gender || '',
        fundSource: row.fund_source || '',
        designation,
        classification: personnelClassifications.get(String(designation).trim().toLowerCase()) || typeClassifications[type] || 'Unclassified',
        appointmentStatus: row.appointment_status || '',
        degree: row.degree || '',
        specialization: row.specialization || '',
        minor: row.minor || '',
        assignedArea: row.assigned_area || '',
        gradeLevel: row.grade_level || '',
        section: row.section || '',
        m: row.m || '',
        t: row.t || '',
        w: row.w || '',
        th: row.th || '',
        f: row.f || '',
        s: row.s || '',
        sun: row.sun || '',
        from: row.from || '',
        to: row.to || '',
        overallLoad: row.overall_load || 0,
        teachingLoad: row.teaching_load || 0,
        dateUpdated: row['DATE UPDATED'] || row['DATE UPDATED '] || '',
        loadingStatus: row['LOADING STATUS'] || row.loading_status || '',
        type,
      };
      });
    const enrollmentHistory = enrollmentRows
      .filter((row) => String(row.school_id ?? row.sch_id) === schoolId)
      .map((row) => ({
        schoolYear: row.school_year,
        enrollment: Number(row.enrollment || 0),
      }))
      .sort((a, b) => Number(a.schoolYear || 0) - Number(b.schoolYear || 0));

    const latestEnrollment = enrollmentHistory.length > 0
      ? enrollmentHistory[enrollmentHistory.length - 1].enrollment
      : Number(school.enrollment || 0) || 0;

    const teacherReqTotalTeachers = teacherReqInfo.total_teachers == null || teacherReqInfo.total_teachers === ''
      ? null
      : Number(teacherReqInfo.total_teachers);
    const totalTeachers = teacherReqTotalTeachers ?? Number(schoolPersonnel.length ?? 0);
    const teacherReqTotalShortage = teacherReqInfo.total_shortage == null || teacherReqInfo.total_shortage === ''
      ? null
      : Number(teacherReqInfo.total_shortage);
    const totalShortage = teacherReqTotalShortage ?? 0;
    const teacherReqTotalExcess = teacherReqInfo.total_excess == null || teacherReqInfo.total_excess === ''
      ? null
      : Number(teacherReqInfo.total_excess);
    const totalExcess = teacherReqTotalExcess ?? 0;
    const totalMooe = Number(mooeInfo.total_mooe ?? 0);
    const schoolHeadRecord = schoolPersonnel.find((person) => (
      String(person.section || '').trim().toLowerCase() === 'school head'
    ));
    const schoolHead = school.school_head || school.schoolhead || schoolHeadInfo.school_head
      || schoolHeadRecord?.nameOfPersonnel || '';
    const schoolHeadDesignation = getSchoolHeadDesignation(
      schoolHead,
      schoolPersonnel,
      schoolHeadInfo.designation || school.designation || ''
    );

    schoolMap.set(schoolId, {
      id: schoolId,
      name: schoolName,
      type: classroomInfo.coc || school.designation || 'Public',
      region: subOffice || 'Main District',
      studentsCount: latestEnrollment,
      teachersCount: totalTeachers || schoolPersonnel.length || 30,
      gradRate: totalShortage > 0 ? Math.max(0, 100 - totalShortage) : 94.5,
      avgSat: Math.max(0, Math.round((latestEnrollment / (totalTeachers || 1)) * 10) / 10),
      budget: totalMooe > 0 ? `₱${Number(totalMooe).toLocaleString()}` : '$0',
      rating: 4.6,
      performanceGrade: totalShortage > 0 ? 'Needs Action' : 'Stable',
      principal: schoolHead || 'School Principal',
      address: `${subOffice || 'District'} Office`,
      phone: school.contact_number || school.contact_no || schoolHeadInfo.contact_number || '(555) 000-0000',
      website: '',
      founded: 2000,
      programs: [
        school.track || school.coc || classroomInfo.coc || 'General Education',
        school.strand || '',
        classroomInfo.Shifting || 'Single Shift',
        classroomInfo.classification || 'School Program',
      ],
      gradeDistribution: { A: 40, B: 35, C: 20, D: 5 },
      rawRow: school,
      schoolHead,
      designation: schoolHeadDesignation,
      contactNumber: school.contact_number || school.contact_no || schoolHeadInfo.contact_number || '',
      subOffice,
      legalBasis: school.legal_bases || school.legal_basis || 'view',
      legalBasisUrl: school.basis_link || school.legal_basis_url || '',
      establishmentStatus: school.establishment_status || '',
      schoolHeadRemarks: normalizeSchoolHeadRemarks(school.sh_remarks),
      psds: subOfficeInfo.psds || '',
      track: school.track || '',
      strand: school.strand || '',
      schoolClass: classroomInfo.classification || 'General',
      status: classroomInfo.status || 'Non-IU',
      shifting: classroomInfo.Shifting || 'Single Shift',
      classrooms: classroomInfo.classrooms || 0,
      classroomShortage: classroomInfo.classroom_shortage || 'no shortage',
      totalMooe,
      elemAllocation: mooeInfo.elementary == null || mooeInfo.elementary === ''
        ? null
        : Number(mooeInfo.elementary),
      jhsAllocation: mooeInfo.jhs == null || mooeInfo.jhs === ''
        ? null
        : Number(mooeInfo.jhs),
      shsAllocation: mooeInfo.shs == null || mooeInfo.shs === ''
        ? null
        : Number(mooeInfo.shs),
      gad: mooeInfo.gad == null || mooeInfo.gad === ''
        ? null
        : Number(mooeInfo.gad),
      enrollmentHistory,
      totalShortage,
      totalExcess,
      teacherReqTotalShortage,
      teacherReqTotalExcess,
      teacherReqTotalTeachers,
      totalPersonnel: schoolPersonnel.length,
      personnelRecords: schoolPersonnel,
      schoolId,
      schoolYearLatest: enrollmentHistory.length > 0 ? enrollmentHistory[enrollmentHistory.length - 1].schoolYear : null,
      totalEnrollment: teacherReqInfo.total_enrollment == null || teacherReqInfo.total_enrollment === ''
        ? null
        : Number(teacherReqInfo.total_enrollment),
      elemRegularEnrollment: teacherReqInfo.enrollment_elem == null || teacherReqInfo.enrollment_elem === ''
        ? null
        : Number(teacherReqInfo.enrollment_elem),
      elemRegularTeachers: teacherReqInfo.teachers_elem == null || teacherReqInfo.teachers_elem === ''
        ? null
        : Number(teacherReqInfo.teachers_elem),
      elemRegularExcess: teacherReqInfo.excess_elem == null || teacherReqInfo.excess_elem === ''
        ? null
        : Number(teacherReqInfo.excess_elem),
      elemRegularShortage: teacherReqInfo.shortage_elem == null || teacherReqInfo.shortage_elem === ''
        ? null
        : Number(teacherReqInfo.shortage_elem),
      elemNonGradedEnrollment: teacherReqInfo.enrollment_elemng == null || teacherReqInfo.enrollment_elemng === ''
        ? null
        : Number(teacherReqInfo.enrollment_elemng),
      elemNonGradedTeachers: teacherReqInfo.teachers_elemng == null || teacherReqInfo.teachers_elemng === ''
        ? null
        : Number(teacherReqInfo.teachers_elemng),
      elemNonGradedExcess: teacherReqInfo.excess_elemng == null || teacherReqInfo.excess_elemng === ''
        ? null
        : Number(teacherReqInfo.excess_elemng),
      elemNonGradedShortage: teacherReqInfo.shortage_elemng == null || teacherReqInfo.shortage_elemng === ''
        ? null
        : Number(teacherReqInfo.shortage_elemng),
      jhsRegularEnrollment: teacherReqInfo.enrollment_jhs == null || teacherReqInfo.enrollment_jhs === ''
        ? null
        : Number(teacherReqInfo.enrollment_jhs),
      jhsRegularTeachers: teacherReqInfo.teachers_jhs == null || teacherReqInfo.teachers_jhs === ''
        ? null
        : Number(teacherReqInfo.teachers_jhs),
      jhsRegularExcess: teacherReqInfo.excess_jhs == null || teacherReqInfo.excess_jhs === ''
        ? null
        : Number(teacherReqInfo.excess_jhs),
      jhsRegularShortage: teacherReqInfo.shortage_jhs == null || teacherReqInfo.shortage_jhs === ''
        ? null
        : Number(teacherReqInfo.shortage_jhs),
      jhsNonGradedEnrollment: teacherReqInfo.enrollment_jhsng == null || teacherReqInfo.enrollment_jhsng === ''
        ? null
        : Number(teacherReqInfo.enrollment_jhsng),
      jhsNonGradedTeachers: teacherReqInfo.teachers_jhsng == null || teacherReqInfo.teachers_jhsng === ''
        ? null
        : Number(teacherReqInfo.teachers_jhsng),
      jhsNonGradedExcess: teacherReqInfo.excess_jhsng == null || teacherReqInfo.excess_jhsng === ''
        ? null
        : Number(teacherReqInfo.excess_jhsng),
      jhsNonGradedShortage: teacherReqInfo.shortage_jhsng == null || teacherReqInfo.shortage_jhsng === ''
        ? null
        : Number(teacherReqInfo.shortage_jhsng),
      shsEnrollment: teacherReqInfo.enrollment_shs == null || teacherReqInfo.enrollment_shs === ''
        ? null
        : Number(teacherReqInfo.enrollment_shs),
      shsTeachers: teacherReqInfo.teachers_shs == null || teacherReqInfo.teachers_shs === ''
        ? null
        : Number(teacherReqInfo.teachers_shs),
      shsExcess: teacherReqInfo.excess_shs == null || teacherReqInfo.excess_shs === ''
        ? null
        : Number(teacherReqInfo.excess_shs),
      shsShortage: teacherReqInfo.shortage_shs == null || teacherReqInfo.shortage_shs === ''
        ? null
        : Number(teacherReqInfo.shortage_shs),
    });
  });

  return Array.from(schoolMap.values());
};

export const hasSchoolHeadRemarksColumn = (workbook) => {
  const schoolsSheet = workbook?.Sheets?.schools;
  if (!schoolsSheet) return false;

  const [headers = []] = XLSX.utils.sheet_to_json(schoolsSheet, {
    header: 1,
    blankrows: false,
  });
  return headers.some((header) => String(header || '').trim().toLowerCase() === 'sh_remarks');
};

const getInitialDashboardState = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    activeTab: params.get('tab') === 'school' ? 1 : 0,
    selectedSchoolId: params.get('schoolId') || INITIAL_FALLBACK_SCHOOLS[0].id,
  };
};

export default function App() {
  const [initialDashboardState] = useState(getInitialDashboardState);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(initialDashboardState.activeTab);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [headerSchoolSearch, setHeaderSchoolSearch] = useState('');

  const [schools, setSchools] = useState(INITIAL_FALLBACK_SCHOOLS);
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialDashboardState.selectedSchoolId);
  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileDataSource, setFileDataSource] = useState('Fallback Default Dataset');
  const [parseError, setParseError] = useState(null);

  const fileInputRef = useRef(null);

  const handleHeaderSchoolSelect = (school) => {
    if (!school) return;
    setSelectedSchoolId(school.id);
    setHeaderSchoolSearch(school.name);
    setActiveTab(1);
  };

  const handleSheetDataLoad = useCallback((rows, sourceLabel, cacheHit = false, workbook = null, manualRefresh = false) => {
    if (!rows || rows.length === 0) return;

    const parsedSchools = workbook
      ? buildSchoolRecordsFromWorkbook(workbook)
      : rows.map((row, idx) => normalizeExcelRow(row, idx));

    if (workbook && !hasSchoolHeadRemarksColumn(workbook)) {
      setParseError(
        `${sourceLabel} is missing the "sh_remarks" column on its schools sheet. Publish the latest workbook, then refresh the app.`
      );
    }

    setSchools(parsedSchools);
    if (parsedSchools.length > 0) {
      setSelectedSchoolId((currentSchoolId) => (
        parsedSchools.some((school) => school.id === currentSchoolId)
          ? currentSchoolId
          : parsedSchools[0].id
      ));
    }
    setFileDataSource(
      manualRefresh && sourceLabel === 'S3 SIPAT Database'
        ? `${sourceLabel} (manual refresh) (${parsedSchools.length} rows loaded)`
        : cacheHit
          ? `${sourceLabel} (cached within 7 days) (${parsedSchools.length} rows loaded)`
          : `${sourceLabel} (${parsedSchools.length} rows loaded)`
    );
  }, []);

  useEffect(() => {
    setIsXlsxLoaded(true);
  }, []);

  const refreshSipatData = useCallback(async (forceRefresh = false) => {
    setIsLoadingFile(true);
    setParseError(null);

    try {
      const { rows, sheetName, cacheHit, workbook } = await fetchAndParseExcel(
        SIPAT_WORKBOOK_URL,
        'S3 SIPAT Database',
        forceRefresh
      );

      if (!rows || rows.length === 0) {
        setParseError(`The sheet "${sheetName}" in the SharePoint workbook contains no data rows.`);
        return;
      }

      handleSheetDataLoad(rows, 'S3 SIPAT Database', cacheHit, workbook, forceRefresh);
    } catch (err) {
      console.log('S3 workbook fetch failed; trying bundled fallback copy.', err);
      const remoteError = err instanceof Error ? err.message : String(err);

      try {
        const { rows, sheetName, cacheHit, workbook } = await fetchAndParseExcel(
          '/sipatdatabase.xlsx',
          'Bundled fallback workbook',
          forceRefresh
        );

        if (!rows || rows.length === 0) {
          throw new Error(`The sheet "${sheetName}" in the local fallback file contains no data rows.`);
        }

        handleSheetDataLoad(rows, 'Bundled fallback workbook', cacheHit, workbook, forceRefresh);
        setParseError(
          `Could not refresh the S3 workbook. Loaded the bundled workbook instead; its data may be out of date. ${remoteError}`
        );
      } catch (fallbackErr) {
        console.log('Local fallback also failed, using default dataset.', fallbackErr);
        const fallbackError = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        setParseError(
          `Could not load data from the S3 workbook or bundled workbook. S3: ${remoteError} Bundled workbook: ${fallbackError}`
        );
      }
    } finally {
      setIsLoadingFile(false);
    }
  }, [handleSheetDataLoad]);

  useEffect(() => {
    if (!isXlsxLoaded) return;
    refreshSipatData(false);
  }, [isXlsxLoaded, refreshSipatData]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTab === 1) {
      url.searchParams.set('tab', 'school');
      url.searchParams.set('schoolId', selectedSchoolId);
    } else {
      url.searchParams.delete('tab');
      url.searchParams.delete('schoolId');
    }
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [activeTab, selectedSchoolId]);

  const parseAndSetExcelData = (buffer, sourceName) => {
    try {
      setParseError(null);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      if (!jsonData || jsonData.length === 0) {
        setParseError(`The sheet "${firstSheetName}" in ${sourceName} contains no data rows.`);
        return;
      }

      const parsedSchools = buildSchoolRecordsFromWorkbook(workbook);
      setSchools(parsedSchools.length > 0 ? parsedSchools : jsonData.map((row, idx) => normalizeExcelRow(row, idx)));
      if (parsedSchools.length > 0) {
        setSelectedSchoolId((currentSchoolId) => (
          parsedSchools.some((school) => school.id === currentSchoolId)
            ? currentSchoolId
            : parsedSchools[0].id
        ));
      }
      setFileDataSource(`${sourceName} (${parsedSchools.length || jsonData.length} rows loaded)`);
    } catch (err) {
      console.error('Error parsing excel file:', err);
      setParseError(`Failed to parse Excel file: ${err.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!isXlsxLoaded) {
      setParseError('Excel reader engine is still initializing. Please try again in a second.');
      return;
    }

    setIsLoadingFile(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      parseAndSetExcelData(evt.target.result, file.name);
      setIsLoadingFile(false);
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
      setIsLoadingFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesRegion = selectedRegion === 'All' || school.region === selectedRegion;
      const matchesType = selectedType === 'All' || school.type === selectedType;
      return matchesRegion && matchesType;
    });
  }, [schools, selectedRegion, selectedType]);

  const uniqueRegions = useMemo(() => {
    const set = new Set(schools.map((school) => school.region));
    return ['All', ...Array.from(set)];
  }, [schools]);

  const uniqueTypes = useMemo(() => {
    const set = new Set(schools.map((school) => school.type));
    return ['All', ...Array.from(set)];
  }, [schools]);

  const activeSchoolDetail = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) || schools[0],
    [schools, selectedSchoolId]
  );

  useEffect(() => {
    if (activeSchoolDetail) {
      setHeaderSchoolSearch(getSchoolSearchLabel(activeSchoolDetail));
    }
  }, [activeSchoolDetail]);

  const totalStudents = useMemo(
    () => schools.reduce((acc, school) => acc + (school.studentsCount || 0), 0),
    [schools]
  );

  const avgGraduationRate = useMemo(() => {
    if (schools.length === 0) return '0.0';
    return (schools.reduce((acc, school) => acc + (school.gradRate || 0), 0) / schools.length).toFixed(1);
  }, [schools]);

  const avgStudentTeacherRatio = useMemo(() => {
    const totalTeachers = schools.reduce((acc, school) => acc + (school.teachersCount || 1), 0);
    return totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : '15.0';
  }, [schools, totalStudents]);

  return (
    <div className={`app-root${darkMode ? ' app-dark-mode' : ''}`} data-bs-theme={darkMode ? 'dark' : 'light'}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
      />

      <Header
        schools={schools}
        schoolSearchValue={headerSchoolSearch}
        setSchoolSearchValue={setHeaderSchoolSearch}
        onSelectSchool={handleHeaderSchoolSelect}
        fileInputRef={fileInputRef}
        isLoadingFile={isLoadingFile}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onRefreshData={() => refreshSipatData(true)}
      />

      <div className="app-navigation border-bottom">
        <nav className="container-fluid px-3 px-lg-4 nav nav-tabs" aria-label="Dashboard sections">
          <button className={`nav-link${activeTab === 0 ? ' active' : ''}`} type="button" onClick={() => setActiveTab(0)} aria-current={activeTab === 0 ? 'page' : undefined}>
            General Overview <span className="badge rounded-pill text-bg-success ms-1">{filteredSchools.length}</span>
          </button>
          <button className={`nav-link${activeTab === 1 ? ' active' : ''}`} type="button" onClick={() => setActiveTab(1)} aria-current={activeTab === 1 ? 'page' : undefined}>
            School Dashboard
          </button>
        </nav>
      </div>

      <main className="container-fluid px-3 px-lg-4 py-3 py-lg-4">
        {parseError && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <strong>
              {fileDataSource.startsWith('Bundled fallback workbook')
                ? 'S3 Refresh Warning'
                : fileDataSource.startsWith('S3 SIPAT Database')
                  ? 'Workbook Data Warning'
                  : 'Excel Processing Error'}
            </strong>
            <div>{parseError}</div>
           {fileDataSource.startsWith('Bundled fallback workbook') && (
             <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
               <a href={SIPAT_WORKBOOK_URL} target="_blank" rel="noreferrer">
                 Download the workbook from S3
               </a>
               <button
                 type="button"
                 className="btn btn-sm btn-outline-danger"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isLoadingFile}
               >
                 Choose a downloaded workbook
               </button>
               <span className="small">
                 Download the latest .xlsx from S3, then select it here to load its data.
               </span>
             </div>
           )}
           <button type="button" className="btn-close" aria-label="Dismiss error" onClick={() => setParseError(null)} />
         </div>
        )}

        {activeTab === 0 ? (              
          <SchoolOverviewTab
            schools={schools}
            filteredSchools={filteredSchools}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            setSelectedSchoolId={setSelectedSchoolId}
            setActiveTab={setActiveTab}
            fileDataSource={fileDataSource}
            totalStudents={totalStudents}
            avgGraduationRate={avgGraduationRate}
            avgStudentTeacherRatio={avgStudentTeacherRatio}
            uniqueRegions={uniqueRegions}
            uniqueTypes={uniqueTypes}
          />
        ) : (
          <SchoolDetailTab
            selectedSchoolId={selectedSchoolId}
            setSelectedSchoolId={setSelectedSchoolId}
            activeSchoolDetail={activeSchoolDetail}
          />
        )}
      </main>
    </div>
  );
}
