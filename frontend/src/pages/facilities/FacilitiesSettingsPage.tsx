import { useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';

// Tabs for settings
type SettingsTab = 'general' | 'booking' | 'notifications' | 'integrations' | 'attributes';

interface BookingRule {
  id: string;
  name: string;
  description: string;
  maxDaysInAdvance: number;
  maxDurationHours: number;
  minDurationMinutes: number;
  requiresApproval: boolean;
  allowRecurring: boolean;
  spaceTypes: string[];
  isEnabled: boolean;
}

interface CustomAttribute {
  id: string;
  name: string;
  displayName: string;
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'select';
  options?: string[];
  isRequired: boolean;
  appliesToSpaces: boolean;
  appliesToOffices: boolean;
  isEnabled: boolean;
}

interface NotificationSetting {
  key: string;
  name: string;
  description: string;
  email: boolean;
  inApp: boolean;
  teams: boolean;
}

export function FacilitiesSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Mock data for now - will be replaced with API calls
  const bookingRules: BookingRule[] = [
    {
      id: '1',
      name: 'Standard Desk Booking',
      description: 'Default rules for hot desk reservations',
      maxDaysInAdvance: 14,
      maxDurationHours: 8,
      minDurationMinutes: 60,
      requiresApproval: false,
      allowRecurring: true,
      spaceTypes: ['Hot Desk', 'Private Office'],
      isEnabled: true,
    },
    {
      id: '2',
      name: 'Conference Room Booking',
      description: 'Rules for meeting room reservations',
      maxDaysInAdvance: 30,
      maxDurationHours: 4,
      minDurationMinutes: 30,
      requiresApproval: false,
      allowRecurring: true,
      spaceTypes: ['Conference Room', 'Huddle Room'],
      isEnabled: true,
    },
    {
      id: '3',
      name: 'Training Room Booking',
      description: 'Rules for training room reservations',
      maxDaysInAdvance: 60,
      maxDurationHours: 8,
      minDurationMinutes: 60,
      requiresApproval: true,
      allowRecurring: false,
      spaceTypes: ['Training Room'],
      isEnabled: true,
    },
  ];

  const customAttributes: CustomAttribute[] = [
    {
      id: '1',
      name: 'costCenter',
      displayName: 'Cost Center',
      dataType: 'text',
      isRequired: false,
      appliesToSpaces: false,
      appliesToOffices: true,
      isEnabled: true,
    },
    {
      id: '2',
      name: 'hasMonitor',
      displayName: 'Has External Monitor',
      dataType: 'boolean',
      isRequired: false,
      appliesToSpaces: true,
      appliesToOffices: false,
      isEnabled: true,
    },
    {
      id: '3',
      name: 'floorType',
      displayName: 'Floor Type',
      dataType: 'select',
      options: ['Carpet', 'Hardwood', 'Tile', 'Concrete'],
      isRequired: false,
      appliesToSpaces: true,
      appliesToOffices: true,
      isEnabled: true,
    },
  ];

  const notificationSettings: NotificationSetting[] = [
    {
      key: 'booking_confirmed',
      name: 'Booking Confirmed',
      description: 'When a space booking is confirmed',
      email: true,
      inApp: true,
      teams: false,
    },
    {
      key: 'booking_cancelled',
      name: 'Booking Cancelled',
      description: 'When a booking is cancelled',
      email: true,
      inApp: true,
      teams: false,
    },
    {
      key: 'booking_reminder',
      name: 'Booking Reminder',
      description: 'Reminder before scheduled booking',
      email: false,
      inApp: true,
      teams: false,
    },
    {
      key: 'checkin_reminder',
      name: 'Check-in Reminder',
      description: 'Reminder to check in to booked space',
      email: false,
      inApp: true,
      teams: false,
    },
    {
      key: 'lease_expiration',
      name: 'Lease Expiration Warning',
      description: 'When a lease is approaching expiration',
      email: true,
      inApp: true,
      teams: true,
    },
    {
      key: 'option_year_deadline',
      name: 'Option Year Deadline',
      description: 'When an option year decision is due',
      email: true,
      inApp: true,
      teams: true,
    },
    {
      key: 'clearance_expiring',
      name: 'Clearance Expiring',
      description: 'When an employee clearance is about to expire',
      email: true,
      inApp: true,
      teams: false,
    },
    {
      key: 'travel_request_status',
      name: 'Travel Request Status Change',
      description: 'When a foreign travel request status changes',
      email: true,
      inApp: true,
      teams: false,
    },
  ];

  const tabs: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'booking',
      label: 'Booking Rules',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
    },
    {
      id: 'attributes',
      label: 'Custom Attributes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facilities Settings</h1>
        <p className="text-gray-600 mt-1">Configure booking rules, notifications, and integrations</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Window</label>
                <p className="text-xs text-gray-500 mb-2">How long before booking start time users can check in</p>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              {/* Auto-release Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-release Unchecked Bookings</label>
                <p className="text-xs text-gray-500 mb-2">Release booking if not checked in within this time</p>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="0">Disabled</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              {/* Default Booking Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Booking Duration</label>
                <p className="text-xs text-gray-500 mb-2">Pre-selected duration for new bookings</p>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                  <option value="480">Full day (8 hours)</option>
                </select>
              </div>

              {/* Time Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Time Zone</label>
                <p className="text-xs text-gray-500 mb-2">Used when office time zone is not set</p>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* Business Hours Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours Start</label>
                <p className="text-xs text-gray-500 mb-2">Default start of bookable hours</p>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Business Hours End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours End</label>
                <p className="text-xs text-gray-500 mb-2">Default end of bookable hours</p>
                <input
                  type="time"
                  defaultValue="18:00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">Feature Toggles</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Require Check-in</span>
                    <p className="text-xs text-gray-500">Users must check in to activate bookings</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Allow Walk-in Check-ins</span>
                    <p className="text-xs text-gray-500">Users can check in without a prior booking</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">GPS Location Verification</span>
                    <p className="text-xs text-gray-500">Verify user location when checking in</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Show Who's Here Publicly</span>
                    <p className="text-xs text-gray-500">All users can see who is checked in at each office</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => toast.success('Settings saved')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Booking Rules */}
        {activeTab === 'booking' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Booking Rules</h2>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Rule
              </button>
            </div>

            <div className="space-y-4">
              {bookingRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${rule.isEnabled ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{rule.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rule.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Up to {rule.maxDaysInAdvance} days in advance
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Max {rule.maxDurationHours} hours
                        </span>
                        {rule.requiresApproval && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Requires approval
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {rule.spaceTypes.map((type) => (
                          <span key={type} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <p className="text-sm text-gray-600">Configure how and when notifications are sent for facilities events.</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">In-App</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Teams</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notificationSettings.map((setting) => (
                    <tr key={setting.key}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{setting.name}</p>
                          <p className="text-sm text-gray-500">{setting.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={setting.email}
                          className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={setting.inApp}
                          className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={setting.teams}
                          className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => toast.success('Notification preferences saved')}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <p className="text-sm text-gray-600">Connect myFacilities with external services.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Microsoft Teams */}
              <div className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.125 7.5h-3.375v3.375h3.375a1.688 1.688 0 000-3.375zm.75 4.875h-4.125v6.75h2.625a1.5 1.5 0 001.5-1.5v-5.25zm-6.375-4.5H7.125A1.125 1.125 0 006 9v9.375a1.125 1.125 0 001.125 1.125H12.5v-11.625zM20.625 6a2.625 2.625 0 100 5.25 2.625 2.625 0 000-5.25z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Microsoft Teams</h3>
                    <p className="text-sm text-gray-500">Sync conference rooms with Teams</p>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Not Connected
                  </span>
                </div>
                <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Connect
                </button>
              </div>

              {/* Microsoft Outlook */}
              <div className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Outlook Calendar</h3>
                    <p className="text-sm text-gray-500">Sync bookings with Outlook</p>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Not Connected
                  </span>
                </div>
                <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Connect
                </button>
              </div>

              {/* Badge System */}
              <div className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Badge/Access Control</h3>
                    <p className="text-sm text-gray-500">Integrate with physical access systems</p>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Not Connected
                  </span>
                </div>
                <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Configure
                </button>
              </div>

              {/* Slack */}
              <div className="p-6 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.52v-2.522h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.52 2.521h-6.313z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Slack</h3>
                    <p className="text-sm text-gray-500">Send notifications to Slack channels</p>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Not Connected
                  </span>
                </div>
                <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Attributes */}
        {activeTab === 'attributes' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Custom Attributes</h2>
                <p className="text-sm text-gray-600 mt-1">Define additional fields for offices and spaces</p>
              </div>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Attribute
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Offices</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Spaces</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Required</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customAttributes.map((attr) => (
                    <tr key={attr.id}>
                      <td className="px-4 py-4 font-mono text-sm text-gray-600">{attr.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{attr.displayName}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                          {attr.dataType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {attr.appliesToOffices ? (
                          <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {attr.appliesToSpaces ? (
                          <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {attr.isRequired ? (
                          <svg className="w-5 h-5 mx-auto text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          attr.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {attr.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
