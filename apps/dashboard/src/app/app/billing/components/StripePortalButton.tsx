/**
 * Stripe Portal Button Component (Sprint S33.2)
 * Opens Stripe Customer Portal for payment method management
 */

'use client';

import React, { useState } from 'react';
import { openPaymentPortal } from '@/lib/billingApi';

interface StripePortalButtonProps {
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}

export function StripePortalButton({
  variant = 'secondary',
  children = 'Manage Payment Method'
}: StripePortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const portalUrl = await openPaymentPortal();

      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        alert('Failed to open payment portal. Please try again.');
      }
    } catch (error) {
      console.error('Failed to open payment portal:', error);
      alert('Failed to open payment portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles}`}
    >
      {isLoading ? 'Opening...' : children}
    </button>
  );
}
