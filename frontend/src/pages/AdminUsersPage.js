import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, CreditCard, LogOut, ShieldCheck, LayoutDashboard, Crown, Zap, X, Eye } from "lucide-react";
import { toast } from "sonner";

const AdminUsersPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const paidParam = searchParams.get("paid");

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async (searchQuery = "", plan = null, paid = null) => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (plan) params.plan = plan;
      if (paid !== null && paid !== undefined) params.paid = paid;

      const res = await axios.get(`${API}/admin/users`, { params });
      setUsersList(res.data);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchTerm, planParam, paidParam);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, planParam, paidParam, fetchUsers]);

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

  const getActiveFilterLabel = () => {
    if (planParam === "basic") return "Showing: Basic Plan Users";
    if (planParam === "premium") return "Showing: Premium Plan Users";
    if (paidParam === "true") return "Showing: Paid Users";
    if (paidParam === "false") return "Showing: Unpaid Users";
    return null;
  };

  const activeFilterLabel = getActiveFilterLabel();

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and filter registered accounts.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Filter Indicator Badge */}
        {activeFilterLabel && (
          <div className="mb-6 inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">
            <span>{activeFilterLabel}</span>
            <button
              onClick={() => navigate("/admin/users")}
              className="p-0.5 hover:bg-primary/20 rounded-full transition-colors text-primary"
              title="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No users found matching your search/filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Paid Status</th>
                    <th className="px-6 py-3">Joined Date</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {usersList.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-2">
                        <span>{u.name}</span>
                        {u.is_admin && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 font-semibold rounded-full">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">{u.phone || "N/A"}</td>
                      <td className="px-6 py-4">
                        {u.membership_type === "premium" ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Crown className="w-3 h-3" />
                            <span>Premium ({u.membership_plan || "N/A"})</span>
                          </span>
                        ) : u.membership_type === "basic" ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Zap className="w-3 h-3" />
                            <span>Basic ({u.membership_plan || "N/A"})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_paid ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(u.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDateTime(u.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${u.id}`);
                          }}
                          className="flex items-center space-x-1 text-xs text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsersPage;
