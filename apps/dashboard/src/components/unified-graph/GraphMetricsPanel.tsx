/**
 * Graph Metrics Panel Component (Sprint S66)
 * Displays graph analytics and metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  GraphMetrics,
  formatNodeCount,
  formatCentrality,
} from '@/lib/unifiedGraphApi';
import {
  CircleDot,
  GitBranch,
  Layers,
  TrendingUp,
  Network,
  BarChart3,
} from 'lucide-react';

interface GraphMetricsPanelProps {
  metrics: GraphMetrics;
  isLoading?: boolean;
}

export function GraphMetricsPanel({ metrics, isLoading }: GraphMetricsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Graph Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricCards = [
    {
      icon: CircleDot,
      label: 'Total Nodes',
      value: formatNodeCount(metrics.totalNodes),
      subvalue: `${metrics.activeNodes} active`,
      color: 'text-blue-600',
    },
    {
      icon: GitBranch,
      label: 'Total Edges',
      value: formatNodeCount(metrics.totalEdges),
      subvalue: `${metrics.activeEdges} active`,
      color: 'text-green-600',
    },
    {
      icon: Layers,
      label: 'Clusters',
      value: String(metrics.clusterCount || 0),
      subvalue: 'Identified groups',
      color: 'text-purple-600',
    },
    {
      icon: Network,
      label: 'Graph Density',
      value: metrics.density ? `${(metrics.density * 100).toFixed(2)}%` : 'N/A',
      subvalue: 'Connection density',
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Graph Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.subvalue}</p>
            </div>
          ))}
        </div>

        {/* Average Degree */}
        {metrics.avgDegree !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Average Degree</span>
              <span className="text-sm">{metrics.avgDegree.toFixed(2)}</span>
            </div>
            <Progress value={Math.min((metrics.avgDegree / 10) * 100, 100)} />
          </div>
        )}

        {/* Top Nodes by PageRank */}
        {metrics.topNodesByPagerank && metrics.topNodesByPagerank.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Nodes by Importance
            </h4>
            <div className="space-y-2">
              {metrics.topNodesByPagerank.slice(0, 5).map((node, index) => (
                <div key={node.nodeId} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                  <span className="flex-1 truncate text-sm">{node.label}</span>
                  <span className="text-xs font-medium">
                    {formatCentrality(node.pagerank)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node Distribution */}
        {Object.keys(metrics.nodesByType).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Node Distribution</h4>
            <div className="space-y-2">
              {Object.entries(metrics.nodesByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="flex-1 text-sm truncate">{type}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                    <div className="w-16">
                      <Progress
                        value={(count / metrics.totalNodes) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Edge Distribution */}
        {Object.keys(metrics.edgesByType).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Edge Distribution</h4>
            <div className="space-y-2">
              {Object.entries(metrics.edgesByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="flex-1 text-sm truncate">{type}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                    <div className="w-16">
                      <Progress
                        value={(count / metrics.totalEdges) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Last Computed */}
        {metrics.computedAt && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last computed: {new Date(metrics.computedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
