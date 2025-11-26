import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import {
  useTenantSettings,
  useUpdateTenantSettings,
  useUploadLogo,
} from '../hooks/useTenantSettings';
import type { UpdateTenantSettingsRequest } from '../types/doa';
import toast from 'react-hot-toast';

export function AdminTenantSettingsPage() {
  const { data: settings, isLoading } = useTenantSettings();
  const updateMutation = useUpdateTenantSettings();
  const uploadLogoMutation = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateTenantSettingsRequest>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        logoUrl: settings.logoUrl,
        logoFileName: settings.logoFileName,
        logoWidth: settings.logoWidth,
        logoHeight: settings.logoHeight,
        doaPrintHeaderContent: settings.doaPrintHeaderContent,
        doaPrintFooterContent: settings.doaPrintFooterContent,
        doaPrintLetterhead: settings.doaPrintLetterhead,
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        companyWebsite: settings.companyWebsite,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
      });
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PNG, JPEG, and SVG files are allowed');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    try {
      const result = await uploadLogoMutation.mutateAsync(file);
      setLogoPreview(result.logoUrl);
      setFormData({ ...formData, logoUrl: result.logoUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync(formData);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-pulse text-gray-500">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure your organization's branding, company information, and print templates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo & Branding</h2>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                        <img
                          src={logoPreview}
                          alt="Company Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-sm text-gray-400">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLogoMutation.isPending}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPEG, or SVG. Max file size 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Width (px)
                  </label>
                  <input
                    type="number"
                    value={formData.logoWidth || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, logoWidth: parseInt(e.target.value) || undefined })
                    }
                    placeholder="Auto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Height (px)
                  </label>
                  <input
                    type="number"
                    value={formData.logoHeight || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, logoHeight: parseInt(e.target.value) || undefined })
                    }
                    placeholder="Auto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Address
                </label>
                <textarea
                  value={formData.companyAddress || ''}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  placeholder="123 Main Street&#10;City, State ZIP"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.companyPhone || ''}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail || ''}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.companyWebsite || ''}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  placeholder="https://www.company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* DOA Print Template Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              DOA Print Template Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print Header Content
                </label>
                <textarea
                  value={formData.doaPrintHeaderContent || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, doaPrintHeaderContent: e.target.value })
                  }
                  placeholder="Header text that appears at the top of printed DOA letters..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print Footer Content
                </label>
                <textarea
                  value={formData.doaPrintFooterContent || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, doaPrintFooterContent: e.target.value })
                  }
                  placeholder="Footer text that appears at the bottom of printed DOA letters..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Letterhead Content
                </label>
                <textarea
                  value={formData.doaPrintLetterhead || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, doaPrintLetterhead: e.target.value })
                  }
                  placeholder="Custom letterhead content (HTML supported)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You can use HTML for custom formatting
                </p>
              </div>
            </div>
          </div>

          {/* Styling Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Styling Options</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor || ''}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor || '#64748B'}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor || ''}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#64748B"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={formData.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Size (pt)
                  </label>
                  <input
                    type="number"
                    value={formData.fontSize || 12}
                    onChange={(e) =>
                      setFormData({ ...formData, fontSize: parseInt(e.target.value) || 12 })
                    }
                    min="8"
                    max="24"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
