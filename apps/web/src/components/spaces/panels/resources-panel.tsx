/**
 * Resources Panel - Full Implementation
 * File sharing, links, documents with filtering and management
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  Text,
  Badge,
  Skeleton,
  EmptyState,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@hive/ui/design-system/primitives';
import {
  DocumentTextIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { MapPinIcon as PinSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@hive/auth-logic';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'link' | 'file' | 'document' | 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isPinned: boolean;
  category?: string;
  tags?: string[];
  createdBy: string;
  createdByName: string;
  createdByHandle: string;
  createdByAvatar?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  downloadCount: number;
}

export interface ResourcesPanelProps {
  spaceId: string;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member';
}

const TYPE_ICONS: Record<Resource['type'], React.ComponentType<{ className?: string }>> = {
  link: LinkIcon,
  file: FolderIcon,
  document: DocumentTextIcon,
  image: PhotoIcon,
  video: VideoCameraIcon,
};

const TYPE_LABELS: Record<Resource['type'], string> = {
  link: 'Link',
  file: 'File',
  document: 'Document',
  image: 'Image',
  video: 'Video',
};

const TYPE_COLORS: Record<Resource['type'], string> = {
  link: 'bg-blue-500/20 text-blue-400',
  file: 'bg-purple-500/20 text-purple-400',
  document: 'bg-amber-500/20 text-amber-400',
  image: 'bg-emerald-500/20 text-emerald-400',
  video: 'bg-rose-500/20 text-rose-400',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const ResourcesPanel = ({ spaceId, userRole = 'member' }: ResourcesPanelProps) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<Resource['type'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link' as Resource['type'],
    url: '',
    category: '',
    tags: [] as string[],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = ['owner', 'admin', 'moderator'].includes(userRole);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await fetch(`/api/spaces/${spaceId}/resources?${params}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch resources');
      }

      setResources(data.resources || []);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [spaceId, typeFilter, categoryFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Filter resources by search
  const filteredResources = resources.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.tags?.some((t) => t.toLowerCase().includes(query))
    );
  });

  // Separate pinned and unpinned
  const pinnedResources = filteredResources.filter((r) => r.isPinned);
  const unpinnedResources = filteredResources.filter((r) => !r.isPinned);

  // Create resource
  const handleCreate = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch(`/api/spaces/${spaceId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          category: formData.category || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create resource');
      }

      // Add to list and close modal
      setResources((prev) => [data.resource, ...prev]);
      setAddModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create resource');
    } finally {
      setFormLoading(false);
    }
  };

  // Update resource
  const handleUpdate = async () => {
    if (!selectedResource) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch(`/api/spaces/${spaceId}/resources/${selectedResource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          url: formData.url,
          category: formData.category || undefined,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update resource');
      }

      // Update in list
      setResources((prev) =>
        prev.map((r) => (r.id === selectedResource.id ? data.resource : r))
      );
      setEditModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update resource');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete resource
  const handleDelete = async () => {
    if (!selectedResource) return;

    try {
      setFormLoading(true);

      const res = await fetch(`/api/spaces/${spaceId}/resources/${selectedResource.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete resource');
      }

      // Remove from list
      setResources((prev) => prev.filter((r) => r.id !== selectedResource.id));
      setDeleteModalOpen(false);
      setSelectedResource(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle pin
  const handleTogglePin = async (resource: Resource) => {
    if (!canManage) return;

    try {
      const res = await fetch(`/api/spaces/${spaceId}/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !resource.isPinned }),
      });

      const data = await res.json();

      if (data.success) {
        setResources((prev) =>
          prev.map((r) =>
            r.id === resource.id ? { ...r, isPinned: !r.isPinned } : r
          )
        );
      }
    } catch {
      // Silently fail pin toggle
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'link',
      url: '',
      category: '',
      tags: [],
    });
    setFormError(null);
    setSelectedResource(null);
  };

  const openEditModal = (resource: Resource) => {
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url,
      category: resource.category || '',
      tags: resource.tags || [],
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (resource: Resource) => {
    setSelectedResource(resource);
    setDeleteModalOpen(true);
  };

  const canEditResource = (resource: Resource) => {
    return canManage || resource.createdBy === user?.uid;
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<FolderIcon className="h-12 w-12" />}
          title="Failed to load resources"
          description={error}
          actionLabel="Try Again"
          onAction={fetchResources}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Resources</h2>
          <Text className="text-white/60">
            {resources.length} resource{resources.length !== 1 ? 's' : ''} shared
          </Text>
        </div>
        <Button
          variant="cta"
          onClick={() => setAddModalOpen(true)}
          className="gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type filter tabs */}
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as Resource['type'] | 'all')}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
            <TabsTrigger value="document">Docs</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category filter */}
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <FunnelIcon className="h-4 w-4 mr-2 text-white/40" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Pinned Resources */}
      {pinnedResources.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PinSolidIcon className="h-4 w-4 text-amber-400" />
            <Text className="font-medium text-white/80">Pinned</Text>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                canEdit={canEditResource(resource)}
                canPin={canManage}
                onEdit={() => openEditModal(resource)}
                onDelete={() => openDeleteModal(resource)}
                onTogglePin={() => handleTogglePin(resource)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      {unpinnedResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unpinnedResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              canEdit={canEditResource(resource)}
              canPin={canManage}
              onEdit={() => openEditModal(resource)}
              onDelete={() => openDeleteModal(resource)}
              onTogglePin={() => handleTogglePin(resource)}
            />
          ))}
        </div>
      ) : pinnedResources.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="h-12 w-12" />}
          title="No resources yet"
          description="Share links, files, and documents with your space members"
          actionLabel="Add First Resource"
          onAction={() => setAddModalOpen(true)}
        />
      ) : null}

      {/* Add Resource Modal */}
      <Modal open={addModalOpen} onOpenChange={setAddModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add Resource</ModalTitle>
            <ModalDescription>
              Share a link or file with your space
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Type</label>
                <div className="flex gap-2">
                  {(['link', 'document', 'image', 'video'] as const).map((type) => {
                    const Icon = TYPE_ICONS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setFormData((prev) => ({ ...prev, type }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          formData.type === type
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{TYPE_LABELS[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Title</label>
                <Input
                  placeholder="Resource title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              {/* URL */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">URL</label>
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Brief description of this resource"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Category (optional)
                </label>
                <Input
                  placeholder="e.g., Study Materials, Meeting Notes"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Text className="text-red-400 text-sm">{formError}</Text>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="cta"
              onClick={handleCreate}
              disabled={!formData.title || !formData.url || formLoading}
            >
              {formLoading ? 'Adding...' : 'Add Resource'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal open={editModalOpen} onOpenChange={setEditModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Resource</ModalTitle>
            <ModalDescription>Update resource details</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Title</label>
                <Input
                  placeholder="Resource title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              {/* URL */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">URL</label>
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Brief description of this resource"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Category (optional)
                </label>
                <Input
                  placeholder="e.g., Study Materials, Meeting Notes"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Text className="text-red-400 text-sm">{formError}</Text>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="cta"
              onClick={handleUpdate}
              disabled={!formData.title || !formData.url || formLoading}
            >
              {formLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent variant="alert">
          <ModalHeader>
            <ModalTitle>Delete Resource</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete "{selectedResource?.title}"? This
              action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedResource(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

// Resource Card Component
interface ResourceCardProps {
  resource: Resource;
  canEdit: boolean;
  canPin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function ResourceCard({
  resource,
  canEdit,
  canPin,
  onEdit,
  onDelete,
  onTogglePin,
}: ResourceCardProps) {
  const Icon = TYPE_ICONS[resource.type];

  return (
    <Card
      interactive
      warmth="low"
      className="group relative overflow-hidden"
    >
      {/* Pin indicator */}
      {resource.isPinned && (
        <div className="absolute top-3 right-3 z-10">
          <PinSolidIcon className="h-4 w-4 text-amber-400" />
        </div>
      )}

      {/* Thumbnail or Icon */}
      {resource.thumbnailUrl ? (
        <div className="h-32 bg-white/5 overflow-hidden">
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 bg-white/5 flex items-center justify-center">
          <div className={`p-4 rounded-xl ${TYPE_COLORS[resource.type]}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type badge */}
        <Badge variant="secondary" className="mb-2 text-xs">
          {TYPE_LABELS[resource.type]}
        </Badge>

        {/* Title */}
        <h3 className="font-medium text-white line-clamp-1 mb-1">
          {resource.title}
        </h3>

        {/* Description */}
        {resource.description && (
          <Text className="text-white/60 text-sm line-clamp-2 mb-3">
            {resource.description}
          </Text>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <EyeIcon className="h-3 w-3" />
              {resource.viewCount}
            </span>
            {resource.fileSize && (
              <span>{formatFileSize(resource.fileSize)}</span>
            )}
          </div>
          <span>{formatRelativeTime(resource.createdAt)}</span>
        </div>

        {/* Category tag */}
        {resource.category && (
          <div className="mt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
              {resource.category}
            </span>
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Open link */}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-white" />
        </a>

        {/* Pin/Unpin */}
        {canPin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onTogglePin();
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {resource.isPinned ? (
              <PinSolidIcon className="h-5 w-5 text-amber-400" />
            ) : (
              <PinIcon className="h-5 w-5 text-white" />
            )}
          </button>
        )}

        {/* Edit */}
        {canEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <PencilIcon className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Delete */}
        {canEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 transition-colors"
          >
            <TrashIcon className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
    </Card>
  );
}

// Fix PinIcon import - it doesn't exist, use a custom one
function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l8.5 8.5M3 3v4m0-4h4m11 14l-8.5-8.5M21 21v-4m0 4h-4M12 12l-4-4m4 4l4 4"
      />
    </svg>
  );
}

export default ResourcesPanel;
