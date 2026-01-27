/**
 * Content Item API Route Handler
 *
 * GET /api/content/items/[id] - Fetch single content asset
 * PATCH /api/content/items/[id] - Update content asset
 *
 * Gate 1A compliant: Client → Next.js Route Handler → Backend
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock content asset for development
const MOCK_ASSET = {
  id: '1',
  organizationId: 'org-1',
  title: 'Ultimate Guide to Marketing Automation',
  contentType: 'long_form',
  status: 'draft',
  authorityIntent: 'Establish thought leadership in marketing automation space',
  wordCount: 4500,
  citeMindStatus: 'warning',
  citeMindIssues: [
    { type: 'unverified_claim', severity: 'warning', message: 'Statistics need source attribution', section: 'Introduction' },
    { type: 'missing_citation', severity: 'warning', message: 'Industry benchmark claim requires citation', section: 'Benefits' },
  ],
  entityAssociations: ['Marketing Automation', 'B2B Marketing', 'Lead Generation'],
  authoritySignals: {
    authorityContributionScore: 72,
    citationEligibilityScore: 65,
    aiIngestionLikelihood: 78,
    crossPillarImpact: 54,
    competitiveAuthorityDelta: 8,
    measuredAt: new Date().toISOString(),
  },
  body: `# Ultimate Guide to Marketing Automation

## Introduction

Marketing automation has become essential for modern businesses...`,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, fetch from backend API
    // const backendUrl = process.env.API_BASE_URL;
    // const response = await fetch(`${backendUrl}/content/items/${params.id}`, {
    //   headers: { Authorization: request.headers.get('Authorization') || '' },
    // });

    // For now, return mock data
    return NextResponse.json({
      success: true,
      data: { item: { ...MOCK_ASSET, id: params.id } },
    });
  } catch (error) {
    console.error('Failed to fetch content item:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch content item' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // In production, forward to backend API
    // const backendUrl = process.env.API_BASE_URL;
    // const response = await fetch(`${backendUrl}/content/items/${params.id}`, {
    //   method: 'PATCH',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: request.headers.get('Authorization') || '',
    //   },
    //   body: JSON.stringify(body),
    // });

    // For now, return success with merged data
    return NextResponse.json({
      success: true,
      data: {
        item: {
          ...MOCK_ASSET,
          id: params.id,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to update content item:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update content item' } },
      { status: 500 }
    );
  }
}
