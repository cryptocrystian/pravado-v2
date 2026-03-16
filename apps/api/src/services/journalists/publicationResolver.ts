/**
 * Publication Domain Resolver (Sprint S-INT-06)
 *
 * Maps publication names to domains for Hunter.io lookups.
 */

const KNOWN_PUBLICATIONS: Record<string, string> = {
  'TechCrunch': 'techcrunch.com',
  'Forbes': 'forbes.com',
  'Wired': 'wired.com',
  'The Verge': 'theverge.com',
  'Bloomberg': 'bloomberg.com',
  'Reuters': 'reuters.com',
  'VentureBeat': 'venturebeat.com',
  'Fast Company': 'fastcompany.com',
  'MIT Technology Review': 'technologyreview.com',
  'Axios': 'axios.com',
  'The Information': 'theinformation.com',
  'Protocol': 'protocol.com',
  'Business Insider': 'businessinsider.com',
  'CNBC': 'cnbc.com',
  'The Wall Street Journal': 'wsj.com',
  'The New York Times': 'nytimes.com',
  'Washington Post': 'washingtonpost.com',
  'Ars Technica': 'arstechnica.com',
  'Engadget': 'engadget.com',
  'Mashable': 'mashable.com',
  'TechRepublic': 'techrepublic.com',
  'ZDNet': 'zdnet.com',
  'Inc.': 'inc.com',
  'Entrepreneur': 'entrepreneur.com',
  'Harvard Business Review': 'hbr.org',
  'AdWeek': 'adweek.com',
  'Marketing Week': 'marketingweek.com',
  'PR Week': 'prweek.com',
  'The Drum': 'thedrum.com',
  'Digiday': 'digiday.com',
  'Search Engine Journal': 'searchenginejournal.com',
  'Search Engine Land': 'searchengineland.com',
  'Moz': 'moz.com',
};

/**
 * Industry-to-publications mapping for journalist discovery.
 */
export const INDUSTRY_PUBLICATIONS: Record<string, string[]> = {
  'technology': [
    'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
    'venturebeat.com', 'zdnet.com', 'engadget.com', 'technologyreview.com',
    'mashable.com', 'protocol.com',
  ],
  'business': [
    'forbes.com', 'bloomberg.com', 'cnbc.com', 'wsj.com',
    'businessinsider.com', 'inc.com', 'entrepreneur.com', 'fastcompany.com',
    'hbr.org', 'axios.com',
  ],
  'marketing': [
    'adweek.com', 'marketingweek.com', 'thedrum.com', 'digiday.com',
    'prweek.com', 'searchenginejournal.com', 'searchengineland.com', 'moz.com',
    'contentmarketinginstitute.com', 'hubspot.com',
  ],
  'finance': [
    'bloomberg.com', 'reuters.com', 'cnbc.com', 'wsj.com',
    'ft.com', 'marketwatch.com', 'barrons.com', 'investopedia.com',
    'thestreet.com', 'fortune.com',
  ],
  'healthcare': [
    'statnews.com', 'fiercehealthcare.com', 'healthcareitnews.com',
    'modernhealthcare.com', 'beckershospitalreview.com', 'medscape.com',
    'healthline.com', 'webmd.com', 'medcitynews.com', 'mobihealthnews.com',
  ],
  'saas': [
    'techcrunch.com', 'venturebeat.com', 'saastr.com', 'g2.com',
    'producthunt.com', 'betakit.com', 'eu-startups.com', 'techinasia.com',
    'businessinsider.com', 'fastcompany.com',
  ],
  'ai': [
    'techcrunch.com', 'technologyreview.com', 'wired.com', 'theverge.com',
    'venturebeat.com', 'arxiv.org', 'towardsdatascience.com', 'deepmind.com',
    'openai.com', 'huggingface.co',
  ],
  'ecommerce': [
    'digitalcommerce360.com', 'retaildive.com', 'ecommercetimes.com',
    'practicalcommerce.com', 'shopify.com', 'bigcommerce.com',
    'forbes.com', 'businessinsider.com', 'techcrunch.com', 'fastcompany.com',
  ],
};

/**
 * Resolve a publication name to its domain.
 * Returns { domain, verified } — verified=true if from known map.
 */
export function resolvePublicationDomain(publication: string): { domain: string; verified: boolean } | null {
  if (!publication) return null;

  // Check exact match (case-insensitive)
  for (const [name, domain] of Object.entries(KNOWN_PUBLICATIONS)) {
    if (name.toLowerCase() === publication.toLowerCase()) {
      return { domain, verified: true };
    }
  }

  // Check if input already looks like a domain
  if (publication.includes('.')) {
    return { domain: publication.toLowerCase().trim(), verified: false };
  }

  // Derive domain: lowercase, remove spaces, append .com
  const derived = publication
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (derived.length < 3) return null;

  return { domain: `${derived}.com`, verified: false };
}

/**
 * Get relevant publication domains for given industries.
 */
export function getPublicationsForIndustries(industries: string[]): string[] {
  const domains = new Set<string>();
  for (const industry of industries) {
    const key = industry.toLowerCase();
    const pubs = INDUSTRY_PUBLICATIONS[key];
    if (pubs) {
      pubs.forEach((d) => domains.add(d));
    }
  }
  return Array.from(domains);
}
