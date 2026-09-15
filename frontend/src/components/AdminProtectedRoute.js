import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../App";

const AdminProtectedRoute = ({ children, user }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user && !user.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default AdminProtectedRoute;
