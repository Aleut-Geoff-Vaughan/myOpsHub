# myForecast Portal - Comprehensive Test Plan

## 1. Overview

This test plan covers the myForecast portal implementation, which provides a dedicated forecasting experience for PMs, Finance leads, P&L owners, and executives.

### Test Environment
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5107
- **Test Account**: admin@admin.com

### Test Data Prerequisites
- At least 5 projects with project role assignments
- Forecasts in various statuses (Draft, Submitted, Reviewed, Approved, Locked)
- At least 3 test users with different roles (PM, Finance, Executive)
- Budget data configured for variance testing (optional)

---

## 2. Navigation & Layout Tests

### 2.1 ForecastLayout
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NAV-001 | Access forecast portal | Navigate to /forecast | Dashboard loads with sidebar navigation |
| NAV-002 | Sidebar toggle | Click hamburger menu | Sidebar collapses/expands |
| NAV-003 | Navigation links | Click each nav item | Correct page loads |
| NAV-004 | Role-based navigation | Login with PM role | Only PM-relevant items shown |
| NAV-005 | User menu | Click user avatar | Dropdown shows profile, portals, logout |
| NAV-006 | Portal switching | Click "My Portal" in menu | Redirects to main portal |
| NAV-007 | Search shortcut | Press Ctrl+K | Search modal opens |
| NAV-008 | Desktop-only indicator | View Review Queue nav item | Shows desktop icon indicator |

---

## 3. Dashboard Tests

### 3.1 ForecastDashboardPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DASH-001 | Dashboard loads | Navigate to /forecast | Stats cards display with data |
| DASH-002 | Status counts | View dashboard stats | Shows draft, submitted, reviewed, approved counts |
| DASH-003 | Total hours | View summary cards | Total forecasted hours displayed |
| DASH-004 | Quick actions | Click "My Forecasts" card | Navigates to /forecast/my-forecasts |
| DASH-005 | Recent activity | View activity section | Shows recent forecast changes |
| DASH-006 | Empty state | Login with user with no forecasts | Shows appropriate empty message |

---

## 4. My Forecasts Page Tests

### 4.1 MyForecastsPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MYF-001 | List forecasts | Navigate to /forecast/my-forecasts | Shows user's forecasts grouped by project |
| MYF-002 | View mode toggle | Switch between byProject/byMonth/list | View changes correctly |
| MYF-003 | Status filter | Filter by "Submitted" | Only submitted forecasts shown |
| MYF-004 | Year filter | Change year selector | Forecasts for selected year shown |
| MYF-005 | Search | Type project name | Filters forecasts by search term |
| MYF-006 | Click project | Click project name | Navigates to project grid page |
| MYF-007 | Status badges | View forecast items | Status badges have correct colors |

---

## 5. Projects Page Tests

### 5.1 ForecastProjectsPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PRJ-001 | List projects | Navigate to /forecast/projects | Shows all projects with forecast data |
| PRJ-002 | Sort by name | Click Name column header | Projects sort alphabetically |
| PRJ-003 | Sort by hours | Click Hours column header | Projects sort by total hours |
| PRJ-004 | Search projects | Type in search box | Filters by project name |
| PRJ-005 | Project link | Click project name | Navigates to project grid |
| PRJ-006 | Assignment count | View assignments column | Shows correct count |

### 5.2 ProjectForecastGridPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| GRID-001 | Load project grid | Navigate to /forecast/projects/:id | Grid loads with assignments |
| GRID-002 | Year selector | Change year dropdown | Grid shows data for selected year |
| GRID-003 | Version selector | Select different version | Forecasts from selected version shown |
| GRID-004 | Inline editing | Click a cell, enter hours | Cell becomes editable |
| GRID-005 | Save forecast | Enter hours and blur | Forecast saves automatically |
| GRID-006 | Row selection | Click checkbox on row | Row highlights as selected |
| GRID-007 | Bulk selection | Click "Select All" | All rows selected |
| GRID-008 | Submit forecasts | Select rows, click Submit | Selected forecasts move to Submitted status |
| GRID-009 | Status colors | View cells with different statuses | Cells show appropriate background colors |
| GRID-010 | Row totals | Edit hours | Row total updates automatically |
| GRID-011 | Column totals | View totals row | Monthly totals calculated correctly |

---

## 6. Budget Management Tests

