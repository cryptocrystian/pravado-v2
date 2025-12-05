/**
 * PersonaComparisonDrawer Component (Sprint S51.2)
 * Side-by-side persona comparison with merge functionality
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PersonaComparisonResult, AudiencePersonaTrait } from '@pravado/types';
import {
  formatPersonaName,
  getPersonaTypeLabel,
  getTraitCategoryLabel,
} from '@/lib/personaApi';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  GitMerge,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface PersonaComparisonDrawerProps {
  comparison: PersonaComparisonResult | null;
  isOpen: boolean;
  onClose: () => void;
  onMerge?: (sourceId: string, targetId: string) => Promise<void>;
}

export function PersonaComparisonDrawer({
  comparison,
  isOpen,
  onClose,
  onMerge,
}: PersonaComparisonDrawerProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeDirection, setMergeDirection] = useState<'1to2' | '2to1'>('1to2');

  if (!comparison) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Persona Comparison</SheetTitle>
            <SheetDescription>No comparison data available</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const { persona1, persona2, similarityScore, scoreDifferences, commonTraits, uniqueTraits1, uniqueTraits2, mergeRecommendation, mergeSuggestion } = comparison;

  const handleMerge = async () => {
    if (!onMerge) return;

    const sourceId = mergeDirection === '1to2' ? persona1.id : persona2.id;
    const targetId = mergeDirection === '1to2' ? persona2.id : persona1.id;

    setIsMerging(true);
    try {
      await onMerge(sourceId, targetId);
      onClose();
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsMerging(false);
    }
  };

  const similarityColor =
    similarityScore >= 80 ? 'text-red-600' : similarityScore >= 60 ? 'text-yellow-600' : 'text-green-600';

  const similarityBg =
    similarityScore >= 80 ? 'bg-red-100' : similarityScore >= 60 ? 'bg-yellow-100' : 'bg-blue-100';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Persona Comparison</SheetTitle>
          <SheetDescription>
            Analyzing similarities and differences between two personas
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Similarity Score */}
          <Card className={cn('border-2', similarityBg)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Similarity Score</div>
                  <div className={cn('text-4xl font-bold', similarityColor)}>
                    {similarityScore.toFixed(1)}%
                  </div>
                </div>
                {mergeRecommendation && (
                  <Badge variant="default" className="bg-orange-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Merge Recommended
                  </Badge>
                )}
              </div>
              {mergeSuggestion && (
                <p className="text-sm text-gray-700 mt-3">{mergeSuggestion}</p>
              )}
            </CardContent>
          </Card>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Persona 1 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{formatPersonaName(persona1)}</h3>
                  <Badge variant="outline" className="text-xs">
                    {getPersonaTypeLabel(persona1.personaType)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {persona1.description && (
                  <p className="text-sm text-gray-600">{persona1.description}</p>
                )}
                <div className="space-y-1 text-xs">
                  {persona1.role && (
                    <div>
                      <span className="text-gray-500">Role:</span> {persona1.role}
                    </div>
                  )}
                  {persona1.industry && (
                    <div>
                      <span className="text-gray-500">Industry:</span> {persona1.industry}
                    </div>
                  )}
                  {persona1.seniorityLevel && (
                    <div>
                      <span className="text-gray-500">Seniority:</span> {persona1.seniorityLevel}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Persona 2 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-base">{formatPersonaName(persona2)}</h3>
                  <Badge variant="outline" className="text-xs">
                    {getPersonaTypeLabel(persona2.personaType)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {persona2.description && (
                  <p className="text-sm text-gray-600">{persona2.description}</p>
                )}
                <div className="space-y-1 text-xs">
                  {persona2.role && (
                    <div>
                      <span className="text-gray-500">Role:</span> {persona2.role}
                    </div>
                  )}
                  {persona2.industry && (
                    <div>
                      <span className="text-gray-500">Industry:</span> {persona2.industry}
                    </div>
                  )}
                  {persona2.seniorityLevel && (
                    <div>
                      <span className="text-gray-500">Seniority:</span> {persona2.seniorityLevel}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score Differences */}
          <Card>
            <CardHeader>
              <h4 className="font-semibold text-sm">Score Comparison</h4>
            </CardHeader>
            <CardContent className="space-y-2">
              {scoreDifferences && Object.entries(scoreDifferences).map(([key, diff]) => {
                const isPositive = diff > 0;
                const Icon = isPositive ? TrendingUp : TrendingDown;
                const color = isPositive ? 'text-green-600' : 'text-red-600';

                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-medium', color)}>
                        {isPositive ? '+' : ''}
                        {diff.toFixed(1)}
                      </span>
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Common Traits */}
          {commonTraits && commonTraits.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Common Traits</h4>
                  <Badge variant="secondary" className="text-xs">
                    {commonTraits.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commonTraits.map((trait: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{trait.traitName}</span>
                        <Badge variant="outline" className="text-xs">
                          {getTraitCategoryLabel(trait.traitCategory)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{(trait.strength1 * 100).toFixed(0)}%</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{(trait.strength2 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unique Traits */}
          <div className="grid grid-cols-2 gap-4">
            {/* Unique to Persona 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Unique to {persona1.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {uniqueTraits1?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {uniqueTraits1 && uniqueTraits1.length > 0 ? (
                  <div className="space-y-1">
                    {uniqueTraits1.slice(0, 5).map((trait: AudiencePersonaTrait) => (
                      <div
                        key={trait.id}
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm"
                      >
                        <span className="font-medium">{trait.traitName}</span>
                        <Badge variant="outline" className="text-xs">
                          {(trait.traitStrength * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                    {uniqueTraits1.length > 5 && (
                      <p className="text-xs text-gray-500 pt-2">
                        +{uniqueTraits1.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No unique traits</p>
                )}
              </CardContent>
            </Card>

            {/* Unique to Persona 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Unique to {persona2.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {uniqueTraits2?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {uniqueTraits2 && uniqueTraits2.length > 0 ? (
                  <div className="space-y-1">
                    {uniqueTraits2.slice(0, 5).map((trait: AudiencePersonaTrait) => (
                      <div
                        key={trait.id}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded text-sm"
                      >
                        <span className="font-medium">{trait.traitName}</span>
                        <Badge variant="outline" className="text-xs">
                          {(trait.traitStrength * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                    {uniqueTraits2.length > 5 && (
                      <p className="text-xs text-gray-500 pt-2">
                        +{uniqueTraits2.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No unique traits</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Merge Action */}
          {mergeRecommendation && onMerge && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <GitMerge className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Merge These Personas?</h4>
                    <p className="text-xs text-gray-700 mb-3">
                      These personas are very similar. Merging will combine their traits and insights
                      while archiving the source persona.
                    </p>

                    {/* Merge Direction */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Merge Direction:</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMergeDirection('1to2')}
                          className={cn(
                            'flex-1 p-2 rounded border text-xs transition-colors',
                            mergeDirection === '1to2'
                              ? 'bg-orange-100 border-orange-300 text-orange-900'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{persona1.name}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-medium">{persona2.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Keep {persona2.name}, archive {persona1.name}
                          </div>
                        </button>
                        <button
                          onClick={() => setMergeDirection('2to1')}
                          className={cn(
                            'flex-1 p-2 rounded border text-xs transition-colors',
                            mergeDirection === '2to1'
                              ? 'bg-orange-100 border-orange-300 text-orange-900'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{persona2.name}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-medium">{persona1.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Keep {persona1.name}, archive {persona2.name}
                          </div>
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={handleMerge}
                      disabled={isMerging}
                      className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                      size="sm"
                    >
                      <GitMerge className="h-4 w-4 mr-2" />
                      {isMerging ? 'Merging...' : 'Merge Personas'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
