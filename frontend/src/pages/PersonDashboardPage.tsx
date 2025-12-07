import { useParams, Navigate, Link } from 'react-router-dom';
import { usePerson } from '../hooks/usePeople';
import { PersonScheduleView } from '../components/PersonScheduleView';
import { PersonResumeSection } from '../components/PersonResumeSection';
import { ChevronLeft, Mail, Building2, User } from 'lucide-react';

export default function PersonDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: person, isLoading, error } = usePerson(id);

  if (!id) return <Navigate to="/" replace />;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Failed to load person dashboard. {error.message}
        </div>
      </div>
    );
  }

  if (isLoading || !person) {
    return (
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link
          to="/people"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to People
        </Link>

        {/* Person Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {person.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {person.displayName}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
                  {person.type === 0 ? 'Employee' : 'Contractor'}
                </span>
              </div>

              {person.jobTitle && (
                <p className="text-base text-gray-600 mb-1">{person.jobTitle}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${person.email}`} className="hover:text-indigo-600">
                    {person.email}
                  </a>
                </span>
                {(person.department || person.orgUnit) && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {person.department || person.orgUnit}
                  </span>
                )}
                {person.managerId && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Reports to Manager
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule View (replacing work location table) */}
      <div className="mb-6">
        <PersonScheduleView userId={person.id} displayName={person.displayName} />
      </div>

      {/* Resume Section */}
      <div>
        <PersonResumeSection userId={person.id} displayName={person.displayName} />
      </div>
    </div>
  );
}