### 6.1 BudgetManagementPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BUD-001 | Load budget page | Navigate to /forecast/budgets | Budget summary displays |
| BUD-002 | Project list | View projects table | Shows budget vs forecast comparison |
| BUD-003 | Variance calculation | View variance column | Shows percentage variance correctly |
| BUD-004 | Variance colors | View variance badges | Green (<10%), Amber (10-20%), Red (>20%) |
| BUD-005 | Search | Type project name | Filters projects |
| BUD-006 | Sort columns | Click column headers | Table sorts correctly |
| BUD-007 | No budget indicator | View project without budget | Shows "No budget" text |
| BUD-008 | Project link | Click project name | Navigates to project grid |

---

## 7. Analytics Tests

### 7.1 ForecastAnalyticsPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ANA-001 | Load analytics | Navigate to /forecast/analytics | Analytics dashboard loads |
| ANA-002 | Summary cards | View top cards | Total hours, forecasts, variance displayed |
| ANA-003 | Status distribution | View Status tab | Bar chart shows status counts |
| ANA-004 | Budget variance | View Variance tab | Top variances listed |
| ANA-005 | Top projects | View Projects tab | Projects sorted by hours |
| ANA-006 | Tab switching | Click different tabs | Content updates correctly |
| ANA-007 | Quick actions | Click action links | Navigate to correct pages |

---

## 8. Review Queue Tests (Finance)

### 8.1 ForecastReviewPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| REV-001 | Load review queue | Navigate to /forecast/review | Shows submitted forecasts |
| REV-002 | Group by project | Select "Project" grouping | Forecasts grouped by project |
| REV-003 | Group by person | Select "Person" grouping | Forecasts grouped by person |
| REV-004 | Expand group | Click group header | Shows individual forecasts |
| REV-005 | Select forecast | Click checkbox | Forecast selected |
| REV-006 | Bulk select | Check group checkbox | All in group selected |
| REV-007 | Mark reviewed | Select forecasts, click "Mark Reviewed" | Modal appears |
| REV-008 | Confirm review | Enter notes, confirm | Forecasts move to Reviewed status |
| REV-009 | Reject | Select forecasts, click "Reject" | Rejection modal appears |
| REV-010 | Confirm reject | Enter reason, confirm | Forecasts rejected with reason |
| REV-011 | Empty state | No submitted forecasts | Shows "All caught up" message |
| REV-012 | Mobile warning | View on mobile | Shows desktop recommendation banner |

---

## 9. Approvals Tests (P&L Lead)

### 9.1 ForecastApprovalsPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| APP-001 | Load approvals | Navigate to /forecast/approvals | Shows reviewed forecasts |
| APP-002 | Project grouping | View by project | Projects with variance info shown |
| APP-003 | List view | Switch to list view | Shows flat list of forecasts |
| APP-004 | Select for approval | Click checkboxes | Forecasts selected |
| APP-005 | Approve | Click "Approve" button | Approval modal appears |
| APP-006 | Confirm approval | Enter notes, confirm | Forecasts move to Approved status |
| APP-007 | Reject | Click "Reject" button | Rejection modal appears |
| APP-008 | Budget variance display | View project variance | Shows over/under budget indicators |
| APP-009 | Empty state | No reviewed forecasts | Shows appropriate message |
| APP-010 | Mobile warning | View on mobile | Shows desktop recommendation banner |

---

## 10. Settings Tests

### 10.1 ForecastSettingsPage
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SET-001 | Load settings | Navigate to /forecast/settings | Settings page displays |
| SET-002 | Current version | View version info | Shows current forecast version details |
| SET-003 | Status summary | View status section | Shows counts for each status |
| SET-004 | Lock period | Select year/month | Can select period to lock |
| SET-005 | Lock confirmation | Click Lock button | Confirmation modal appears |
| SET-006 | Execute lock | Confirm lock | Approved forecasts locked |
| SET-007 | Lock warning | View warning message | Warning about irreversibility shown |
| SET-008 | Coming soon features | View auto-lock settings | Shows "Coming Soon" badge |

---

## 11. Import/Export Tests

### 11.1 ForecastImportExportPage (existing)
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| IMP-001 | Load page | Navigate to /forecast/import-export | Import/export page loads |
| IMP-002 | Download template | Click template download | Excel template downloads |
| IMP-003 | Export CSV | Click Export CSV | CSV file downloads |
| IMP-004 | Export Excel | Click Export Excel | Excel file downloads |
| IMP-005 | Import preview | Upload file | Preview with validation shown |
| IMP-006 | Import commit | Confirm import | Forecasts created/updated |
| IMP-007 | History | View history section | Previous imports/exports listed |

