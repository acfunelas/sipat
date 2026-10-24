import { fireEvent, render, screen, within } from '@testing-library/react';
import * as XLSX from 'xlsx';
import {
  buildSchoolRecordsFromWorkbook,
  getSchoolHeadDesignation,
  hasSchoolHeadRemarksColumn,
} from './App';
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
    sh_remarks: 'Schoolhead remarks from the schools worksheet.',
  }, {
    school_id: 307931,
    school_name: 'No Remarks School',
    sh_remarks: 'none',
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
    teaching_load: 245,
  }]), 'sch_personnel');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'item_classification');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'enrollment');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'classroom');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    school_id: 307930,
    total_mooe: 1234567,
    elementary: 765432,
    jhs: 234567,
    shs: 123456,
    gad: 34567,
  }]), 'mooe');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    sch_id: 307930,
    enrollment_elem: 735,
    teachers_elem: 12,
    excess_elem: 4,
    shortage_elem: 3,
    enrollment_elemng: 82,
    teachers_elemng: 3,
    excess_elemng: 5,
    shortage_elemng: 2,
    enrollment_jhs: 456,
    teachers_jhs: 15,
    excess_jhs: 6,
    shortage_jhs: 4,
    enrollment_jhsng: 37,
    teachers_jhsng: 2,
    excess_jhsng: 8,
    shortage_jhsng: 5,
    enrollment_shs: 212,
    teachers_shs: 7,
    excess_shs: 9,
    shortage_shs: 1,
    total_enrollment: 1500,
    total_teachers: 26,
    total_excess: 17,
    total_shortage: 13,
  }]), 'teacher_reqt');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'suboffices');

  const [school, schoolWithoutRemarks] = buildSchoolRecordsFromWorkbook(workbook);
  expect(school.establishmentStatus).toBe(establishmentStatus);
  expect(school.schoolHeadRemarks).toBe('Schoolhead remarks from the schools worksheet.');
  expect(school.totalMooe).toBe(1234567);
  expect(school.elemAllocation).toBe(765432);
  expect(school.jhsAllocation).toBe(234567);
  expect(school.shsAllocation).toBe(123456);
  expect(school.gad).toBe(34567);
  expect(school.totalEnrollment).toBe(1500);
  expect(school.teacherReqTotalTeachers).toBe(26);
  expect(school.teacherReqTotalExcess).toBe(17);
  expect(school.teacherReqTotalShortage).toBe(13);
  expect(school.elemRegularEnrollment).toBe(735);
  expect(school.elemRegularTeachers).toBe(12);
  expect(school.elemRegularExcess).toBe(4);
  expect(school.elemRegularShortage).toBe(3);
  expect(school.elemNonGradedEnrollment).toBe(82);
  expect(school.elemNonGradedTeachers).toBe(3);
  expect(school.elemNonGradedExcess).toBe(5);
  expect(school.elemNonGradedShortage).toBe(2);
  expect(school.jhsRegularEnrollment).toBe(456);
  expect(school.jhsRegularTeachers).toBe(15);
  expect(school.jhsRegularExcess).toBe(6);
  expect(school.jhsRegularShortage).toBe(4);
  expect(school.jhsNonGradedEnrollment).toBe(37);
  expect(school.jhsNonGradedTeachers).toBe(2);
  expect(school.jhsNonGradedExcess).toBe(8);
  expect(school.jhsNonGradedShortage).toBe(5);
  expect(school.shsEnrollment).toBe(212);
  expect(school.shsTeachers).toBe(7);
  expect(school.shsExcess).toBe(9);
  expect(school.shsShortage).toBe(1);
  expect(schoolWithoutRemarks.schoolHeadRemarks).toBe('');
  expect(schoolWithoutRemarks.totalEnrollment).toBeNull();
  expect(schoolWithoutRemarks.teacherReqTotalTeachers).toBeNull();
  expect(schoolWithoutRemarks.teacherReqTotalExcess).toBeNull();
  expect(schoolWithoutRemarks.teacherReqTotalShortage).toBeNull();
  expect(schoolWithoutRemarks.elemRegularEnrollment).toBeNull();
  expect(schoolWithoutRemarks.elemRegularTeachers).toBeNull();
  expect(schoolWithoutRemarks.elemRegularExcess).toBeNull();
  expect(schoolWithoutRemarks.elemRegularShortage).toBeNull();
  expect(schoolWithoutRemarks.elemNonGradedEnrollment).toBeNull();
  expect(schoolWithoutRemarks.elemNonGradedTeachers).toBeNull();
  expect(schoolWithoutRemarks.elemNonGradedExcess).toBeNull();
  expect(schoolWithoutRemarks.elemNonGradedShortage).toBeNull();
  expect(schoolWithoutRemarks.jhsRegularEnrollment).toBeNull();
  expect(schoolWithoutRemarks.jhsRegularTeachers).toBeNull();
  expect(schoolWithoutRemarks.jhsRegularExcess).toBeNull();
  expect(schoolWithoutRemarks.jhsRegularShortage).toBeNull();
  expect(schoolWithoutRemarks.jhsNonGradedEnrollment).toBeNull();
  expect(schoolWithoutRemarks.jhsNonGradedTeachers).toBeNull();
  expect(schoolWithoutRemarks.jhsNonGradedExcess).toBeNull();
  expect(schoolWithoutRemarks.jhsNonGradedShortage).toBeNull();
  expect(schoolWithoutRemarks.shsEnrollment).toBeNull();
  expect(schoolWithoutRemarks.shsTeachers).toBeNull();
  expect(schoolWithoutRemarks.shsExcess).toBeNull();
  expect(schoolWithoutRemarks.shsShortage).toBeNull();
  expect(school.schoolHead).toBe('AUNARIO, MYRENE, SANGCAP');
  expect(school.designation).toBe('Principal I');
  expect(school.personnelRecords[0].teachingLoad).toBe(245);
});

