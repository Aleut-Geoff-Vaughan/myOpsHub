import type { HelpContextMapping } from '../types/help';

/**
 * Maps routes to help context keys.
 * Used to determine which help articles to show based on current page.
 */
export const helpContextMappings: HelpContextMapping[] = [
  // Work Module
  { pattern: /^\/work\/staffing/, contextKey: 'work.staffing', moduleName: 'work' },
  { pattern: /^\/work\/projects/, contextKey: 'work.projects', moduleName: 'work' },
  { pattern: /^\/work\/wbs/, contextKey: 'work.wbs', moduleName: 'work' },
  { pattern: /^\/work\/assignments/, contextKey: 'work.assignments', moduleName: 'work' },
  { pattern: /^\/work\/team-calendar/, contextKey: 'work.team-calendar', moduleName: 'work' },
  { pattern: /^\/work\/work-location/, contextKey: 'work.work-location', moduleName: 'work' },
  { pattern: /^\/work\/doa/, contextKey: 'work.doa', moduleName: 'work' },
  { pattern: /^\/work/, contextKey: 'work', moduleName: 'work' },

  // Forecast Module
  { pattern: /^\/forecast\/projects/, contextKey: 'forecast.projects', moduleName: 'forecast' },
  { pattern: /^\/forecast\/settings/, contextKey: 'forecast.settings', moduleName: 'forecast' },
  { pattern: /^\/forecast\/cost-rates/, contextKey: 'forecast.cost-rates', moduleName: 'forecast' },
  { pattern: /^\/forecast\/reports/, contextKey: 'forecast.reports', moduleName: 'forecast' },
  { pattern: /^\/forecast/, contextKey: 'forecast', moduleName: 'forecast' },

  // Facilities Module
  { pattern: /^\/facilities\/hoteling/, contextKey: 'facilities.hoteling', moduleName: 'facilities' },
  { pattern: /^\/facilities\/offices/, contextKey: 'facilities.offices', moduleName: 'facilities' },
  { pattern: /^\/facilities\/leases/, contextKey: 'facilities.leases', moduleName: 'facilities' },
  { pattern: /^\/facilities\/portal/, contextKey: 'facilities.portal', moduleName: 'facilities' },
  { pattern: /^\/facilities/, contextKey: 'facilities', moduleName: 'facilities' },

  // Resume Module
  { pattern: /^\/resume\/profile/, contextKey: 'resume.profile', moduleName: 'resume' },
  { pattern: /^\/resume\/certifications/, contextKey: 'resume.certifications', moduleName: 'resume' },
  { pattern: /^\/resume\/skills/, contextKey: 'resume.skills', moduleName: 'resume' },
  { pattern: /^\/resume/, contextKey: 'resume', moduleName: 'resume' },

  // Admin Module
  { pattern: /^\/admin\/users/, contextKey: 'admin.users', moduleName: 'admin' },
  { pattern: /^\/admin\/tenants/, contextKey: 'admin.tenants', moduleName: 'admin' },
  { pattern: /^\/admin\/permissions/, contextKey: 'admin.permissions', moduleName: 'admin' },
  { pattern: /^\/admin\/settings/, contextKey: 'admin.settings', moduleName: 'admin' },
  { pattern: /^\/admin\/help-articles/, contextKey: 'admin.help-articles', moduleName: 'admin' },
  { pattern: /^\/admin/, contextKey: 'admin', moduleName: 'admin' },

  // Dashboard
  { pattern: /^\/dashboard/, contextKey: 'dashboard', moduleName: 'dashboard' },

  // Profile
  { pattern: /^\/profile/, contextKey: 'profile', moduleName: 'profile' },

  // Default
  { pattern: /^\//, contextKey: 'general', moduleName: 'general' },
];

/**
 * Get the help context key for a given path
 */
export function getHelpContextKey(pathname: string): { contextKey: string; moduleName: string } {
  for (const mapping of helpContextMappings) {
    if (typeof mapping.pattern === 'string') {
      if (pathname === mapping.pattern || pathname.startsWith(mapping.pattern + '/')) {
        return { contextKey: mapping.contextKey, moduleName: mapping.moduleName };
      }
    } else if (mapping.pattern.test(pathname)) {
      return { contextKey: mapping.contextKey, moduleName: mapping.moduleName };
    }
  }

  return { contextKey: 'general', moduleName: 'general' };
}

/**
 * List of available modules for categorization
 */
export const helpModules = [
  { key: 'work', label: 'Work & Staffing' },
  { key: 'forecast', label: 'Forecasting' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'resume', label: 'Resume' },
  { key: 'admin', label: 'Administration' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'profile', label: 'Profile' },
  { key: 'general', label: 'General' },
];
