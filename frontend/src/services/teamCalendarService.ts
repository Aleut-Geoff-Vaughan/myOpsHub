import { api } from '../lib/api-client';
import type {
  TeamCalendarResponse,
  CreateTeamCalendarRequest,
  UpdateTeamCalendarRequest,
  AddTeamCalendarMemberRequest,
  BulkAddMembersRequest,
  TeamCalendarMemberResponse,
  TeamCalendarViewResponse,
  ManagerViewResponse,
  AvailableTeamCalendarsResponse,
} from '../types/teamCalendar';

export const teamCalendarService = {
  /**
   * Get all team calendars for a tenant
   */
  getAll: async (params: {
    tenantId: string;
    includeInactive?: boolean;
  }): Promise<TeamCalendarResponse[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('tenantId', params.tenantId);
    if (params.includeInactive) {
      queryParams.append('includeInactive', 'true');
    }

    return api.get<TeamCalendarResponse[]>(`/teamcalendar?${queryParams.toString()}`);
  },

  /**
   * Get a specific team calendar by ID
   */
  getById: async (id: string): Promise<TeamCalendarResponse> => {
    return api.get<TeamCalendarResponse>(`/teamcalendar/${id}`);
  },

  /**
   * Create a new team calendar
   */
  create: async (
    tenantId: string,
    userId: string,
    request: CreateTeamCalendarRequest
  ): Promise<TeamCalendarResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('tenantId', tenantId);
    queryParams.append('userId', userId);

    return api.post<TeamCalendarResponse>(
      `/teamcalendar?${queryParams.toString()}`,
      request
    );
  },

  /**
   * Update an existing team calendar
   */
  update: async (
    id: string,
    userId: string,
    request: UpdateTeamCalendarRequest
  ): Promise<TeamCalendarResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.put<TeamCalendarResponse>(
      `/teamcalendar/${id}?${queryParams.toString()}`,
      request
    );
  },

  /**
   * Delete a team calendar
   */
  delete: async (id: string, userId: string): Promise<void> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.delete<void>(`/teamcalendar/${id}?${queryParams.toString()}`);
  },

  /**
   * Add a member to a team calendar
   */
  addMember: async (
    calendarId: string,
    userId: string,
    request: AddTeamCalendarMemberRequest
  ): Promise<TeamCalendarMemberResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.post<TeamCalendarMemberResponse>(
      `/teamcalendar/${calendarId}/members?${queryParams.toString()}`,
      request
    );
  },

  /**
   * Bulk add members to a team calendar
   */
  bulkAddMembers: async (
    calendarId: string,
    userId: string,
    request: BulkAddMembersRequest
  ): Promise<TeamCalendarMemberResponse[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.post<TeamCalendarMemberResponse[]>(
      `/teamcalendar/${calendarId}/members/bulk?${queryParams.toString()}`,
      request
    );
  },

  /**
   * Remove a member from a team calendar
   */
  removeMember: async (
    calendarId: string,
    memberId: string,
    userId: string
  ): Promise<void> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.delete<void>(
      `/teamcalendar/${calendarId}/members/${memberId}?${queryParams.toString()}`
    );
  },

  /**
   * Get team calendar view with work location preferences
   */
  getCalendarView: async (
    calendarId: string,
    params?: {
      startDate?: string; // ISO date format YYYY-MM-DD
      endDate?: string; // ISO date format YYYY-MM-DD
    }
  ): Promise<TeamCalendarViewResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const query = queryParams.toString();
    return api.get<TeamCalendarViewResponse>(
      `/teamcalendar/${calendarId}/view${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get manager view - shows direct reports and their schedules
   */
  getManagerView: async (params: {
    managerUserId?: string;
    userId?: string;
    startDate?: string; // ISO date format YYYY-MM-DD
    endDate?: string; // ISO date format YYYY-MM-DD
  }): Promise<ManagerViewResponse> => {
    const queryParams = new URLSearchParams();
    if (params.managerUserId) {
      queryParams.append('managerUserId', params.managerUserId);
    }
    if (params.userId) {
      queryParams.append('userId', params.userId);
    }
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    return api.get<ManagerViewResponse>(
      `/teamcalendar/manager-view?${queryParams.toString()}`
    );
  },

  /**
   * Get available team calendars for a user to opt into
   */
  getAvailableCalendars: async (userId: string): Promise<AvailableTeamCalendarsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);

    return api.get<AvailableTeamCalendarsResponse>(
      `/teamcalendar/available?${queryParams.toString()}`
    );
  },
};
