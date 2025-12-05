# AI Personality Engine V1 (Sprint S11)

**Status:** ✅ Implemented
**Sprint:** S11
**Dependencies:** S7 (Playbook Runtime), S9 (Collaboration), S10 (Memory V2)
**Related Docs:** [Agent Runtime](./agent_runtime.md), [AI Memory V2](./ai_memory_v2.md)

## Overview

The **Personality Engine V1** introduces configurable personality profiles that influence agent behavior, decision-making, and collaboration dynamics. Each agent can be assigned a personality that modifies its tone, style, risk tolerance, escalation behavior, and domain framing.

This is the first phase of the personality system - **static personality profiles**. Future phases will introduce adaptive personalities that evolve based on outcomes and user feedback.

## Core Concepts

### Personality Profile

A `PersonalityProfile` defines behavioral characteristics that influence how an agent operates:

```typescript
interface PersonalityProfile {
  tone: string;                      // "formal", "analytical", "friendly", etc.
  style: string;                     // "structured", "concise", "verbose", etc.
  riskTolerance: RiskTolerance;      // "low" | "medium" | "high"
  domainSpecialty: string[];         // ["pr", "seo", "content"]
  biasModifiers: Record<string, number>;  // e.g. { "optimism": +0.2 }
  memoryWeight: number;              // 0–1 scalar for semantic memory relevance
  escalationSensitivity: number;     // 0–1 scalar modifying escalation decisions
  collaborationStyle: CollaborationStyle;  // "assertive" | "supportive" | "balanced"
  constraints: {
    forbid?: string[];               // Forbidden actions/approaches
    require?: string[];              // Required validations
  };
}
```

### Agent Personality

An `AgentPersonality` is a stored personality profile that can be assigned to agents:

```typescript
interface AgentPersonality {
  id: string;
  orgId: string;
  slug: string;                      // URL-friendly identifier
  name: string;
  description: string;
  configuration: PersonalityProfile;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Personality Assignment

Agents are linked to personalities via the `agent_personality_assignments` table. One agent can have one personality at a time.

## Built-in System Personalities

The system provides 8 pre-configured personalities that cover common use cases:

### 1. PR Strategist
- **Tone:** Professional
- **Style:** Persuasive
- **Risk Tolerance:** Medium
- **Domain:** PR, Media, Outreach
- **Collaboration:** Assertive
- **Key Traits:** Optimistic, assertive, creative
- **Use Case:** Media outreach, journalist relationship management

### 2. SEO Analyst
- **Tone:** Analytical
- **Style:** Structured
- **Risk Tolerance:** Low
- **Domain:** SEO, Keywords, Analytics
- **Collaboration:** Supportive
- **Key Traits:** Precise, cautious, data-driven
- **Use Case:** Keyword research, technical SEO, content optimization

### 3. Content Architect
- **Tone:** Engaging
- **Style:** Narrative
- **Risk Tolerance:** Medium
- **Domain:** Content, Writing, Storytelling
- **Collaboration:** Balanced
- **Key Traits:** Creative, empathetic, readable
- **Use Case:** Long-form content, storytelling, audience engagement

### 4. Investigative Analyst
- **Tone:** Formal
- **Style:** Detailed
- **Risk Tolerance:** Low
- **Domain:** Research, Analysis, Fact-checking
- **Collaboration:** Supportive
- **Key Traits:** Skeptical, thorough, cautious
- **Use Case:** Data gathering, competitive analysis, fact verification

### 5. Generalist Agent
- **Tone:** Friendly
- **Style:** Concise
- **Risk Tolerance:** Medium
- **Domain:** PR, SEO, Content
- **Collaboration:** Balanced
- **Key Traits:** Adaptable, balanced
- **Use Case:** General-purpose tasks across all domains

### 6. Social Media Manager
- **Tone:** Casual
- **Style:** Conversational
- **Risk Tolerance:** High
- **Domain:** Social, Trends, Engagement
- **Collaboration:** Assertive
- **Key Traits:** Creative, fast, trend-aware
- **Use Case:** Social media content, trend adaptation, audience engagement

### 7. Technical Writer
- **Tone:** Instructional
- **Style:** Structured
- **Risk Tolerance:** Low
- **Domain:** Documentation, Technical, Clarity
- **Collaboration:** Supportive
- **Key Traits:** Precise, clear, simplifies complexity
- **Use Case:** Documentation, technical content, instructional materials

### 8. Brand Guardian
- **Tone:** Brand-aligned
- **Style:** Consistent
- **Risk Tolerance:** Low
- **Domain:** Brand, Compliance, Quality
- **Collaboration:** Supportive
- **Key Traits:** Conservative, consistent, quality-focused
- **Use Case:** Brand protection, content review, compliance checking

## How Personality Influences Behavior

### 1. Prompt Construction
Personality tone and style modify the system prompts sent to LLMs:
- **Tone** influences the speaking voice (formal vs. casual)
- **Style** influences structure (concise vs. detailed)
- **Domain specialty** frames the task within expert context

### 2. Memory Weighting
The `memoryWeight` scalar (0–1) modifies how heavily semantic memories influence decisions:
- **High memory weight (0.8):** SEO Analyst relies heavily on past keyword research
- **Low memory weight (0.4):** Social Media Manager prioritizes current trends over history

### 3. Escalation Sensitivity
The `escalationSensitivity` scalar (0–1) combined with `riskTolerance` determines when to escalate:

```typescript
// Low risk + high sensitivity = escalates quickly
// High risk + low sensitivity = self-reliant, rarely escalates

