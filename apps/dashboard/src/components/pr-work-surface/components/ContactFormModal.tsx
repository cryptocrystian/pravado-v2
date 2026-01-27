'use client';

/**
 * Contact Form Modal - DS 3.0
 *
 * Unified modal for creating and editing journalist contacts.
 * Supports both "New Contact" and "Edit Contact" modes.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { useState, useEffect, useCallback } from 'react';
import { buttonStyles, typography } from '../prWorkSurfaceStyles';

interface ContactFormData {
  fullName: string;
  primaryEmail: string;
  primaryOutlet: string;
  beat: string;
  twitterHandle: string;
  linkedinUrl: string;
}

interface ContactFormModalProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ContactFormData> & { id?: string };
  onClose: () => void;
  onSave: (data: ContactFormData, id?: string) => Promise<void>;
}

const INITIAL_FORM_DATA: ContactFormData = {
  fullName: '',
  primaryEmail: '',
  primaryOutlet: '',
  beat: '',
  twitterHandle: '',
  linkedinUrl: '',
};

export function ContactFormModal({
  mode,
  initialData,
  onClose,
  onSave,
}: ContactFormModalProps) {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form with existing data for edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        primaryEmail: initialData.primaryEmail || '',
        primaryOutlet: initialData.primaryOutlet || '',
        beat: initialData.beat || '',
        twitterHandle: initialData.twitterHandle || '',
        linkedinUrl: initialData.linkedinUrl || '',
      });
    }
  }, [initialData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};

    // Required: Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    // Required: Email (valid format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.primaryEmail.trim()) {
      newErrors.primaryEmail = 'Email is required';
    } else if (!emailRegex.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Invalid email format';
    }

    // Required: Outlet
    if (!formData.primaryOutlet.trim()) {
      newErrors.primaryOutlet = 'Outlet is required';
    }

    // Optional but validate format if provided
    if (formData.twitterHandle && !formData.twitterHandle.match(/^@?[a-zA-Z0-9_]{1,15}$/)) {
      newErrors.twitterHandle = 'Invalid Twitter handle format';
    }

    if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com/')) {
      newErrors.linkedinUrl = 'Invalid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData, initialData?.id);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0D0D12] border border-[#1A1A24] rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A24]">
          <h2 className={typography.titleLarge}>
            {mode === 'create' ? 'New Contact' : 'Edit Contact'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name (Required) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Full Name <span className="text-brand-magenta">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="e.g., Sarah Chen"
              className={`w-full px-4 py-2.5 bg-[#13131A] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${
                errors.fullName ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1A1A24] focus:ring-brand-magenta/30 focus:border-brand-magenta'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Email (Required) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Email <span className="text-brand-magenta">*</span>
            </label>
            <input
              type="email"
              value={formData.primaryEmail}
              onChange={(e) => handleChange('primaryEmail', e.target.value)}
              placeholder="e.g., sarah@techcrunch.com"
              className={`w-full px-4 py-2.5 bg-[#13131A] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${
                errors.primaryEmail ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1A1A24] focus:ring-brand-magenta/30 focus:border-brand-magenta'
              }`}
            />
            {errors.primaryEmail && (
              <p className="mt-1 text-xs text-red-400">{errors.primaryEmail}</p>
            )}
          </div>

          {/* Outlet (Required) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Outlet <span className="text-brand-magenta">*</span>
            </label>
            <input
              type="text"
              value={formData.primaryOutlet}
              onChange={(e) => handleChange('primaryOutlet', e.target.value)}
              placeholder="e.g., TechCrunch"
              className={`w-full px-4 py-2.5 bg-[#13131A] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${
                errors.primaryOutlet ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1A1A24] focus:ring-brand-magenta/30 focus:border-brand-magenta'
              }`}
            />
            {errors.primaryOutlet && (
              <p className="mt-1 text-xs text-red-400">{errors.primaryOutlet}</p>
            )}
          </div>

          {/* Beat (Optional) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Beat / Topic
            </label>
            <input
              type="text"
              value={formData.beat}
              onChange={(e) => handleChange('beat', e.target.value)}
              placeholder="e.g., Enterprise AI, SaaS"
              className="w-full px-4 py-2.5 bg-[#13131A] border border-[#1A1A24] rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 focus:border-brand-magenta transition-colors"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Twitter Handle
              </label>
              <input
                type="text"
                value={formData.twitterHandle}
                onChange={(e) => handleChange('twitterHandle', e.target.value)}
                placeholder="@handle"
                className={`w-full px-4 py-2.5 bg-[#13131A] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${
                  errors.twitterHandle ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1A1A24] focus:ring-brand-magenta/30 focus:border-brand-magenta'
                }`}
              />
              {errors.twitterHandle && (
                <p className="mt-1 text-xs text-red-400">{errors.twitterHandle}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                placeholder="linkedin.com/in/..."
                className={`w-full px-4 py-2.5 bg-[#13131A] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-colors ${
                  errors.linkedinUrl ? 'border-red-500 focus:ring-red-500/30' : 'border-[#1A1A24] focus:ring-brand-magenta/30 focus:border-brand-magenta'
                }`}
              />
              {errors.linkedinUrl && (
                <p className="mt-1 text-xs text-red-400">{errors.linkedinUrl}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={buttonStyles.primary}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                mode === 'create' ? 'Add Contact' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
