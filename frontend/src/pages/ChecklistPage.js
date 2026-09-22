import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { CheckSquare, Plus, Trash2, Edit2, ArrowLeft, LogOut, CalendarDays, Users, FolderOpen, Crown, Zap, ListTodo, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ChecklistPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Checklist Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [creatingChecklist, setCreatingChecklist] = useState(false);

  // Edit Checklist State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  // New Item State
  const [newItemText, setNewItemText] = useState("");
  const [newItemPriority, setNewItemPriority] = useState("medium");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async (selectedId = null) => {
    try {
      const response = await axios.get(`${API}/checklists`);
      const data = response.data;
      setChecklists(data);

      if (data.length > 0) {
        const targetId = selectedId || (activeChecklist ? activeChecklist.id : data[0].id);
        const currentActive = data.find(c => c.id === targetId) || data[0];
        fetchSingleChecklist(currentActive.id);
      } else {
        setActiveChecklist(null);
      }
    } catch (error) {
      toast.error("Failed to fetch checklists");
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleChecklist = async (id) => {
    try {
      const response = await axios.get(`${API}/checklists/${id}`);
      setActiveChecklist(response.data);
    } catch (error) {
      toast.error("Failed to load checklist details");
    }
  };

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) {
      toast.error("Please enter a checklist title");
      return;
    }
    setCreatingChecklist(true);
    try {
      const response = await axios.post(`${API}/checklists`, { title: newChecklistTitle.trim() });
      toast.success("Checklist created!");
      setNewChecklistTitle("");
      setShowCreateModal(false);
      fetchChecklists(response.data.id);
    } catch (error) {
      toast.error("Failed to create checklist");
    } finally {
      setCreatingChecklist(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || !activeChecklist) return;
    try {
      await axios.put(`${API}/checklists/${activeChecklist.id}`, { title: editTitle.trim() });
      toast.success("Checklist renamed!");
      setShowEditModal(false);
      fetchChecklists(activeChecklist.id);
    } catch (error) {
      toast.error("Failed to rename checklist");
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    try {
      await axios.delete(`${API}/checklists/${checklistId}`);
      toast.success("Checklist deleted!");
      if (activeChecklist && activeChecklist.id === checklistId) {
        setActiveChecklist(null);
      }
      fetchChecklists();
    } catch (error) {
      toast.error("Failed to delete checklist");
    }
  };

  const handleAddItem = async (e) => {
    e?.preventDefault();
    if (!newItemText.trim() || !activeChecklist) return;
    setAddingItem(true);
    try {
      await axios.post(`${API}/checklists/${activeChecklist.id}/items`, {
        text: newItemText.trim(),
        priority: newItemPriority
      });
      setNewItemText("");
      toast.success("Item added!");
      fetchSingleChecklist(activeChecklist.id);
      fetchChecklists(activeChecklist.id);
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setAddingItem(false);
    }
  };

  const handleToggleItem = async (item) => {
    if (!activeChecklist) return;
    try {
      const newChecked = !item.is_checked;
      await axios.put(`${API}/checklists/${activeChecklist.id}/items/${item.id}`, {
        is_checked: newChecked
      });
      
      // Update state locally for instantaneous responsiveness
      setActiveChecklist(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? { ...i, is_checked: newChecked } : i),
        completed_item_count: newChecked ? prev.completed_item_count + 1 : prev.completed_item_count - 1
      }));

      fetchChecklists(activeChecklist.id);
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!activeChecklist) return;
    try {
      await axios.delete(`${API}/checklists/${activeChecklist.id}/items/${itemId}`);
      toast.success("Item removed!");
      fetchSingleChecklist(activeChecklist.id);
      fetchChecklists(activeChecklist.id);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "super_important":
      case "high":
        return "text-red-600 border-red-600/30 bg-red-600/10";
      case "medium":
        return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      case "low":
        return "text-green-500 border-green-500/30 bg-green-500/10";
      default:
        return "text-muted-foreground border-muted";
    }
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
      {/* Top Navbar */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate("/dashboard")} data-testid="checklists-logo">TASKPLAY</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")} data-testid="nav-dashboard-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              DASHBOARD
            </Button>
            {user?.membership_type !== "basic" ? (
              <Button variant="outline" onClick={() => navigate("/calendar")} data-testid="nav-calendar-btn">
                <CalendarDays className="w-4 h-4 mr-2" />
                CALENDAR
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/upgrade?feature=calendar")} className="border-purple-600 text-purple-600">
                <Crown className="w-4 h-4 mr-2" />
                CALENDAR (Premium)
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/teams")} data-testid="nav-teams-btn">
              <Users className="w-4 h-4 mr-2" />
              TEAMS
            </Button>
            <Button variant="outline" onClick={() => navigate("/groups")} data-testid="nav-groups-btn">
              <FolderOpen className="w-4 h-4 mr-2" />
              GROUPS
            </Button>
            <Button variant="outline" onClick={() => navigate("/tasks")} data-testid="nav-tasks-btn">
              ALL TASKS
            </Button>
            <Button variant="default" className="bg-primary text-white" onClick={() => navigate("/checklists")} data-testid="nav-checklists-btn">
              <CheckSquare className="w-4 h-4 mr-2" />
              CHECKLISTS
            </Button>
            <Button variant="ghost" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2" data-testid="checklists-heading">
              CHECKLISTS
            </h2>
            <p className="text-muted-foreground">Manage non-task checklists, packing lists & to-do items</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            data-testid="create-checklist-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW CHECKLIST
          </Button>
        </div>

        {checklists.length === 0 ? (
          <div className="border border-border bg-secondary p-12 rounded-sm text-center" data-testid="no-checklists-message">
            <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Checklists Found</h3>
            <p className="text-muted-foreground mb-6">Create your first checklist to organize items, steps, or custom to-do lists.</p>
            <Button onClick={() => setShowCreateModal(true)} data-testid="create-first-checklist-btn">
              <Plus className="w-4 h-4 mr-2" />
              CREATE FIRST CHECKLIST
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar / List of Checklists */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">YOUR CHECKLISTS ({checklists.length})</h3>
              <div className="space-y-3">
                {checklists.map((c) => {
                  const isSelected = activeChecklist && activeChecklist.id === c.id;
                  const pct = c.item_count > 0 ? Math.round((c.completed_item_count / c.item_count) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => fetchSingleChecklist(c.id)}
                      className={`p-4 rounded-sm border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                      data-testid={`checklist-card-${c.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-foreground">{c.title}</h4>
                        <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          {c.completed_item_count}/{c.item_count} done
                        </span>
                      </div>

                      <div className="space-y-1 mt-3">
                        <Progress value={pct} className="h-1.5" />
                        <div className="text-[11px] text-muted-foreground text-right">{pct}% completed</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Checklist Detail View */}
            <div className="lg:col-span-2">
              {activeChecklist ? (
                <div className="border border-border bg-background p-6 md:p-8 rounded-sm shadow-sm" data-testid="active-checklist-container">
                  {/* Header */}
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-bold tracking-tight" data-testid="active-checklist-title">{activeChecklist.title}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditTitle(activeChecklist.title);
                            setShowEditModal(true);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          data-testid="rename-checklist-btn"
                          title="Rename checklist"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created on {new Date(activeChecklist.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {activeChecklist.completed_item_count} of {activeChecklist.item_count} Completed
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeChecklist.item_count > 0
                            ? `${Math.round((activeChecklist.completed_item_count / activeChecklist.item_count) * 100)}% progress`
                            : "No items yet"}
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50" data-testid="delete-checklist-btn">
                            <Trash2 className="w-4 h-4 mr-1" />
                            DELETE
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Checklist?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{activeChecklist.title}" and all of its items? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteChecklist(activeChecklist.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              data-testid="confirm-delete-checklist-btn"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Add New Item Form */}
                  <form onSubmit={handleAddItem} className="flex gap-3 mb-8" data-testid="add-item-form">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Add a new item to this checklist..."
                      className="flex-1"
                      data-testid="new-item-text-input"
                    />
                    <Select value={newItemPriority} onValueChange={setNewItemPriority}>
                      <SelectTrigger className="w-32" data-testid="new-item-priority-select">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={addingItem || !newItemText.trim()} data-testid="add-item-btn">
                      <Plus className="w-4 h-4 mr-1" />
                      ADD
                    </Button>
                  </form>

                  {/* Checklist Items List */}
                  <div className="space-y-2">
                    {activeChecklist.items && activeChecklist.items.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-border rounded-sm" data-testid="no-items-message">
                        <p className="text-muted-foreground text-sm">This checklist is empty. Add your first item above!</p>
                      </div>
                    ) : (
                      activeChecklist.items?.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3.5 rounded-sm border transition-all ${
                            item.is_checked
                              ? "bg-secondary/40 border-border opacity-70"
                              : "bg-background border-border hover:border-primary/40"
                          }`}
                          data-testid={`checklist-item-${item.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                            <Checkbox
                              checked={item.is_checked}
                              onCheckedChange={() => handleToggleItem(item)}
                              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              data-testid={`item-checkbox-${item.id}`}
                            />
                            <span
                              className={`text-sm cursor-pointer select-none truncate ${
                                item.is_checked ? "line-through text-muted-foreground" : "text-foreground font-medium"
                              }`}
                              onClick={() => handleToggleItem(item)}
                              data-testid={`item-text-${item.id}`}
                            >
                              {item.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                              title="Delete item"
                              data-testid={`delete-item-btn-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-border bg-secondary p-12 rounded-sm text-center">
                  <p className="text-muted-foreground">Select a checklist on the left to view its items.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Checklist Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Checklist</DialogTitle>
            <DialogDescription>
              Give your new checklist a clear title (e.g. "Travel Packing List", "Weekly Grocery").
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateChecklist()}
              placeholder="Checklist Title..."
              data-testid="create-checklist-title-input"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChecklist} disabled={creatingChecklist || !newChecklistTitle.trim()} data-testid="save-checklist-btn">
              Create Checklist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Title Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Checklist</DialogTitle>
            <DialogDescription>Enter a new title for this checklist.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUpdateTitle()}
              placeholder="New Title..."
              data-testid="edit-checklist-title-input"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTitle} disabled={!editTitle.trim()} data-testid="save-rename-btn">
              Save Title
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistPage;