const riskModifier = riskTolerance === 'low' ? 1.3 :
                    riskTolerance === 'high' ? 0.7 : 1.0;

const shouldEscalate = baseThreshold * (sensitivity * riskModifier);
```

**Examples:**
- **Brand Guardian** (low risk, 0.2 sensitivity): Escalates frequently to avoid mistakes
- **Social Media Manager** (high risk, 0.7 sensitivity): Acts independently, rarely escalates

### 4. Collaboration Style
Determines how agents interact with other agents:
- **Assertive:** More likely to delegate, request help, take initiative
- **Supportive:** Prefers to assist others, less likely to delegate
- **Balanced:** Standard collaboration behavior

### 5. Bias Modifiers
Key-value pairs that influence specific behavioral tendencies:
```typescript
{
  "optimism": 0.3,        // PR Strategist leans positive
  "precision": 0.8,       // Technical Writer prioritizes accuracy
  "creativity": 0.6,      // Content Architect emphasizes originality
  "conservatism": 0.7     // Brand Guardian avoids risk
}
```

### 6. Constraints
- **`require`:** Actions that must be taken (e.g., `["journalist_validation"]`)
- **`forbid`:** Actions that are prohibited (e.g., `["spam_tactics"]`)

## Database Schema

### agent_personalities Table

```sql
CREATE TABLE agent_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);
```

### agent_personality_assignments Table

```sql
CREATE TABLE agent_personality_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  personality_id UUID NOT NULL REFERENCES agent_personalities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, agent_id)
);
```

## API Endpoints

### List Custom Personalities
```http
GET /api/v1/personalities?limit=50&offset=0
Authorization: Bearer <token>
```

Returns org-specific custom personalities.

### List System Personalities
```http
GET /api/v1/personalities/system
Authorization: Bearer <token>
```

Returns all built-in system personalities that can be cloned.

### Get Personality by ID
```http
GET /api/v1/personalities/:id
Authorization: Bearer <token>
```

### Create Custom Personality
```http
POST /api/v1/personalities
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "custom-analyst",
  "name": "Custom Analyst",
  "description": "Custom personality for specialized analysis",
  "configuration": {
    "tone": "analytical",
    "style": "detailed",
    "riskTolerance": "low",
    "domainSpecialty": ["research", "analysis"],
    "biasModifiers": { "skepticism": 0.7 },
    "memoryWeight": 0.8,
    "escalationSensitivity": 0.3,
    "collaborationStyle": "supportive",
    "constraints": {
      "require": ["source_verification"],
      "forbid": ["speculation"]
    }
  }
}
```

### Update Personality
```http
PUT /api/v1/personalities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Assign Personality to Agent
```http
POST /api/v1/personalities/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "agentId": "pr-research-agent",
  "personalityId": "uuid-of-personality"
}
```

### Get Agent's Assigned Personality
```http
GET /api/v1/personalities/agent/:agentId
Authorization: Bearer <token>
```

### Remove Personality from Agent
```http
DELETE /api/v1/personalities/agent/:agentId
Authorization: Bearer <token>
```

## Integration Points

