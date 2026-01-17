"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Search = MagnifyingGlassIcon;
const Filter = FunnelIcon;
const Download = ArrowDownTrayIcon;
const UserCog = Cog6ToothIcon;
const Ban = NoSymbolIcon;
const CheckCircle = CheckCircleIcon;
const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const X = XMarkIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Shield = ShieldCheckIcon;
const Clock = ClockIcon;
const Users = UsersIcon;
const Wrench = WrenchIcon;
import { Sparkline } from "./charts";

interface User {
  id: string;
  displayName: string;
  email?: string;
  handle: string;
  role: "user" | "builder" | "admin" | "super_admin";
  status: "active" | "suspended" | "pending" | "deleted";
  onboardingCompleted: boolean;
  createdAt: string;
  lastActive: string;
  spaceCount: number;
  toolCount?: number;
  avatar?: string;
}

interface UserListResponse {
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type RoleFilter = "all" | "user" | "builder" | "admin" | "super_admin";
type StatusFilter = "all" | "active" | "suspended" | "pending";
type SortField = "createdAt" | "lastActive" | "displayName";
type SortOrder = "asc" | "desc";

export function UserManagementDashboard() {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Detail panel state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<Record<string, unknown> | null>(null);

  // Bulk action state
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("limit", String(pagination.limit));
      params.set("offset", String(reset ? 0 : pagination.offset));

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);

      if (reset) {
        setSelectedUsers(new Set());
        setSelectAll(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder, pagination.limit, pagination.offset]);

