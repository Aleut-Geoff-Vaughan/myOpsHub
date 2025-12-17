import { Link } from 'react-router-dom';
import { Tag, XCircle, Building2, SlidersHorizontal, ListChecks, type LucideIcon } from 'lucide-react';

interface SettingsSection {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

export function SalesOpsSettingsPage() {
  const sections: SettingsSection[] = [
    {
      id: 'stages',
      name: 'Pipeline Stages',
      description: 'Configure sales pipeline stages and probabilities',
      icon: Tag,
      path: '/salesops/settings/stages',
    },
    {
      id: 'picklists',
      name: 'Picklists',
      description: 'Manage dropdown values for Acquisition Type, Contract Type, and more',
      icon: ListChecks,
      path: '/salesops/settings/picklists',
    },
    {
      id: 'loss-reasons',
      name: 'Loss Reasons',
      description: 'Manage loss and no-bid reason codes',
      icon: XCircle,
      path: '/salesops/settings/loss-reasons',
    },
    {
      id: 'entities',
      name: 'Bidding Entities',
      description: 'Track 8(a) and teaming partner certifications',
      icon: Building2,
      path: '/salesops/entities',
    },
    {
      id: 'fields',
      name: 'Custom Fields',
      description: 'Add custom fields to opportunities and accounts',
      icon: SlidersHorizontal,
      path: '/salesops/fields',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure mySalesOps module settings
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <section.icon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{section.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline Stages Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Pipeline Stages</h2>
          <p className="mt-1 text-sm text-gray-500">
            Default stages for tracking opportunity progress
          </p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {[
              { name: 'Lead', probability: 10, color: 'gray' },
              { name: 'Qualified', probability: 25, color: 'blue' },
              { name: 'Active Capture', probability: 40, color: 'cyan' },
              { name: 'Proposal', probability: 50, color: 'amber' },
              { name: 'Proposal Submitted', probability: 60, color: 'purple' },
              { name: 'Negotiation', probability: 75, color: 'orange' },
              { name: 'Closed Won', probability: 100, color: 'emerald' },
              { name: 'Closed Lost', probability: 0, color: 'red' },
            ].map((stage, index) => (
              <div
                key={stage.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`}></div>
                  <span className="font-medium text-gray-900">{stage.name}</span>
                </div>
                <span className="text-sm text-gray-500">{stage.probability}%</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Stage management will be available after seeding default data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SalesOpsSettingsPage;
