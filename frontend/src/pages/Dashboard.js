import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, Calendar, Clock, CheckCircle2, AlertCircle, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, tasksResponse] = await Promise.all([
        axios.get(`${API}/tasks/stats/overview`),
        axios.get(`${API}/tasks`)
      ]);
      setStats(statsResponse.data);
      setRecentTasks(tasksResponse.data.slice(0, 5));
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-accent";
      case "medium":
        return "text-orange-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      toast.success("Task status updated");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to update task status");
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
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="dashboard-logo">TASKPRO</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground" data-testid="user-name">Welcome, {user?.name}</span>
            <Button
              variant="outline"
              onClick={() => navigate("/tasks")}
              data-testid="view-all-tasks-btn"
            >
              ALL TASKS
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
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" data-testid="dashboard-heading">
            DASHBOARD
          </h2>
          <p className="text-muted-foreground">Overview of your task management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          <div className="border border-border bg-secondary p-6 rounded-sm" data-testid="stat-total">
            <ListTodo className="w-6 h-6 mb-3 text-primary" />
            <div className="text-3xl font-bold mb-1">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Total Tasks</div>
          </div>
          
          <div className="border border-border bg-secondary p-6 rounded-sm" data-testid="stat-pending">
            <Clock className="w-6 h-6 mb-3 text-orange-500" />
            <div className="text-3xl font-bold mb-1">{stats?.pending || 0}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Pending</div>
          </div>
          
          <div className="border border-border bg-secondary p-6 rounded-sm" data-testid="stat-in-progress">
            <Calendar className="w-6 h-6 mb-3 text-blue-500" />
            <div className="text-3xl font-bold mb-1">{stats?.in_progress || 0}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">In Progress</div>
          </div>
          
          <div className="border border-border bg-secondary p-6 rounded-sm" data-testid="stat-completed">
            <CheckCircle2 className="w-6 h-6 mb-3 text-green-500" />
            <div className="text-3xl font-bold mb-1">{stats?.completed || 0}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">Completed</div>
          </div>
          
          <div className="border border-border bg-secondary p-6 rounded-sm" data-testid="stat-high-priority">
            <AlertCircle className="w-6 h-6 mb-3 text-accent" />
            <div className="text-3xl font-bold mb-1">{stats?.high_priority || 0}</div>
            <div className="text-sm text-muted-foreground uppercase tracking-wide">High Priority</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium tracking-tight" data-testid="recent-tasks-heading">RECENT TASKS</h3>
              <Button
                onClick={() => navigate("/tasks/new")}
                data-testid="create-task-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW TASK
              </Button>
            </div>
            
            {recentTasks.length === 0 ? (
              <div className="border border-border bg-secondary p-12 rounded-sm text-center" data-testid="no-tasks-message">
                <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-border bg-background p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium">{task.title}</h4>
                      <span className={`text-xs uppercase tracking-wider font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.scheduled_date}
                        </span>
                      )}
                      {task.assignee_name && (
                        <span>Assigned to: {task.assignee_name}</span>
                      )}
                      <span className="ml-auto uppercase">{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-medium tracking-tight mb-6" data-testid="quick-actions-heading">QUICK ACTIONS</h3>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate("/tasks/new")}
                data-testid="quick-new-task-btn"
              >
                <Plus className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">CREATE NEW TASK</div>
                  <div className="text-xs text-muted-foreground">Add a new task with details</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate("/tasks?status=pending")}
                data-testid="quick-view-pending-btn"
              >
                <Clock className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">VIEW PENDING TASKS</div>
                  <div className="text-xs text-muted-foreground">See all pending tasks</div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => navigate("/tasks?priority=high")}
                data-testid="quick-view-high-priority-btn"
              >
                <AlertCircle className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">HIGH PRIORITY TASKS</div>
                  <div className="text-xs text-muted-foreground">Focus on urgent tasks</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;