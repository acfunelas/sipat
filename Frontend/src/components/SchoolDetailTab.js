import React, { useMemo, useState } from 'react';

export function SchoolDetailTab({ activeSchoolDetail }) {
  const [personnelSearch, setPersonnelSearch] = useState('');
  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    if (!numericValue) return '₱0';
    return `₱${numericValue.toLocaleString()}`;
  };

  const formatSchoolYearLabel = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const nextYear = value + 1;
      return `SY ${String(value).slice(-2)}-${String(nextYear).slice(-2)}`;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return 'SY 00-01';
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((part) => part.trim());
        const startYear = Number(start);
        const endYear = Number(end);
        if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
          return `SY ${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
        }
      }
      const numericYear = Number(trimmed);
      if (Number.isFinite(numericYear)) {
        const nextYear = numericYear + 1;
        return `SY ${String(numericYear).slice(-2)}-${String(nextYear).slice(-2)}`;
      }
    }

    return 'SY 00-01';
  };

  const schoolProfile = {
    name: activeSchoolDetail?.name || 'Calauan CES',
    district: activeSchoolDetail?.subOffice || 'CALAUAN',
    schoolHead: activeSchoolDetail?.schoolHead || activeSchoolDetail?.principal || 'Mylene M. Dimaculangan',
    designation: activeSchoolDetail?.designation || 'Principal II',
    contactNumber: activeSchoolDetail?.contactNumber || '0945 7032 907',
    coc: activeSchoolDetail?.coc || 'Purely ES',
    schoolClass: activeSchoolDetail?.schoolClass || 'Large',
    enrollment: activeSchoolDetail?.studentsCount || 1125,
    shifting: activeSchoolDetail?.shifting || 'Single Shift',
    classrooms: activeSchoolDetail?.classrooms || 45,
    roomShortage: activeSchoolDetail?.classroomShortage || 'no shortage',
    schoolId: activeSchoolDetail?.schoolId || activeSchoolDetail?.id || '108255',
    totalMooe: activeSchoolDetail?.totalMooe || 1919000,
    elemAllocation: activeSchoolDetail?.elemAllocation || 1919000,
    jhsAllocation: activeSchoolDetail?.jhsAllocation || 0,
    shsAllocation: activeSchoolDetail?.shsAllocation || 0,
    gad: activeSchoolDetail?.gad || 95950,
    emailAddress: activeSchoolDetail?.emailAddress || '108255@deped.gov.ph',
    subOffice: activeSchoolDetail?.subOffice || 'CALAUAN',
    psds: activeSchoolDetail?.psds || 'Luis M. Germina',
    status: activeSchoolDetail?.status || 'Non-IU',
    legalBasis: activeSchoolDetail?.legalBasis || 'view',
    establishmentStatus: activeSchoolDetail?.establishmentStatus || 'DO plantilla',
  };

  const enrollmentHistory = useMemo(() => {
    if (!activeSchoolDetail?.enrollmentHistory || activeSchoolDetail.enrollmentHistory.length === 0) {
      return [
        { schoolYear: '2023', enrollment: Math.max(0, schoolProfile.enrollment - 60) },
        { schoolYear: '2024', enrollment: Math.max(0, schoolProfile.enrollment - 30) },
        { schoolYear: '2025', enrollment: schoolProfile.enrollment },
      ];
    }

    return [...activeSchoolDetail.enrollmentHistory]
      .sort((a, b) => Number(a.schoolYear || 0) - Number(b.schoolYear || 0))
      .slice(-3);
  }, [activeSchoolDetail, schoolProfile.enrollment]);

  const enrollmentTrend = enrollmentHistory.map((row) => Number(row.enrollment));
  const yearToYearVariance = enrollmentTrend.length > 1
    ? enrollmentTrend[enrollmentTrend.length - 1] - enrollmentTrend[enrollmentTrend.length - 2]
    : 0;
  const varianceDirection = yearToYearVariance >= 0 ? 'up' : 'down';
  const varianceArrow = yearToYearVariance >= 0 ? '↑' : '↓';
  const varianceSummary = `${varianceArrow} ${Math.abs(yearToYearVariance).toLocaleString()} ${varianceDirection} from last school year`;
  const enrollmentLabels = enrollmentHistory.map((row) => row.schoolYear ? formatSchoolYearLabel(row.schoolYear) : '');

  const stateCards = [
    { label: 'Current Ratio', value: '26', tone: '#e3f2fd', color: '#1565c0' },
    { label: 'Track', value: 'STEM', tone: '#e8f5e9', color: '#2e7d32' },
    { label: 'Strand', value: 'ICT', tone: '#fff3e0', color: '#ef6c00' },
    { label: 'Reqt HT', value: '2', tone: '#f3e5f5', color: '#7b1fa2' },
    { label: 'Reqt MT', value: '3', tone: '#e0f7fa', color: '#00695c' },
  ];

  const totalTeachers = Number(activeSchoolDetail?.teachersCount || 43);
  const totalShortage = Number(activeSchoolDetail?.totalShortage || 0);
  const totalExcess = Number(activeSchoolDetail?.totalExcess || 2);
  const personnelRecords = activeSchoolDetail?.personnelRecords || [];
  const classificationCounts = personnelRecords.reduce((counts, person) => {
    const classification = person.classification || 'Unclassified';
    counts[classification] = (counts[classification] || 0) + 1;
    return counts;
  }, {});
  const designationsByClassification = personnelRecords.reduce((groups, person) => {
    const classification = person.classification || 'Unclassified';
    const designation = person.designation || 'Unspecified designation';
    groups[classification] = groups[classification] || {};
    groups[classification][designation] = (groups[classification][designation] || 0) + 1;
    return groups;
  }, {});
  const specializationCounts = personnelRecords.reduce((counts, person) => {
    const specialization = person.specialization?.trim();
    if (specialization && specialization.toLowerCase() !== 'n/a') {
      counts[specialization] = (counts[specialization] || 0) + 1;
    }
    return counts;
  }, {});
  const sortedSpecializations = Object.entries(specializationCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
  const classificationPalette = {
    Teaching: '#2e7d32',
    'Teaching-Related': '#ffa726',
    'Non-Teaching': '#64b5f6',
    Unclassified: '#9e9e9e',
  };
  const classificationTotal = personnelRecords.length;
  let donutOffset = 0;
  const donutSegments = Object.entries(classificationCounts).map(([label, value]) => {
    const start = donutOffset;
    donutOffset += classificationTotal ? (value / classificationTotal) * 100 : 0;
    return `${classificationPalette[label] || '#9e9e9e'} ${start}% ${donutOffset}%`;
  });
  const rosterRows = personnelRecords.map((person, index) => ({
    key: `${person.tin || person.nameOfPersonnel || 'person'}-${index}`,
    name: person.nameOfPersonnel || 'N/A',
    designation: person.designation || 'N/A',
    grade: person.gradeLevel || 'N/A',
    area: person.assignedArea || 'N/A',
    specialization: person.specialization || 'N/A',
    overallLoad: person.overallLoad,
    teachingLoad: person.teachingLoad,
    appointmentStatus: person.appointmentStatus || 'N/A',
    status: person.loadingStatus || 'Not specified',
  }));
  const searchTerm = personnelSearch.trim().toLowerCase();
  const filteredRosterRows = searchTerm
    ? rosterRows.filter((person) => [
      person.name,
      person.designation,
      person.grade,
      person.area,
      person.specialization,
      person.overallLoad,
      person.teachingLoad,
      person.appointmentStatus,
      person.status,
    ].some((value) => String(value ?? '').toLowerCase().includes(searchTerm)))
    : rosterRows;
  const inventoryRows = [
    { label: 'GRAND TOTAL', enrollment: schoolProfile.enrollment, teachers: totalTeachers, excess: totalExcess, shortage: totalShortage },
    { label: 'ELEM - Reg', enrollment: Math.max(0, Math.round(schoolProfile.enrollment * 0.66)), teachers: Math.max(0, totalTeachers - 10), excess: Math.max(0, totalExcess - 1), shortage: 0 },
    { label: 'ELEM - NG', enrollment: Math.max(0, Math.round(schoolProfile.enrollment * 0.07)), teachers: 4, excess: 0, shortage: 1 },
    { label: 'JHS - Reg', enrollment: Math.max(0, Math.round(schoolProfile.enrollment * 0.19)), teachers: 8, excess: 1, shortage: 0 },
    { label: 'JHS - NG', enrollment: Math.max(0, Math.round(schoolProfile.enrollment * 0.04)), teachers: 2, excess: 0, shortage: 1 },
    { label: 'SHS', enrollment: Math.max(0, Math.round(schoolProfile.enrollment * 0.04)), teachers: 3, excess: 0, shortage: 0 },
  ];

  const detailGroups = [
    [
      ['School Name', schoolProfile.name],
      ['School Head', schoolProfile.schoolHead],
      ['Designation', schoolProfile.designation],
      ['Contact No.', schoolProfile.contactNumber],
      ['COC', schoolProfile.coc],
      ['School Class', schoolProfile.schoolClass],
      ['Enrollment', schoolProfile.enrollment.toLocaleString()],
      ['Shifting', schoolProfile.shifting],
      ['Classrooms', schoolProfile.classrooms],
      ['Room Shortage', schoolProfile.roomShortage],
    ],
    [
      ['Email Address', schoolProfile.emailAddress],
      ['Email Sub-Office', schoolProfile.subOffice],
      ['PSDS', schoolProfile.psds],
      ['IU/Non-IU', schoolProfile.status],
      ['Legal Basis', schoolProfile.legalBasis],
      ['Establishment Status', schoolProfile.establishmentStatus],
      ['MOOE', formatCurrency(schoolProfile.totalMooe)],
      ['Elem Allocation', formatCurrency(schoolProfile.elemAllocation)],
      ['JHS Allocation', formatCurrency(schoolProfile.jhsAllocation)],
      ['SHS Allocation', formatCurrency(schoolProfile.shsAllocation)],
      ['GAD', formatCurrency(schoolProfile.gad)],
    ],
  ];

  const chartWidth = 720;
  const chartHeight = 270;
  const chartBounds = { left: 58, right: 704, top: 24, bottom: 220 };
  const maxEnrollment = Math.max(...enrollmentTrend, 1);
  const chartPoints = enrollmentTrend.map((value, index) => {
    const x = enrollmentTrend.length > 1
      ? chartBounds.left + (index * (chartBounds.right - chartBounds.left)) / (enrollmentTrend.length - 1)
      : (chartBounds.left + chartBounds.right) / 2;
    const y = chartBounds.bottom - (value / maxEnrollment) * (chartBounds.bottom - chartBounds.top);
    return { x, y, value, label: enrollmentLabels[index] };
  });

  if (!activeSchoolDetail) {
    return <div className="alert alert-warning mb-0" role="status">No school selected or found in dataset.</div>;
  }

  return (
    <div className="vstack gap-3">
      <section className="card school-profile-card overflow-hidden">
        <header className="school-hero px-3 px-lg-4 py-3">
          <div className="eyebrow text-white-50">School ID: {schoolProfile.schoolId}</div>
          <h1 className="h4 fw-bold text-white mb-1">{schoolProfile.name}, {schoolProfile.district}</h1>
          <p className="text-white-75 mb-0">School Head: {schoolProfile.schoolHead}</p>
        </header>

        <div className="p-3 p-lg-4">
          <div className="row g-3 align-items-stretch">
            <div className="col-12 col-xl-4">
              <section className="card h-100 detail-panel">
                <div className="card-header bg-white fw-bold text-uppercase small">School Details</div>
                <div className="card-body p-3">
                  <div className="row g-3">
                    {detailGroups.map((group, groupIndex) => (
                      <div className="col-12 col-sm-6" key={groupIndex}>
                        <dl className="detail-list mb-0">
                          {group.map(([label, value]) => (
                            <div className="detail-row" key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-6">
              <section className="card h-100 detail-panel">
                <div className="card-header bg-white d-flex justify-content-between align-items-center gap-2">
                  <h2 className="h6 text-uppercase fw-bold mb-0">Enrollment Trend</h2>
                  <span className="badge text-bg-light border">3-year comparison</span>
                </div>
                <div className="card-body p-2 p-sm-3">
                  <div className="enrollment-chart-wrap">
                    <svg className="enrollment-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Enrollment trend by school year">
                      {[0, 1, 2, 3, 4].map((step) => {
                        const y = chartBounds.top + ((chartBounds.bottom - chartBounds.top) * step) / 4;
                        const value = Math.round(maxEnrollment * (1 - step / 4));
                        return (
                          <g key={step}>
                            <line x1={chartBounds.left} x2={chartBounds.right} y1={y} y2={y} className="chart-gridline" />
                            <text x={chartBounds.left - 8} y={y + 4} textAnchor="end" className="chart-axis-label">{value.toLocaleString()}</text>
                          </g>
                        );
                      })}
                      <polyline points={chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')} className="chart-line" />
                      {chartPoints.map(({ x, y, value, label }) => (
                        <g key={`${label}-${value}`}>
                          <circle cx={x} cy={y} r="5" className="chart-point">
                            <title>{`${label}: ${value.toLocaleString()}`}</title>
                          </circle>
                          <text x={x} y={Math.max(15, y - 12)} textAnchor="middle" className="chart-value-label">{value.toLocaleString()}</text>
                          <text x={x} y={chartBounds.bottom + 25} textAnchor="middle" className="chart-axis-label">{label}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-2">
              <section className={`card h-100 variance-panel ${yearToYearVariance < 0 ? 'variance-negative' : 'variance-positive'}`}>
                <div className="card-body p-3 p-lg-4">
                  <div className="eyebrow">Variance</div>
                  <div className="variance-value mt-2">
                    {Math.abs(yearToYearVariance).toLocaleString()} <span>{varianceArrow}</span>
                  </div>
                  <p className="small fw-semibold mt-3 mb-0">{varianceSummary}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header bg-white section-header">Enrollment and Teacher Inventory</header>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-12 col-xl-7">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th scope="col">COC</th><th scope="col">Enrollment</th><th scope="col">Teachers</th><th scope="col">Excess</th><th scope="col">Shortage</th></tr>
                  </thead>
                  <tbody>
                    {inventoryRows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td>{row.enrollment.toLocaleString()}</td>
                        <td>{row.teachers}</td>
                        <td className={row.excess > 0 ? 'table-success fw-bold' : ''}>{row.excess}</td>
                        <td className={row.shortage > 0 ? 'table-danger fw-bold' : ''}>{row.shortage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="remarks-panel mt-3">
                <div className="eyebrow">Remarks from Schoolhead</div>
                <p className="small mb-0 mt-2">The school continues to manage classroom and staffing balance while maintaining stable learning delivery and focused support for literacy and numeracy programs.</p>
              </div>
            </div>
            <div className="col-12 col-xl-5">
              <div className="row g-2">
                {stateCards.map((card) => (
                  <div className="col-12 col-sm-6" key={card.label}>
                    <div className="state-card" style={{ backgroundColor: card.tone }}>
                      <span className="small fw-semibold">{card.label}</span>
                      <span className="badge bg-white border" style={{ color: card.color }}>{card.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header bg-white section-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <span>Personnel Inventory per Plantilla</span>
          <span className="small fw-normal text-secondary">Last update: Jun 10, 2026</span>
        </header>
        <div className="card-body p-3">
          <div className="row g-3 align-items-stretch">
            <div className="col-12 col-lg-4">
              <div className="subpanel h-100">
                <h2 className="h6 fw-bold mb-3">Teaching Items</h2>
                {Object.entries(designationsByClassification.Teaching || {})
                  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
                  .map(([designation, count]) => (
                    <div className="compact-list-row" key={designation}><span>{designation}</span><strong>{count}</strong></div>
                  ))}
                {Object.keys(designationsByClassification.Teaching || {}).length === 0 && <p className="small text-secondary mb-0">No teaching personnel rows in this workbook.</p>}
              </div>
            </div>
            <div className="col-12 col-lg-4 d-flex align-items-center justify-content-center py-3">
              <div className="personnel-donut" role="img" aria-label={`${classificationTotal} personnel records`} style={{ background: donutSegments.length ? `conic-gradient(${donutSegments.join(', ')})` : '#e9efeb' }}>
                <div className="personnel-donut-center"><strong>{classificationTotal.toLocaleString()}</strong><span>Personnel Records</span></div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="subpanel h-100">
                <h2 className="h6 fw-bold mb-3">Teaching-Related / Non-Teaching</h2>
                {Object.entries({
                  'Teaching-Related': designationsByClassification['Teaching-Related'] || {},
                  'Non-Teaching': designationsByClassification['Non-Teaching'] || {},
                  Unclassified: designationsByClassification.Unclassified || {},
                }).map(([classification, designations]) => (
                  <div key={classification} className="mb-3">
                    <div className="eyebrow mb-1">{classification}</div>
                    {Object.entries(designations)
                      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
                      .map(([designation, count]) => (
                        <div className="compact-list-row" key={designation}><span>{designation}</span><strong>{count}</strong></div>
                      ))}
                    {Object.keys(designations).length === 0 && <div className="small text-secondary">No records</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header bg-white section-header">Teaching and Related-Teaching Inventory per Specialization</header>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <div className="subpanel h-100">
                <h2 className="h6 fw-bold mb-3">Specialization Count</h2>
                {sortedSpecializations.map((item) => (
                  <div className="compact-list-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>
                ))}
                {sortedSpecializations.length === 0 && <p className="small text-secondary mb-0">No specialization values in this workbook.</p>}
              </div>
            </div>
            <div className="col-12 col-lg-8">
              <div className="subpanel h-100">
                <h2 className="h6 fw-bold mb-3">Coverage by Specialization</h2>
                <div className="specialization-chart">
                  {sortedSpecializations.map((item, index) => (
                    <div className="specialization-column" key={item.label}>
                      <span className="small fw-semibold">{item.value}</span>
                      <div className="specialization-bar-track">
                        <div className="specialization-bar" style={{ height: `${Math.max(16, item.value * 14)}px`, backgroundColor: ['#1b5e20', '#2e7d32', '#66bb6a', '#81c784', '#90caf9', '#64b5f6', '#ffcc80', '#ffa726', '#ef9a9a', '#ef5350', '#c62828'][index] }} />
                      </div>
                      <span className="specialization-label" title={item.label}>{item.label.split(' ')[0]}</span>
                    </div>
                  ))}
                  {sortedSpecializations.length === 0 && <p className="small text-secondary mb-0">No specialization values to chart.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header bg-white d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <h2 className="section-header mb-0">Personnel Inventory</h2>
          <div className="d-flex align-items-center gap-3 flex-grow-1 justify-content-end">
            <span className="small text-secondary text-nowrap">
              {filteredRosterRows.length.toLocaleString()} of {rosterRows.length.toLocaleString()} personnel
            </span>
            <div className="input-group personnel-search">
              <span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span>
              <input
                className="form-control"
                type="search"
                value={personnelSearch}
                onChange={(event) => setPersonnelSearch(event.target.value)}
                placeholder="Search personnel"
                aria-label="Search personnel"
              />
            </div>
          </div>
        </header>
        <div className="card-body p-3">
          <div className="table-responsive personnel-table-wrap">
            <table className="table table-sm table-hover align-middle mb-0 personnel-table">
              <thead className="table-light">
                <tr>
                  <th scope="col">Name of Personnel</th>
                  <th scope="col">Designation</th>
                  <th scope="col">Grade Level</th>
                  <th scope="col">Area / Task</th>
                  <th scope="col">Specialization</th>
                  <th scope="col">Overall / Teaching Load</th>
                  <th scope="col">Appointment Status</th>
                  <th scope="col">Loading Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRosterRows.map((person) => (
                  <tr key={person.key}>
                    <td>{person.name}</td>
                    <td>{person.designation}</td>
                    <td>{person.grade}</td>
                    <td>{person.area}</td>
                    <td>{person.specialization}</td>
                    <td>{person.overallLoad || 0} / {person.teachingLoad || 0}</td>
                    <td>{person.appointmentStatus}</td>
                    <td><span className={`badge status-${String(person.status).toLowerCase().replace(/\s+/g, '-')}`}>{person.status}</span></td>
                  </tr>
                ))}
                {filteredRosterRows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-secondary py-4">
                      No personnel match “{personnelSearch}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}