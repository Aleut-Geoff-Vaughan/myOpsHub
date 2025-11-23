import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody, Input, Button } from '../components/ui';
import { loginAuditService, type LoginAuditItem } from '../services/loginAuditService';
import { StatusBadge } from '../components/ui';

export function AdminLoginReport() {
  const [email, setEmail] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [page, setPage] = useState(1);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['login-audits', email, resultFilter, page],
    queryFn: () =>
      loginAuditService.list({
        email: email.trim() || undefined,
        isSuccess: resultFilter === 'all' ? undefined : resultFilter === 'success',
        page,
        pageSize: 25,
      }),
  });

  const items = data?.items || [];

  const columns = [
    { key: 'when', header: 'When', render: (row: LoginAuditItem) => new Date(row.createdAt).toLocaleString() },
    { key: 'email', header: 'Email', render: (row: LoginAuditItem) => row.email || '-' },
    { key: 'result', header: 'Result', render: (row: LoginAuditItem) => (
      <StatusBadge status={row.isSuccess ? 'Success' : 'Failed'} variant={row.isSuccess ? 'success' : 'danger'} />
    ) },
    { key: 'ip', header: 'IP', render: (row: LoginAuditItem) => row.ipAddress || '-' },
    { key: 'ua', header: 'User Agent', render: (row: LoginAuditItem) => (
      <span className="text-xs text-gray-600 break-all">{row.userAgent || '-'}</span>
    ) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Login Reports</h1>
        <p className="text-gray-600 mt-1">Platform-wide login activity</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Logins</div>
              <div className="text-3xl font-semibold text-gray-900">{data?.total ?? '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Successful</div>
              <div className="text-3xl font-semibold text-green-600">{data?.successCount ?? '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Failed</div>
              <div className="text-3xl font-semibold text-red-600">{data?.failedCount ?? '-'}</div>
            </div>
            <div className="flex items-end justify-end">
              <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Filters" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Email contains"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select
                value={resultFilter}
                onChange={(e) => {
                  setPage(1);
                  setResultFilter(e.target.value as 'all' | 'success' | 'failed');
                }}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent Logins" subtitle={`Page ${page}`} />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No login records found
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-2 text-sm text-gray-700">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <CardBody className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page}</div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching || (data && (page * data.pageSize >= data.total))}
            >
              Next
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
