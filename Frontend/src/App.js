import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';

import Header from './components/common/header';
import { SchoolOverviewTab } from './components/SchoolOverviewTab';
import { SchoolDetailTab } from './components/SchoolDetailTab';
import { fetchAndParseExcel } from './utils/excelLoader';

const SHAREPOINT_SIPAT_URL = 'https://depedph-my.sharepoint.com/:x:/r/personal/dyessajane_funelas_deped_gov_ph/_layouts/15/Doc.aspx?sourcedoc=%7BE4E4DA95-EB76-446E-9BEA-578E7D529506%7D&file=1%20SIPAT%20Database.xlsx&action=default&mobileredirect=true';

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
    gradeDistribution: { A: 40, B: 35, C: 20, D: 5 },
    rawRow: row,
  };
};

const buildSchoolRecordsFromWorkbook = (workbook) => {
  if (!workbook || !workbook.SheetNames) return [];

  const toJsonSheet = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  };

  const schoolRows = toJsonSheet('schools');
  const personnelRows = toJsonSheet('personnel');
  const teachingItemRows = toJsonSheet('teaching_items');
  const enrollmentRows = toJsonSheet('enrollment');
  const classroomRows = toJsonSheet('classroom');
  const mooeRows = toJsonSheet('mooe');
  const teacherReqRows = toJsonSheet('teacher_reqt');
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
    const classroomInfo = classroomRows.find((row) => String(row.school_id ?? row.sch_id) === schoolId) || {};
    const mooeInfo = mooeRows.find((row) => String(row.school_id ?? row.sch_id) === schoolId) || {};
    const teacherReqInfo = teacherReqRows.find((row) => String(row.sch_id ?? row.school_id) === schoolId) || {};
    const schoolPersonnel = personnelRows
      .filter((row) => String(row.sch_id ?? row.school_id) === schoolId)
      .map((row) => {
        const designation = row.designation || '';
        const type = String(row.TYPE || row.type || '').trim().toUpperCase();
        return {
        subOffice: row.sub_office || '',
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

    const totalTeachers = Number(teacherReqInfo.total_teachers ?? schoolPersonnel.length ?? 0);
    const totalShortage = Number(teacherReqInfo.total_shortage ?? 0);
    const totalExcess = Number(teacherReqInfo.total_excess ?? 0);
    const totalMooe = Number(mooeInfo.total_mooe ?? 0);

    schoolMap.set(schoolId, {
      id: schoolId,
      name: schoolName,
      type: classroomInfo.coc || school.designation || 'Public',
      region: school.sub_office || 'Main District',
      studentsCount: latestEnrollment,
      teachersCount: totalTeachers || schoolPersonnel.length || 30,
      gradRate: totalShortage > 0 ? Math.max(0, 100 - totalShortage) : 94.5,
      avgSat: Math.max(0, Math.round((latestEnrollment / (totalTeachers || 1)) * 10) / 10),
      budget: totalMooe > 0 ? `₱${Number(totalMooe).toLocaleString()}` : '$0',
      rating: 4.6,
      performanceGrade: totalShortage > 0 ? 'Needs Action' : 'Stable',
      principal: school.school_head || 'School Principal',
      address: `${school.sub_office || 'District'} Office`,
      phone: school.contact_number || '(555) 000-0000',
      website: '',
      founded: 2000,
      programs: [
        classroomInfo.coc || 'General Education',
        classroomInfo.Shifting || 'Single Shift',
        classroomInfo.classification || 'School Program',
      ],
      gradeDistribution: { A: 40, B: 35, C: 20, D: 5 },
      rawRow: school,
      schoolHead: school.school_head || '',
      designation: school.designation || '',
      contactNumber: school.contact_number || '',
      subOffice: school.sub_office || '',
      schoolClass: classroomInfo.classification || 'General',
      status: classroomInfo.status || 'Non-IU',
      shifting: classroomInfo.Shifting || 'Single Shift',
      classrooms: classroomInfo.classrooms || 0,
      classroomShortage: classroomInfo.classroom_shortage || 'no shortage',
      totalMooe,
      gad: Number(mooeInfo.gad ?? 0),
      enrollmentHistory,
      totalShortage,
      totalExcess,
      totalPersonnel: schoolPersonnel.length,
      personnelRecords: schoolPersonnel,
      schoolId,
      schoolYearLatest: enrollmentHistory.length > 0 ? enrollmentHistory[enrollmentHistory.length - 1].schoolYear : null,
    });
  });

  return Array.from(schoolMap.values());
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [headerSchoolSearch, setHeaderSchoolSearch] = useState('');

  const [schools, setSchools] = useState(INITIAL_FALLBACK_SCHOOLS);
  const [selectedSchoolId, setSelectedSchoolId] = useState(INITIAL_FALLBACK_SCHOOLS[0].id);
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

    setSchools(parsedSchools);
    if (parsedSchools.length > 0) {
      setSelectedSchoolId(parsedSchools[0].id);
    }
    setFileDataSource(
      manualRefresh
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
        SHAREPOINT_SIPAT_URL,
        'SharePoint SIPAT Database',
        forceRefresh
      );

      if (!rows || rows.length === 0) {
        setParseError(`The sheet "${sheetName}" in the SharePoint workbook contains no data rows.`);
        return;
      }

      handleSheetDataLoad(rows, 'SharePoint SIPAT Database', cacheHit, workbook, forceRefresh);
    } catch (err) {
      console.log('SharePoint fetch failed; trying fallback local copy.', err);

      try {
        const { rows, sheetName, cacheHit, workbook } = await fetchAndParseExcel(
          '/sipatdatabase.xlsx',
          'sipatdatabase.xlsx (Local fallback)',
          forceRefresh
        );

        if (!rows || rows.length === 0) {
          throw new Error(`The sheet "${sheetName}" in the local fallback file contains no data rows.`);
        }

        handleSheetDataLoad(rows, 'sipatdatabase.xlsx (Local fallback)', cacheHit, workbook, forceRefresh);
      } catch (fallbackErr) {
        console.log('Local fallback also failed, using default dataset.', fallbackErr);
      }
    } finally {
      setIsLoadingFile(false);
    }
  }, [handleSheetDataLoad]);

  useEffect(() => {
    if (!isXlsxLoaded) return;
    refreshSipatData(false);
  }, [isXlsxLoaded, refreshSipatData]);

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
        setSelectedSchoolId(parsedSchools[0].id);
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
            <strong>Excel Processing Error</strong>
            <div>{parseError}</div>
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
