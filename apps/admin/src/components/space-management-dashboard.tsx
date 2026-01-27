"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button as Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const Pencil = PencilIcon;
const AlertTriangle = ExclamationTriangleIcon;

interface Space {
  id: string;
  name: string;
  type: 'campus_living' | 'fraternity_and_sorority' | 'hive_exclusive' | 'student_organizations' | 'university_organizations';
  description: string;
  memberCount: number;
  status: 'dormant' | 'activated' | 'frozen';
  hasBuilders: boolean;
  createdAt: string;
  activatedAt?: string;
  surfaces: {
    pinned: boolean;
    posts: boolean;
    events: boolean;
    tools: boolean;
    chat: boolean;
    members: boolean;
  };
}

interface SpaceSearchResult {
  spaces: Space[];
  total: number;
  page: number;
  limit: number;
}

const PAGE_SIZE = 25;

interface SpaceEditForm {
  name: string;
  description: string;
  type: Space['type'];
  visibility: 'public' | 'private' | 'members_only';
  featured: boolean;
}

export function SpaceManagementDashboard() {
  const { admin } = useAdminAuth();
  const [spaces, setSpaces] = useState<SpaceSearchResult | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [editForm, setEditForm] = useState<SpaceEditForm>({
    name: '',
    description: '',
    type: 'student_organizations',
    visibility: 'public',
    featured: false,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    action: 'archive' | 'freeze' | 'transfer';
    spaceId: string;
    spaceName: string;
  } | null>(null);

  const spaceTypes = [
    { value: 'campus_living', label: 'Campus Living' },
    { value: 'fraternity_and_sorority', label: 'Greek Life' },
    { value: 'hive_exclusive', label: 'HIVE Exclusive' },
    { value: 'student_organizations', label: 'Student Orgs' },
    { value: 'university_organizations', label: 'University Orgs' },
  ];

  const searchSpaces = useCallback(async (page = currentPage) => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({
          action: 'search',
          query: searchTerm,
          type: selectedType !== 'all' ? selectedType : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search spaces');
      }

      const data = await response.json();
      setSpaces(data.spaces || { spaces: [], total: 0, page, limit: PAGE_SIZE });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [admin, searchTerm, selectedStatus, selectedType, currentPage]);

  const handleSpaceAction = async (action: string, spaceId: string) => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({
          action,
          spaceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} space`);
      }

      // Refresh search results
      await searchSpaces();
      
      if (selectedSpace?.id === spaceId) {
        setSelectedSpace(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const seedSpaces = async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spaces/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({
          universityId: 'buffalo',
          force: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to seed spaces');
      }

      // Refresh search results
      await searchSpaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (space: Space) => {
    setEditingSpace(space);
    setEditForm({
      name: space.name,
      description: space.description,
      type: space.type,
      visibility: 'public', // Default, could be pulled from space data if available
      featured: false, // Default, could be pulled from space data if available
    });
  };

  // Save space edits
  const saveSpaceEdit = async () => {
    if (!admin || !editingSpace) return;

    setEditSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/spaces/${editingSpace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          type: editForm.type,
          visibility: editForm.visibility,
          featured: editForm.featured,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update space');
      }

      // Optimistic update
      if (spaces) {
        setSpaces({
          ...spaces,
          spaces: spaces.spaces.map(s =>
            s.id === editingSpace.id
              ? { ...s, name: editForm.name, description: editForm.description, type: editForm.type }
              : s
          ),
        });
      }

      // Close modal
      setEditingSpace(null);

      // Refresh to get server state
      await searchSpaces(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // Handle destructive action with confirmation
  const executeConfirmedAction = async () => {
    if (!confirmAction || !admin) return;

    setLoading(true);
    try {
      await handleSpaceAction(confirmAction.action, confirmAction.spaceId);
    } finally {
      setConfirmAction(null);
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus]);

  useEffect(() => {
    searchSpaces(currentPage);
  }, [currentPage, searchSpaces]);

  const totalPages = spaces ? Math.ceil(spaces.total / PAGE_SIZE) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activated': return 'bg-green-500';
      case 'dormant': return 'bg-gray-500';
      case 'frozen': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campus_living': return 'text-blue-400';
      case 'fraternity_and_sorority': return 'text-purple-400';
      case 'hive_exclusive': return 'text-amber-400';
      case 'student_organizations': return 'text-green-400';
      case 'university_organizations': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="border-gray-700 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Space Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search spaces by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchSpaces(currentPage)}
                className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Button
                onClick={() => searchSpaces(currentPage)}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Types</option>
                {spaceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="activated">Activated</option>
                <option value="dormant">Dormant</option>
                <option value="frozen">Frozen</option>
              </select>

              <Button
                onClick={seedSpaces}
                disabled={loading}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/10"
              >
                Seed Spaces
              </Button>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Space Results */}
      {spaces && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">
              Spaces ({spaces.total} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spaces.spaces.map((space) => (
                <div
                  key={space.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(space.status)}`}></div>
                      <div>
                        <h3 className="font-semibold text-white">{space.name}</h3>
                        <p className="text-sm text-gray-400">{space.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`text-sm ${getTypeColor(space.type)}`}>
                            {spaceTypes.find(t => t.value === space.type)?.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {(space.memberCount || 0)} members
                          </span>
                          {space.hasBuilders && (
                            <Badge variant="secondary" className="text-xs">
                              Has Builders
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(space)}
                      className="border-amber-600 text-amber-400 hover:bg-amber-600/10"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSpace(space)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      View
                    </Button>
                    {space.status === 'activated' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSpaceAction('deactivate', space.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSpaceAction('activate', space.id)}
                        className="border-green-600 text-green-400 hover:bg-green-600/10"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
                  <span className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, spaces.total)} of {spaces.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Space Details Modal */}
      {selectedSpace && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Space Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSpace(null)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Name: </span>
                    <span className="text-white">{selectedSpace.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type: </span>
                    <span className={getTypeColor(selectedSpace.type)}>
                      {spaceTypes.find(t => t.value === selectedSpace.type)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <div className="inline-flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedSpace.status)}`}></div>
                      <span className="text-white capitalize">{selectedSpace.status}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Members: </span>
                    <span className="text-white">{(selectedSpace.memberCount || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Has Builders: </span>
                    <span className="text-white">{selectedSpace.hasBuilders ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Surface Status</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(selectedSpace.surfaces).map(([surface, enabled]) => (
                    <div key={surface} className="flex justify-between">
                      <span className="text-gray-400 capitalize">{surface}: </span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className="text-white">{enabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="font-semibold text-white mb-3">Admin Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedSpace)}
                  className="border-amber-600 text-amber-400 hover:bg-amber-600/10"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit Space
                </Button>
                {selectedSpace.status === 'activated' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpaceAction('deactivate', selectedSpace.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    Deactivate Space
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpaceAction('activate', selectedSpace.id)}
                    className="border-green-600 text-green-400 hover:bg-green-600/10"
                  >
                    Activate Space
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction({ action: 'freeze', spaceId: selectedSpace.id, spaceName: selectedSpace.name })}
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                >
                  Freeze Space
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction({ action: 'archive', spaceId: selectedSpace.id, spaceName: selectedSpace.name })}
                  className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
                >
                  Archive Space
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Space Modal */}
      <Dialog open={!!editingSpace} onOpenChange={() => setEditingSpace(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update space details and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Space name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                placeholder="Space description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Category</label>
              <Select
                value={editForm.type}
                onValueChange={(value: Space['type']) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {spaceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Visibility</label>
              <Select
                value={editForm.visibility}
                onValueChange={(value: 'public' | 'private' | 'members_only') =>
                  setEditForm({ ...editForm, visibility: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="public" className="text-white">Public</SelectItem>
                  <SelectItem value="private" className="text-white">Private</SelectItem>
                  <SelectItem value="members_only" className="text-white">Members Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm font-medium text-gray-300">Featured Space</label>
                <p className="text-xs text-gray-500">Show in featured section on browse page</p>
              </div>
              <Switch
                checked={editForm.featured}
                onCheckedChange={(checked) => setEditForm({ ...editForm, featured: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingSpace(null)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSpaceEdit}
              disabled={editSaving || !editForm.name.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {confirmAction?.action === 'archive' && (
                <>
                  Are you sure you want to archive <strong className="text-white">{confirmAction.spaceName}</strong>?
                  This will hide the space from all users.
                </>
              )}
              {confirmAction?.action === 'freeze' && (
                <>
                  Are you sure you want to freeze <strong className="text-white">{confirmAction.spaceName}</strong>?
                  Users will not be able to post or interact until unfrozen.
                </>
              )}
              {confirmAction?.action === 'transfer' && (
                <>
                  Are you sure you want to transfer ownership of <strong className="text-white">{confirmAction.spaceName}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={executeConfirmedAction}
              disabled={loading}
              className={
                confirmAction?.action === 'archive'
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : confirmAction?.action === 'freeze'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {loading ? 'Processing...' : `Yes, ${confirmAction?.action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
