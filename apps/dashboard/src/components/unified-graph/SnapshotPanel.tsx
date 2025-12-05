/**
 * Snapshot Panel Component (Sprint S66)
 * Manage graph snapshots
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  IntelligenceGraphSnapshot,
  GraphSnapshotStatus,
  getSnapshotStatusLabel,
  getSnapshotStatusColor,
  formatNodeCount,
  listSnapshots,
  createSnapshot,
  regenerateSnapshot,
} from '@/lib/unifiedGraphApi';
import {
  Camera,
  Plus,
  RefreshCw,
  Clock,
  CircleDot,
  GitBranch,
  Loader2,
  MoreVertical,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SnapshotPanelProps {
  onSelect?: (snapshot: IntelligenceGraphSnapshot) => void;
}

export function SnapshotPanel({ onSelect }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<IntelligenceGraphSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');

  const fetchSnapshots = async () => {
    try {
      const result = await listSnapshots({ limit: 20 });
      setSnapshots(result.snapshots);
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCreate = async () => {
    if (!newSnapshotName.trim()) return;

    setIsCreating(true);
    try {
      await createSnapshot({
        name: newSnapshotName,
        description: newSnapshotDescription || undefined,
        snapshotType: 'full',
        computeDiff: true,
      });
      setShowCreateDialog(false);
      setNewSnapshotName('');
      setNewSnapshotDescription('');
      fetchSnapshots();
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = async (snapshotId: string) => {
    try {
      await regenerateSnapshot(snapshotId);
      fetchSnapshots();
    } catch (error) {
      console.error('Failed to regenerate snapshot:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Graph Snapshots
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Snapshot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Graph Snapshot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder="e.g., Weekly Backup - Dec 1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newSnapshotDescription}
                    onChange={(e) => setNewSnapshotDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !newSnapshotName.trim()}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Snapshot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No snapshots yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a snapshot to capture the current graph state
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{snapshot.name}</span>
                    <Badge className={getSnapshotStatusColor(snapshot.status)}>
                      {snapshot.status === GraphSnapshotStatus.GENERATING && (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      )}
                      {getSnapshotStatusLabel(snapshot.status)}
                    </Badge>
                  </div>
                  {snapshot.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {snapshot.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </span>
                    {snapshot.nodeCount != null && (
                      <span className="flex items-center gap-1">
                        <CircleDot className="h-3 w-3" />
                        {formatNodeCount(snapshot.nodeCount ?? 0)} nodes
                      </span>
                    )}
                    {snapshot.edgeCount != null && (
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {formatNodeCount(snapshot.edgeCount ?? 0)} edges
                      </span>
                    )}
                  </div>
                  {snapshot.diffJson && (
                    <div className="flex items-center gap-2 mt-2">
                      {snapshot.diffJson.nodesAdded > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          +{snapshot.diffJson.nodesAdded} nodes
                        </Badge>
                      )}
                      {snapshot.diffJson.nodesRemoved > 0 && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          -{snapshot.diffJson.nodesRemoved} nodes
                        </Badge>
                      )}
                      {snapshot.diffJson.edgesAdded > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          +{snapshot.diffJson.edgesAdded} edges
                        </Badge>
                      )}
                      {snapshot.diffJson.edgesRemoved > 0 && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          -{snapshot.diffJson.edgesRemoved} edges
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelect?.(snapshot)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {snapshot.status !== GraphSnapshotStatus.GENERATING && (
                      <DropdownMenuItem onClick={() => handleRegenerate(snapshot.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
