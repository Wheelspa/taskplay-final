import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  Plus,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Trash2,
  Edit,
  ListTodo,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#A855F7" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
];

const TaskGroupsPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API}/task-groups`);
      setGroups(response.data);
    } catch (error) {
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API}/task-groups`, formData);
      setGroups([...groups, response.data]);
      setShowCreateModal(false);
      setFormData({ name: "", description: "", color: "#3B82F6" });
      toast.success("Group created successfully!");
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setSaving(false);
    }
  };

  const handleEditGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`${API}/task-groups/${editingGroup.id}`, formData);
      setGroups(groups.map(g => g.id === editingGroup.id ? response.data : g));
      setShowEditModal(false);
      setEditingGroup(null);
      setFormData({ name: "", description: "", color: "#3B82F6" });
      toast.success("Group updated successfully!");
    } catch (error) {
      toast.error("Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(`${API}/task-groups/${groupId}`);
      setGroups(groups.filter(g => g.id !== groupId));
      toast.success("Group deleted");
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1
              className="text-2xl font-bold tracking-tight cursor-pointer"
              onClick={() => navigate("/dashboard")}
              data-testid="groups-logo"
            >
              TASKPRO
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name}
              </span>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                data-testid="dashboard-btn"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                DASHBOARD
              </Button>
              {user?.membership_type !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/calendar")}
                  data-testid="calendar-btn"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  CALENDAR
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Create Group Button */}
          <div>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="create-group-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              CREATE GROUP
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2" data-testid="groups-heading">
            TASK GROUPS
          </h2>
          <p className="text-muted-foreground">
            Organize your tasks into groups for better management
          </p>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="border border-border rounded-sm p-12 text-center bg-secondary" data-testid="no-groups-message">
            <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create groups to organize your tasks better
            </p>
            <Button onClick={() => setShowCreateModal(true)} data-testid="create-first-group-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="border border-border rounded-sm p-6 bg-background hover:shadow-md transition-all"
                data-testid={`group-card-${group.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center"
                    style={{ backgroundColor: `${group.color}20` }}
                  >
                    <FolderOpen className="w-6 h-6" style={{ color: group.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(group)}
                      data-testid={`edit-group-${group.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-group-${group.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{group.name}"? Tasks in this group will be ungrouped but not deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div
                  className="flex items-center justify-between pt-4 border-t border-border cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/tasks?group=${group.id}`)}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ListTodo className="w-4 h-4" />
                    <span>{group.task_count} task{group.task_count !== 1 ? "s" : ""}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Color indicator */}
                <div
                  className="w-full h-1 rounded-full mt-4"
                  style={{ backgroundColor: group.color }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Create New Group
            </DialogTitle>
            <DialogDescription>
              Create a group to organize related tasks together
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Group Name *</Label>
              <Input
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="group-name-input"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="What is this group for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={saving} data-testid="submit-create-group-btn">
              {saving ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Group
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Group Name *</Label>
              <Input
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="What is this group for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGroup} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskGroupsPage;
