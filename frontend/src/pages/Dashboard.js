import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListTodo, Calendar, CalendarDays, Clock, CheckCircle2, AlertCircle, LogOut, Plus, Bell, X, Trophy, Target, TrendingUp, Award, Sparkles, Users, Crown, Zap, CreditCard, Mic, FolderOpen, StickyNote, Trash2, Pin, CheckSquare, UserCheck, Phone } from "lucide-react";
import { toast } from "sonner";
import VoiceTaskCreator from "../components/VoiceTaskCreator";

// Sub-component for Pinned Task live ticking countdown timer
const PinnedTaskCountdown = ({ scheduledDate, scheduledTime }) => {
  const calculateTimeLeft = () => {
    if (!scheduledDate) return null;

    const datePart = scheduledDate.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length < 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    let hours = 23;
    let minutes = 59;
    let seconds = 59;
    let hasTime = false;

    if (scheduledTime && scheduledTime.trim()) {
      const timeParts = scheduledTime.trim().split(':');
      if (timeParts.length >= 2) {
        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);
        const s = timeParts.length >= 3 ? parseInt(timeParts[2], 10) : 0;
        if (!isNaN(h) && !isNaN(m)) {
          hours = h;
          minutes = m;
          seconds = isNaN(s) ? 0 : s;
          hasTime = true;
        }
      }
    }

    const targetDate = new Date(year, month, day, hours, minutes, seconds);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    // Format readable date string
    const formattedDate = targetDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let formattedTime = "";
    if (hasTime) {
      formattedTime = targetDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }

    const formattedFull = hasTime ? `Due: ${formattedDate}, ${formattedTime}` : `Due: ${formattedDate}`;

    if (diff <= 0) {
      return { isOverdue: true, formattedFull };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minsRemaining = Math.floor((diff / (1000 * 60)) % 60);
    const secsRemaining = Math.floor((diff / 1000) % 60);

    return {
      isOverdue: false,
      formattedFull,
      days: String(days).padStart(2, '0'),
      hours: String(hoursRemaining).padStart(2, '0'),
      minutes: String(minsRemaining).padStart(2, '0'),
      seconds: String(secsRemaining).padStart(2, '0'),
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledDate, scheduledTime]);

  if (!timeLeft) return null;

  return (
    <div className="mt-2 pt-2 border-t border-amber-200/70" data-testid="pinned-countdown-container" onClick={(e) => e.stopPropagation()}>
      <div className="text-[11px] font-medium text-amber-900 mb-1.5 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>{timeLeft.formattedFull}</span>
      </div>

      {timeLeft.isOverdue ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-100 border border-red-300 text-red-700 font-bold text-xs" data-testid="pinned-overdue-badge">
          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          <span>OVERDUE</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mt-1" data-testid="pinned-countdown-boxes">
          <div className="flex flex-col items-center bg-amber-100/90 border border-amber-300 rounded px-2 py-0.5 min-w-[38px] shadow-xs">
            <span className="font-mono text-xs font-bold text-amber-950">{timeLeft.days}</span>
            <span className="text-[8px] uppercase tracking-wider text-amber-700 font-semibold">Days</span>
          </div>
          <span className="text-amber-500 font-bold text-xs">:</span>
          <div className="flex flex-col items-center bg-amber-100/90 border border-amber-300 rounded px-2 py-0.5 min-w-[38px] shadow-xs">
            <span className="font-mono text-xs font-bold text-amber-950">{timeLeft.hours}</span>
            <span className="text-[8px] uppercase tracking-wider text-amber-700 font-semibold">Hrs</span>
          </div>
          <span className="text-amber-500 font-bold text-xs">:</span>
          <div className="flex flex-col items-center bg-amber-100/90 border border-amber-300 rounded px-2 py-0.5 min-w-[38px] shadow-xs">
            <span className="font-mono text-xs font-bold text-amber-950">{timeLeft.minutes}</span>
            <span className="text-[8px] uppercase tracking-wider text-amber-700 font-semibold">Min</span>
          </div>
          <span className="text-amber-500 font-bold text-xs">:</span>
          <div className="flex flex-col items-center bg-amber-100/90 border border-amber-300 rounded px-2 py-0.5 min-w-[38px] shadow-xs">
            <span className="font-mono text-xs font-bold text-amber-950">{timeLeft.seconds}</span>
            <span className="text-[8px] uppercase tracking-wider text-amber-700 font-semibold">Sec</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [pinnedTasks, setPinnedTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({});
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [criticalTasks, setCriticalTasks] = useState([]);
  const [scores, setScores] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [previousScore, setPreviousScore] = useState(0);
  const [showVoiceCreator, setShowVoiceCreator] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);
  
  // Sticky notes (Quick Tasks) state
  const [stickyNotes, setStickyNotes] = useState([]);
  const [newStickyNote, setNewStickyNote] = useState("");

  const fetchQuickTasks = async () => {
    try {
      const response = await axios.get(`${API}/quick-tasks`);
      let fetchedTasks = response.data;

      // One-time migration of localStorage quick tasks if backend list is empty
      const localSaved = localStorage.getItem('taskplay_sticky_notes');
      if (localSaved) {
        try {
          const parsedLocal = JSON.parse(localSaved);
          if (Array.isArray(parsedLocal) && parsedLocal.length > 0 && fetchedTasks.length === 0) {
            const migratedTasks = [];
            for (const item of parsedLocal) {
              if (item.text && item.text.trim()) {
                const res = await axios.post(`${API}/quick-tasks`, {
                  text: item.text.trim(),
                  is_checked: Boolean(item.completed || item.is_checked)
                });
                migratedTasks.push(res.data);
              }
            }
            fetchedTasks = migratedTasks;
          }
        } catch (e) {
          console.error("Migration error", e);
        } finally {
          localStorage.removeItem('taskplay_sticky_notes');
        }
      }

      setStickyNotes(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch quick tasks");
    }
  };

  const addStickyNote = async () => {
    if (!newStickyNote.trim()) return;
    if (stickyNotes.length >= 10) {
      toast.error("Maximum 10 quick tasks allowed!");
      return;
    }
    const textToAdd = newStickyNote.trim();
    setNewStickyNote("");
    try {
      const response = await axios.post(`${API}/quick-tasks`, { text: textToAdd });
      setStickyNotes([...stickyNotes, response.data]);
      toast.success("Quick task added!");
    } catch (error) {
      toast.error("Failed to add quick task");
    }
  };

  const toggleStickyNote = async (id) => {
    const target = stickyNotes.find(note => note.id === id || note._id === id);
    if (!target) return;

    const newCheckedState = !(target.is_checked || target.completed);
    
    // Optimistic UI update
    setStickyNotes(stickyNotes.map(note =>
      (note.id === id || note._id === id) ? { ...note, is_checked: newCheckedState, completed: newCheckedState } : note
    ));

    try {
      await axios.put(`${API}/quick-tasks/${id}`, { is_checked: newCheckedState });
    } catch (error) {
      toast.error("Failed to update quick task");
      fetchQuickTasks();
    }
  };

  const deleteStickyNote = async (id) => {
    // Optimistic UI update
    setStickyNotes(stickyNotes.filter(note => note.id !== id && note._id !== id));
    try {
      await axios.delete(`${API}/quick-tasks/${id}`);
    } catch (error) {
      toast.error("Failed to delete quick task");
      fetchQuickTasks();
    }
  };

  const clearCompletedNotes = async () => {
    const completedList = stickyNotes.filter(note => note.is_checked || note.completed);
    setStickyNotes(stickyNotes.filter(note => !note.is_checked && !note.completed));
    try {
      await Promise.all(completedList.map(note => axios.delete(`${API}/quick-tasks/${note.id || note._id}`)));
      toast.success("Completed tasks cleared!");
    } catch (error) {
      toast.error("Failed to clear completed tasks");
      fetchQuickTasks();
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTaskGroups();
    fetchQuickTasks();
  }, []);

  const fetchTaskGroups = async () => {
    try {
      const response = await axios.get(`${API}/task-groups`);
      setTaskGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups");
    }
  };

  // Group tasks by date
  const groupTasksByDate = (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + 2);
    
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    const groups = {
      overdue: { label: "Overdue", icon: "🔴", tasks: [], color: "border-red-500 bg-red-50" },
      today: { label: "Today's Tasks", icon: "📅", tasks: [], color: "border-blue-500 bg-blue-50" },
      tomorrow: { label: "Tomorrow", icon: "⏰", tasks: [], color: "border-orange-500 bg-orange-50" },
      thisWeek: { label: "This Week", icon: "📆", tasks: [], color: "border-purple-500 bg-purple-50" },
      later: { label: "Later", icon: "📋", tasks: [], color: "border-gray-400 bg-gray-50" },
      noDate: { label: "No Date Set", icon: "❓", tasks: [], color: "border-gray-300 bg-gray-50" }
    };

    tasks.forEach(task => {
      // Skip completed tasks
      if (task.status === "completed") return;
      
      if (!task.scheduled_date) {
        groups.noDate.tasks.push(task);
        return;
      }

      const taskDate = new Date(task.scheduled_date);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate < today) {
        groups.overdue.tasks.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        groups.today.tasks.push(task);
      } else if (taskDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.tasks.push(task);
      } else if (taskDate <= nextWeekEnd) {
        groups.thisWeek.tasks.push(task);
      } else {
        groups.later.tasks.push(task);
      }
    });

    // Sort tasks within each group by priority
    Object.keys(groups).forEach(key => {
      groups[key].tasks = sortTasks(groups[key].tasks);
    });

    return groups;
  };

  // Priority order for sorting (lower number = higher priority)
  const priorityOrder = {
    "super_important": 1,
    "high": 2,
    "medium": 3,
    "low": 4
  };

  // Sort tasks: completed at bottom, then by priority
  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      
      // If both completed or both not completed, sort by priority
      const priorityA = priorityOrder[a.priority] || 5;
      const priorityB = priorityOrder[b.priority] || 5;
      
      return priorityA - priorityB;
    });
  };

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, tasksResponse, scoresResponse] = await Promise.all([
        axios.get(`${API}/tasks/stats/overview`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/tasks/stats/scores`)
      ]);
      setStats(statsResponse.data);
      
      const allFetchedTasks = tasksResponse.data;
      
      // Filter pinned tasks
      const pinned = allFetchedTasks.filter(t => t.is_pinned);
      setPinnedTasks(sortTasks(pinned));

      // Separate personal tasks vs tasks assigned to others
      const personalTasks = allFetchedTasks.filter(t => {
        if (!t.assignee_phone || t.assignee_phone.trim() === "") return true;
        if (t.assigned_to_user_id && t.assigned_to_user_id === user?.id) return true;
        if (user?.phone && t.assignee_phone === user.phone) return true;
        return false;
      });

      const assignedToOthers = allFetchedTasks.filter(t => {
        if (!t.assignee_phone || t.assignee_phone.trim() === "") return false;
        if (t.assigned_to_user_id && t.assigned_to_user_id === user?.id) return false;
        if (user?.phone && t.assignee_phone === user.phone) return false;
        return true;
      });

      setAssignedTasks(sortTasks(assignedToOthers));

      // Sort personal tasks and take top 10 for display
      const sortedTasks = sortTasks(personalTasks);
      setRecentTasks(sortedTasks.slice(0, 10));
      
      // Group personal tasks by date (MY TASKS date-grouping for Group 1 only)
      const grouped = groupTasksByDate(personalTasks);
      setGroupedTasks(grouped);
      
      const newScores = scoresResponse.data;
      
      // Check if a new milestone was reached
      if (scores && scores.monthly_score < newScores.monthly_score) {
        const milestones = [25, 50, 75, 100];
        for (const milestone of milestones) {
          if (scores.monthly_score < milestone && newScores.monthly_score >= milestone) {
            const achievement = newScores.achievements.find(a => 
              (milestone === 25 && a.level === "bronze") ||
              (milestone === 50 && a.level === "silver") ||
              (milestone === 75 && a.level === "gold") ||
              (milestone === 100 && a.level === "platinum")
            );
            if (achievement) {
              setNewAchievement(achievement);
              setShowAchievement(true);
            }
            break;
          }
        }
      }
      
      setScores(newScores);
      setPreviousScore(newScores.monthly_score);
      
      // Find super important tasks (critical priority and not completed)
      const superImportantTasks = allFetchedTasks.filter(
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

  const handleUnpinTask = async (taskId, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`${API}/tasks/${taskId}`, { is_pinned: false });
      toast.success("Task unpinned from Dashboard");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to unpin task");
    }
  };

  const handleTogglePin = async (taskId, currentPinnedStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const newPinned = !currentPinnedStatus;
      await axios.put(`${API}/tasks/${taskId}`, { is_pinned: newPinned });
      toast.success(newPinned ? "Task pinned to Dashboard" : "Task unpinned from Dashboard");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update pin status");
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
      const response = await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      
      // Auto-delete when marked as completed
      if (newStatus === "completed") {
        const pointsEarned = response.data.points_earned || 0;
        toast.success(`Task completed! +${pointsEarned} points earned 🎉`, {
          duration: 3000
        });
        
        setTimeout(async () => {
          try {
            await axios.delete(`${API}/tasks/${taskId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Achievement Celebration Modal */}
      <Dialog open={showAchievement} onOpenChange={setShowAchievement}>
        <DialogContent className="max-w-md border-4 border-primary bg-gradient-to-br from-primary/10 to-accent/10">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold flex flex-col items-center gap-4">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-accent animate-pulse" />
                <span className="absolute inset-0 flex items-center justify-center text-5xl">
                  {newAchievement?.icon}
                </span>
              </div>
              <div>
                ACHIEVEMENT UNLOCKED!
              </div>
            </DialogTitle>
            <DialogDescription className="text-center py-6">
              <div className="text-6xl mb-4">{newAchievement?.icon}</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {newAchievement?.name}
              </h3>
              <p className="text-base text-muted-foreground mb-4">
                {newAchievement?.description}
              </p>
              <div className="bg-primary/20 border-2 border-primary p-4 rounded-sm">
                <p className="text-lg font-bold text-primary">
                  {scores?.monthly_score} POINTS THIS MONTH
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {scores?.next_milestone > scores?.monthly_score 
                    ? `${scores.next_milestone - scores.monthly_score} more to next milestone`
                    : "You've reached the highest milestone!"}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAchievement(false)}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="close-achievement-btn"
            >
              <Trophy className="w-4 h-4 mr-2" />
              AWESOME!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight" data-testid="dashboard-logo">TASKPLAY</h1>
            </div>
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
              {user?.membership_type !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/calendar")}
                  data-testid="calendar-view-btn"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  CALENDAR
                </Button>
              )}
              {user?.membership_type === "basic" && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/upgrade?feature=calendar")}
                  data-testid="calendar-upgrade-btn"
                  className="border-purple-600 text-purple-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  CALENDAR (Premium)
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/teams")}
                data-testid="teams-view-btn"
              >
                <Users className="w-4 h-4 mr-2" />
                TEAMS
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/groups")}
                data-testid="groups-view-btn"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                GROUPS
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/tasks")}
                data-testid="view-all-tasks-btn"
              >
                ALL TASKS
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
          
          {/* Add Task Buttons Below Logo */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/tasks/new")}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="quick-add-task-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              ADD NEW TASK
            </Button>
            <Button
              onClick={() => setShowVoiceCreator(true)}
              size="lg"
              variant="outline"
              className="uppercase tracking-wider border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="voice-task-btn"
            >
              <Mic className="w-5 h-5 mr-2" />
              VOICE COMMAND
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Brand Ambassador - Left Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 bg-gradient-to-b from-primary/5 to-purple-500/5 border-r border-border p-6">
          <div className="sticky top-6">
            <img
              src="https://customer-assets.emergentagent.com/job_taskflow-pro-95/artifacts/mrfodckx_Gemini_Generated_Image_xk0v49xk0v49xk0v.png"
              alt="TaskPlay Brand Ambassador"
              className="w-full h-auto rounded-sm shadow-lg mb-4"
              data-testid="brand-ambassador-full"
            />
            <h3 className="text-lg font-bold text-primary text-center">TASKPLAY</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">Trusted by 10,000+ Professionals</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" /> Manage tasks efficiently
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" /> Team collaboration
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" /> Track progress & scores
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 md:px-12 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Header with Sticky Note */}
            <div className="flex flex-col lg:flex-row gap-8 mb-12">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" data-testid="dashboard-heading">
                  DASHBOARD
                </h2>
                <p className="text-muted-foreground mb-6">Overview of your task management</p>

                {/* PINNED TASKS WIDGET */}
                <div className="bg-amber-50/80 border-2 border-amber-400 p-5 rounded-sm shadow-sm" data-testid="pinned-tasks-section">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Pin className="w-5 h-5 text-amber-600 fill-amber-500" />
                      <h3 className="text-base font-bold text-amber-950 uppercase tracking-wide">PINNED TASKS</h3>
                      <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full" data-testid="pinned-tasks-count">
                        {pinnedTasks.length}
                      </span>
                    </div>
                  </div>

                  {pinnedTasks.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-amber-300 rounded-sm bg-amber-50/50" data-testid="no-pinned-tasks-message">
                      <Pin className="w-8 h-8 mx-auto text-amber-400 mb-2 opacity-60" />
                      <p className="text-sm text-amber-900 font-medium">No pinned tasks yet — pin a task from your task list to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {pinnedTasks.map((task) => {
                        const dueBadge = getDueBadge(task.scheduled_date);
                        return (
                          <div
                            key={task.id}
                            className="bg-white border border-amber-200 p-3.5 rounded-sm shadow-sm hover:border-amber-400 transition-all cursor-pointer"
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            data-testid={`pinned-task-item-${task.id}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm text-foreground truncate hover:text-primary">
                                    {task.title}
                                  </h4>
                                  {dueBadge && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-sm border whitespace-nowrap ${dueBadge.colorClass}`} data-testid={`due-badge-${task.id}`}>
                                      {dueBadge.text}
                                    </span>
                                  )}
                                  {task.assigned_by_name && task.created_by !== user?.id && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium whitespace-nowrap">
                                      Assigned by {task.assigned_by_name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${getPriorityColor(task.priority)}`}>
                                  {task.priority === "super_important" ? "SUPER" : task.priority}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleUnpinTask(task.id, e)}
                                  className="h-7 w-7 p-0 text-amber-700 hover:text-red-600 hover:bg-red-50 rounded-sm"
                                  title="Unpin task"
                                  data-testid={`unpin-dashboard-task-${task.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Live Countdown Timer for Pinned Task */}
                            {task.scheduled_date && (
                              <PinnedTaskCountdown
                                scheduledDate={task.scheduled_date}
                                scheduledTime={task.scheduled_time}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mascot Holding Sticky Note */}
              <div className="relative flex-shrink-0" data-testid="mascot-sticky-container">
                {/* Mascot on top */}
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/9fbc21f8-64e2-4716-bbae-173dedbd0b1d/images/0a7307e5d8fdecb2cbc70bdb5b8dc35fda6df5b62db30c2452a539607f04309f.png"
                    alt="TaskPlay Mascot"
                    className="w-20 h-20 object-contain drop-shadow-lg"
                    style={{ animation: "float 3s ease-in-out infinite" }}
                    data-testid="taskplay-mascot"
                  />
                </div>
                
                {/* Sticky Note Quick Tasks */}
                <div 
                  className="relative bg-yellow-100 p-5 rounded-sm shadow-lg w-full lg:w-80 mt-8"
                  style={{
                    background: "linear-gradient(180deg, #fef9c3 0%, #fef08a 100%)",
                    boxShadow: "4px 4px 15px rgba(0,0,0,0.15)"
                  }}
                  data-testid="sticky-notes-container"
                >
                  {/* Tape effect */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-14 h-5 bg-yellow-200/80 rounded-sm" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}></div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="w-4 h-4 text-yellow-700" />
                    <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">Quick Tasks</h3>
                    <span className="text-xs text-yellow-700 ml-auto">{stickyNotes.length}/10</span>
                  </div>

                  {/* Add new task input */}
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newStickyNote}
                      onChange={(e) => setNewStickyNote(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addStickyNote()}
                      placeholder="Add quick task..."
                      className="bg-yellow-50 border-yellow-300 text-yellow-900 placeholder:text-yellow-600 text-xs h-8"
                      maxLength={50}
                      data-testid="sticky-note-input"
                    />
                    <Button
                      size="sm"
                      onClick={addStickyNote}
                      disabled={stickyNotes.length >= 10}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white h-8 w-8 p-0"
                      data-testid="add-sticky-note-btn"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Task list */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {stickyNotes.length === 0 ? (
                      <p className="text-yellow-700 text-xs text-center py-3 italic">
                        No quick tasks yet!
                      </p>
                    ) : (
                      stickyNotes.map((note) => {
                        const noteId = note.id || note._id;
                        const isDone = Boolean(note.is_checked || note.completed);
                        return (
                          <div
                            key={noteId}
                            className={`flex items-center gap-2 p-1.5 rounded-sm transition-all ${
                              isDone ? "bg-yellow-200/50 opacity-60" : "bg-yellow-50 hover:bg-yellow-200/70"
                            }`}
                            data-testid={`sticky-note-${noteId}`}
                          >
                            <Checkbox
                              checked={isDone}
                              onCheckedChange={() => toggleStickyNote(noteId)}
                              className="border-yellow-600 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600 h-4 w-4"
                              data-testid={`sticky-checkbox-${noteId}`}
                            />
                            <span 
                              className={`flex-1 text-xs text-yellow-900 ${isDone ? "line-through" : ""}`}
                            >
                              {note.text}
                            </span>
                            <button
                              onClick={() => deleteStickyNote(noteId)}
                              className="text-yellow-600 hover:text-red-600 transition-colors"
                              data-testid={`delete-sticky-${noteId}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Clear completed button */}
                  {stickyNotes.some(n => n.is_checked || n.completed) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCompletedNotes}
                      className="mt-2 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-200 w-full h-7 text-xs"
                      data-testid="clear-completed-sticky-btn"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear Done
                    </Button>
                  )}
                </div>
              </div>
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

        {/* Membership Status Card */}
        <div className={`border-2 p-6 rounded-sm mb-8 ${
          user?.membership_type === "premium" 
            ? "border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100" 
            : user?.membership_type === "basic"
            ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100"
            : "border-gray-300 bg-gray-50"
        }`} data-testid="membership-status-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-sm ${
                user?.membership_type === "premium" 
                  ? "bg-purple-200" 
                  : user?.membership_type === "basic"
                  ? "bg-blue-200"
                  : "bg-gray-200"
              }`}>
                {user?.membership_type === "premium" ? (
                  <Crown className="w-8 h-8 text-purple-600" />
                ) : user?.membership_type === "basic" ? (
                  <Zap className="w-8 h-8 text-blue-600" />
                ) : (
                  <CreditCard className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {user?.membership_type === "premium" ? "Premium Member" : 
                   user?.membership_type === "basic" ? "Basic Member" : 
                   "Free Account"}
                  {user?.membership_type && (
                    <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                      user?.membership_type === "premium" 
                        ? "bg-purple-600 text-white" 
                        : "bg-blue-600 text-white"
                    }`}>
                      {user?.membership_plan === "yearly" ? "Annual" : "Monthly"}
                    </span>
                  )}
                </h3>
                {user?.membership_type ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user?.membership_type === "premium" 
                      ? "Unlimited tasks • Advanced analytics • Team collaboration • Priority support" 
                      : "Up to 50 tasks/month • Basic analytics • Email support"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to unlock premium features
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {user?.membership_expires_at ? (
                <div>
                  <div className="text-xs text-muted-foreground uppercase">Valid Until</div>
                  <div className="text-lg font-bold">
                    {new Date(user.membership_expires_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  {new Date(user.membership_expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                    <div className="text-xs text-orange-600 font-medium mt-1">
                      ⚠️ Expiring soon
                    </div>
                  )}
                  {user?.membership_type === "basic" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/upgrade")}
                      className="mt-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                      data-testid="upgrade-to-premium-btn"
                    >
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              ) : !user?.membership_type && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/upgrade")}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid="upgrade-btn"
                >
                  Upgrade Now
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Score Tracking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border-2 border-primary bg-primary/5 p-6 rounded-sm" data-testid="daily-score-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground font-medium">TODAY'S SCORE</h3>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="text-5xl font-bold text-primary mb-2">{scores?.daily_score || 0}</div>
            <p className="text-sm text-muted-foreground">Points earned today</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary">
              <Trophy className="w-4 h-4" />
              <span>Keep going! Complete more tasks</span>
            </div>
          </div>

          <div className="border-2 border-green-600 bg-green-50 p-6 rounded-sm" data-testid="monthly-score-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground font-medium">THIS MONTH</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-5xl font-bold text-green-600 mb-2">{scores?.monthly_score || 0}</div>
            <p className="text-sm text-muted-foreground">Points this month</p>
            {scores?.monthly_penalties > 0 && (
              <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                -{scores.monthly_penalties} penalty points
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="border-2 border-accent bg-accent/5 p-6 rounded-sm" data-testid="total-score-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground font-medium">ALL TIME</h3>
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="text-5xl font-bold text-accent mb-2">{scores?.total_score || 0}</div>
            <p className="text-sm text-muted-foreground">Total points earned</p>
            {scores?.total_penalties > 0 && (
              <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                -{scores.total_penalties} total penalties
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-accent">
              <CheckCircle2 className="w-4 h-4" />
              <span>{scores?.completed_tasks_count || 0} tasks completed</span>
            </div>
          </div>
        </div>

        {/* Delayed Tasks Warning */}
        {scores?.delayed_tasks_count > 0 && (
          <div className="bg-red-50 border-2 border-red-600 p-4 rounded-sm mb-8" data-testid="delayed-tasks-warning">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">
                  ⚠️ {scores.delayed_tasks_count} Task(s) Delayed by 3+ Days
                </h3>
                <p className="text-sm text-red-800 mt-1">
                  {scores.delayed_tasks_count} task(s) are overdue by more than 3 days. 
                  5 points have been deducted for each delayed task. Complete them soon to avoid further penalties!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Display */}
        {scores?.achievements && scores.achievements.length > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary p-6 rounded-sm mb-8" data-testid="achievements-section">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">THIS MONTH'S ACHIEVEMENTS</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Bronze - 25 points */}
              <div className={`border-2 p-4 rounded-sm text-center transition-all ${
                scores.achievements.some(a => a.level === "bronze")
                  ? "border-amber-700 bg-amber-50"
                  : "border-muted bg-muted/20 opacity-50"
              }`} data-testid="achievement-bronze">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-xs font-bold uppercase tracking-wide">Getting Started</div>
                <div className="text-xs text-muted-foreground mt-1">25 Points</div>
                {scores.achievements.some(a => a.level === "bronze") && (
                  <div className="text-xs text-green-600 font-medium mt-2">✓ UNLOCKED</div>
                )}
              </div>

              {/* Silver - 50 points */}
              <div className={`border-2 p-4 rounded-sm text-center transition-all ${
                scores.achievements.some(a => a.level === "silver")
                  ? "border-gray-400 bg-gray-50"
                  : "border-muted bg-muted/20 opacity-50"
              }`} data-testid="achievement-silver">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-xs font-bold uppercase tracking-wide">Productive Worker</div>
                <div className="text-xs text-muted-foreground mt-1">50 Points</div>
                {scores.achievements.some(a => a.level === "silver") && (
                  <div className="text-xs text-green-600 font-medium mt-2">✓ UNLOCKED</div>
                )}
              </div>

              {/* Gold - 75 points */}
              <div className={`border-2 p-4 rounded-sm text-center transition-all ${
                scores.achievements.some(a => a.level === "gold")
                  ? "border-yellow-600 bg-yellow-50"
                  : "border-muted bg-muted/20 opacity-50"
              }`} data-testid="achievement-gold">
                <div className="text-4xl mb-2">🥇</div>
                <div className="text-xs font-bold uppercase tracking-wide">High Achiever</div>
                <div className="text-xs text-muted-foreground mt-1">75 Points</div>
                {scores.achievements.some(a => a.level === "gold") && (
                  <div className="text-xs text-green-600 font-medium mt-2">✓ UNLOCKED</div>
                )}
              </div>

              {/* Platinum - 100 points */}
              <div className={`border-2 p-4 rounded-sm text-center transition-all ${
                scores.achievements.some(a => a.level === "platinum")
                  ? "border-blue-600 bg-blue-50"
                  : "border-muted bg-muted/20 opacity-50"
              }`} data-testid="achievement-platinum">
                <div className="text-4xl mb-2">💎</div>
                <div className="text-xs font-bold uppercase tracking-wide">Task Master</div>
                <div className="text-xs text-muted-foreground mt-1">100 Points</div>
                {scores.achievements.some(a => a.level === "platinum") && (
                  <div className="text-xs text-green-600 font-medium mt-2">✓ UNLOCKED</div>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {scores.monthly_score < 100 ? (
                <>Keep completing tasks to unlock more achievements! Next: {scores.next_milestone} points</>
              ) : (
                <>🎉 Congratulations! You've unlocked all achievements this month!</>
              )}
            </div>
          </div>
        )}

        {/* Date-Based Task Groups */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium tracking-tight" data-testid="grouped-tasks-heading">MY TASKS</h3>
            <Button
              onClick={() => navigate("/tasks/new")}
              data-testid="create-task-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              NEW TASK
            </Button>
          </div>

          {Object.values(groupedTasks).every(g => g.tasks.length === 0) ? (
            <div className="border border-border bg-secondary p-12 rounded-sm text-center" data-testid="no-tasks-message">
              <p className="text-muted-foreground">No tasks yet. Create your first task to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([key, group]) => {
                if (group.tasks.length === 0) return null;
                return (
                  <div key={key} className={`border-2 rounded-sm overflow-hidden ${group.color}`} data-testid={`task-group-${key}`}>
                    <div className="px-4 py-3 border-b bg-white/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{group.icon}</span>
                        <h4 className="font-bold uppercase tracking-wide">{group.label}</h4>
                        <span className="text-sm text-muted-foreground">({group.tasks.length})</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border bg-background">
                      {group.tasks.map((task) => {
                        const taskScore = getTaskScore(task.status);
                        return (
                          <div
                            key={task.id}
                            className="p-4 hover:bg-secondary/50 transition-colors"
                            data-testid={`task-item-${task.id}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h5 
                                  className="font-medium cursor-pointer hover:text-primary"
                                  onClick={() => navigate(`/tasks/${task.id}`)}
                                >
                                  {task.title}
                                </h5>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {(() => {
                                  const dueBadge = getDueBadge(task.scheduled_date);
                                  return dueBadge ? (
                                    <span className={`text-xs px-2 py-0.5 rounded-sm border ${dueBadge.colorClass}`} data-testid={`due-badge-${task.id}`}>
                                      {dueBadge.text}
                                    </span>
                                  ) : null;
                                })()}
                                <span className={`text-xs uppercase tracking-wider font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority === "super_important" ? "🔥 SUPER" : task.priority}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleTogglePin(task.id, task.is_pinned, e)}
                                  className={`h-6 w-6 p-0 rounded-sm ${task.is_pinned ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-muted-foreground hover:text-foreground"}`}
                                  title={task.is_pinned ? "Unpin task from Dashboard" : "Pin task to Dashboard"}
                                  data-testid={task.is_pinned ? `unpin-mytask-btn-${task.id}` : `pin-mytask-btn-${task.id}`}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {task.scheduled_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}
                                  </span>
                                )}
                                {task.assigned_by_name && task.created_by !== user?.id && (
                                  <span className="px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                    Assigned by {task.assigned_by_name}
                                  </span>
                                )}
                                {task.assignee_name && (
                                  <span>→ {task.assignee_name}</span>
                                )}
                              </div>
                              <Select 
                                value={task.status} 
                                onValueChange={(value) => handleStatusChange(task.id, value)}
                              >
                                <SelectTrigger 
                                  className="w-32 h-7 text-xs uppercase"
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Tasks I Assigned */}
        <div className="mb-8" data-testid="assigned-tasks-section">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-medium tracking-tight flex items-center gap-2" data-testid="assigned-tasks-heading">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                <span>TASKS I ASSIGNED</span>
                <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full ml-1" data-testid="assigned-tasks-count">
                  {assignedTasks.length}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Track and oversee tasks assigned to other team members or users.</p>
            </div>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="border border-border bg-secondary p-8 rounded-sm text-center" data-testid="no-assigned-tasks-message">
              <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground text-sm font-medium">No tasks assigned to others.</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks you assign to other users via phone number will appear here for tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedTasks.map((task) => {
                const dueBadge = getDueBadge(task.scheduled_date);
                return (
                  <div
                    key={task.id}
                    className="border border-border bg-background p-4 rounded-sm hover:border-indigo-300 transition-colors shadow-sm"
                    data-testid={`assigned-task-item-${task.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5
                          className="font-medium cursor-pointer hover:text-indigo-600 flex items-center gap-2"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <span>{task.title}</span>
                          {task.group_name && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {task.group_name}
                            </span>
                          )}
                        </h5>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {dueBadge && (
                          <span className={`text-xs px-2 py-0.5 rounded-sm border ${dueBadge.colorClass}`} data-testid={`due-badge-${task.id}`}>
                            {dueBadge.text}
                          </span>
                        )}
                        <span className={`text-xs uppercase tracking-wider font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority === "super_important" ? "🔥 SUPER" : task.priority}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleTogglePin(task.id, task.is_pinned, e)}
                          className={`h-6 w-6 p-0 rounded-sm ${task.is_pinned ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-muted-foreground hover:text-foreground"}`}
                          title={task.is_pinned ? "Unpin task from Dashboard" : "Pin task to Dashboard"}
                          data-testid={task.is_pinned ? `unpin-assigned-btn-${task.id}` : `pin-assigned-btn-${task.id}`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${task.is_pinned ? "fill-amber-500 text-amber-600" : ""}`} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {task.scheduled_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{task.scheduled_date} {task.scheduled_time && `at ${task.scheduled_time}`}</span>
                          </span>
                        )}

                        {task.assignee_name ? (
                          <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm font-medium">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Assigned to: <strong>{task.assignee_name}</strong></span>
                          </span>
                        ) : task.assignee_phone ? (
                          <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm font-medium">
                            <Phone className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Assigned to: <strong>{task.assignee_phone}</strong></span>
                          </span>
                        ) : null}

                        {task.assignee_name && task.assignee_phone && (
                          <a
                            href={`tel:${task.assignee_phone}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{task.assignee_phone}</span>
                          </a>
                        )}

                        {task.location_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{task.location_address}</span>
                          </span>
                        )}
                      </div>

                      <Select
                        value={task.status}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger
                          className="w-32 h-7 text-xs uppercase"
                          data-testid={`assigned-status-select-${task.id}`}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mt-8">
          <h3 className="text-2xl font-medium tracking-tight mb-6" data-testid="quick-actions-heading">QUICK ACTIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
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
              className="justify-start h-auto py-4"
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
              className="justify-start h-auto py-4"
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

      {/* Voice Task Creator Modal */}
      <VoiceTaskCreator
        open={showVoiceCreator}
        onOpenChange={setShowVoiceCreator}
        groups={taskGroups}
        onTaskCreated={(task) => {
          fetchDashboardData();
          toast.success("Task created via voice command!");
        }}
      />
    </div>
  );
};

export default Dashboard;