export interface ContextChip {
  label: string;
  prompt: string;
}

export const CONTEXT_CHIPS: Record<string, ContextChip[]> = {
  'command-center': [
    { label: 'Summarize my week', prompt: 'Summarize my PR and content activity this week.' },
    { label: 'What needs attention?', prompt: 'What are my highest priority items right now?' },
    { label: 'EVI status', prompt: 'What is my current EVI score and what is driving it?' },
  ],
  pr: [
    { label: 'Draft a follow-up', prompt: 'Help me draft a follow-up for journalists who haven\'t replied.' },
    { label: 'Find journalists', prompt: 'Find journalists covering my target topics.' },
    { label: 'Explain coverage gap', prompt: 'Why do I have a coverage gap and how do I close it?' },
  ],
  content: [
    { label: 'Generate a brief', prompt: 'Generate a content brief for my highest-priority topic gap.' },
    { label: 'Improve CiteMind score', prompt: 'How can I improve the CiteMind score on my top content?' },
    { label: 'Find content gaps', prompt: 'What content gaps am I missing compared to competitors?' },
  ],
  seo: [
    { label: 'Explain EVI drop', prompt: 'Why did my EVI score drop and what should I do?' },
    { label: 'Find entity gaps', prompt: 'What entity gaps am I missing in my content?' },
    { label: 'Schema opportunities', prompt: 'Where are my biggest schema markup opportunities?' },
  ],
  analytics: [
    { label: 'Interpret this trend', prompt: 'Help me interpret the current trend in my analytics.' },
    { label: 'Compare to last period', prompt: 'How does this period compare to the previous one?' },
    { label: 'What drove EVI change?', prompt: 'What drove the change in my EVI score?' },
  ],
  calendar: [
    { label: "What's due this week?", prompt: 'What tasks and deadlines do I have this week?' },
    { label: 'Reschedule suggestions', prompt: 'Suggest a better schedule for my upcoming tasks.' },
    { label: 'Dependency conflicts', prompt: 'Are there any dependency conflicts in my calendar?' },
  ],
  default: [
    { label: 'What needs attention?', prompt: 'What are my highest priority items right now?' },
    { label: 'EVI status', prompt: 'What is my current EVI score?' },
    { label: 'Weekly summary', prompt: 'Give me a summary of this week\'s activity.' },
  ],
};

export function getChipsForPath(pathname: string): ContextChip[] {
  if (pathname.includes('/command-center')) return CONTEXT_CHIPS['command-center'];
  if (pathname.includes('/pr')) return CONTEXT_CHIPS['pr'];
  if (pathname.includes('/content')) return CONTEXT_CHIPS['content'];
  if (pathname.includes('/seo')) return CONTEXT_CHIPS['seo'];
  if (pathname.includes('/analytics')) return CONTEXT_CHIPS['analytics'];
  if (pathname.includes('/calendar')) return CONTEXT_CHIPS['calendar'];
  return CONTEXT_CHIPS['default'];
}
