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
