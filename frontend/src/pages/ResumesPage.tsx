import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Edit,
  Eye,
  Download,
  Share2,
  Briefcase,
  GraduationCap,
  Award,
  Star,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getMyResume, createResume } from '../services/resumeService';
import { useAuthStore } from '../stores/authStore';
import type { ResumeProfile, ResumeStatus } from '../types/api';
import toast from 'react-hot-toast';

const statusConfig = {
  0: { label: 'Draft', icon: FileText, color: 'text-gray-500', bg: 'bg-gray-100' },
  1: { label: 'Pending Review', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  2: { label: 'Approved', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  3: { label: 'Changes Requested', icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
  4: { label: 'Active', icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  5: { label: 'Archived', icon: FileText, color: 'text-gray-400', bg: 'bg-gray-100' },
};

export function ResumesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadMyResume();
  }, []);

  const loadMyResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyResume();
      setResume(data);
    } catch (err) {
      console.error('Error loading resume:', err);
      setError('Failed to load your resume');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setCreating(true);
      const newResume = await createResume({ userId: user.id });
      toast.success('Resume created successfully!');
      navigate(`/resumes/${newResume.id}`);
    } catch (err: any) {
      console.error('Error creating resume:', err);
      if (err?.response?.status === 409) {
        toast.error('You already have a resume');
        loadMyResume(); // Reload in case it exists
      } else {
        toast.error('Failed to create resume');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleViewResume = () => {
    if (resume) {
      navigate(`/resumes/${resume.id}`);
    }
  };

  const getStatusBadge = (status: ResumeStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your resume...</p>
        </div>
      </div>
    );
  }

  // No resume exists - show create prompt
  if (!resume) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Resume</h1>
          <p className="mt-2 text-gray-600">
            Manage your professional resume and career information
          </p>
        </div>

        <Card className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Create Your Resume
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't created a resume yet. Get started by creating your professional
              resume to showcase your skills, experience, and qualifications.
            </p>
            <Button
              onClick={handleCreateResume}
              disabled={creating}
              size="lg"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create My Resume
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Resume exists - show resume overview
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resume</h1>
          <p className="mt-2 text-gray-600">
            Manage your professional resume and career information
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(`/resumes/${resume.id}/share`)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/resumes/${resume.id}/export`)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleViewResume}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Resume
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 text-red-800">{error}</div>
        </Card>
      )}

      {/* Resume Status Card */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {resume.user?.displayName || resume.user?.name || 'Your Resume'}
                </h2>
                <p className="text-gray-600">{resume.user?.jobTitle || 'Professional Profile'}</p>
              </div>
            </div>
            {getStatusBadge(resume.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{resume.sections?.length || 0}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{resume.versions?.length || 0}</div>
              <div className="text-sm text-gray-600">Versions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {resume.lastReviewedAt ? new Date(resume.lastReviewedAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Last Reviewed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {resume.isPublic ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Public</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleViewResume}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">View & Edit</h3>
              <p className="text-sm text-gray-500">Update your resume</p>
            </div>
          </div>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/resumes/${resume.id}#experience`)}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Experience</h3>
              <p className="text-sm text-gray-500">Work history</p>
            </div>
          </div>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/resumes/${resume.id}#education`)}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Education</h3>
              <p className="text-sm text-gray-500">Academic background</p>
            </div>
          </div>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/resumes/${resume.id}#skills`)}
        >
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Skills</h3>
              <p className="text-sm text-gray-500">Technical abilities</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resume Sections Summary */}
      {resume.sections && resume.sections.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Sections</h3>
            <div className="divide-y divide-gray-100">
              {resume.sections.map((section) => (
                <div key={section.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      {section.type === 0 && <Briefcase className="w-4 h-4 text-gray-600" />}
                      {section.type === 1 && <GraduationCap className="w-4 h-4 text-gray-600" />}
                      {section.type === 2 && <Star className="w-4 h-4 text-gray-600" />}
                      {section.type === 3 && <Award className="w-4 h-4 text-gray-600" />}
                      {section.type >= 4 && <FileText className="w-4 h-4 text-gray-600" />}
                    </div>
                    <span className="font-medium text-gray-900">
                      {getSectionTypeName(section.type)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {section.entries?.length || 0} entries
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()} at{' '}
        {new Date(resume.updatedAt || resume.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

function getSectionTypeName(type: number): string {
  const types: Record<number, string> = {
    0: 'Experience',
    1: 'Education',
    2: 'Skills',
    3: 'Certifications',
    4: 'Projects',
    5: 'Publications',
    6: 'Awards',
    7: 'Languages',
    8: 'Summary',
    9: 'Objective',
    10: 'References',
    11: 'Custom',
  };
  return types[type] || 'Section';
}
