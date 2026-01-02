import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListTodo, Calendar, Clock, CheckCircle2, AlertCircle, LogOut, Plus, Trash2, Bell, X } from "lucide-react";
import { toast } from "sonner";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [criticalTasks, setCriticalTasks] = useState([]);
  const [scores, setScores] = useState(null);

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
      
      // Find super important tasks (critical priority and not completed)
      const superImportantTasks = tasksResponse.data.filter(
        task => task.priority === "super_important" && task.status !== "completed"
      );
      setCriticalTasks(superImportantTasks);
      
      // Show alert if there are critical tasks
      if (superImportantTasks.length > 0) {
        setShowCriticalAlert(true);
      }
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
      case "super_important":
        return "text-red-600 font-bold animate-pulse";
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

  const getTaskScore = (status) => {
    switch (status) {
      case "completed":
        return { score: 10, color: "text-green-600", bgColor: "bg-green-600" };
      case "in_progress":
        return { score: 5, color: "text-blue-600", bgColor: "bg-blue-600" };
      case "pending":
        return { score: 0, color: "text-orange-600", bgColor: "bg-orange-600" };
      default:
        return { score: 0, color: "text-muted-foreground", bgColor: "bg-muted" };
    }
  };

  const calculateOverallProgress = () => {
    if (!recentTasks || recentTasks.length === 0) return 0;
    const totalScore = recentTasks.reduce((sum, task) => {
      return sum + getTaskScore(task.status).score;
    }, 0);
    const maxPossibleScore = recentTasks.length * 10;
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      
      // Auto-delete when marked as completed
      if (newStatus === "completed") {
        setTimeout(async () => {
          try {
            await axios.delete(`${API}/tasks/${taskId}`);
            toast.success("Task completed and archived");
            fetchDashboardData();
          } catch (error) {
            console.error("Failed to auto-delete completed task:", error);
          }
        }, 2000); // 2 second delay to show the status change
      } else {
        toast.success("Task status updated");
        fetchDashboardData();
      }
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleClearCompleted = async () => {
    const completedTasks = recentTasks.filter(task => task.status === "completed");
    if (completedTasks.length === 0) {
      toast.info("No completed tasks to clear");
      return;
    }

    try {
      // Delete all completed tasks
      await Promise.all(
        completedTasks.map(task => axios.delete(`${API}/tasks/${task.id}`))
      );
      toast.success(`Cleared ${completedTasks.length} completed task(s)`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to clear completed tasks");
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
      {/* Critical Tasks Alert Dialog */}
      <Dialog open={showCriticalAlert} onOpenChange={setShowCriticalAlert}>
        <DialogContent className="max-w-2xl border-red-600 border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-red-600">
              <Bell className="w-6 h-6 animate-pulse" />
              SUPER IMPORTANT TASKS ALERT
            </DialogTitle>
            <DialogDescription>
              You have {criticalTasks.length} super important task(s) that require immediate attention!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {criticalTasks.map((task) => (
              <div
                key={task.id}
                className="border-2 border-red-600 bg-red-50 p-4 rounded-sm cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => {
                  setShowCriticalAlert(false);
                  navigate(`/tasks/${task.id}`);
                }}
                data-testid={`critical-task-${task.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-bold text-red-900">{task.title}</h4>
                  <span className="text-xs uppercase tracking-wider font-bold text-red-600 bg-red-200 px-2 py-1 rounded">
                    SUPER IMPORTANT
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-red-800 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-red-700">
                  {task.scheduled_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}
                    </span>
                  )}
                  {task.assignee_name && (
                    <span>Assigned to: {task.assignee_name}</span>
                  )}
                  <span className="ml-auto uppercase font-medium">{task.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">Click on any task to view details</p>
            <Button
              onClick={() => setShowCriticalAlert(false)}
              data-testid="close-critical-alert-btn"
            >
              <X className="w-4 h-4 mr-2" />
              CLOSE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="dashboard-logo">TASKPRO</h1>
          <div className="flex items-center gap-4">
            {criticalTasks.length > 0 && (
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 relative"
                onClick={() => setShowCriticalAlert(true)}
                data-testid="show-critical-tasks-btn"
              >
                <Bell className="w-4 h-4 mr-2 animate-pulse" />
                {criticalTasks.length} CRITICAL
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
              </Button>
            )}
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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-12">
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

          <div className="border border-border bg-primary/10 p-6 rounded-sm" data-testid="stat-progress">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Overall Progress</div>
            <div className="text-3xl font-bold mb-2 text-primary">{calculateOverallProgress()}%</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateOverallProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium tracking-tight" data-testid="recent-tasks-heading">RECENT TASKS</h3>
              <div className="flex gap-2">
                {stats?.completed > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        data-testid="clear-completed-btn"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        CLEAR COMPLETED
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Completed Tasks</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {stats.completed} completed task(s). This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="cancel-clear-btn">CANCEL</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearCompleted}
                          data-testid="confirm-clear-btn"
                        >
                          DELETE COMPLETED TASKS
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  onClick={() => navigate("/tasks/new")}
                  data-testid="create-task-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  NEW TASK
                </Button>
              </div>
            </div>
            
            {recentTasks.length === 0 ? (
              <div className="border border-border bg-secondary p-12 rounded-sm text-center" data-testid="no-tasks-message">
                <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => {
                  const taskScore = getTaskScore(task.status);
                  return (
                    <div
                      key={task.id}
                      className="border border-border bg-background p-6 rounded-sm hover:border-primary/50 transition-colors"
                      data-testid={`task-item-${task.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 
                            className="text-lg font-medium cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/tasks/${task.id}`)}
                          >
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs uppercase tracking-wider font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority === "super_important" ? "🔥 SUPER IMPORTANT" : task.priority}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-sm border border-border bg-secondary">
                            <div className="flex items-center gap-1">
                              <span className={`text-sm font-bold ${taskScore.color}`}>{taskScore.score}</span>
                              <span className="text-xs text-muted-foreground">/10</span>
                            </div>
                            <div className="w-16 bg-muted rounded-full h-1.5">
                              <div 
                                className={`${taskScore.bgColor} h-1.5 rounded-full transition-all`}
                                style={{ width: `${taskScore.score * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between gap-4">
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
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">STATUS:</span>
                          <Select 
                            value={task.status} 
                            onValueChange={(value) => handleStatusChange(task.id, value)}
                          >
                            <SelectTrigger 
                              className="w-36 h-8 text-xs uppercase"
                              data-testid={`status-select-${task.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
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