import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const TaskFormPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isEdit = Boolean(taskId);
  
  const [loading, setLoading] = useState(false);
  const [fetchingTask, setFetchingTask] = useState(isEdit);
  const [mapPosition, setMapPosition] = useState([28.6139, 77.2090]);
  const [suggestions, setSuggestions] = useState({
    titles: [],
    assigneeNames: [],
    assigneePhones: [],
    locations: []
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_name: "",
    assignee_phone: "",
    priority: "medium",
    scheduled_date: "",
    scheduled_time: "",
    location_lat: null,
    location_lng: null,
    location_address: "",
    status: "pending"
  });

  useEffect(() => {
    if (isEdit) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`${API}/tasks/${taskId}`);
      const task = response.data;
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assignee_name: task.assignee_name || "",
        assignee_phone: task.assignee_phone || "",
        priority: task.priority || "medium",
        scheduled_date: task.scheduled_date || "",
        scheduled_time: task.scheduled_time || "",
        location_lat: task.location_lat,
        location_lng: task.location_lng,
        location_address: task.location_address || "",
        status: task.status || "pending"
      });
      if (task.location_lat && task.location_lng) {
        setMapPosition([task.location_lat, task.location_lng]);
      }
    } catch (error) {
      toast.error("Failed to fetch task");
      navigate("/tasks");
    } finally {
      setFetchingTask(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        location_lat: mapPosition[0],
        location_lng: mapPosition[1]
      };

      if (isEdit) {
        await axios.put(`${API}/tasks/${taskId}`, submitData);
        toast.success("Task updated successfully");
      } else {
        await axios.post(`${API}/tasks`, submitData);
        toast.success("Task created successfully");
      }
      navigate("/tasks");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (fetchingTask) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="taskform-logo">TASKPRO</h1>
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

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8" data-testid="form-heading">
          {isEdit ? "EDIT TASK" : "CREATE TASK"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">TASK TITLE *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="task-title-input"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">DESCRIPTION</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                data-testid="task-description-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="assignee_name">ASSIGNEE NAME</Label>
              <Input
                id="assignee_name"
                type="text"
                value={formData.assignee_name}
                onChange={(e) => setFormData({ ...formData, assignee_name: e.target.value })}
                data-testid="task-assignee-name-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="assignee_phone">ASSIGNEE PHONE</Label>
              <Input
                id="assignee_phone"
                type="tel"
                value={formData.assignee_phone}
                onChange={(e) => setFormData({ ...formData, assignee_phone: e.target.value })}
                data-testid="task-assignee-phone-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="priority">PRIORITY *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="mt-2" data-testid="task-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">STATUS *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="mt-2" data-testid="task-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduled_date">SCHEDULED DATE</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                data-testid="task-date-input"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="scheduled_time">SCHEDULED TIME</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                data-testid="task-time-input"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="location_address">LOCATION ADDRESS</Label>
              <Input
                id="location_address"
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder="Enter address or click on map"
                data-testid="task-location-input"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label>LOCATION ON MAP</Label>
              <p className="text-sm text-muted-foreground mb-2">Click on the map to select location</p>
              <div className="border border-border rounded-sm overflow-hidden" data-testid="task-map">
                <MapContainer
                  center={mapPosition}
                  zoom={13}
                  style={{ height: "400px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              data-testid="save-task-btn"
              className="uppercase tracking-wider"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "SAVING..." : isEdit ? "UPDATE TASK" : "CREATE TASK"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tasks")}
              data-testid="cancel-btn"
            >
              CANCEL
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormPage;