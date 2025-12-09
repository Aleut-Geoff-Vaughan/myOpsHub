import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  projectRoleAssignmentsService,
  laborCategoriesService,
  careerJobFamiliesService,
  type CreateProjectRoleAssignmentDto,
  type UpdateProjectRoleAssignmentDto,
  type ProjectRoleAssignment,
  type LaborCategory,
  type CareerJobFamily,
  ProjectRoleAssignmentStatus,
} from '../services/staffingService';
import { usersService } from '../services/tenantsService';
import wbsService from '../services/wbsService';
import type { WbsElement } from '../types/wbs';
import type { User } from '../types/api';

interface AddPositionModalProps {
  projectId: string;
  projectName: string;
  tenantId: string;
  editAssignment?: ProjectRoleAssignment;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPositionModal({ projectId, projectName, tenantId, editAssignment, onClose, onSuccess }: AddPositionModalProps) {
  const isEditMode = !!editAssignment;

  const [positionTitle, setPositionTitle] = useState(editAssignment?.positionTitle || '');
  const [assigneeType, setAssigneeType] = useState<'user' | 'tbd'>(
    editAssignment ? (editAssignment.isTbd ? 'tbd' : 'user') : 'tbd'
  );
  const [selectedUserId, setSelectedUserId] = useState(editAssignment?.userId || '');
  const [userSearchTerm, setUserSearchTerm] = useState(editAssignment?.assigneeName || editAssignment?.userName || '');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [tbdDescription, setTbdDescription] = useState(editAssignment?.tbdDescription || '');
  const [selectedWbsId, setSelectedWbsId] = useState(editAssignment?.wbsElementId || '');
  const [selectedLaborCategoryId, setSelectedLaborCategoryId] = useState(editAssignment?.laborCategoryId || '');
  const [selectedCareerJobFamilyId, setSelectedCareerJobFamilyId] = useState(editAssignment?.careerJobFamilyId || '');
  const [careerLevel, setCareerLevel] = useState<number | undefined>(editAssignment?.careerLevel);
  const [startDate, setStartDate] = useState(
    editAssignment?.startDate
      ? new Date(editAssignment.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    editAssignment?.endDate ? new Date(editAssignment.endDate).toISOString().split('T')[0] : ''
  );

  const userSearchRef = useRef<HTMLDivElement>(null);

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users', tenantId],
    queryFn: () => usersService.getAll(tenantId),
    enabled: !!tenantId,
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users as User[];
    const term = userSearchTerm.toLowerCase();
    return (users as User[]).filter(
      (user) =>
        user.displayName?.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
    );
  }, [users, userSearchTerm]);

