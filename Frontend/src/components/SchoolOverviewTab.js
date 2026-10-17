import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FilterListIcon,
  SchoolIcon,
  PeopleIcon,
  WorkspacePremiumIcon,
  TrendingUpIcon,
  DomainIcon,
  ErrorOutlineIcon,
  ChevronRightIcon,
} from './common/uiIcons';

export function SchoolOverviewTab({
  schools,
  filteredSchools,
  selectedRegion,
  setSelectedRegion,
  selectedType,
  setSelectedType,
  setSelectedSchoolId,
  setActiveTab,
  fileDataSource,
  totalStudents,
  avgGraduationRate,
  avgStudentTeacherRatio,
  uniqueRegions,
  uniqueTypes,
}) {
  const scrollContainerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [filteredSchools.length, selectedRegion, selectedType]);

  const visibleSchools = useMemo(() => filteredSchools.slice(0, visibleCount), [filteredSchools, visibleCount]);

  const openSchool = (school) => {
    setSelectedSchoolId(school.id);
    setActiveTab(1);
  };

  const handleDirectoryScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom <= 120 && visibleCount < filteredSchools.length) {
      setVisibleCount((previousCount) => Math.min(previousCount + 20, filteredSchools.length));
    }
  };

  const metrics = [
    { label: 'Total schools', value: schools.length, note: 'Live parsed records', icon: DomainIcon, tone: 'green' },
    { label: 'Total enrollment', value: totalStudents.toLocaleString(), note: 'Aggregated student count', icon: PeopleIcon, tone: 'blue' },
    { label: 'Avg. graduation rate', value: `${avgGraduationRate}%`, note: 'Benchmark average', icon: SchoolIcon, tone: 'mint' },
    { label: 'Student-teacher ratio', value: `${avgStudentTeacherRatio} : 1`, note: 'Based on dataset teachers', icon: WorkspacePremiumIcon, tone: 'amber' },
  ];

  return (
    <div className="vstack gap-3">
      <div className="row g-3">
        {metrics.map(({ label, value, note, icon: MetricIcon, tone }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={label}>
            <section className="card metric-card h-100">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="eyebrow">{label}</div>
                    <div className="metric-value">{value}</div>
                  </div>
                  <span className={`metric-icon metric-icon-${tone}`}><MetricIcon /></span>
                </div>
                <div className="small text-secondary mt-3"><TrendingUpIcon className="me-1" />{note}</div>
              </div>
            </section>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label small fw-semibold" htmlFor="region-filter"><FilterListIcon className="me-2" />Region / District</label>
              <select id="region-filter" className="form-select" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
                {uniqueRegions.map((region) => <option key={region} value={region}>{region === 'All' ? 'All Regions' : region}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label small fw-semibold" htmlFor="type-filter">School Type</label>
              <select id="type-filter" className="form-select" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {uniqueTypes.map((type) => <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-2">
              {(selectedRegion !== 'All' || selectedType !== 'All') && (
                <button className="btn btn-outline-secondary w-100" type="button" onClick={() => {
                  setSelectedRegion('All');
                  setSelectedType('All');
                }}>
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card directory-card">
        <div className="card-header bg-white border-0 p-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h2 className="h5 mb-1">Schools Directory</h2>
            <p className="small text-secondary mb-0">All records parsed from {fileDataSource}</p>
          </div>
          <span className="badge rounded-pill text-bg-light border">
            Showing {Math.min(visibleCount, filteredSchools.length)} of {filteredSchools.length}
          </span>
        </div>
        <div className="table-responsive directory-scroll" ref={scrollContainerRef} onScroll={handleDirectoryScroll}>
          <table className="table table-hover align-middle mb-0 school-directory-table">
            <thead className="table-light sticky-top">
              <tr>
                <th scope="col">School Details</th>
                <th scope="col">Type &amp; Region</th>
                <th scope="col">Students</th>
                <th scope="col">Graduation Rate</th>
                <th scope="col">Avg SAT</th>
                <th scope="col">Grade / Rating</th>
                <th scope="col" className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.length > 0 ? visibleSchools.map((school) => {
                const graduationRate = Math.min(100, Math.max(0, school.gradRate || 0));
                const typeClass = school.type === 'Public' ? 'text-bg-success' : school.type === 'Private' ? 'text-bg-primary' : 'text-bg-warning';
                const gradeClass = String(school.performanceGrade).startsWith('A') ? 'text-bg-success' : 'text-bg-info';

                return (
                  <tr key={school.id} className="school-directory-row" onClick={() => openSchool(school)}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <span className="school-avatar">{school.name.substring(0, 2).toUpperCase()}</span>
                        <div>
                          <div className="fw-semibold">{school.name}</div>
                          <div className="small text-secondary">{school.id} · {school.principal}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${typeClass}`}>{school.type}</span>
                      <div className="small text-secondary mt-1">{school.region}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{school.studentsCount ? school.studentsCount.toLocaleString() : 'N/A'}</div>
                      <div className="small text-secondary">{school.teachersCount || 0} teachers</div>
                    </td>
                    <td className="graduation-cell">
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" role="progressbar" aria-label={`${school.name} graduation rate`} aria-valuenow={graduationRate} aria-valuemin="0" aria-valuemax="100">
                          <div className="progress-bar bg-success" style={{ width: `${graduationRate}%` }} />
                        </div>
                        <span className="small fw-semibold">{school.gradRate}%</span>
                      </div>
                    </td>
                    <td className="fw-semibold">{school.avgSat || 'N/A'}</td>
                    <td><span className={`badge ${gradeClass}`}>{school.performanceGrade || `${school.rating} ★`}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-success" type="button" onClick={(event) => {
                        event.stopPropagation();
                        openSchool(school);
                      }}>
                        Inspect <ChevronRightIcon className="ms-1" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <ErrorOutlineIcon className="empty-state-icon" />
                    <div className="fw-semibold mt-2">No schools found in {fileDataSource} matching filters</div>
                    <div className="small text-secondary">Try adjusting the filters or uploading another file.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}