/**
 * Team Calendar Type Definitions
 * Corresponds to backend TeamCalendarModels.cs
 */

export enum TeamCalendarType {
  Team = 0,
  Manager = 1,
  Department = 2,
  Project = 3,
}

export enum MembershipType {
  OptIn = 0,
  Forced = 1,
  Automatic = 2,
}

export interface PersonSummary {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  managerId?: string;
  managerName?: string;
}

export interface TeamCalendarMemberResponse {
  id: string;
  teamCalendarId: string;
  personId: string;
  person: PersonSummary;
  membershipType: MembershipType;
  addedDate: string; // ISO date string
  addedByUserId?: string;
  addedByName?: string;
  isActive: boolean;
}

export interface TeamCalendarResponse {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: TeamCalendarType;
  isActive: boolean;
  ownerId?: string;
  owner?: PersonSummary;
  memberCount: number;
  members: TeamCalendarMemberResponse[];
  createdAt: string; // ISO date string
}

export interface CreateTeamCalendarRequest {
  name: string;
  description?: string;
  type: TeamCalendarType;
  ownerId?: string;
  isActive: boolean;
}

export interface UpdateTeamCalendarRequest {
  name: string;
  description?: string;
  type: TeamCalendarType;
  ownerId?: string;
  isActive: boolean;
}

export interface AddTeamCalendarMemberRequest {
  personId: string;
  membershipType: MembershipType;
}

export interface BulkAddMembersRequest {
  personIds: string[];
  membershipType: MembershipType;
}

export interface WorkLocationPreferenceResponse {
  id: string;
  workDate: string; // ISO date string (YYYY-MM-DD)
  locationType: number; // WorkLocationType enum
  officeId?: string;
  officeName?: string;
  remoteLocation?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
}

export interface TeamMemberSchedule {
  personId: string;
  personName: string;
  personEmail?: string;
  managerId?: string;
  jobTitle?: string;
  preferences: WorkLocationPreferenceResponse[];
}

export interface TeamCalendarViewResponse {
  calendar: TeamCalendarResponse;
  memberSchedules: TeamMemberSchedule[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface ManagerViewRequest {
  managerId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface ManagerViewResponse {
  manager: PersonSummary;
  directReports: TeamMemberSchedule[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalDirectReports: number;
}

export interface TeamCalendarSummary {
  id: string;
  name: string;
  description?: string;
  type: TeamCalendarType;
  memberCount: number;
  isMember: boolean;
  membershipType?: MembershipType;
}

export interface AvailableTeamCalendarsResponse {
  availableCalendars: TeamCalendarSummary[];
  memberOf: TeamCalendarSummary[];
}
