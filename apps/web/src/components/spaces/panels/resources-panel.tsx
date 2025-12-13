/**
 * Resources Panel - Coming Soon
 * Planned features: File sharing, links, documents, pinned resources
 */

'use client';

import React from 'react';
import { Card } from '@hive/ui';
import { FileText, Link2, FolderOpen, Clock } from 'lucide-react';

export interface ResourcesPanelProps {
  spaceId: string;
}

export const ResourcesPanel = ({ spaceId: _spaceId }: ResourcesPanelProps) => {
  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-muted/50 p-4">
          <FolderOpen className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Resources Coming Soon</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Share files, links, and important documents with your space members.
        This feature is currently in development.
      </p>

      {/* Preview of planned features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Documents</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
          <Link2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Links</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">History</span>
        </div>
      </div>
    </Card>
  );
};

export default ResourcesPanel;