test('maps every populated schoolhead remark directly from the schools sheet', () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    school_id: 108391,
    school_name: 'Matikiw ES',
    sh_remarks: '6 out of 7 teachers are secondary educ graduates',
  }, {
    school_id: 301243,
    school_name: 'Kabulusan Integrated National High School',
    sh_remarks: 'excess in parameters but w/shortage in actual due to 2 annex schools',
  }, {
    school_id: 108405,
    school_name: 'Aplaya ES',
    sh_remarks: 'no shortage as of 8.22.25',
  }, {
    school_id: 108464,
    school_name: 'School with multigrade remark',
    sh_remarks: 'multigrade, no shortage as of 08.22.25',
  }, {
    school_id: 301273,
    school_name: 'Siniloan Integrated National High School',
    sh_remarks: 'w/ classroom shortage in SHS. Ratio is 1:60',
  }]), 'schools');

  const schools = buildSchoolRecordsFromWorkbook(workbook);
  expect(schools.map((school) => school.schoolHeadRemarks)).toEqual([
    '6 out of 7 teachers are secondary educ graduates',
    'excess in parameters but w/shortage in actual due to 2 annex schools',
    'no shortage as of 8.22.25',
    'multigrade, no shortage as of 08.22.25',
    'w/ classroom shortage in SHS. Ratio is 1:60',
  ]);
});

test('detects when the published schools sheet omits the sh_remarks column', () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{
    school_id: 301243,
    school_name: 'Kabulusan Integrated National High School',
  }]), 'schools');
  expect(hasSchoolHeadRemarksColumn(workbook)).toBe(false);

  workbook.Sheets.schools = XLSX.utils.json_to_sheet([{
    school_id: 301243,
    school_name: 'Kabulusan Integrated National High School',
    sh_remarks: 'School remark',
  }]);
  expect(hasSchoolHeadRemarksColumn(workbook)).toBe(true);
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
    subOffice: 'Test District',
    schoolHeadRemarks: 'Remarks loaded from the schools worksheet.',
    legalBasis: 'view',
    legalBasisUrl: 'https://example.com/legal-basis',
    establishmentStatus: 'DO plantilla\nAdditional status detail',
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  expect(screen.getByRole('heading', { name: 'Test School' })).toBeInTheDocument();
  expect(screen.getByText('Remarks loaded from the schools worksheet.')).toBeInTheDocument();
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

test('styles allocation and GAD amounts like their labels', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    elemAllocation: 1000,
    jhsAllocation: 2000,
    shsAllocation: 3000,
    gad: 4000,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  ['Elem Allocation', 'JHS Allocation', 'SHS Allocation', 'GAD'].forEach((label) => {
    const labelElement = within(details).getByText(label);
    const row = labelElement.closest('.detail-row');
    expect(row).toHaveClass('detail-muted-row');
    expect(row.querySelector('dd')).toBeInTheDocument();
  });
});

test('shows elementary allocation from the mooe sheet elementary column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    elemAllocation: 765432,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('Elem Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱765,432');
});

