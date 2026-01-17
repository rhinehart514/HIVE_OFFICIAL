'use client';

/**
 * HiveLab IDE Demo - Direct access to visual canvas
 *
 * Shows the Make.com-style IDE without needing to create a tool first.
 */

import { HiveLabIDE } from '@hive/ui';

export default function HiveLabDemoPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <HiveLabIDE
        initialComposition={{
          id: 'demo-tool',
          name: 'Demo Tool',
          description: 'Visual IDE Demo',
          elements: [],
          connections: [],
        }}
        onSave={async (composition) => {
          console.log('Save:', composition);
        }}
        onPreview={() => {
          console.log('Preview');
        }}
        onCancel={() => {
          console.log('Cancel');
        }}
        userId="demo-user"
        userContext={{
          userId: 'demo-user',
          campusId: 'ub-buffalo',
          isSpaceLeader: true,
          leadingSpaceIds: ['demo-space'],
        }}
      />
    </div>
  );
}