---

## 12. Version Management Tests

### 12.1 ForecastVersionsPage (existing)
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| VER-001 | List versions | Navigate to /forecast/versions | All versions displayed |
| VER-002 | Create version | Click Create button | New version modal appears |
| VER-003 | Clone version | Click Clone on existing | Clone options shown |
| VER-004 | Promote version | Click Promote | Version becomes current |
| VER-005 | Compare versions | Select two versions | Comparison view shows differences |
| VER-006 | Archive version | Click Archive | Version archived |

---

## 13. Cross-Cutting Concerns

### 13.1 Mobile Responsiveness
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MOB-001 | Dashboard mobile | View dashboard on mobile | Responsive layout, cards stack |
| MOB-002 | My Forecasts mobile | View on mobile | List view works on mobile |
| MOB-003 | Desktop warning | View grid on mobile | Warning banner appears |
| MOB-004 | Dismiss warning | Click X on warning | Banner dismisses |

### 13.2 Error Handling
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ERR-001 | API error | Trigger API failure | Error toast displayed |
| ERR-002 | Loading states | Navigate to pages | Loading spinners shown |
| ERR-003 | Empty data | View with no data | Empty state messages shown |
| ERR-004 | Invalid input | Enter invalid hours | Validation prevents save |

### 13.3 Authorization
| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-001 | PM access | Login as PM | Can view and edit own forecasts |
| AUTH-002 | Finance access | Login as Finance | Can review submitted forecasts |
| AUTH-003 | P&L access | Login as P&L Lead | Can approve reviewed forecasts |
| AUTH-004 | Executive access | Login as Executive | Can view analytics, approvals |
| AUTH-005 | Role restrictions | Try to access restricted page | Hidden from navigation |

---

## 14. Performance Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PERF-001 | Large project grid | Load project with 50+ assignments | Page loads in <3 seconds |
| PERF-002 | Dashboard with data | Load dashboard with 100+ forecasts | Page loads in <2 seconds |
| PERF-003 | Bulk operations | Select and submit 20 forecasts | Operation completes in <5 seconds |

---

## 15. Regression Tests

Run after any changes to ensure existing functionality is not broken:

1. Login/logout works
2. Portal switching between Me/Manager/Forecast portals
3. Basic CRUD operations on forecasts
4. Status workflow (Draft -> Submitted -> Reviewed -> Approved -> Locked)
5. Search functionality across pages
6. Navigation between all pages

---

## 16. Test Execution Checklist

### Pre-Test Setup
- [ ] Backend running on port 5107
- [ ] Frontend running on port 5173
- [ ] Test data seeded
- [ ] Multiple test accounts available

### Test Execution
- [ ] Navigation tests complete
- [ ] Dashboard tests complete
- [ ] My Forecasts tests complete
- [ ] Projects/Grid tests complete
- [ ] Budget Management tests complete
- [ ] Analytics tests complete
- [ ] Review Queue tests complete
- [ ] Approvals tests complete
- [ ] Settings tests complete
- [ ] Import/Export tests complete
- [ ] Version Management tests complete
- [ ] Mobile tests complete
- [ ] Error handling tests complete
- [ ] Authorization tests complete
- [ ] Performance tests complete

### Post-Test
- [ ] Bug tickets created for failures
- [ ] Test results documented
- [ ] Sign-off from stakeholders

---

## 17. Known Issues & Limitations

1. **Budget editing not implemented** - Budget values currently display-only (backend API not yet available)
2. **Auto-lock feature** - Marked as "Coming Soon" - not yet implemented
3. **Email notifications** - Settings shown but not functional
4. **Weekly granularity** - UI toggle present but defaults to monthly view
5. **Actuals data** - Actual hours import available but variance calculations limited without actuals data

---

## 18. Test Data Scripts

See `scripts/seed-forecast-test-data.sql` for database seeding scripts (if available).

Manual test data creation:
1. Create projects via Admin > Projects
2. Create assignments via Admin > Staffing > Role Assignments
3. Create forecasts via /forecast/projects/:id/grid
4. Submit/Review/Approve via respective workflow pages