test('keeps a zero elementary allocation instead of showing the placeholder amount', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    elemAllocation: 0,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('Elem Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱0');
});

test('shows JHS allocation from the mooe sheet jhs column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    jhsAllocation: 234567,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('JHS Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱234,567');
});

test('keeps a zero JHS allocation instead of showing a placeholder amount', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    jhsAllocation: 0,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('JHS Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱0');
});

test('shows SHS allocation from the mooe sheet shs column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    shsAllocation: 123456,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('SHS Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱123,456');
});

test('keeps a zero SHS allocation instead of showing a placeholder amount', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    shsAllocation: 0,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const allocationRow = within(details).getByText('SHS Allocation').closest('.detail-row');
  expect(allocationRow.querySelector('dd')).toHaveTextContent('₱0');
});

test('shows GAD from the mooe sheet gad column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    gad: 34567,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const gadRow = within(details).getByText('GAD').closest('.detail-row');
  expect(gadRow.querySelector('dd')).toHaveTextContent('₱34,567');
});

test('keeps a zero GAD amount instead of showing a placeholder amount', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    gad: 0,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const gadRow = within(details).getByText('GAD').closest('.detail-row');
  expect(gadRow.querySelector('dd')).toHaveTextContent('₱0');
});

test('shows MOOE from the mooe sheet total_mooe column', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    totalMooe: 1234567,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const mooeRow = within(details).getByText('MOOE').closest('.detail-row');
  expect(mooeRow.querySelector('dd')).toHaveTextContent('₱1,234,567');
});

test('keeps a zero MOOE value instead of showing the placeholder amount', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: 'school-1',
    name: 'Test School',
    totalMooe: 0,
  }} />);

  const details = screen.getByText('SCHOOL DETAILS').closest('section');
  const mooeRow = within(details).getByText('MOOE').closest('.detail-row');
  expect(mooeRow.querySelector('dd')).toHaveTextContent('₱0');
});

test('shows elementary regular enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemRegularEnrollment: 735,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('735');
});

test('styles zero inventory values gray and preserves positive excess and shortage colors', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    elemRegularEnrollment: 0,
    elemRegularTeachers: 0,
    elemRegularExcess: 0,
    elemRegularShortage: 0,
    elemNonGradedEnrollment: 12,
    elemNonGradedTeachers: 3,
    elemNonGradedExcess: 2,
    elemNonGradedShortage: 1,
    personnelRecords: [],
  }} />);

  const zeroRow = screen.getByText('ELEM - Reg').closest('tr');
  within(zeroRow).getAllByRole('cell').forEach((cell) => {
    expect(cell).toHaveClass('text-secondary');
  });

  const positiveRow = screen.getByText('ELEM - NG').closest('tr');
  const positiveCells = within(positiveRow).getAllByRole('cell');
  expect(positiveCells[0]).not.toHaveClass('text-secondary');
  expect(positiveCells[1]).not.toHaveClass('text-secondary');
  expect(positiveCells[0]).toHaveClass('fw-bold');
  expect(positiveCells[1]).toHaveClass('fw-bold');
  expect(positiveCells[2]).toHaveClass('table-success', 'fw-bold');
  expect(positiveCells[3]).toHaveClass('table-danger', 'fw-bold');
});

test('shows grand total enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    totalEnrollment: 1500,
    teacherReqTotalTeachers: 26,
    teacherReqTotalExcess: 17,
    teacherReqTotalShortage: 13,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('GRAND TOTAL').closest('tr');
  expect(row).toHaveClass('table-light');
  expect(row.closest('table').querySelector('thead tr')).toHaveClass('inventory-table-header');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('1,500');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('26');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('17');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('13');
  expect(within(row).getAllByRole('cell')[2]).not.toHaveClass('table-success');
  expect(within(row).getAllByRole('cell')[3]).not.toHaveClass('table-danger');
  within(row).getAllByRole('cell').forEach((cell) => {
    expect(cell).not.toHaveClass('fw-bold');
  });
});

test('preserves a zero grand total shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    totalShortage: 99,
    teacherReqTotalShortage: 0,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('GRAND TOTAL').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('0');
});

test('preserves a zero grand total excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    totalExcess: 99,
    teacherReqTotalExcess: 0,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('GRAND TOTAL').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('0');
});

test('shows elementary regular teacher count from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemRegularTeachers: 12,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('12');
});

test('shows elementary regular excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemRegularExcess: 4,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('4');
});

test('shows elementary regular shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemRegularShortage: 3,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('3');
});

