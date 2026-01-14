import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const TeamsPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API}/teams`);
      setTeams(response.data);
    } catch (error) {
      toast.error("Failed to fetch teams");
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

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API}/teams`, newTeam);
      setTeams([...teams, response.data]);
      setShowCreateModal(false);
      setNewTeam({ name: "", description: "" });
      toast.success("Team created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create team");
    } finally {
      setCreating(false);
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
              data-testid="teams-logo"
            >
              TASKPRO
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="user-name">
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
                onClick={() => navigate("/calendar")}
                data-testid="calendar-btn"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                CALENDAR
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Create Team Button */}
          <div>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="create-team-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              CREATE TEAM
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Team Image - Left Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0 bg-gradient-to-b from-primary/5 to-purple-500/5 border-r border-border p-6">
          <div className="sticky top-6">
            <img
              src="https://customer-assets.emergentagent.com/job_taskflow-pro-95/artifacts/97bi891b_Gemini_Generated_Image_t1zkgat1zkgat1zk.png"
              alt="Team Collaboration"
              className="w-full h-auto rounded-sm shadow-lg mb-4"
              data-testid="teams-image"
            />
            <h3 className="text-lg font-bold text-primary text-center">TEAM COLLABORATION</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">Work together, achieve more</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Users className="w-3 h-3 text-primary" /> Create unlimited teams
              </p>
              <p className="flex items-center gap-2">
                <UserPlus className="w-3 h-3 text-primary" /> Invite team members
              </p>
              <p className="flex items-center gap-2">
                <Crown className="w-3 h-3 text-yellow-600" /> Role-based permissions
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 md:px-12 py-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2" data-testid="teams-heading">
              MY TEAMS
            </h2>
            <p className="text-muted-foreground">
              Collaborate with your team members on tasks
            </p>
          </div>
          {/* Teams Grid */}
          {teams.length === 0 ? (
            <div className="border border-border rounded-sm p-12 text-center bg-secondary" data-testid="no-teams-message">
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first team to start collaborating with others
              </p>
              <Button onClick={() => setShowCreateModal(true)} data-testid="create-first-team-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="border border-border rounded-sm p-6 bg-background hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/teams/${team.id}`)}
                  data-testid={`team-card-${team.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{team.member_count} member{team.member_count !== 1 ? "s" : ""}</span>
                    </div>
                    {team.owner_id === user?.id && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        <Crown className="w-3 h-3" />
                        Owner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create New Team
            </DialogTitle>
            <DialogDescription>
              Create a team to collaborate with others on tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Team Name *</label>
              <Input
                placeholder="Enter team name"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                data-testid="team-name-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="What is this team about?"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                rows={3}
                data-testid="team-description-input"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={creating} data-testid="submit-create-team-btn">
              {creating ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
