import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getResumes } from '../services/resumeService';
import { ResumeStatus, ResumeSectionType } from '../types/api';
import { useAuthStore } from '../stores/authStore';
import {
  FileText,
  ExternalLink,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface PersonResumeSectionProps {
  userId: string;
  displayName: string;
}

export function PersonResumeSection({ userId, displayName }: PersonResumeSectionProps) {
  const { currentWorkspace } = useAuthStore();

  const { data: resumes = [], isLoading, error } = useQuery({
    queryKey: ['person-resumes', userId, currentWorkspace?.tenantId],
    queryFn: async () => {
      const allResumes = await getResumes(currentWorkspace?.tenantId);
      // Filter to only this user's resumes
      return allResumes.filter((r) => r.userId === userId);
    },
    enabled: !!userId && !!currentWorkspace?.tenantId,
  });

  // Get the primary resume (usually Active or most recent)
  const primaryResume = resumes.find((r) => r.status === ResumeStatus.Active)
    || resumes.find((r) => r.status === ResumeStatus.Approved)
    || resumes[0];

  const getStatusBadge = (status: ResumeStatus) => {
    const config: Record<ResumeStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      [ResumeStatus.Draft]: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <Clock className="w-3 h-3" />,
        label: 'Draft'
      },
      [ResumeStatus.PendingReview]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <Clock className="w-3 h-3" />,
        label: 'Pending Review'
      },
      [ResumeStatus.Approved]: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Approved'
      },
      [ResumeStatus.ChangesRequested]: {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        icon: <AlertCircle className="w-3 h-3" />,
        label: 'Changes Requested'
      },
      [ResumeStatus.Active]: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Star className="w-3 h-3" />,
        label: 'Active'
      },
      [ResumeStatus.Archived]: {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        icon: <FileText className="w-3 h-3" />,
        label: 'Archived'
      },
    };
    return config[status] || config[ResumeStatus.Draft];
  };

  const getSectionIcon = (type: ResumeSectionType) => {
    switch (type) {
      case ResumeSectionType.Experience:
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case ResumeSectionType.Education:
        return <GraduationCap className="w-4 h-4 text-green-500" />;
      case ResumeSectionType.Certifications:
        return <Award className="w-4 h-4 text-amber-500" />;
      case ResumeSectionType.Skills:
        return <Star className="w-4 h-4 text-purple-500" />;
      case ResumeSectionType.Projects:
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to load resume</span>
        </div>
      </div>
    );
  }

  if (!primaryResume) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{displayName}'s Resume</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No resume profile found</p>
          <p className="text-xs text-gray-400 mt-1">User has not created a resume yet</p>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(primaryResume.status);
  const sections = primaryResume.sections || [];
  const sectionCounts = sections.reduce((acc, section) => {
    acc[section.type] = (acc[section.type] || 0) + (section.entries?.length || 0);
    return acc;
  }, {} as Record<ResumeSectionType, number>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{displayName}'s Resume</h3>
          <Link
            to={`/resumes/${primaryResume.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
          >
            <ExternalLink className="w-4 h-4" />
            View Full
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status and Meta Info */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.icon}
            {status.label}
          </span>
          {primaryResume.isPublic && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Public
            </span>
          )}
          {primaryResume.lastReviewedAt && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              Reviewed {new Date(primaryResume.lastReviewedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* LinkedIn Profile */}
        {primaryResume.linkedInProfileUrl && (
          <div className="mb-4">
            <a
              href={primaryResume.linkedInProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn Profile
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Section Summary */}
        {sections.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Resume Sections</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(sectionCounts).map(([type, count]) => {
                const sectionType = parseInt(type) as ResumeSectionType;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    {getSectionIcon(sectionType)}
                    <div>
                      <div className="text-xs font-medium text-gray-700">
                        {ResumeSectionType[sectionType]}
                      </div>
                      <div className="text-xs text-gray-500">{count} entries</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No sections added yet</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-indigo-600">{sections.length}</div>
            <div className="text-xs text-gray-500">Sections</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {sections.reduce((sum, s) => sum + (s.entries?.length || 0), 0)}
            </div>
            <div className="text-xs text-gray-500">Entries</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{resumes.length}</div>
            <div className="text-xs text-gray-500">Versions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonResumeSection;
