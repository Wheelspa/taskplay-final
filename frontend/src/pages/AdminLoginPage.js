import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, setAuthToken, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminLoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user } = response.data;

      if (user && user.is_admin) {
        setAuthToken(access_token);
        if (setUser) setUser(user);
        toast.success("Admin login successful!");
        navigate("/admin/dashboard");
      } else {
        removeAuthToken();
        if (setUser) setUser(null);
        toast.error("This account does not have admin access");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Admin login failed";
      toast.error(errorMsg);
      removeAuthToken();
      if (setUser) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border border-border">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            ADMIN PORTAL
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with your admin credentials
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="admin-password">Password</Label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-medium text-primary hover:underline"
                data-testid="admin-forgot-password-link"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Admin Panel"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
