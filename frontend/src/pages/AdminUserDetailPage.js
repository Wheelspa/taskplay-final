import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Users,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Crown,
  Zap,
  Calendar,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  ListTodo,
  UserCheck,
  Pin
} from "lucide-react";
import { toast } from "sonner";

const AdminUserDetailPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [userData, setUserData] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users/${userId}`);
      setUserData(res.data.user);
      setUserTasks(res.data.tasks || []);
    } catch (err) {
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const handleLogout = () => {
    removeAuthToken();
    if (setUser) setUser(null);
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      return new Date(isoStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "Never logged in";
    try {
      return new Date(isoStr).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "super_important":
        return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">🔥 Super</span>;
      case "high":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full border border-orange-200">High</span>;
      case "medium":
        return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full border border-amber-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">Completed</span>;
      case "in_progress":
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">In Progress</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Pending</span>;
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary flex items-center space-x-1"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/users")}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : !userData ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
              User details not found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Overview Header */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                      {userData.is_admin && (
                        <span className="px-2.5 py-0.5 text-xs bg-purple-100 text-purple-700 font-semibold rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {userData.is_paid ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Subscription (Paid)
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                      Free / Unpaid
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Meta Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Mail className="w-4 h-4 mr-1.5 text-primary" />
                    <span>Contact Info</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{userData.email}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    <span>{userData.phone || "No phone listed"}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Crown className="w-4 h-4 mr-1.5 text-purple-600" />
                    <span>Membership Plan</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 capitalize">
                    {userData.membership_type === "premium" ? (
                      <span className="text-purple-700 flex items-center space-x-1">
                        <Crown className="w-4 h-4 inline mr-1" />
                        Premium ({userData.membership_plan || "Standard"})
                      </span>
                    ) : userData.membership_type === "basic" ? (
                      <span className="text-blue-700 flex items-center space-x-1">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Basic ({userData.membership_plan || "Standard"})
                      </span>
                    ) : (
                      "Free Plan"
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Status: {userData.is_paid ? "Paid" : "Unpaid"}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
                    <span>Activity Log</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Joined:</span> {formatDate(userData.created_at)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-gray-700">Last Login:</span>{" "}
                    <span className={userData.last_login ? "text-gray-900 font-medium" : "text-amber-600"}>
                      {formatDateTime(userData.last_login)}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                    <ListTodo className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>Tasks Stats</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userTasks.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total associated tasks</div>
                </div>
              </div>

              {/* Tasks List Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <ListTodo className="w-5 h-5 text-primary" />
                    <span>User's Tasks ({userTasks.length})</span>
                  </h2>
                </div>

                {userTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No tasks found for this user.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Task Title</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Priority</th>
                          <th className="px-6 py-3">Scheduled Date</th>
                          <th className="px-6 py-3">Assignment Info</th>
                          <th className="px-6 py-3">Pinned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                        {userTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              <div>{t.title}</div>
                              {t.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{t.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(t.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPriorityBadge(t.priority)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                              {t.scheduled_date ? (
                                <span>{t.scheduled_date} {t.scheduled_time && `at ${t.scheduled_time}`}</span>
                              ) : (
                                <span className="text-gray-400">No date</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600">
                              {t.assigned_by_name && (
                                <div className="text-indigo-600 font-medium">Assigned by: {t.assigned_by_name}</div>
                              )}
                              {t.assignee_name && (
                                <div>Assignee: {t.assignee_name}</div>
                              )}
                              {t.assignee_phone && (
                                <div className="text-gray-400">Phone: {t.assignee_phone}</div>
                              )}
                              {!t.assigned_by_name && !t.assignee_name && (
                                <span className="text-gray-400">Self created</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              {t.is_pinned ? (
                                <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                  <Pin className="w-3 h-3 mr-1 fill-amber-500" /> Pinned
                                </span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUserDetailPage;
