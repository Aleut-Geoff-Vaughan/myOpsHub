import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { facilitiesPortalService } from '../../services/facilitiesPortalService';

export function UsageAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedOffice, setSelectedOffice] = useState<string>('all');

  const { data: offices = [] } = useQuery({
    queryKey: ['office-directory'],
    queryFn: () => facilitiesPortalService.getOfficeDirectory(),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['facilities-dashboard'],
    queryFn: () => facilitiesPortalService.getDashboard(),
  });

  // Placeholder metrics - would come from analytics API
  const metrics = {
    averageOccupancy: 68,
    peakUtilization: 92,
    totalCheckIns: dashboard?.todayCheckIns || 0,
    totalBookings: dashboard?.todayBookings || 0,
    spaceUtilization: [
      { name: 'Hot Desks', utilization: 78, total: 50, used: 39 },
      { name: 'Conference Rooms', utilization: 65, total: 20, used: 13 },
      { name: 'Private Offices', utilization: 85, total: 30, used: 26 },
      { name: 'Huddle Rooms', utilization: 55, total: 15, used: 8 },
    ],
    dailyTrend: [
      { day: 'Mon', checkIns: 145 },
      { day: 'Tue', checkIns: 168 },
      { day: 'Wed', checkIns: 175 },
      { day: 'Thu', checkIns: 162 },
      { day: 'Fri', checkIns: 98 },
    ],
    topOffices: [
      { name: 'Headquarters', checkIns: 524, bookings: 312 },
      { name: 'Denver Office', checkIns: 234, bookings: 145 },
      { name: 'Austin Office', checkIns: 189, bookings: 98 },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into facilities usage and occupancy trends</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  dateRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>

          {/* Office Filter */}
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Select office"
          >
            <option value="all">All Offices</option>
            {offices.filter(o => o.status === 1).map(office => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Occupancy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.averageOccupancy}%</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-teal-600 text-sm font-medium">+5%</span>
            <span className="text-gray-500 text-sm">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Peak Utilization</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.peakUtilization}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-orange-600 text-sm font-medium">Wed 10am</span>
            <span className="text-gray-500 text-sm">busiest time</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Check-Ins</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalCheckIns.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-blue-600 text-sm font-medium">Today</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalBookings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-purple-600 text-sm font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Space Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Space Utilization by Type</h2>
          <div className="space-y-4">
            {metrics.spaceUtilization.map((space) => (
              <div key={space.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{space.name}</span>
                  <span className="text-sm text-gray-500">{space.used}/{space.total} ({space.utilization}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      space.utilization >= 80 ? 'bg-red-500' :
                      space.utilization >= 60 ? 'bg-yellow-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${space.utilization}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Check-In Trend</h2>
          <div className="flex items-end justify-between h-48 px-4">
            {metrics.dailyTrend.map((day) => {
              const maxCheckIns = Math.max(...metrics.dailyTrend.map(d => d.checkIns));
              const height = (day.checkIns / maxCheckIns) * 100;
              return (
                <div key={day.day} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-600">{day.checkIns}</span>
                  <div
                    className="w-12 bg-teal-500 rounded-t-lg transition-all hover:bg-teal-600"
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Offices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Offices by Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Ins</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.topOffices.map((office, index) => (
                <tr key={office.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{office.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">{office.checkIns.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-700">{office.bookings.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium text-gray-900">{Math.round((office.checkIns + office.bookings) / 10)}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-teal-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (office.checkIns + office.bookings) / 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-teal-900">Advanced Analytics Coming Soon</h3>
            <p className="text-sm text-teal-700 mt-1">
              We're working on enhanced analytics features including:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Predictive occupancy forecasting
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Cost per seat analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportable reports (PDF/Excel)
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Automated alerts and recommendations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
