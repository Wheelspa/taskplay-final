import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CreditCard,
  Tag,
  LogOut,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const AdminCouponsPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [couponsList, setCouponsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const defaultForm = {
    code: "",
    discount_percent: 100,
    allowed_email: "",
    max_uses: "1",
    expires_at: "",
    is_active: true
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/admin/coupons`);
      setCouponsList(res.data);
    } catch (err) {
      toast.error("Failed to load coupons");
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

  const handleToggleActive = async (coupon) => {
    const updatedStatus = !coupon.is_active;
    try {
      await axios.put(`${API}/admin/coupons/${coupon.id}`, {
        is_active: updatedStatus
      });
      setCouponsList((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: updatedStatus } : c))
      );
      toast.success(`Coupon "${coupon.code}" marked as ${updatedStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update coupon status");
      fetchCoupons();
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/coupons/${coupon.id}`);
      setCouponsList((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success(`Coupon "${coupon.code}" deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete coupon");
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCreateError("");

    const codeClean = formData.code.trim().toUpperCase();
    if (!codeClean) {
      setCreateError("Please enter a coupon code");
      return;
    }

    const discountNum = parseInt(formData.discount_percent, 10);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      setCreateError("Discount percentage must be between 1 and 100");
      return;
    }

    const emailClean = formData.allowed_email.trim().toLowerCase();
    const maxUsesVal = formData.max_uses !== "" ? parseInt(formData.max_uses, 10) : null;

    if (discountNum === 100 && !emailClean && (!maxUsesVal || maxUsesVal <= 0)) {
      setCreateError("A 100% discount coupon must specify either an allowed email or a maximum usage limit.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: codeClean,
        discount_percent: discountNum,
        allowed_email: emailClean || null,
        max_uses: maxUsesVal && maxUsesVal > 0 ? maxUsesVal : null,
        expires_at: formData.expires_at ? new Date(`${formData.expires_at}T23:59:59`).toISOString() : null,
        is_active: formData.is_active
      };

      await axios.post(`${API}/admin/coupons`, payload);
      toast.success(`Coupon "${codeClean}" created successfully!`);
      setIsCreateOpen(false);
      setFormData(defaultForm);
      fetchCoupons();
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to create coupon. Please check your inputs.";
      setCreateError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Never";
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

  const isExpired = (isoStr) => {
    if (!isoStr) return false;
    try {
      return new Date(isoStr) < new Date();
    } catch {
      return false;
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
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center space-x-1"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                </Link>
                <Link
                  to="/admin/coupons"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary flex items-center space-x-1"
                >
                  <Tag className="w-4 h-4" />
                  <span>Coupons</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons & Access Codes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage discount codes and create 100% free access passes for users.
            </p>
          </div>
          <Button
            onClick={() => {
              setFormData(defaultForm);
              setCreateError("");
              setIsCreateOpen(true);
            }}
            className="flex items-center space-x-2"
            data-testid="create-coupon-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </Button>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : couponsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No coupons found. Click "Create Coupon" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3">Allowed Email</th>
                    <th className="px-6 py-3">Usage</th>
                    <th className="px-6 py-3">Expiry</th>
                    <th className="px-6 py-3">Active</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {couponsList.map((c) => {
                    const expired = isExpired(c.expires_at);
                    const maxReached = c.max_uses !== null && c.used_count >= c.max_uses;

                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 tracking-wider">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {c.discount_percent === 100 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              100% Free
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {c.discount_percent}% Off
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {c.allowed_email ? (
                            <span className="font-medium text-gray-900">{c.allowed_email}</span>
                          ) : (
                            <span className="text-gray-400 italic">Anyone</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{c.used_count}</span>
                          <span className="text-gray-500"> / {c.max_uses !== null ? c.max_uses : "∞"}</span>
                          {maxReached && (
                            <span className="ml-2 text-xs text-amber-600 font-medium">
                              (Limit reached)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span>{formatDate(c.expires_at)}</span>
                          {expired && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={c.is_active}
                              onCheckedChange={() => handleToggleActive(c)}
                              aria-label={`Toggle active status for ${c.code}`}
                            />
                            <span className={`text-xs font-medium ${c.is_active ? "text-emerald-700" : "text-gray-400"}`}>
                              {c.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(c)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Coupon Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a promo discount or 100% free access code.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <Label htmlFor="coupon-code">Coupon Code *</Label>
              <Input
                id="coupon-code"
                type="text"
                placeholder="e.g. SPECIAL100"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value.toUpperCase() });
                  setCreateError("");
                }}
                required
                className="font-mono mt-1"
                data-testid="create-coupon-code-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="coupon-discount">Discount % *</Label>
                <Input
                  id="coupon-discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => {
                    setFormData({ ...formData, discount_percent: e.target.value });
                    setCreateError("");
                  }}
                  required
                  className="mt-1"
                  data-testid="create-coupon-discount-input"
                />
              </div>

              <div>
                <Label htmlFor="coupon-max-uses">Max Uses (optional)</Label>
                <Input
                  id="coupon-max-uses"
                  type="number"
                  min="1"
                  placeholder="e.g. 1 (blank for ∞)"
                  value={formData.max_uses}
                  onChange={(e) => {
                    setFormData({ ...formData, max_uses: e.target.value });
                    setCreateError("");
                  }}
                  className="mt-1"
                  data-testid="create-coupon-maxuses-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coupon-email">Allowed Email (optional)</Label>
              <Input
                id="coupon-email"
                type="email"
                placeholder="user@example.com (leave blank for any email)"
                value={formData.allowed_email}
                onChange={(e) => {
                  setFormData({ ...formData, allowed_email: e.target.value });
                  setCreateError("");
                }}
                className="mt-1"
                data-testid="create-coupon-email-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Restricts redemption strictly to this email address.
              </p>
            </div>

            <div>
              <Label htmlFor="coupon-expiry">Expiry Date (optional)</Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={formData.expires_at}
                onChange={(e) => {
                  setFormData({ ...formData, expires_at: e.target.value });
                  setCreateError("");
                }}
                className="mt-1"
                data-testid="create-coupon-expiry-input"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="coupon-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="coupon-active" className="cursor-pointer">
                Active immediately upon creation
              </Label>
            </div>

            {parseInt(formData.discount_percent, 10) === 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800">
                <strong>Rule:</strong> 100% Free coupons must have an <strong>Allowed Email</strong> or a <strong>Max Uses</strong> limit specified.
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="submit-create-coupon-btn">
                {submitting ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouponsPage;
