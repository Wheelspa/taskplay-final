import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";
import CalendarView from "./pages/CalendarView";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TaskListPage from "./pages/TaskListPage";
import TaskFormPage from "./pages/TaskFormPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import UpgradePage from "./pages/UpgradePage";
import TaskGroupsPage from "./pages/TaskGroupsPage";
import ChecklistPage from "./pages/ChecklistPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getAuthToken = () => localStorage.getItem("token");

export const setAuthToken = (token) => {
  localStorage.setItem("token", token);
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
};

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const PremiumRoute = ({ children, user }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  // If user is basic, redirect to upgrade page
  if (user && user.membership_type === "basic") {
    return <Navigate to="/upgrade?feature=calendar" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setAuthToken(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      removeAuthToken();
    } finally {
      setLoading(false);
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
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PremiumRoute user={user}>
                <CalendarView user={user} setUser={setUser} />
              </PremiumRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute>
                <TeamDetailPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <UpgradePage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <TaskGroupsPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklists"
            element={
              <ProtectedRoute>
                <ChecklistPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskListPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <ProtectedRoute>
                <TaskFormPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:taskId/edit"
            element={
              <ProtectedRoute>
                <TaskFormPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <ProtectedRoute>
                <TaskDetailPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLoginPage setUser={setUser} />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute user={user}>
                <AdminDashboardPage user={user} setUser={setUser} />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute user={user}>
                <AdminUsersPage user={user} setUser={setUser} />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminProtectedRoute user={user}>
                <AdminUserDetailPage user={user} setUser={setUser} />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminProtectedRoute user={user}>
                <AdminPaymentsPage user={user} setUser={setUser} />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;