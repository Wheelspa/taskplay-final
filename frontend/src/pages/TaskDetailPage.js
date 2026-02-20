import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Phone, MapPin, LogOut, ArrowLeft, Edit, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const TaskDetailPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`${API}/tasks/${taskId}`);
      setTask(response.data);
    } catch (error) {
      toast.error("Failed to fetch task");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      navigate("/tasks");
    } catch (error) {
      toast.error("Failed to delete task");
      setDeleting(false);
    }
  };

  const handleCall = () => {
    if (task?.assignee_phone) {
      window.location.href = `tel:${task.assignee_phone}`;
    }
  };

  const handleOpenMap = () => {
    if (task?.location_lat && task?.location_lng) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${task.location_lat},${task.location_lng}`,
        "_blank"
      );
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
      case "high":
        return "text-accent border-accent/30 bg-accent/10";
      case "medium":
        return "text-orange-500 border-orange-500/30 bg-orange-500/10";
      case "low":
        return "text-green-500 border-green-500/30 bg-green-500/10";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 border-green-600/30 bg-green-600/10";
      case "in_progress":
        return "text-blue-600 border-blue-600/30 bg-blue-600/10";
      case "pending":
        return "text-orange-600 border-orange-600/30 bg-orange-600/10";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Task not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="taskdetail-logo">TASKPLAY</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/tasks")}
              data-testid="back-to-tasks-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              TASKS
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
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`text-xs uppercase tracking-wider font-medium px-3 py-1 rounded-sm border ${getStatusColor(task.status)}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" data-testid="task-title">
              {task.title}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/tasks/${taskId}/edit`)}
              data-testid="edit-task-btn"
            >
              <Edit className="w-4 h-4 mr-2" />
              EDIT
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="delete-task-btn">
                  <Trash2 className="w-4 h-4 mr-2" />
                  DELETE
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="cancel-delete-btn">CANCEL</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    data-testid="confirm-delete-btn"
                  >
                    {deleting ? "DELETING..." : "DELETE"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {task.description && (
              <div className="border border-border bg-secondary p-6 rounded-sm">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">DESCRIPTION</h3>
                <p className="text-base leading-relaxed" data-testid="task-description">{task.description}</p>
              </div>
            )}

            {(task.scheduled_date || task.scheduled_time) && (
              <div className="border border-border bg-secondary p-6 rounded-sm">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">SCHEDULE</h3>
                <div className="space-y-2">
                  {task.scheduled_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-medium" data-testid="task-date">{task.scheduled_date}</span>
                    </div>
                  )}
                  {task.scheduled_time && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium" data-testid="task-time">{task.scheduled_time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(task.location_lat && task.location_lng) && (
              <div className="border border-border bg-secondary p-6 rounded-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm uppercase tracking-wide text-muted-foreground">LOCATION</h3>
                  <Button
                    size="sm"
                    onClick={handleOpenMap}
                    data-testid="open-map-btn"
                  >
                    OPEN IN MAPS
                  </Button>
                </div>
                {task.location_address && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <p className="font-medium" data-testid="task-location-address">{task.location_address}</p>
                  </div>
                )}
                <div className="border border-border rounded-sm overflow-hidden" data-testid="task-map-view">
                  <MapContainer
                    center={[task.location_lat, task.location_lng]}
                    zoom={13}
                    style={{ height: "300px", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[task.location_lat, task.location_lng]} />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {(task.assignee_name || task.assignee_phone) && (
              <div className="border border-border bg-secondary p-6 rounded-sm">
                <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">ASSIGNEE</h3>
                <div className="space-y-3">
                  {task.assignee_name && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">NAME</p>
                      <p className="font-medium" data-testid="task-assignee-name">{task.assignee_name}</p>
                    </div>
                  )}
                  {task.assignee_phone && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PHONE</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium" data-testid="task-assignee-phone">{task.assignee_phone}</p>
                        <Button
                          size="sm"
                          onClick={handleCall}
                          data-testid="call-btn"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          CALL
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-border bg-secondary p-6 rounded-sm">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">METADATA</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CREATED</p>
                  <p data-testid="task-created-at">{new Date(task.created_at).toLocaleString()}</p>
                </div>
                {task.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">UPDATED</p>
                    <p data-testid="task-updated-at">{new Date(task.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;