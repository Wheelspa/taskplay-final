import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
  Plus,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const TeamDetailPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", role: "member" });
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("members");

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const [teamRes, membersRes, tasksRes] = await Promise.all([
        axios.get(`${API}/teams/${teamId}`),
        axios.get(`${API}/teams/${teamId}/members`),
        axios.get(`${API}/teams/${teamId}/tasks`),
      ]);
      setTeam(teamRes.data);
      setMembers(membersRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error("Failed to fetch team data");
      navigate("/teams");
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

  const handleAddMember = async () => {
    if (!newMember.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setAdding(true);
    try {
      const response = await axios.post(`${API}/teams/${teamId}/members`, {
        user_email: newMember.email,
        role: newMember.role,
      });
      setMembers([...members, response.data]);
      setShowAddMemberModal(false);
      setNewMember({ email: "", role: "member" });
      toast.success("Member added successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await axios.delete(`${API}/teams/${teamId}/members/${userId}`);
      setMembers(members.filter((m) => m.user_id !== userId));
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await axios.delete(`${API}/teams/${teamId}`);
      toast.success("Team deleted");
      navigate("/teams");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete team");
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const isOwnerOrAdmin = members.some(
    (m) => m.user_id === user?.id && (m.role === "owner" || m.role === "admin")
  );
  const isOwner = team?.owner_id === user?.id;

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
              data-testid="team-detail-logo"
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
              <Button
                variant="outline"
                onClick={() => navigate("/teams")}
                data-testid="teams-btn"
              >
                <Users className="w-4 h-4 mr-2" />
                TEAMS
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/teams")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Team Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-primary/10 rounded-sm flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight" data-testid="team-name">
                  {team?.name}
                </h2>
                {team?.description && (
                  <p className="text-muted-foreground">{team.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <Button onClick={() => setShowAddMemberModal(true)} data-testid="add-member-btn">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            )}
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" data-testid="delete-team-btn">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Team</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this team? This action cannot be undone.
                      All team data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTeam} className="bg-red-600 hover:bg-red-700">
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-border bg-secondary p-4 rounded-sm">
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
          <div className="border border-border bg-secondary p-4 rounded-sm">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
          <div className="border border-border bg-secondary p-4 rounded-sm">
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter((t) => t.status === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="border border-border bg-secondary p-4 rounded-sm">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === "completed").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "members"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("members")}
            data-testid="members-tab"
          >
            Members ({members.length})
          </button>
          <button
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === "tasks"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("tasks")}
            data-testid="tasks-tab"
          >
            Tasks ({tasks.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "members" && (
          <div className="space-y-3" data-testid="members-list">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="border border-border rounded-sm p-4 flex items-center justify-between"
                data-testid={`member-${member.user_id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="font-medium">{member.user_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.user_email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded uppercase ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                  {isOwnerOrAdmin && member.role !== "owner" && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`remove-member-${member.user_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div data-testid="tasks-list">
            {tasks.length === 0 ? (
              <div className="border border-border rounded-sm p-12 text-center bg-secondary">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tasks assigned to this team yet</p>
                <Button onClick={() => navigate("/tasks/new")} data-testid="create-team-task-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-border rounded-sm p-4 hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    data-testid={`team-task-${task.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <span className="text-xs uppercase text-muted-foreground">
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    {task.scheduled_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3" />
                        {task.scheduled_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Team Member
            </DialogTitle>
            <DialogDescription>
              Invite someone to join your team by their email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address *</label>
              <Input
                type="email"
                placeholder="Enter member's email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                data-testid="member-email-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={newMember.role}
                onValueChange={(value) => setNewMember({ ...newMember, role: value })}
              >
                <SelectTrigger data-testid="member-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={adding} data-testid="submit-add-member-btn">
              {adding ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamDetailPage;
