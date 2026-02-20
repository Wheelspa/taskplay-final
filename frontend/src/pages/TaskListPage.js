import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Phone, MapPin, LogOut, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TaskListPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");

  // Priority order for sorting (lower number = higher priority)
  const priorityOrder = {
    "super_important": 1,
    "high": 2,
    "medium": 3,
    "low": 4
  };

  // Sort tasks: completed at bottom, then by priority
  const sortTasks = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      
      // If both completed or both not completed, sort by priority
      const priorityA = priorityOrder[a.priority] || 5;
      const priorityB = priorityOrder[b.priority] || 5;
      
      return priorityA - priorityB;
    });
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      
      const response = await axios.get(`${API}/tasks`, { params });
      // Sort tasks before setting
      setTasks(sortTasks(response.data));
    } catch (error) {
      toast.error("Failed to fetch tasks");
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
        return "text-accent border-accent/30 bg-accent/10";
      case "medium":
        return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      case "low":
        return "text-green-500 border-green-500/30 bg-green-500/10";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 border-green-600/30 bg-green-600/10";
      case "in_progress":
        return "text-blue-600 border-blue-600/30 bg-blue-600/10";
      case "pending":
        return "text-orange-600 border-orange-600/30 bg-orange-600/10";
      default:
        return "text-muted-foreground";
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="tasklist-logo">TASKPLAY</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              data-testid="back-to-dashboard-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              DASHBOARD
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2" data-testid="tasklist-heading">
              ALL TASKS
            </h2>
            <p className="text-muted-foreground">{tasks.length} tasks found</p>
          </div>
          <Button
            onClick={() => navigate("/tasks/new")}
            data-testid="create-new-task-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            NEW TASK
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="priority-filter">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="border border-border bg-secondary p-12 rounded-sm text-center" data-testid="no-tasks-found">
            <p className="text-muted-foreground mb-4">No tasks found with the selected filters.</p>
            <Button onClick={() => navigate("/tasks/new")} data-testid="create-first-task-btn">
              <Plus className="w-4 h-4 mr-2" />
              CREATE FIRST TASK
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-border bg-background p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/tasks/${task.id}`)}
                data-testid={`task-card-${task.id}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getStatusColor(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {task.scheduled_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}</span>
                    </div>
                  )}
                  {task.assignee_name && (
                    <div className="flex items-center gap-2">
                      <span>Assigned to: <strong>{task.assignee_name}</strong></span>
                    </div>
                  )}
                  {task.assignee_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{task.assignee_phone}</span>
                    </div>
                  )}
                  {task.location_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{task.location_address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListPage;