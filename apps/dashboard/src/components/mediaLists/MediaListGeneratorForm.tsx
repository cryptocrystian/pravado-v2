/**
 * Media List Generator Form Component (Sprint S47)
 * Form for generating AI-powered media lists
 */

'use client';

import { useState } from 'react';
import type { MediaListGenerationInput } from '@pravado/types';

interface MediaListGeneratorFormProps {
  onGenerate: (input: MediaListGenerationInput) => void;
  isGenerating?: boolean;
}

export function MediaListGeneratorForm({ onGenerate, isGenerating = false }: MediaListGeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [market, setMarket] = useState('');
  const [geography, setGeography] = useState('');
  const [product, setProduct] = useState('');
  const [targetCount, setTargetCount] = useState('50');
  const [minFitScore, setMinFitScore] = useState('0.3');
  const [includeTiers, setIncludeTiers] = useState({
    A: true,
    B: true,
    C: true,
    D: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTiers = Object.entries(includeTiers)
      .filter(([_, selected]) => selected)
      .map(([tier]) => tier as 'A' | 'B' | 'C' | 'D');

    const input: MediaListGenerationInput = {
      topic: topic.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
      market: market.trim() || undefined,
      geography: geography.trim() || undefined,
      product: product.trim() || undefined,
      targetCount: parseInt(targetCount, 10),
      minFitScore: parseFloat(minFitScore),
      includeTiers: selectedTiers,
    };

    onGenerate(input);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Generate AI Media List
      </h2>

      <div className="space-y-4">
        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., AI in healthcare, sustainable fashion"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Main topic or subject matter for journalist targeting
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
            Keywords
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="machine learning, healthcare AI, diagnosis (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Comma-separated keywords to match in journalist profiles
          </p>
        </div>

        {/* Market & Geography Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-1">
              Market
            </label>
            <input
              type="text"
              id="market"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="e.g., B2B SaaS, Consumer Tech"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="geography" className="block text-sm font-medium text-gray-700 mb-1">
              Geography
            </label>
            <input
              type="text"
              id="geography"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g., North America, Global"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Product */}
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            Product/Company
          </label>
          <input
            type="text"
            id="product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g., Your product or company name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Target Count & Min Fit Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Count
            </label>
            <input
              type="number"
              id="targetCount"
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
              min="1"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum number of journalists (1-200)</p>
          </div>

          <div>
            <label htmlFor="minFitScore" className="block text-sm font-medium text-gray-700 mb-1">
              Min Fit Score
            </label>
            <input
              type="number"
              id="minFitScore"
              value={minFitScore}
              onChange={(e) => setMinFitScore(e.target.value)}
              min="0"
              max="1"
              step="0.05"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum fit score threshold (0-1)</p>
          </div>
        </div>

        {/* Include Tiers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Include Tiers
          </label>
          <div className="flex gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((tier) => (
              <label key={tier} className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeTiers[tier]}
                  onChange={(e) => setIncludeTiers({ ...includeTiers, [tier]: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{tier}-Tier</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Select which journalist tiers to include in results
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Media List'}
        </button>
      </div>
    </form>
  );
}