test('shows elementary non-graded enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemNonGradedEnrollment: 82,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('82');
});

test('shows elementary non-graded teacher count from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemNonGradedTeachers: 3,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('3');
});

test('shows elementary non-graded excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemNonGradedExcess: 5,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('5');
});

test('shows elementary non-graded shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    elemNonGradedShortage: 2,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('ELEM - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('2');
});

test('shows junior high regular enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsRegularEnrollment: 456,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('456');
});

test('shows junior high regular teacher count from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsRegularTeachers: 15,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('15');
});

test('shows junior high regular excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsRegularExcess: 6,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('6');
});

test('shows junior high regular shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsRegularShortage: 4,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - Reg').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('4');
});

test('shows junior high non-graded enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsNonGradedEnrollment: 37,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('37');
});

test('shows junior high non-graded teacher count from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsNonGradedTeachers: 2,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('2');
});

test('shows junior high non-graded excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsNonGradedExcess: 8,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('8');
});

test('shows junior high non-graded shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    jhsNonGradedShortage: 5,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('JHS - NG').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('5');
});

test('shows senior high enrollment from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    shsEnrollment: 212,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('SHS').closest('tr');
  expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('212');
});

test('shows senior high teacher count from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    shsTeachers: 7,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('SHS').closest('tr');
  expect(within(row).getAllByRole('cell')[1]).toHaveTextContent('7');
});

test('shows senior high excess from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    shsExcess: 9,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('SHS').closest('tr');
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('9');
});

test('shows senior high shortage from teacher inventory data', () => {
  render(<SchoolDetailTab activeSchoolDetail={{
    id: '307930',
    name: 'Test School',
    studentsCount: 1000,
    shsShortage: 1,
    personnelRecords: [],
  }} />);

  const row = screen.getByText('SHS').closest('tr');
  expect(within(row).getAllByRole('cell')[3]).toHaveTextContent('1');
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
  expect(screen.getByRole('link', { name: /SIPAT \(School Inventory Profiling and Analysis Tool\)/ })).toBeInTheDocument();
});

test('shows school name and district in top search while matching the school name in the header', () => {
  const school = { id: '108188', name: 'Alaminos CES', region: 'Alaminos' };
  const onSelectSchool = jest.fn();
  const setSchoolSearchValue = jest.fn();

  render(<Header
    schools={[school]}
    schoolSearchValue=""
    setSchoolSearchValue={setSchoolSearchValue}
    onSelectSchool={onSelectSchool}
    fileInputRef={{ current: null }}
    isLoadingFile={false}
    darkMode={false}
    setDarkMode={() => {}}
    onRefreshData={() => {}}
  />);

  const search = screen.getByRole('combobox', { name: 'Search schools by name' });
  expect(document.querySelector('#school-search-options option')).toHaveAttribute(
    'value',
    'Alaminos CES, Alaminos'
  );

  fireEvent.change(search, { target: { value: 'Alaminos CES, Alaminos' } });
  expect(setSchoolSearchValue).toHaveBeenCalledWith('Alaminos CES, Alaminos');
  expect(onSelectSchool).toHaveBeenCalledWith(school);
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

  const personnelHeader = screen.getByRole('heading', { name: 'Personnel Inventory' }).closest('header');
  expect(personnelHeader).toHaveClass('personnel-inventory-header', 'justify-content-between', 'flex-nowrap');
  const personnelCount = screen.getByText('2 of 2 personnel');
  expect(personnelCount).toHaveClass('personnel-inventory-count');
  expect(personnelCount.parentElement).toHaveClass('personnel-inventory-controls', 'align-items-center', 'flex-nowrap');
  expect(personnelHeader).toContainElement(screen.getByRole('searchbox', { name: 'Search personnel' }));
  expect(personnelHeader.querySelector('h2')).toHaveClass('text-nowrap');

  expect(screen.getByRole('columnheader', { name: 'Teaching Load' })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Overall / Teaching Load' })).not.toBeInTheDocument();

  const search = screen.getByRole('searchbox', { name: 'Search personnel' });
  fireEvent.change(search, { target: { value: 'ava santos' } });

  const rosterTable = screen.getAllByRole('table')[1];
  const avaRow = within(rosterTable).getByText('Ava Santos').closest('tr');
  expect(avaRow).toBeInTheDocument();
  expect(within(avaRow).getAllByRole('cell')[5]).toHaveTextContent('240');
  expect(within(avaRow).queryByText('300 / 240')).not.toBeInTheDocument();
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
