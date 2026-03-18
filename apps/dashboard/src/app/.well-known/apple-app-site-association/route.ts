/**
 * Apple App Site Association (AASA) route handler
 *
 * Next.js doesn't serve extensionless files from public/ by default.
 * This route handler explicitly serves the AASA file with the correct
 * Content-Type header required by Apple's validation.
 *
 * TODO: Replace XXXXXXXXXX with your Apple Developer Team ID
 * Found at: developer.apple.com → Account → Membership → Team ID
 */

import { NextResponse } from 'next/server';

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'XXXXXXXXXX.com.pravado.mobile',
        paths: ['/app/*', '/legal/*', '/login', '/invite/*', '/beta'],
      },
    ],
  },
};

export async function GET() {
  return NextResponse.json(aasa, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
