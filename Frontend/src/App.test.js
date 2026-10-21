import { fireEvent, render, screen, within } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { buildSchoolRecordsFromWorkbook, getSchoolHeadDesignation } from './App';
import Header from './components/common/header';
import { SchoolDetailTab } from './components/SchoolDetailTab';
import { SchoolOverviewTab } from './components/SchoolOverviewTab';

test('maps full establishment status and school-head details from the current workbook schema', () => {
  const establishmentStatus = 'no plantilla; borrowed from Masaya NHS (301251); transfer request forwarded for approval';
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    school_id: 307930,
    school_name: 'Laguna Science Integrated High School',
    status: 'Non-IU',
    establishment_status: establishmentStatus,
  }]), 'schools');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    district: 'Bay',
    sch_id: 307930,
    school_head: '',
    designation: '',
  }]), 'schoolhead');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    district: 'BAY',
    sch_id: 307930,
    name_of_personnel: 'AUNARIO, MYRENE, SANGCAP',
    designation: 'SCHOOL PRINCIPAL I',
    section: 'School Head',
  }]), 'sch_personnel');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'item_classification');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'enrollment');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'classroom');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'mooe');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'teacher_reqt');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'suboffices');

  const [school] = buildSchoolRecordsFromWorkbook(workbook);
  expect(school.establishmentStatus).toBe(establishmentStatus);
  expect(school.schoolHead).toBe('AUNARIO, MYRENE, SANGCAP');
  expect(school.designation).toBe('Principal I');
});

test('uses the matching school head personnel designation over a stale school title', () => {
  expect(getSchoolHeadDesignation(
    'Myrene S. Aunario',
    [{ nameOfPersonnel: 'AUNARIO, MYRENE, SANGCAP', designation: 'SCHOOL PRINCIPAL I' }],
    'Head Teacher I'
  )).toBe('Principal I');
});

test('puts legal basis above the large multiline establishment status in the third details column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    legalBasis: 'view',
    legalBasisUrl: 'https://example.com/legal-basis',
    establishmentStatus: 'DO plantilla\nAdditional status detail',
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const columns = details.querySelectorAll('.detail-list');
  expect(columns).toHaveLength(3);
  expect(columns[2].querySelectorAll('.detail-row')).toHaveLength(2);
  expect(within(columns[2]).getByText('Legal Basis').compareDocumentPosition(
    within(columns[2]).getByText('Establishment Status')
  ) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(columns[2]).getByText('Establishment Status')).toBeInTheDocument();
  const statusRow = columns[2].querySelector('.detail-establishment-row');
  expect(statusRow).toBeInTheDocument();
  expect(statusRow).toHaveClass('detail-row', 'detail-establishment-row');
  expect(statusRow.querySelector('dd').textContent).toBe('DO plantilla\nAdditional status detail');
  expect(within(columns[0]).getByText('School Name')).toBeInTheDocument();
  expect(within(columns[1]).queryByText('Legal Basis')).not.toBeInTheDocument();
  expect(within(details).getByRole('link', { name: 'view' })).toHaveAttribute('href', 'https://example.com/legal-basis');
  expect(within(details).getByRole('link', { name: 'view' })).toHaveAttribute('target', '_blank');
});

test('renders the SIPAT application header', () => {
  render(<Header
    schools={[]}
    schoolSearchValue=""
    setSchoolSearchValue={() => {}}
    onSelectSchool={() => {}}
    fileInputRef={{ current: null }}
    isLoadingFile={false}
    darkMode={false}
    setDarkMode={() => {}}
    onRefreshData={() => {}}
  />);
  expect(screen.getByText('SIPAT')).toBeInTheDocument();
});

test('filters personnel inventory rows by search text', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    personnelRecords: [
      {
        tin: '1',
        nameOfPersonnel: 'Ava Santos',
        designation: 'Teacher I',
        gradeLevel: 'Grade 4',
        assignedArea: 'English',
        specialization: 'English',
        overallLoad: 300,
        teachingLoad: 240,
        appointmentStatus: 'Regular Permanent',
        loadingStatus: 'exact',
      },
      {
        tin: '2',
        nameOfPersonnel: 'Ben Reyes',
        designation: 'Teacher II',
        gradeLevel: 'Grade 5',
        assignedArea: 'Mathematics',
        specialization: 'Math',
        overallLoad: 300,
        teachingLoad: 260,
        appointmentStatus: 'Contractual',
        loadingStatus: 'overload',
      },
    ],
  }} />);

  const search = screen.getByRole('searchbox', { name: 'Search personnel' });
  fireEvent.change(search, { target: { value: 'ava santos' } });

  const rosterTable = screen.getAllByRole('table')[1];
  expect(within(rosterTable).getByText('Ava Santos')).toBeInTheDocument();
  expect(within(rosterTable).queryByText('Ben Reyes')).not.toBeInTheDocument();
  expect(screen.getByText('1 of 2 personnel')).toBeInTheDocument();
});

