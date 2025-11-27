import { useMemo } from 'react';

interface OfficeIconProps {
  stateCode?: string;
  countryCode?: string;
  iconUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// US State abbreviation to full name mapping for display
const US_STATES: Record<string, { name: string; color: string }> = {
  AL: { name: 'Alabama', color: 'bg-red-500' },
  AK: { name: 'Alaska', color: 'bg-blue-700' },
  AZ: { name: 'Arizona', color: 'bg-amber-600' },
  AR: { name: 'Arkansas', color: 'bg-red-600' },
  CA: { name: 'California', color: 'bg-yellow-500' },
  CO: { name: 'Colorado', color: 'bg-blue-600' },
  CT: { name: 'Connecticut', color: 'bg-blue-500' },
  DE: { name: 'Delaware', color: 'bg-blue-400' },
  FL: { name: 'Florida', color: 'bg-orange-500' },
  GA: { name: 'Georgia', color: 'bg-red-500' },
  HI: { name: 'Hawaii', color: 'bg-teal-500' },
  ID: { name: 'Idaho', color: 'bg-blue-600' },
  IL: { name: 'Illinois', color: 'bg-blue-500' },
  IN: { name: 'Indiana', color: 'bg-blue-600' },
  IA: { name: 'Iowa', color: 'bg-blue-500' },
  KS: { name: 'Kansas', color: 'bg-yellow-600' },
  KY: { name: 'Kentucky', color: 'bg-blue-600' },
  LA: { name: 'Louisiana', color: 'bg-purple-600' },
  ME: { name: 'Maine', color: 'bg-blue-700' },
  MD: { name: 'Maryland', color: 'bg-red-600' },
  MA: { name: 'Massachusetts', color: 'bg-blue-600' },
  MI: { name: 'Michigan', color: 'bg-blue-500' },
  MN: { name: 'Minnesota', color: 'bg-blue-600' },
  MS: { name: 'Mississippi', color: 'bg-red-600' },
  MO: { name: 'Missouri', color: 'bg-blue-500' },
  MT: { name: 'Montana', color: 'bg-blue-700' },
  NE: { name: 'Nebraska', color: 'bg-yellow-600' },
  NV: { name: 'Nevada', color: 'bg-blue-600' },
  NH: { name: 'New Hampshire', color: 'bg-blue-500' },
  NJ: { name: 'New Jersey', color: 'bg-yellow-500' },
  NM: { name: 'New Mexico', color: 'bg-red-500' },
  NY: { name: 'New York', color: 'bg-blue-600' },
  NC: { name: 'North Carolina', color: 'bg-blue-500' },
  ND: { name: 'North Dakota', color: 'bg-blue-600' },
  OH: { name: 'Ohio', color: 'bg-red-500' },
  OK: { name: 'Oklahoma', color: 'bg-orange-600' },
  OR: { name: 'Oregon', color: 'bg-blue-700' },
  PA: { name: 'Pennsylvania', color: 'bg-blue-500' },
  RI: { name: 'Rhode Island', color: 'bg-blue-500' },
  SC: { name: 'South Carolina', color: 'bg-blue-600' },
  SD: { name: 'South Dakota', color: 'bg-blue-700' },
  TN: { name: 'Tennessee', color: 'bg-red-500' },
  TX: { name: 'Texas', color: 'bg-red-600' },
  UT: { name: 'Utah', color: 'bg-blue-500' },
  VT: { name: 'Vermont', color: 'bg-green-600' },
  VA: { name: 'Virginia', color: 'bg-blue-600' },
  WA: { name: 'Washington', color: 'bg-green-500' },
  WV: { name: 'West Virginia', color: 'bg-blue-600' },
  WI: { name: 'Wisconsin', color: 'bg-red-500' },
  WY: { name: 'Wyoming', color: 'bg-blue-700' },
  DC: { name: 'Washington DC', color: 'bg-red-600' },
};

// Country code to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  MX: '🇲🇽',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  JP: '🇯🇵',
  AU: '🇦🇺',
  IN: '🇮🇳',
  BR: '🇧🇷',
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function OfficeIcon({
  stateCode,
  countryCode = 'US',
  iconUrl,
  size = 'md',
  className = '',
}: OfficeIconProps) {
  const sizeClass = SIZE_CLASSES[size];

  const icon = useMemo(() => {
    // If custom icon URL is provided, use it
    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt="Office icon"
          className={`${sizeClass} rounded-lg object-cover ${className}`}
        />
      );
    }

    // If US state code is provided, show a state badge
    if (stateCode && countryCode === 'US') {
      const stateInfo = US_STATES[stateCode.toUpperCase()];
      if (stateInfo) {
        return (
          <div
            className={`${sizeClass} ${stateInfo.color} rounded-lg flex items-center justify-center font-bold text-white ${className}`}
            title={stateInfo.name}
          >
            {stateCode.toUpperCase()}
          </div>
        );
      }
    }

    // If country code is provided, show country flag
    if (countryCode) {
      const flag = COUNTRY_FLAGS[countryCode.toUpperCase()];
      if (flag) {
        return (
          <div
            className={`${sizeClass} bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
            title={countryCode}
          >
            <span className="text-2xl">{flag}</span>
          </div>
        );
      }
    }

    // Default office building icon
    return (
      <div className={`${sizeClass} bg-blue-100 rounded-lg flex items-center justify-center ${className}`}>
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    );
  }, [iconUrl, stateCode, countryCode, sizeClass, className]);

  return icon;
}

export default OfficeIcon;
