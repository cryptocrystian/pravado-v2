/**
 * AI Draft Generation Service (Sprint S98)
 * Generates personalized pitch emails and responses using LLM
 */

import { routeLLM } from '@pravado/utils';

/**
 * Context for generating a pitch draft
 */
export interface PitchDraftContext {
  // Journalist info
  journalistName: string;
  journalistEmail: string;
  journalistOutlet: string | null;
  journalistBeat: string | null;
  journalistTopics?: string[];

  // Brand/org info
  brandName: string;
  brandDescription?: string;

  // Optional: Related coverage
  coverageTitle?: string;
  coverageSummary?: string;

  // Action type
  action: 'pitch' | 'respond' | 'follow-up';

  // Custom topic/angle
  topic?: string;
  angle?: string;
}

/**
 * Generated draft result
 */
export interface GeneratedDraft {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  reasoning: string;
  generatedAt: Date;
}

/**
 * AI Draft Generation Service
 */
export class AIDraftService {
  /**
   * Generate a pitch draft for a journalist
   */
  async generatePitchDraft(context: PitchDraftContext): Promise<GeneratedDraft> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildPitchPrompt(context);

    try {
      const response = await routeLLM({
        systemPrompt,
        userPrompt,
        responseFormat: 'json',
        schema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Email subject line' },
            bodyText: { type: 'string', description: 'Plain text email body' },
            reasoning: { type: 'string', description: 'Brief explanation of the approach' },
          },
          required: ['subject', 'bodyText', 'reasoning'],
        },
        temperature: 0.7,
        maxTokens: 1500,
      });

      const parsed = this.parseJsonResponse(response.content);

      // Convert plain text to simple HTML (preserve line breaks)
      const bodyHtml = this.textToHtml(parsed.bodyText);

      return {
        subject: parsed.subject,
        bodyHtml,
        bodyText: parsed.bodyText,
        reasoning: parsed.reasoning,
        generatedAt: new Date(),
      };
    } catch (error) {
      // Fallback to template if LLM fails
      console.error('LLM generation failed, using fallback:', error);
      return this.generateFallbackDraft(context);
    }
  }

  /**
   * Generate a response to coverage
   */
  async generateResponseDraft(context: PitchDraftContext): Promise<GeneratedDraft> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildResponsePrompt(context);

    try {
      const response = await routeLLM({
        systemPrompt,
        userPrompt,
        responseFormat: 'json',
        schema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Email subject line' },
            bodyText: { type: 'string', description: 'Plain text email body' },
            reasoning: { type: 'string', description: 'Brief explanation of the approach' },
          },
          required: ['subject', 'bodyText', 'reasoning'],
        },
        temperature: 0.7,
        maxTokens: 1500,
      });

      const parsed = this.parseJsonResponse(response.content);
      const bodyHtml = this.textToHtml(parsed.bodyText);

      return {
        subject: parsed.subject,
        bodyHtml,
        bodyText: parsed.bodyText,
        reasoning: parsed.reasoning,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('LLM generation failed, using fallback:', error);
      return this.generateFallbackDraft(context);
    }
  }

  /**
   * Build system prompt for the LLM
   */
  private buildSystemPrompt(context: PitchDraftContext): string {
    return `You are an expert PR professional helping to draft personalized outreach emails.

Your goals:
1. Write concise, compelling emails that respect journalists' time
2. Personalize based on the journalist's beat and past coverage
3. Provide clear value propositions
4. Use a professional but warm tone
5. Keep subject lines under 60 characters
6. Keep emails under 200 words

Brand context: ${context.brandName}${context.brandDescription ? ` - ${context.brandDescription}` : ''}

Always respond with valid JSON matching the requested schema.`;
  }

  /**
   * Build pitch prompt
   */
  private buildPitchPrompt(context: PitchDraftContext): string {
    let prompt = `Generate a personalized pitch email to the following journalist:

Journalist: ${context.journalistName}
Outlet: ${context.journalistOutlet || 'Unknown'}
Beat: ${context.journalistBeat || 'General'}
${context.journalistTopics?.length ? `Topics they cover: ${context.journalistTopics.join(', ')}` : ''}

`;

    if (context.topic) {
      prompt += `Pitch topic: ${context.topic}\n`;
    }
    if (context.angle) {
      prompt += `Suggested angle: ${context.angle}\n`;
    }

    prompt += `
Create a compelling pitch that:
1. Opens with a relevant hook based on their coverage area
2. Briefly introduces why ${context.brandName} is relevant to their audience
3. Includes a clear call-to-action
4. Ends professionally

Remember: Be concise and respectful of their time.`;

    return prompt;
  }

  /**
   * Build response prompt (for responding to coverage)
   */
  private buildResponsePrompt(context: PitchDraftContext): string {
    let prompt = `Generate a response email to the following journalist who recently covered a relevant topic:

Journalist: ${context.journalistName}
Outlet: ${context.journalistOutlet || 'Unknown'}
`;

    if (context.coverageTitle) {
      prompt += `Their recent article: "${context.coverageTitle}"\n`;
    }
    if (context.coverageSummary) {
      prompt += `Article summary: ${context.coverageSummary}\n`;
    }

    prompt += `
Create a thoughtful response that:
1. Thanks them for their coverage (if applicable)
2. Offers additional insight or context from ${context.brandName}
3. Proposes a follow-up conversation or exclusive information
4. Keeps a professional, appreciative tone

Be brief and genuine.`;

    return prompt;
  }

  /**
   * Parse JSON response from LLM
   */
  private parseJsonResponse(content: string): { subject: string; bodyText: string; reasoning: string } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch {
      // If parsing fails, use the content as-is
      return {
        subject: 'Connecting with you',
        bodyText: content,
        reasoning: 'Failed to parse structured response',
      };
    }
  }

  /**
   * Convert plain text to simple HTML
   */
  private textToHtml(text: string): string {
    return text
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Generate fallback draft when LLM fails
   */
  private generateFallbackDraft(context: PitchDraftContext): GeneratedDraft {
    const subject = context.action === 'respond'
      ? `Re: Your recent coverage`
      : `${context.brandName} - Story Opportunity`;

    const bodyText = context.action === 'respond'
      ? `Hi ${context.journalistName},

I wanted to reach out regarding your recent coverage${context.coverageTitle ? ` on "${context.coverageTitle}"` : ''}.

At ${context.brandName}, we have some additional insights that might interest your readers.

Would you be open to a brief conversation?

Best regards`
      : `Hi ${context.journalistName},

I'm reaching out from ${context.brandName} with a story opportunity that aligns with your coverage${context.journalistBeat ? ` of ${context.journalistBeat}` : ''}.

${context.topic ? `The story focuses on ${context.topic}.` : 'We have a unique angle that could resonate with your audience.'}

Would you be interested in learning more?

Best regards`;

    const bodyHtml = this.textToHtml(bodyText);

    return {
      subject,
      bodyHtml,
      bodyText,
      reasoning: 'Generated using fallback template (LLM unavailable)',
      generatedAt: new Date(),
    };
  }
}

/**
 * Factory function
 */
export function createAIDraftService(): AIDraftService {
  return new AIDraftService();
}
