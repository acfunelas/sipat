import { fireEvent, render, screen, within } from '@testing-library/react';
import Header from './components/common/header';
import { SchoolDetailTab } from './components/SchoolDetailTab';

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

  expect(screen.getByText('2 SY ago')).toBeInTheDocument();
  expect(screen.getByText('Previous SY')).toBeInTheDocument();
  expect(screen.getByText('Current SY')).toBeInTheDocument();
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('1,100')).toBeInTheDocument();
  expect(screen.getByText('1,050')).toBeInTheDocument();
  expect(screen.getByText('50')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Enrollment trend over the available school years' })).toBeInTheDocument();
  expect(container.querySelector('.enrollment-sparkline text')).not.toBeInTheDocument();
});

test('does not invent enrollment history when the workbook has no school-year records', () => {
  render(<SchoolDetailTab activeSchoolDetail={{ id: 'school-1', name: 'Test School' }} />);

  expect(screen.getByText('No enrollment history available.')).toBeInTheDocument();
  expect(screen.getByText('Trend unavailable')).toBeInTheDocument();
  expect(screen.getByText('No prior school year to compare')).toBeInTheDocument();
});