test('searches personnel across schools and displays assignment and available record data', () => {
  const schools = [
    {
      id: '108255',
      name: 'Calauan Central Elementary School',
      region: 'CALAUAN',
      personnelRecords: [{
        tin: '12345',
        nameOfPersonnel: 'Ava Santos',
        designation: 'Teacher I',
        assignedArea: 'English',
        gradeLevel: 'Grade 4',
        specialization: 'English',
        section: 'Rizal',
        m: '8:00 AM',
        t: '8:00 AM',
        w: '8:00 AM',
        th: '8:00 AM',
        f: '8:00 AM',
        from: '8:00 AM',
        to: '12:00 PM',
        overallLoad: 300,
        teachingLoad: 240,
        dateUpdated: '2025-06-15',
        type: 'T',
      }],
    },
    {
      id: '108256',
      name: 'Another Elementary School',
      personnelRecords: [{
        tin: '67890',
        nameOfPersonnel: 'Ben Reyes',
        designation: 'Teacher II',
        assignedArea: 'Mathematics',
      }],
    },
  ];
  render(<SchoolOverviewTab
    schools={schools}
    filteredSchools={schools}
    selectedRegion="All"
    setSelectedRegion={() => {}}
    selectedType="All"
    setSelectedType={() => {}}
    setSelectedSchoolId={() => {}}
    setActiveTab={() => {}}
    fileDataSource="test workbook"
    totalStudents={0}
    avgGraduationRate={0}
    avgStudentTeacherRatio="0"
    uniqueRegions={['All']}
    uniqueTypes={['All']}
  />);

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search personnel across all schools' }), {
    target: { value: 'English' },
  });

  expect(screen.getByText('1 of 2 personnel')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Ava Santos/ })).toBeInTheDocument();
  expect(screen.queryByText('Assigned to Calauan Central Elementary School · School ID: 108255 · CALAUAN')).not.toBeInTheDocument();
  expect(screen.queryByText('12345')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Ava Santos/ }));

  expect(screen.getByText('Assigned to Calauan Central Elementary School · School ID: 108255 · CALAUAN')).toBeInTheDocument();
  expect(screen.getAllByText('Ava Santos')).toHaveLength(1);
  expect(screen.getByText('12345')).toBeInTheDocument();
  expect(screen.getByText('Teacher I')).toBeInTheDocument();
  expect(screen.getByText('240')).toBeInTheDocument();
  expect(screen.getByText('Date updated')).toBeInTheDocument();
  expect(screen.getByText('Jun 15, 2025')).toBeInTheDocument();
  expect(screen.getByText('Personnel type')).toBeInTheDocument();
  expect(screen.getByText('Personnel type').compareDocumentPosition(screen.getByText('Date updated')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText('Teaching load').compareDocumentPosition(screen.getByText('Date updated')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByText('Name', { selector: 'dt' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ava Santos' })).toBeInTheDocument();
  expect(screen.queryByText('Section')).not.toBeInTheDocument();
  expect(screen.queryByText('Monday')).not.toBeInTheDocument();
  expect(screen.queryByText('Tuesday')).not.toBeInTheDocument();
  expect(screen.queryByText('Wednesday')).not.toBeInTheDocument();
  expect(screen.queryByText('Thursday')).not.toBeInTheDocument();
  expect(screen.queryByText('Friday')).not.toBeInTheDocument();
  expect(screen.queryByText('From')).not.toBeInTheDocument();
  expect(screen.queryByText('To')).not.toBeInTheDocument();
  expect(screen.queryByText('Overall load')).not.toBeInTheDocument();
  expect(screen.queryByText('Ben Reyes')).not.toBeInTheDocument();
});

test('shows actual enrollment for the latest three school years with year-over-year variance', () => {
  const { container } = render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    schoolId: '108255',
    enrollmentHistory: [
      { schoolYear: '2023', enrollment: 1000 },
      { schoolYear: '2024', enrollment: 1100 },
      { schoolYear: '2025', enrollment: 1050 },
    ],
  }} />);

  expect(screen.queryByText('2 SY ago')).not.toBeInTheDocument();
  expect(screen.queryByText('Previous SY')).not.toBeInTheDocument();
  expect(screen.queryByText('Current SY')).not.toBeInTheDocument();
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('1,100')).toBeInTheDocument();
  expect(screen.getByText('1,050')).toBeInTheDocument();
  expect(screen.getByText('50')).toBeInTheDocument();
  expect(screen.getByText('VARIANCE')).toBeInTheDocument();
  expect(screen.getByText('Decrease from last SY')).toBeInTheDocument();
  expect(container.querySelector('.enrollment-variance .enrollment-sparkline')).toBeInTheDocument();
  expect(screen.queryByText('↑ 50 up from last school year')).not.toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Enrollment trend over the available school years' })).toBeInTheDocument();
  expect(container.querySelector('.enrollment-sparkline text')).not.toBeInTheDocument();
});

test('does not invent enrollment history when the workbook has no school-year records', () => {
  render(<SchoolDetailTab activeSchoolDetail={{ id: 'school-1', name: 'Test School' }} />);

  expect(screen.getByText('No enrollment history available.')).toBeInTheDocument();
  expect(screen.getByText('Trend unavailable')).toBeInTheDocument();
  expect(screen.getByText('No prior SY to compare')).toBeInTheDocument();
});
