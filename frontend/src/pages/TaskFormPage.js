import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, removeAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogOut, ArrowLeft, Save, Search, MapPin } from "lucide-react";
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
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState([28.6139, 77.2090]);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
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
    fetchSuggestions();
    if (isEdit) {
      fetchTask();
    }
  }, [taskId]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      const tasks = response.data;
      
      // Extract unique suggestions from existing tasks
      const uniqueTitles = [...new Set(tasks.map(t => t.title).filter(Boolean))];
      const uniqueNames = [...new Set(tasks.map(t => t.assignee_name).filter(Boolean))];
      const uniquePhones = [...new Set(tasks.map(t => t.assignee_phone).filter(Boolean))];
      const uniqueLocations = [...new Set(tasks.map(t => t.location_address).filter(Boolean))];
      
      // Add common templates if no previous tasks exist
      const commonTitles = [
        "Complete project report",
        "Review documents",
        "Client meeting",
        "Follow up call",
        "Site visit",
        "Team briefing",
        "Prepare presentation",
        "Update database",
        "Send quotation",
        "Contract signing"
      ];
      
      const finalTitles = uniqueTitles.length > 0 ? uniqueTitles : commonTitles;
      
      setSuggestions({
        titles: finalTitles,
        assigneeNames: uniqueNames,
        assigneePhones: uniquePhones,
        locations: uniqueLocations
      });
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  const searchLocation = async () => {
    if (!locationSearch.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    setSearchingLocation(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding API
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&limit=1`
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setMapPosition([lat, lng]);
        setFormData({
          ...formData,
          location_address: result.display_name,
          location_lat: lat,
          location_lng: lng
        });
        
        toast.success("Location found!");
      } else {
        toast.error("Location not found. Try a different search.");
      }
    } catch (error) {
      toast.error("Failed to search location");
      console.error("Location search error:", error);
    } finally {
      setSearchingLocation(false);
    }
  };

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
        setShowMap(true); // Show map if task has location data
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
        // Only include location coordinates if map is shown
        location_lat: showMap ? mapPosition[0] : null,
        location_lng: showMap ? mapPosition[1] : null
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
                list="title-suggestions"
                placeholder="e.g., Complete project report, Review documents..."
              />
              <datalist id="title-suggestions">
                {suggestions.titles.map((title, idx) => (
                  <option key={idx} value={title} />
                ))}
              </datalist>
              {suggestions.titles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 {suggestions.titles.length} suggestion(s) available - start typing to see them
                </p>
              )}
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
                list="assignee-name-suggestions"
                placeholder="e.g., John Doe, Sarah Smith..."
              />
              <datalist id="assignee-name-suggestions">
                {suggestions.assigneeNames.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
              {suggestions.assigneeNames.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 {suggestions.assigneeNames.length} name(s) from previous tasks
                </p>
              )}
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
                list="assignee-phone-suggestions"
                placeholder="e.g., 9876543210"
              />
              <datalist id="assignee-phone-suggestions">
                {suggestions.assigneePhones.map((phone, idx) => (
                  <option key={idx} value={phone} />
                ))}
              </datalist>
              {suggestions.assigneePhones.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 {suggestions.assigneePhones.length} phone(s) from previous tasks
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">PRIORITY *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="mt-2" data-testid="task-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_important">🔥 Super Important</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                💡 Super Important tasks will trigger an alert popup on dashboard
              </p>
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
              <Select 
                value={formData.scheduled_time} 
                onValueChange={(value) => setFormData({ ...formData, scheduled_time: value })}
              >
                <SelectTrigger className="mt-2" data-testid="task-time-select">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="08:00">08:00 AM</SelectItem>
                  <SelectItem value="08:30">08:30 AM</SelectItem>
                  <SelectItem value="09:00">09:00 AM</SelectItem>
                  <SelectItem value="09:30">09:30 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="10:30">10:30 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="11:30">11:30 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="12:30">12:30 PM</SelectItem>
                  <SelectItem value="13:00">01:00 PM</SelectItem>
                  <SelectItem value="13:30">01:30 PM</SelectItem>
                  <SelectItem value="14:00">02:00 PM</SelectItem>
                  <SelectItem value="14:30">02:30 PM</SelectItem>
                  <SelectItem value="15:00">03:00 PM</SelectItem>
                  <SelectItem value="15:30">03:30 PM</SelectItem>
                  <SelectItem value="16:00">04:00 PM</SelectItem>
                  <SelectItem value="16:30">04:30 PM</SelectItem>
                  <SelectItem value="17:00">05:00 PM</SelectItem>
                  <SelectItem value="17:30">05:30 PM</SelectItem>
                  <SelectItem value="18:00">06:00 PM</SelectItem>
                  <SelectItem value="18:30">06:30 PM</SelectItem>
                  <SelectItem value="19:00">07:00 PM</SelectItem>
                  <SelectItem value="19:30">07:30 PM</SelectItem>
                  <SelectItem value="20:00">08:00 PM</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                💡 Select from 30-minute time slots
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label htmlFor="location_address">LOCATION ADDRESS</Label>
                  <p className="text-xs text-muted-foreground mt-1">Optional - Add a location for this task</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Show Map</span>
                  <Switch
                    checked={showMap}
                    onCheckedChange={setShowMap}
                    data-testid="toggle-map-switch"
                  />
                </div>
              </div>
              <Input
                id="location_address"
                type="text"
                value={formData.location_address}
                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                placeholder="Enter address manually or enable map to pick location"
                data-testid="task-location-input"
                className="mt-2"
                list="location-suggestions"
              />
              <datalist id="location-suggestions">
                {suggestions.locations.map((location, idx) => (
                  <option key={idx} value={location} />
                ))}
              </datalist>
              {suggestions.locations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 {suggestions.locations.length} location(s) from previous tasks
                </p>
              )}
            </div>

            {showMap && (
              <div className="md:col-span-2">
                <Label>LOCATION ON MAP</Label>
                <p className="text-sm text-muted-foreground mb-3">Search for a location or click on the map to select</p>
                
                {/* Location Search Bar */}
                <div className="flex gap-2 mb-3">
                  <Input
                    type="text"
                    placeholder="Search location (e.g., Times Square, New York or Mumbai, India)"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                    data-testid="location-search-input"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={searchLocation}
                    disabled={searchingLocation}
                    data-testid="search-location-btn"
                  >
                    {searchingLocation ? "SEARCHING..." : "SEARCH"}
                  </Button>
                </div>

                <div className="border border-border rounded-sm overflow-hidden" data-testid="task-map">
                  <MapContainer
                    center={mapPosition}
                    zoom={13}
                    style={{ height: "400px", width: "100%" }}
                    key={`${mapPosition[0]}-${mapPosition[1]}`}
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
            )}
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