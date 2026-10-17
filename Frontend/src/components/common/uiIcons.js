const makeIcon = (iconName) => function BootstrapIcon({ className = '', title }) {
  return (
    <i
      className={`bi bi-${iconName} ${className}`.trim()}
      aria-hidden={title ? undefined : 'true'}
      title={title}
    />
  );
};

export const SearchIcon = makeIcon('search');
export const SchoolIcon = makeIcon('mortarboard-fill');
export const PeopleIcon = makeIcon('people-fill');
export const WorkspacePremiumIcon = makeIcon('award-fill');
export const TrendingUpIcon = makeIcon('trending-up');
export const LocationOnIcon = makeIcon('geo-alt-fill');
export const PhoneIcon = makeIcon('telephone-fill');
export const LanguageIcon = makeIcon('globe2');
export const FilterListIcon = makeIcon('funnel-fill');
export const OpenInNewIcon = makeIcon('box-arrow-up-right');
export const CheckCircleIcon = makeIcon('check-circle-fill');
export const DomainIcon = makeIcon('buildings-fill');
export const ChevronRightIcon = makeIcon('chevron-right');
export const ErrorOutlineIcon = makeIcon('exclamation-circle-fill');
export const AutoAwesomeIcon = makeIcon('stars');