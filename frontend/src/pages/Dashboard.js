import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListTodo, Calendar, CalendarDays, Clock, CheckCircle2, AlertCircle, LogOut, Plus, Bell, X, Trophy, Target, TrendingUp, Award, Sparkles, Users, Crown, Zap, CreditCard } from "lucide-react";
import { toast } from "sonner";

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [criticalTasks, setCriticalTasks] = useState([]);
  const [scores, setScores] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [previousScore, setPreviousScore] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, tasksResponse, scoresResponse] = await Promise.all([
        axios.get(`${API}/tasks/stats/overview`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/tasks/stats/scores`)
      ]);
      setStats(statsResponse.data);
      setRecentTasks(tasksResponse.data.slice(0, 5));
      
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
              <h1 className="text-2xl font-bold tracking-tight" data-testid="dashboard-logo">TASKPRO</h1>
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
              <Button
                variant="outline"
                onClick={() => navigate("/calendar")}
                data-testid="calendar-view-btn"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                CALENDAR
              </Button>
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
          
          {/* Add Task Button Below Logo */}
          <div>
            <Button
              onClick={() => navigate("/tasks/new")}
              size="lg"
              className="uppercase tracking-wider"
              data-testid="quick-add-task-btn"
            >
              <Plus className="w-5 h-5 mr-2" />
              ADD NEW TASK
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
                </div>
              ) : !user?.membership_type && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/auth?mode=register")}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medium tracking-tight" data-testid="recent-tasks-heading">RECENT TASKS</h3>
              <div className="flex gap-2">
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