  // Get selected user for display
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return (users as User[]).find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setUserSearchTerm(user.displayName || user.name || user.email);
    setShowUserDropdown(false);
    // Auto-populate career fields from user's profile
    if (user.careerJobFamilyId) {
      setSelectedCareerJobFamilyId(user.careerJobFamilyId);
    }
    if (user.careerLevel) {
      setCareerLevel(user.careerLevel);
    }
  };

  const clearUserSelection = () => {
    setSelectedUserId('');
    setUserSearchTerm('');
    // Reset career fields when user is cleared
    setSelectedCareerJobFamilyId('');
    setCareerLevel(undefined);
  };

  // Fetch WBS elements for this project
  const { data: wbsData } = useQuery({
    queryKey: ['wbs-elements', projectId],
    queryFn: () => wbsService.getWbsElements({ projectId }),
    enabled: !!projectId,
  });
  const wbsElements = wbsData?.items || [];

  // Fetch labor categories for this project
  const { data: laborCategories = [] } = useQuery({
    queryKey: ['labor-categories', projectId],
    queryFn: () => laborCategoriesService.getByProject(projectId, true),
    enabled: !!projectId,
  });

  // Fetch career job families
  const { data: careerJobFamilies = [] } = useQuery({
    queryKey: ['career-job-families', tenantId],
    queryFn: () => careerJobFamiliesService.getAll({ tenantId, isActive: true }),
    enabled: !!tenantId,
  });

  // Fetch existing position titles for autocomplete suggestions
  const { data: existingTitles = [] } = useQuery({
    queryKey: ['position-titles', tenantId],
    queryFn: () => projectRoleAssignmentsService.getPositionTitles(tenantId),
    enabled: !!tenantId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (dto: CreateProjectRoleAssignmentDto) =>
      projectRoleAssignmentsService.create(dto),
    onSuccess: () => {
      toast.success('Position added successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add position');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (dto: UpdateProjectRoleAssignmentDto) =>
      projectRoleAssignmentsService.update(editAssignment!.id, dto),
    onSuccess: () => {
      toast.success('Position updated successfully');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update position');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!positionTitle.trim()) {
      toast.error('Position title is required');
      return;
    }

    if (assigneeType === 'user' && !selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (isEditMode) {
      // Use UpdateProjectRoleAssignmentDto for updates
      const updateDto: UpdateProjectRoleAssignmentDto = {
        positionTitle: positionTitle.trim(),
        wbsElementId: selectedWbsId || undefined,
        laborCategoryId: selectedLaborCategoryId || undefined,
        careerJobFamilyId: selectedCareerJobFamilyId || undefined,
        careerLevel: careerLevel || undefined,
        startDate,
        endDate: endDate || undefined,
        tbdDescription: assigneeType === 'tbd' ? tbdDescription.trim() || undefined : undefined,
      };
      updateMutation.mutate(updateDto);
    } else {
      // Use CreateProjectRoleAssignmentDto for new positions
      const createDto: CreateProjectRoleAssignmentDto = {
        tenantId,
        projectId,
        positionTitle: positionTitle.trim(),
        isTbd: assigneeType === 'tbd',
        tbdDescription: assigneeType === 'tbd' ? tbdDescription.trim() || undefined : undefined,
        userId: assigneeType === 'user' ? selectedUserId : undefined,
        wbsElementId: selectedWbsId || undefined,
        laborCategoryId: selectedLaborCategoryId || undefined,
        careerJobFamilyId: selectedCareerJobFamilyId || undefined,
        careerLevel: careerLevel || undefined,
        startDate,
        endDate: endDate || undefined,
        status: ProjectRoleAssignmentStatus.Active,
      };
      createMutation.mutate(createDto);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? 'Edit Position' : `Add Position to ${projectName}`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditMode ? 'Update the position assignment details' : 'Create a new position assignment for forecasting'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Position Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    list="position-titles"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Senior Developer, Project Manager"
                    required
                  />
                  <datalist id="position-titles">
                    {existingTitles.map((title) => (
                      <option key={title} value={title} />
                    ))}
                  </datalist>
                </div>

                {/* Assignee Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="tbd"
                        checked={assigneeType === 'tbd'}
                        onChange={() => setAssigneeType('tbd')}
                        className="mr-2 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">TBD (To Be Determined)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="assigneeType"
                        value="user"
                        checked={assigneeType === 'user'}
                        onChange={() => setAssigneeType('user')}
                        className="mr-2 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Select User</span>
                    </label>
                  </div>
                </div>

                {/* User Search (if user type) */}
                {assigneeType === 'user' && (
                  <div ref={userSearchRef} className="relative">
                    <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-1">
                      User *
                    </label>
                    <div className="relative">
                      <input
                        id="user-search"
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setShowUserDropdown(true);
                          if (!e.target.value) {
                            setSelectedUserId('');
                          }
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                        placeholder="Search by name or email..."
                        autoComplete="off"
                      />
                      {selectedUserId && (
                        <button
                          type="button"
                          onClick={clearUserSelection}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Clear selection"
                          aria-label="Clear selection"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* User dropdown */}
                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            {userSearchTerm ? 'No users found' : 'Start typing to search...'}
                          </div>
                        ) : (
                          filteredUsers.slice(0, 50).map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className={`w-full px-3 py-2 text-left hover:bg-emerald-50 flex flex-col ${
                                selectedUserId === user.id ? 'bg-emerald-50' : ''
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {user.displayName || user.name}
                              </span>
                              <span className="text-xs text-gray-500">{user.email}</span>
                            </button>
                          ))
                        )}
                        {filteredUsers.length > 50 && (
                          <div className="px-3 py-2 text-xs text-gray-500 border-t">
                            Showing first 50 results. Type more to refine...
                          </div>
                        )}
                      </div>
                    )}
                    {/* Hidden input for form validation */}
                    <input type="hidden" value={selectedUserId} required />
                    {selectedUser && (
                      <div className="mt-1 text-xs text-emerald-600">
                        Selected: {selectedUser.displayName || selectedUser.name} ({selectedUser.email})
                        {selectedUser.careerJobFamilyName && (
                          <span className="ml-2 text-gray-500">
                            - {selectedUser.careerJobFamilyName}
                            {selectedUser.careerLevel && ` Level ${selectedUser.careerLevel}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TBD Description (if TBD type) */}
                {assigneeType === 'tbd' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TBD Description
                    </label>
                    <input
                      type="text"
                      value={tbdDescription}
                      onChange={(e) => setTbdDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., New hire needed for Q2"
                    />
                  </div>
                )}

                {/* WBS Element */}
                {wbsElements.length > 0 && (
                  <div>
                    <label htmlFor="wbs-select" className="block text-sm font-medium text-gray-700 mb-1">
                      WBS Element
                    </label>
                    <select
                      id="wbs-select"
                      value={selectedWbsId}
                      onChange={(e) => setSelectedWbsId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">No WBS</option>
                      {wbsElements.map((wbs: WbsElement) => (
                        <option key={wbs.id} value={wbs.id}>
                          {wbs.code} - {wbs.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Labor Category */}
                {laborCategories.length > 0 && (
                  <div>
                    <label htmlFor="labor-category-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Labor Category
                    </label>
                    <select
                      id="labor-category-select"
                      value={selectedLaborCategoryId}
                      onChange={(e) => setSelectedLaborCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">No labor category</option>
                      {laborCategories.map((lc: LaborCategory) => (
                        <option key={lc.id} value={lc.id}>
                          {lc.code ? `${lc.code} - ` : ''}{lc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Career Job Family & Level - Only show for TBD positions */}
                {assigneeType === 'tbd' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="career-job-family-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Career Job Family
                      </label>
                      <select
                        id="career-job-family-select"
                        value={selectedCareerJobFamilyId}
                        onChange={(e) => setSelectedCareerJobFamilyId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">None</option>
                        {careerJobFamilies.map((jf: CareerJobFamily) => (
                          <option key={jf.id} value={jf.id}>
                            {jf.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="career-level-input" className="block text-sm font-medium text-gray-700 mb-1">
                        Career Level
                      </label>
                      <input
                        id="career-level-input"
                        type="number"
                        value={careerLevel ?? ''}
                        onChange={(e) => setCareerLevel(e.target.value ? parseInt(e.target.value) : undefined)}
                        min={1}
                        max={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="1-10"
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start-date-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      id="start-date-input"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date-input" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      id="end-date-input"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Position')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 sm:mt-0 w-full sm:w-auto px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPositionModal;
