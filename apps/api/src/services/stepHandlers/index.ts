/**
 * Step Handlers Registry (Sprint S18)
 * Maps step types to their execution handlers
 */

import type { StepExecutionContext , PlaybookStepType } from '@pravado/types';

/**
 * Step handler interface
 */
export interface StepHandler {
  execute(context: StepExecutionContext): Promise<unknown>;
}

/**
 * AGENT step handler - executes AI agent tasks
 */
const agentHandler: StepHandler = {
  async execute(context: StepExecutionContext): Promise<unknown> {
    // TODO: Implement agent execution logic (Sprint S7+)
    // For now, return mock success
    console.log(`[AgentHandler] Executing agent step: ${context.step.key}`);

    return {
      success: true,
      message: 'Agent execution placeholder - to be implemented',
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * DATA step handler - performs data transformations
 */
const dataHandler: StepHandler = {
  async execute(context: StepExecutionContext): Promise<unknown> {
    console.log(`[DataHandler] Executing data step: ${context.step.key}`);

    const config = context.step.config as {
      operation?: string;
      source?: string;
      transform?: string;
    };

    // Simple data transformation logic
    if (config.operation === 'merge') {
      // Merge previous outputs
      return {
        ...context.previousOutputs,
        mergedAt: new Date().toISOString(),
      };
    }

    if (config.operation === 'extract') {
      // Extract specific fields from input
      const source = config.source || 'input';
      const data = source === 'input' ? context.input : context.previousOutputs[source];
      return data;
    }

    // Default: pass through input
    return context.input;
  },
};

/**
 * BRANCH step handler - conditional branching logic
 */
const branchHandler: StepHandler = {
  async execute(context: StepExecutionContext): Promise<unknown> {
    console.log(`[BranchHandler] Executing branch step: ${context.step.key}`);

    const config = context.step.config as {
      condition?: string;
      field?: string;
      operator?: string;
      value?: unknown;
    };

    // Simple condition evaluation
    const field = config.field || 'input';
    const operator = config.operator || 'equals';
    const expectedValue = config.value;

    let actualValue: unknown;
    if (field === 'input') {
      actualValue = context.input;
    } else if (field.startsWith('steps.')) {
      const stepKey = field.replace('steps.', '').split('.')[0];
      actualValue = context.previousOutputs[stepKey];
    } else {
      actualValue = context.input;
    }

    let conditionMet = false;

    switch (operator) {
      case 'equals':
        conditionMet = actualValue === expectedValue;
        break;
      case 'notEquals':
        conditionMet = actualValue !== expectedValue;
        break;
      case 'greaterThan':
        conditionMet = Number(actualValue) > Number(expectedValue);
        break;
      case 'lessThan':
        conditionMet = Number(actualValue) < Number(expectedValue);
        break;
      case 'contains':
        conditionMet = String(actualValue).includes(String(expectedValue));
        break;
      default:
        conditionMet = false;
    }

    return {
      conditionMet,
      actualValue,
      expectedValue,
      operator,
      evaluatedAt: new Date().toISOString(),
    };
  },
};

/**
 * API step handler - makes external API calls
 */
const apiHandler: StepHandler = {
  async execute(context: StepExecutionContext): Promise<unknown> {
    console.log(`[ApiHandler] Executing API step: ${context.step.key}`);

    const config = context.step.config as {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    };

    if (!config.url) {
      throw new Error('API step requires a URL');
    }

    const method = config.method || 'GET';
    const headers = config.headers || {};
    const body = config.body;

    // Replace template variables in URL and body
    let url = config.url;
    let requestBody = body;

    // Simple template replacement for {{steps.key.field}}
    const replaceTemplates = (text: string): string => {
      return text.replace(/\{\{steps\.([^}]+)\}\}/g, (_match, path) => {
        const [stepKey, ...fields] = path.split('.');
        let value: any = context.previousOutputs[stepKey];

        for (const field of fields) {
          if (value && typeof value === 'object') {
            value = value[field];
          }
        }

        return String(value || '');
      });
    };

    url = replaceTemplates(url);

    if (typeof requestBody === 'string') {
      requestBody = replaceTemplates(requestBody);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' && requestBody ? JSON.stringify(requestBody) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      executedAt: new Date().toISOString(),
    };
  },
};

/**
 * Step handlers registry
 */
export const stepHandlers: Record<PlaybookStepType, StepHandler> = {
  AGENT: agentHandler,
  DATA: dataHandler,
  BRANCH: branchHandler,
  API: apiHandler,
};
