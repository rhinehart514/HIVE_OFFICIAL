'use client';

/**
 * MemberSelector Element (Space Tier)
 *
 * Select members from a space for assignments or mentions.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState } from 'react';
import { UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface Member {
  id: string;
  name: string;
  photoURL?: string;
}

export function MemberSelectorElement({ config, data, onChange, context, onAction }: ElementProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const members: Member[] = data?.members || [];

  if (!context?.spaceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <UserPlusIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Member Selector requires space context</p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (memberId: string) => {
    const newSelected = selected.includes(memberId)
      ? selected.filter(id => id !== memberId)
      : config.allowMultiple
        ? [...selected, memberId]
        : [memberId];
    setSelected(newSelected);
    const selectedMemberData = members.filter(m => newSelected.includes(m.id));
    onChange?.({ selectedMembers: newSelected, members: selectedMemberData });
    onAction?.('select', { selectedMembers: newSelected, members: selectedMemberData, toggledId: memberId });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserPlusIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Select Members</span>
          {selected.length > 0 && (
            <Badge variant="default" className="ml-auto">{selected.length} selected</Badge>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {members.map((member) => {
            const isSelected = selected.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => handleToggle(member.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                  isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                {config.showAvatars && member.photoURL ? (
                  <img src={member.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">{member.name?.[0]}</span>
                  </div>
                )}
                <span className="text-sm flex-1 text-left">{member.name}</span>
                {isSelected && <CheckIcon className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
