# Contract Examples & MSW Usage

> Single source of truth for Command Center mock data during hollow UI development.

## Overview

The `/contracts/examples/` folder contains JSON contract files that define the expected API response shapes for the Command Center UI. These files serve as:

1. **Mock Data Source** - The ONLY authorized source for MSW handlers
2. **API Contract** - Documents the expected response structure
3. **UI Development Aid** - Enables building UI before backend is ready

## Contract Files

| File | Purpose | Endpoint |
|------|---------|----------|
| `action-stream.json` | Action items with pillars, priorities, gates | `/api/command-center/action-stream` |
| `intelligence-canvas.json` | Knowledge graph nodes, edges, citations | `/api/command-center/intelligence-canvas` |
| `strategy-panel.json` | KPIs, narratives, recommendations | `/api/command-center/strategy-panel` |
| `orchestration-calendar.json` | Calendar items with statuses and modes | `/api/command-center/orchestration-calendar` |

## Enabling MSW

MSW (Mock Service Worker) intercepts API calls in the browser and returns contract examples.

### 1. Environment Variable

Add to `.env.local` in the dashboard app:

```bash
NEXT_PUBLIC_MSW_ENABLED=true
```

### 2. Service Worker

Ensure the MSW service worker is available:

```bash
# Already generated at:
# apps/dashboard/public/mockServiceWorker.js
```

### 3. Provider Setup

The `MSWProvider` component should wrap your app in `layout.tsx`:

```tsx
import { MSWProvider } from '@/mocks/MSWProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MSWProvider>
          {children}
        </MSWProvider>
      </body>
    </html>
  );
}
```

## Using in Tests

For Jest/Vitest tests:

```typescript
import { server } from '@/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Extending Handlers

To add new endpoints, edit `apps/dashboard/src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse, delay } from 'msw';
import newContract from '../../../../contracts/examples/new-endpoint.json';

export const handlers = [
  // ... existing handlers

  http.get('/api/new-endpoint', async () => {
    await delay(200);
    return HttpResponse.json(newContract);
  }),
];
```

**Important**: Always import mock data from `/contracts/examples/`. Do not create duplicate mock data sources.

## CI Validation

The `scripts/check-contracts.mjs` script validates:

- All contract JSON files are parseable
- Mock imports only reference contracts/examples
- No forbidden mock folders exist (\_\_mocks\_\_, fixtures, test-data)
- Required contract files are present

This runs automatically on PR via `.github/workflows/contracts-gates.yml`.

## Related Documentation

- `/docs/canon/COMMAND-CENTER-UI.md` - UI specification
- `/contracts/examples/` - Contract JSON files
- `/apps/dashboard/src/mocks/` - MSW setup files