### 1. Playbook Execution Engine
When executing an AGENT step:
```typescript
const personality = await personalityStore.getPersonalityForAgent(orgId, agentId);

// Personality influences:
// - Prompt tone/style injection
// - Memory weighting in context assembly
// - Escalation threshold adjustments
// - Collaboration style behavior
```

### 2. Collaboration Coordinator
Personality modifies escalation and collaboration:
```typescript
const coordinator = new CollaborationCoordinator({
  personality: personality?.configuration
});

// Risk tolerance + escalation sensitivity determine when to escalate
// Collaboration style influences delegation behavior
```

### 3. Memory Context Assembly
*(Reserved for future implementation)*
```typescript
const assembledContext = await contextAssembler.assembleContextForStep({
  // ...
  personality: personality?.configuration
});

// memoryWeight influences semantic memory retrieval relevance
```

## Validation

Personality profiles are validated using Zod schemas:

```typescript
const personalityProfileSchema = z.object({
  tone: z.string().min(1).max(100),
  style: z.string().min(1).max(100),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  domainSpecialty: z.array(z.string()).default([]),
  biasModifiers: z.record(z.string(), z.number()).default({}),
  memoryWeight: z.number().min(0).max(1).default(0.5),
  escalationSensitivity: z.number().min(0).max(1).default(0.5),
  collaborationStyle: z.enum(['assertive', 'supportive', 'balanced']),
  constraints: z.object({
    forbid: z.array(z.string()).optional(),
    require: z.array(z.string()).optional(),
  }).default({})
});
```

## Testing

Tests cover:
1. **PersonalityStore CRUD operations**
2. **PersonalityRegistry system personalities**
3. **Assignment management**
4. **Validation schemas**
5. **Integration with execution engine**

```bash
pnpm test personalityStore.test.ts
pnpm test personalityRegistry.test.ts
```

## Usage Example

```typescript
// 1. Create a custom personality based on PR Strategist
const prPersonality = getSystemPersonality('pr-strategist');

const customPersonality = await personalityStore.createPersonality(
  orgId,
  userId,
  {
    slug: 'tech-pr-specialist',
    name: 'Tech PR Specialist',
    description: 'PR expert focused on tech industry',
    configuration: {
      ...prPersonality.configuration,
      domainSpecialty: ['pr', 'tech', 'startups'],
      biasModifiers: {
        ...prPersonality.configuration.biasModifiers,
        innovation: 0.5
      }
    }
  }
);

// 2. Assign to an agent
await personalityStore.assignPersonalityToAgent(
  orgId,
  'media-outreach-agent',
  customPersonality.id
);

// 3. Execute playbook step - personality is automatically loaded
const run = await executionEngine.startPlaybookRun(
  orgId,
  playbookId,
  input
);
// Agent behavior is now influenced by the Tech PR Specialist personality
```

## Future Enhancements (Beyond S11)

### Adaptive Personality (V2)
- Personalities evolve based on outcomes
- Success/failure feedback modifies bias modifiers
- Risk tolerance adjusts based on track record

### Multi-Personality Agents
- Agents can switch personalities based on task type
- Context-aware personality selection

### Personality Analytics
- Track which personalities perform best for specific tasks
- A/B testing personality configurations

### Fine-tuned Prompt Engineering
- Personality-specific prompt templates
- Domain-specific language injection

## Troubleshooting

### Personality Not Applied
**Problem:** Agent behavior doesn't reflect assigned personality
**Solution:** Check personality assignment in database, verify execution engine loads personality

### Validation Errors
**Problem:** Cannot create personality with invalid configuration
**Solution:** Ensure `memoryWeight` and `escalationSensitivity` are 0–1, `riskTolerance` is low/medium/high

### Missing System Personality
**Problem:** Cannot find expected system personality
**Solution:** Use `/api/v1/personalities/system` to list all available system personalities

## References

- [Agent Runtime Architecture](./agent_runtime.md)
- [AI Memory V2](./ai_memory_v2.md)
- [Playbook Runtime](./ai_playbooks_runtime.md)
- Migration: `apps/api/supabase/migrations/25_create_agent_personality_schema.sql`
- Types: `packages/types/src/agents.ts` (lines 620-694)
- Validators: `packages/validators/src/personality.ts`
- Store: `apps/api/src/services/personality/personalityStore.ts`
- Registry: `apps/api/src/services/personality/personalityRegistry.ts`
- API Routes: `apps/api/src/routes/personalities/index.ts`
