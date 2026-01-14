import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CalendarView from "./pages/CalendarView";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TaskListPage from "./pages/TaskListPage";
import TaskFormPage from "./pages/TaskFormPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import UpgradePage from "./pages/UpgradePage";
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
              <ProtectedRoute>
                <CalendarView user={user} setUser={setUser} />
              </ProtectedRoute>
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
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;