  // Initial load and filter changes
  useEffect(() => {
    fetchUsers(true);
  }, [roleFilter, statusFilter, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchUsers(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch user details
  const fetchUserDetails = async (userId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setUserDetails(data.data);
    } catch {
      setUserDetails(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Selection handlers
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    setSelectAll(newSelection.size === users.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
      setSelectAll(true);
    }
  };

  // User actions
  const suspendUser = async (userId: string, reason: string = "Admin action") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, duration: "permanent" }),
      });
      if (!response.ok) throw new Error("Failed to suspend user");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const unsuspendUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to unsuspend user");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const updateUserRole = async (userId: string, role: "user" | "builder") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to update role");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  // Bulk actions
  const executeBulkAction = async (
    operation: "suspend" | "unsuspend" | "updateRole",
    params?: { role?: "user" | "builder"; reason?: string }
  ) => {
    if (selectedUsers.size === 0) return;

    setBulkLoading(true);
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          userIds: Array.from(selectedUsers),
          params,
        }),
      });

      if (!response.ok) throw new Error("Bulk operation failed");

      const result = await response.json();
      setSelectedUsers(new Set());
      setSelectAll(false);
      await fetchUsers();

      // Show result feedback
      console.log("Bulk operation result:", result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk operation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Export
  const exportUsers = async (format: "csv" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const response = await fetch(`/api/admin/users/export?${params}`);
    if (!response.ok) {
      setError("Export failed");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hive-users-${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const goToPage = (newOffset: number) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
    fetchUsers();
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Role badge styling
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Admin</Badge>;
      case "builder":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Builder</Badge>;
      default:
        return null;
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspended</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card className="border-white/10 bg-[#141414]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-[#A1A1A6]" />
              User Management
              <span className="text-sm font-normal text-[#A1A1A6]">
                ({pagination.total} total)
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportUsers("csv")}
                className="border-white/10 text-[#A1A1A6] hover:bg-white/5"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportUsers("json")}
                className="border-white/10 text-[#A1A1A6] hover:bg-white/5"
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#818187]" />
              <Input
                placeholder="Search by name, email, or handle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-[#818187]"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-[140px] bg-[#0A0A0A] border-white/10 text-white">
                <Filter className="h-4 w-4 mr-2 text-[#818187]" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px] bg-[#0A0A0A] border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
              <SelectTrigger className="w-[150px] bg-[#0A0A0A] border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="createdAt">Join Date</SelectItem>
                <SelectItem value="lastActive">Last Active</SelectItem>
                <SelectItem value="displayName">Name</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="text-[#A1A1A6] hover:text-white"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* User List */}
      <Card className="border-white/10 bg-[#141414]">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-[#0A0A0A]/50">
            <Checkbox
              checked={selectAll}
              onCheckedChange={toggleSelectAll}
              className="border-white/30"
            />
            <span className="flex-1 text-sm font-medium text-[#A1A1A6]">User</span>
            <span className="w-24 text-sm font-medium text-[#A1A1A6]">Role</span>
            <span className="w-24 text-sm font-medium text-[#A1A1A6]">Status</span>
            <span className="w-20 text-sm font-medium text-[#A1A1A6] text-center">Spaces</span>
            <span className="w-28 text-sm font-medium text-[#A1A1A6]">Last Active</span>
            <span className="w-32 text-sm font-medium text-[#A1A1A6]">Actions</span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
            </div>
          )}

          {/* Empty state */}
          {!loading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#A1A1A6]">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* User rows */}
          {!loading &&
            users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  selectedUsers.has(user.id) ? "bg-white/10" : ""
                }`}
              >
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={() => toggleUserSelection(user.id)}
                  className="border-white/30"
                />

                {/* User info */}
                <div
                  className="flex-1 flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user);
                    fetchUserDetails(user.id);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white font-medium">
                    {user.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.displayName || "Unknown"}</p>
                    <p className="text-sm text-[#818187]">@{user.handle || "no-handle"}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="w-24">{getRoleBadge(user.role)}</div>

                {/* Status */}
                <div className="w-24">{getStatusBadge(user.status)}</div>

                {/* Spaces */}
                <div className="w-20 text-center">
                  <span className="text-white">{user.spaceCount || 0}</span>
                </div>

                {/* Last Active */}
                <div className="w-28 text-sm text-[#A1A1A6]">
                  {user.lastActive
                    ? new Date(user.lastActive).toLocaleDateString()
                    : "Never"}
                </div>

                {/* Actions */}
                <div className="w-32 flex items-center gap-1">
                  {user.status === "suspended" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unsuspendUser(user.id)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => suspendUser(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      fetchUserDetails(user.id);
                    }}
                    className="text-[#A1A1A6] hover:text-white"
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-sm text-[#A1A1A6]">
                Showing {pagination.offset + 1}-{Math.min(pagination.offset + users.length, pagination.total)} of{" "}
                {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(pagination.offset - pagination.limit)}
                  className="text-[#A1A1A6] hover:text-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => goToPage(pagination.offset + pagination.limit)}
                  className="text-[#A1A1A6] hover:text-white disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="border-white/20 bg-[#1A1A1A]/95 backdrop-blur-xl shadow-2xl">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] text-xs font-medium">
                    {selectedUsers.size}
                  </div>
                  <span className="text-white text-sm">selected</span>
                </div>

                <div className="h-4 w-px bg-white/20" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeBulkAction("suspend", { reason: "Bulk suspension" })}
                  disabled={bulkLoading}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Suspend All
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeBulkAction("unsuspend")}
                  disabled={bulkLoading}
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Unsuspend All
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => executeBulkAction("updateRole", { role: "builder" })}
                  disabled={bulkLoading}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Make Builders
                </Button>

                <div className="h-4 w-px bg-white/20" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUsers(new Set());
                    setSelectAll(false);
                  }}
                  className="text-[#A1A1A6] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Panel */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="bg-[#0A0A0A] border-white/10 w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="text-white">User Details</SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white text-2xl font-medium">
                  {selectedUser.displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedUser.displayName || "Unknown User"}
                  </h3>
                  <p className="text-[#A1A1A6]">@{selectedUser.handle}</p>
                  {selectedUser.email && (
                    <p className="text-sm text-[#818187]">{selectedUser.email}</p>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {getRoleBadge(selectedUser.role)}
                {getStatusBadge(selectedUser.status)}
                {!selectedUser.onboardingCompleted && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Onboarding Incomplete
                  </Badge>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-white/10 bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-[#A1A1A6] text-sm mb-1">
                    <Users className="h-4 w-4" />
                    Spaces
                  </div>
                  <p className="text-2xl font-semibold text-white">{selectedUser.spaceCount || 0}</p>
                </Card>
                <Card className="border-white/10 bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-[#A1A1A6] text-sm mb-1">
                    <Wrench className="h-4 w-4" />
                    Tools
                  </div>
                  <p className="text-2xl font-semibold text-white">{selectedUser.toolCount || 0}</p>
                </Card>
                <Card className="border-white/10 bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-[#A1A1A6] text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Days
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {Math.floor(
                      (Date.now() - new Date(selectedUser.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </p>
                </Card>
              </div>

              {/* Activity Sparkline */}
              {userDetails && (
                <Card className="border-white/10 bg-[#141414] p-4">
                  <p className="text-sm text-[#A1A1A6] mb-2">Activity (7 days)</p>
                  <Sparkline
                    data={[4, 7, 2, 9, 5, 8, 3]}
                    color="#FFD700"
                    height={40}
                  />
                </Card>
              )}

              {/* Loading state for details */}
              {detailLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
                </div>
              )}

              {/* Timestamps */}
              <Card className="border-white/10 bg-[#141414] p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#A1A1A6]">Joined</span>
                  <span className="text-white">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1A6]">Last Active</span>
                  <span className="text-white">
                    {selectedUser.lastActive
                      ? new Date(selectedUser.lastActive).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#A1A1A6]">Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedUser.role === "user" && (
                    <Button
                      variant="outline"
                      onClick={() => updateUserRole(selectedUser.id, "builder")}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Make Builder
                    </Button>
                  )}
                  {selectedUser.role === "builder" && (
                    <Button
                      variant="outline"
                      onClick={() => updateUserRole(selectedUser.id, "user")}
                      className="border-white/20 text-[#A1A1A6] hover:bg-white/5"
                    >
                      Remove Builder
                    </Button>
                  )}
                  {selectedUser.status === "suspended" ? (
                    <Button
                      variant="outline"
                      onClick={() => unsuspendUser(selectedUser.id)}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => suspendUser(selectedUser.id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
