import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Phone, MapPin, LogOut, Plus, ArrowLeft, Pin, CheckSquare, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

const TaskListPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");

  const personalTasks = tasks.filter((t) => {
    if (!t.assignee_phone || t.assignee_phone.trim() === "") return true;
    if (t.assigned_to_user_id && t.assigned_to_user_id === user?.id) return true;
    if (user?.phone && t.assignee_phone === user.phone) return true;
    return false;
  });

  const assignedTasks = tasks.filter((t) => {
    if (!t.assignee_phone || t.assignee_phone.trim() === "") return false;
    if (t.assigned_to_user_id && t.assigned_to_user_id === user?.id) return false;
    if (user?.phone && t.assignee_phone === user.phone) return false;
    return true;
  });

  const handleTogglePin = async (e, task) => {
    e.stopPropagation();
    try {
      const newPinned = !task.is_pinned;
      await axios.put(`${API}/tasks/${task.id}`, { is_pinned: newPinned });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_pinned: newPinned } : t));
      toast.success(newPinned ? "Task pinned to Dashboard" : "Task unpinned from Dashboard");
    } catch (error) {
      toast.error("Failed to update pin status");
    }
  };

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

  const getDueBadge = (scheduledDateStr) => {
    if (!scheduledDateStr) return null;
    const datePart = scheduledDateStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length < 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    const taskDate = new Date(year, month, day);
    taskDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        text: "Due today",
        colorClass: "text-blue-600 border-blue-600/30 bg-blue-600/10 font-medium"
      };
    } else if (diffDays === 1) {
      return {
        text: "Due tomorrow",
        colorClass: "text-orange-600 border-orange-600/30 bg-orange-600/10 font-medium"
      };
    } else if (diffDays > 1) {
      return {
        text: `Due in ${diffDays} days`,
        colorClass: "text-purple-600 border-purple-600/30 bg-purple-600/10 font-medium"
      };
    } else {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
        colorClass: "text-red-600 border-red-600/30 bg-red-600/10 font-medium"
      };
    }
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
              variant="outline"
              onClick={() => navigate("/checklists")}
              data-testid="nav-checklists-btn"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              CHECKLISTS
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
            <p className="text-muted-foreground">{tasks.length} tasks found ({personalTasks.length} personal, {assignedTasks.length} assigned)</p>
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
          <div className="space-y-12">
            {/* Section 1: MY TASKS */}
            <div data-testid="my-tasks-section">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="mytasks-heading">
                  <CheckSquare className="w-6 h-6 text-primary" />
                  <span>MY TASKS</span>
                  <span className="text-sm font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full ml-1" data-testid="mytasks-count">
                    {personalTasks.length}
                  </span>
                </h3>
              </div>

              {personalTasks.length === 0 ? (
                <div className="border border-border bg-secondary p-8 rounded-sm text-center" data-testid="no-personal-tasks">
                  <p className="text-muted-foreground text-sm">No personal tasks found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {personalTasks.map((task) => (
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
                        <div className="flex items-center gap-2">
                          {(() => {
                            const dueBadge = getDueBadge(task.scheduled_date);
                            return dueBadge ? (
                              <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${dueBadge.colorClass}`} data-testid={`due-badge-${task.id}`}>
                                {dueBadge.text}
                              </span>
                            ) : null;
                          })()}
                          <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleTogglePin(e, task)}
                            className={`h-7 px-2 flex items-center gap-1 text-xs ${task.is_pinned ? "bg-amber-50 border-amber-500 text-amber-700 hover:bg-amber-100" : "text-muted-foreground hover:text-foreground"}`}
                            title={task.is_pinned ? "Unpin task from Dashboard" : "Pin task to Dashboard"}
                            data-testid={task.is_pinned ? `unpin-task-btn-${task.id}` : `pin-task-btn-${task.id}`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                            <span>{task.is_pinned ? "Pinned" : "Pin"}</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {task.scheduled_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}</span>
                          </div>
                        )}
                        {task.assigned_by_name && task.created_by !== user?.id && (
                          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm font-medium text-xs">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assigned by: <strong>{task.assigned_by_name}</strong></span>
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

            {/* Section 2: TASKS I ASSIGNED */}
            <div data-testid="tasks-i-assigned-section">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="assignedtasks-heading">
                  <UserCheck className="w-6 h-6 text-indigo-600" />
                  <span>TASKS I ASSIGNED</span>
                  <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full ml-1" data-testid="assignedtasks-count">
                    {assignedTasks.length}
                  </span>
                </h3>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="border border-border bg-secondary p-8 rounded-sm text-center" data-testid="no-assigned-tasks">
                  <p className="text-muted-foreground text-sm">No tasks assigned to others.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-border bg-background p-6 rounded-sm hover:border-indigo-300 transition-colors cursor-pointer shadow-sm"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      data-testid={`assigned-task-card-${task.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-medium mb-2">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const dueBadge = getDueBadge(task.scheduled_date);
                            return dueBadge ? (
                              <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${dueBadge.colorClass}`} data-testid={`due-badge-${task.id}`}>
                                {dueBadge.text}
                              </span>
                            ) : null;
                          })()}
                          <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleTogglePin(e, task)}
                            className={`h-7 px-2 flex items-center gap-1 text-xs ${task.is_pinned ? "bg-amber-50 border-amber-500 text-amber-700 hover:bg-amber-100" : "text-muted-foreground hover:text-foreground"}`}
                            title={task.is_pinned ? "Unpin task from Dashboard" : "Pin task to Dashboard"}
                            data-testid={task.is_pinned ? `unpin-assigned-task-btn-${task.id}` : `pin-assigned-task-btn-${task.id}`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                            <span>{task.is_pinned ? "Pinned" : "Pin"}</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {task.scheduled_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}</span>
                          </div>
                        )}
                        {task.assignee_name ? (
                          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-sm font-medium text-xs">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Assigned to: <strong>{task.assignee_name}</strong></span>
                          </div>
                        ) : task.assignee_phone ? (
                          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-sm font-medium text-xs">
                            <Phone className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Assigned to: <strong>{task.assignee_phone}</strong></span>
                          </div>
                        ) : null}
                        {task.assignee_name && task.assignee_phone && (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Phone className="w-4 h-4" />
                            <span>{task.assignee_phone}</span>
                          </div>
                        )}
                        {task.location_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
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
        )}
      </div>
    </div>
  );
};

export default TaskListPage;