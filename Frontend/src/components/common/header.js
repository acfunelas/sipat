import React from 'react';

const Header = ({
  schools,
  schoolSearchValue,
  setSchoolSearchValue,
  onSelectSchool,
  fileInputRef,
  isLoadingFile,
  darkMode,
  setDarkMode,
  onRefreshData,
}) => {
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSchoolSearchValue(value);
    const selectedSchool = schools.find((school) => school.name === value);
    if (selectedSchool) onSelectSchool(selectedSchool);
  };

  return (
    <header className="navbar app-navbar sticky-top">
      <div className="container-fluid d-flex flex-wrap align-items-center gap-3 px-3 px-lg-4 py-2">
        <a className="navbar-brand d-flex align-items-center gap-2 text-white m-0" href="#overview">
          <span className="brand-mark"><i className="bi bi-mortarboard-fill" aria-hidden="true" /></span>
          <span>
            <strong className="d-block lh-1">SIPAT</strong>
            <small className="brand-caption">School Inventory Profiling and Analysis Tool</small>
          </span>
        </a>

        <div className="input-group app-school-search flex-grow-1">
          <span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span>
          <input
            className="form-control"
            type="search"
            list="school-search-options"
            placeholder="Search schools by name"
            aria-label="Search schools by name"
            value={schoolSearchValue}
            onChange={handleSearchChange}
          />
          <datalist id="school-search-options">
            {schools.map((school) => <option key={school.id} value={school.name} />)}
          </datalist>
        </div>

        <div className="d-flex align-items-center gap-2 ms-lg-auto">
          <span className="data-source-indicator" title="SIPAT workbook data source">
            <i className="bi bi-database-check" aria-hidden="true" />
            <span className="visually-hidden">Active data source</span>
          </span> 
          <button className="btn btn-sm btn-outline-light" type="button" onClick={onRefreshData} disabled={isLoadingFile}>
            <i className={`bi ${isLoadingFile ? 'bi-arrow-repeat' : 'bi-cloud-arrow-down'} me-1`} aria-hidden="true" />
            {isLoadingFile ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="btn btn-sm btn-outline-light icon-action"
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
          </button>
          <span className="user-avatar d-none d-xl-inline-flex" title="Admin User, Data Analyst">AD</span>
        </div>
      </div>
    </header>
  );
};

export default Header;