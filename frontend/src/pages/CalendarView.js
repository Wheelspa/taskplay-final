import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  Plus,
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

const CalendarView = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
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

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }
      return task.scheduled_date === dateStr;
    });
  };

  // Get all dates that have tasks
  const getDatesWithTasks = () => {
    const dates = {};
    tasks.forEach((task) => {
      if (task.scheduled_date) {
        if (filterPriority === "all" || task.priority === filterPriority) {
          if (!dates[task.scheduled_date]) {
            dates[task.scheduled_date] = [];
          }
          dates[task.scheduled_date].push(task);
        }
      }
    });
    return dates;
  };

  const tasksMap = getDatesWithTasks();

  // Custom day content renderer
  const renderDay = (day) => {
    const dateStr = day.toISOString().split("T")[0];
    const dayTasks = tasksMap[dateStr] || [];
    const hasSuperImportant = dayTasks.some(
      (t) => t.priority === "super_important"
    );
    const hasHigh = dayTasks.some((t) => t.priority === "high");
    const hasCompleted = dayTasks.some((t) => t.status === "completed");
    const hasPending = dayTasks.some(
      (t) => t.status === "pending" || t.status === "in_progress"
    );

    return (
      <div className="relative w-full h-full flex flex-col items-center">
        <span>{day.getDate()}</span>
        {dayTasks.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {hasSuperImportant && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
            {hasHigh && !hasSuperImportant && (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            )}
            {hasPending && !hasSuperImportant && !hasHigh && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
            {hasCompleted && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </div>
        )}
      </div>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "super_important":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
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
              data-testid="calendar-logo"
            >
              TASKPRO
            </h1>
            <div className="flex items-center gap-4">
              <span
                className="text-sm text-muted-foreground"
                data-testid="user-name"
              >
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
                variant="ghost"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Add Task Button */}
          <div>
            <Button
              onClick={() => navigate("/tasks/new")}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="add-task-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              ADD NEW TASK
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2
              className="text-4xl md:text-5xl font-semibold tracking-tight mb-2"
              data-testid="calendar-heading"
            >
              CALENDAR VIEW
            </h2>
            <p className="text-muted-foreground">
              See all your tasks at a glance
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger
                className="w-40"
                data-testid="priority-filter-select"
              >
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="super_important">Super Important</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div
              className="border border-border rounded-sm p-6 bg-background"
              data-testid="calendar-container"
            >
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">
                    {currentMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    data-testid="today-btn"
                  >
                    TODAY
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell:
                    "text-muted-foreground font-medium text-sm w-full text-center py-2",
                  row: "flex w-full",
                  cell: "w-full h-16 text-center relative p-0 border border-border hover:bg-accent/50 transition-colors cursor-pointer",
                  day: "w-full h-full p-2 font-normal hover:bg-transparent",
                  day_selected: "bg-primary/10 text-primary font-semibold",
                  day_today: "bg-accent font-semibold",
                  day_outside: "text-muted-foreground/50",
                }}
                components={{
                  DayContent: ({ date }) => renderDay(date),
                }}
              />

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Super Important
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-muted-foreground">
                    High Priority
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">
                    Pending/In Progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div>
            <div
              className="border border-border rounded-sm p-6 bg-background sticky top-6"
              data-testid="selected-date-tasks"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
              </div>

              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No tasks scheduled
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/tasks/new")}
                    data-testid="add-task-for-date-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border rounded-sm p-3 cursor-pointer hover:shadow-md transition-all ${getPriorityColor(task.priority)}`}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      data-testid={`calendar-task-${task.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {task.priority === "super_important" && (
                              <Flame className="w-4 h-4 text-red-600 flex-shrink-0" />
                            )}
                            <h4 className="font-medium text-sm truncate">
                              {task.title}
                            </h4>
                          </div>
                          {task.scheduled_time && (
                            <p className="text-xs mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.scheduled_time}
                            </p>
                          )}
                          {task.assignee_name && (
                            <p className="text-xs mt-1 truncate">
                              {task.assignee_name}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusIcon(task.status)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {task.priority.replace("_", " ")}
                        </Badge>
                        <span className="text-xs capitalize">
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Task Summary for Selected Date */}
              {selectedDateTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {
                          selectedDateTasks.filter(
                            (t) => t.status === "pending"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pending
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {
                          selectedDateTasks.filter(
                            (t) => t.status === "in_progress"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        In Progress
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {
                          selectedDateTasks.filter(
                            (t) => t.status === "completed"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Overview */}
            <div
              className="border border-border rounded-sm p-6 bg-background mt-6"
              data-testid="monthly-overview"
            >
              <h3 className="text-lg font-semibold mb-4">
                {currentMonth.toLocaleString("default", { month: "long" })}{" "}
                Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Tasks
                  </span>
                  <span className="font-semibold">
                    {Object.values(tasksMap).flat().length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Days with Tasks
                  </span>
                  <span className="font-semibold">
                    {Object.keys(tasksMap).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Super Important
                  </span>
                  <span className="font-semibold text-red-600">
                    {
                      Object.values(tasksMap)
                        .flat()
                        .filter((t) => t.priority === "super_important").length
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="font-semibold text-green-600">
                    {
                      Object.values(tasksMap)
                        .flat()
                        .filter((t) => t.status === "completed").length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
