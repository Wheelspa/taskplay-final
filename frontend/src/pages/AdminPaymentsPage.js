import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, LogOut, ShieldCheck, LayoutDashboard, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const AdminPaymentsPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API}/admin/payments`);
      setPaymentsList(res.data);
    } catch (err) {
      toast.error("Failed to load payment records");
    } finally {
      setLoading(false);
    }
  };

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
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoStr;
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/payments"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary flex items-center space-x-1"
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Records</h1>
          <p className="text-sm text-gray-500 mt-1">History of membership purchases and upgrades.</p>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No payment records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">User Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {paymentsList.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.user_name}</td>
                      <td className="px-6 py-4">{p.user_email}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{p.membership_plan}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600 flex items-center space-x-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{p.amount?.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(p.date)}</td>
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

export default AdminPaymentsPage;
