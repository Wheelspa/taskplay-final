import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { 
  Users, IndianRupee, CheckSquare, Zap, Crown, CreditCard, UserX, LogOut, 
  ShieldCheck, LayoutDashboard, Plus, Calendar, MapPin, Phone, Trash2, Edit, 
  CheckCircle2, Clock, Check
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboardPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchAdminTasks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API}/admin/dashboard`);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load admin tasks");
    } finally {
      setTasksLoading(false);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      toast.success(newStatus === "completed" ? "Task marked as completed! 🎉" : "Task marked as pending");
      fetchAdminTasks();
      fetchDashboardData();
    } catch (err) {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      fetchAdminTasks();
      fetchDashboardData();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    if (setUser) setUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "super_important":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Super Important</span>;
      case "high":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">High</span>;
      case "medium":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">Medium</span>;
      case "low":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Low</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{priority}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-primary font-bold text-xl">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <span>TaskPlay Admin</span>
              </div>
              <nav className="flex space-x-2 ml-6">
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary flex items-center space-x-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/payments"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium hidden sm:inline-block">
                {user?.name || "Admin"} ({user?.email})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time statistics and analytics for TaskPlay local testing.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div
                onClick={() => navigate("/admin/users")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.total_users ?? 0}</h3>
                </div>
              </div>

              {/* Total Revenue */}
              <div
                onClick={() => navigate("/admin/payments")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                  <IndianRupee className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue (in ₹)</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ₹{(data?.total_revenue ?? 0).toLocaleString('en-IN')}
                  </h3>
                </div>
              </div>

              {/* Total Tasks */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.total_tasks ?? 0}</h3>
                </div>
              </div>

              {/* Basic Users */}
              <div
                onClick={() => navigate("/admin/users?plan=basic")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Basic Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.basic_users_count ?? 0}</h3>
                </div>
              </div>

              {/* Premium Users */}
              <div
                onClick={() => navigate("/admin/users?plan=premium")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Premium Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.premium_users_count ?? 0}</h3>
                </div>
              </div>

              {/* Paid Users */}
              <div
                onClick={() => navigate("/admin/users?paid=true")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Paid Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.paid_users_count ?? 0}</h3>
                </div>
              </div>

              {/* Unpaid Users */}
              <div
                onClick={() => navigate("/admin/users?paid=false")}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
                  <UserX className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unpaid Users</p>
                  <h3 className="text-2xl font-bold text-gray-900">{data?.unpaid_users_count ?? 0}</h3>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Admin Personal Task Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span>My Personal Tasks</span>
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage, track, and complete your tasks directly from the admin panel.</p>
            </div>
            <Button
              onClick={() => navigate("/tasks/new?returnTo=/admin/dashboard")}
              className="bg-primary hover:bg-primary/90 text-white flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </Button>
          </div>

          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-3">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-medium text-gray-700">No tasks created yet</p>
              <p className="text-sm text-gray-500">Click "Add New Task" above to create your first personal task.</p>
              <Button
                onClick={() => navigate("/tasks/new?returnTo=/admin/dashboard")}
                variant="outline"
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isCompleted
                        ? "bg-gray-50 border-gray-200 opacity-75"
                        : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleStatusChange(task.id, task.status)}
                          className={`mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-gray-300 hover:border-primary"
                          }`}
                          title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`font-semibold text-base ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                              {task.title}
                            </h3>
                            {getPriorityBadge(task.priority)}
                            {task.group_name && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {task.group_name}
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className={`text-sm ${isCompleted ? "text-gray-400" : "text-gray-600"}`}>
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                            {task.scheduled_date && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{task.scheduled_date} {task.scheduled_time ? `at ${task.scheduled_time}` : ""}</span>
                              </span>
                            )}

                            {task.assignee_name && (
                              <span className="flex items-center space-x-1">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <span>Assignee: {task.assignee_name}</span>
                              </span>
                            )}

                            {task.assignee_phone && (
                              <a
                                href={`tel:${task.assignee_phone}`}
                                className="flex items-center space-x-1 text-blue-600 hover:underline"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{task.assignee_phone}</span>
                              </a>
                            )}

                            {task.location_address && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{task.location_address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/tasks/${task.id}/edit?returnTo=/admin/dashboard`)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          title="Edit Task"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
