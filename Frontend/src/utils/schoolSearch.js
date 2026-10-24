export const getSchoolSearchLabel = (school) => (
  [school.name, school.region].filter(Boolean).join(', ')
);
