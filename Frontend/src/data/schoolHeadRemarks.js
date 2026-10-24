export const normalizeSchoolHeadRemarks = (value) => {
  if (value == null) return '';
  const remarks = String(value).trim();
  return /^none$/i.test(remarks) ? '' : remarks;
};
