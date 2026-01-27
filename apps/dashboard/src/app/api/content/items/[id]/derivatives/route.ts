/**
 * Content Derivatives API Route Handler
 *
 * GET /api/content/items/[id]/derivatives - Fetch derivatives for asset
 * POST /api/content/items/[id]/derivatives - Generate new derivative
 *
 * Gate 1A compliant: Client → Next.js Route Handler → Backend
 * @see /docs/canon/CONTENT_PILLAR_CANON.md Section 4.3
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock derivatives for development
const MOCK_DERIVATIVES = [
  {
    id: 'deriv-1',
    parentAssetId: '1',
    surfaceType: 'pr_pitch_excerpt',
    content: 'New research shows marketing automation delivers 3x ROI improvement. Our comprehensive guide reveals the key strategies behind successful implementations.',
    valid: true,
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'deriv-2',
    parentAssetId: '1',
    surfaceType: 'aeo_snippet',
    content: 'Marketing automation is software that automates repetitive marketing tasks like email campaigns, social media posting, and lead nurturing to improve efficiency and personalization.',
    valid: true,
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, fetch from backend API
    return NextResponse.json({
      success: true,
      data: {
        derivatives: MOCK_DERIVATIVES.filter((d) => d.parentAssetId === params.id || params.id === '1'),
      },
    });
  } catch (error) {
    console.error('Failed to fetch derivatives:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch derivatives' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type } = body;

    // Validate derivative type
    const validTypes = ['pr_pitch_excerpt', 'aeo_snippet', 'ai_summary', 'social_fragment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid derivative type' } },
        { status: 400 }
      );
    }

    // In production, forward to AI generation service
    // For now, return mock generated derivative
    const generatedDerivative = {
      id: `deriv-${Date.now()}`,
      parentAssetId: params.id,
      surfaceType: type,
      content: `Generated ${type.replace(/_/g, ' ')} for asset ${params.id}. This is a placeholder for AI-generated content.`,
      valid: true,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: { derivative: generatedDerivative },
    });
  } catch (error) {
    console.error('Failed to generate derivative:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate derivative' } },
      { status: 500 }
    );
  }
}
