import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mic, MicOff, Loader2, Wand2, Check, X } from "lucide-react";
import { toast } from "sonner";

const VoiceTaskCreator = ({ open, onOpenChange, onTaskCreated, groups = [] }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTask, setParsedTask] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          if (finalTranscript) {
            setTranscript((prev) => prev + " " + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied. Please allow microphone access.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setParsedTask(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const parseVoiceCommand = (text) => {
    const lowerText = text.toLowerCase().trim();
    
    // Extract task title - usually the main part of the command
    let title = text.trim();
    let priority = "medium";
    let scheduledDate = null;
    let description = "";
    let groupId = null;

    // Priority detection
    if (lowerText.includes("super important") || lowerText.includes("urgent") || lowerText.includes("critical")) {
      priority = "super_important";
      title = title.replace(/super important|urgent|critical/gi, "").trim();
    } else if (lowerText.includes("high priority") || lowerText.includes("important")) {
      priority = "high";
      title = title.replace(/high priority|important/gi, "").trim();
    } else if (lowerText.includes("low priority") || lowerText.includes("not urgent")) {
      priority = "low";
      title = title.replace(/low priority|not urgent/gi, "").trim();
    }

    // Date detection
    const today = new Date();
    if (lowerText.includes("today")) {
      scheduledDate = today.toISOString().split("T")[0];
      title = title.replace(/today/gi, "").trim();
    } else if (lowerText.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduledDate = tomorrow.toISOString().split("T")[0];
      title = title.replace(/tomorrow/gi, "").trim();
    } else if (lowerText.includes("next week")) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      scheduledDate = nextWeek.toISOString().split("T")[0];
      title = title.replace(/next week/gi, "").trim();
    }

    // Group detection
    for (const group of groups) {
      if (lowerText.includes(group.name.toLowerCase())) {
        groupId = group.id;
        title = title.replace(new RegExp(group.name, "gi"), "").trim();
        break;
      }
    }

    // Clean up common phrases
    title = title
      .replace(/^(create|add|make|new|task|a task|to do|todo)\s*/gi, "")
      .replace(/\s*(for me|please|task)\s*$/gi, "")
      .trim();

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return {
      title: title || "New Task",
      description,
      priority,
      scheduled_date: scheduledDate,
      group_id: groupId,
      status: "pending"
    };
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) {
      toast.error("Please speak something first");
      return;
    }

    setIsProcessing(true);
    
    // Parse the voice command
    const parsed = parseVoiceCommand(transcript);
    
    if (!parsed.title || parsed.title === "New Task") {
      toast.error("Could not understand the task. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Automatically create the task
    try {
      const response = await axios.post(`${API}/tasks`, parsed);
      toast.success(`Task "${parsed.title}" created successfully!`, {
        description: `Priority: ${parsed.priority}${parsed.scheduled_date ? ` | Date: ${parsed.scheduled_date}` : ''}`,
        duration: 4000
      });
      onTaskCreated?.(response.data);
      handleClose();
    } catch (error) {
      toast.error("Failed to create task");
      // Fall back to edit mode if auto-save fails
      setParsedTask(parsed);
      setEditMode(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!parsedTask?.title) {
      toast.error("Task title is required");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await axios.post(`${API}/tasks`, parsedTask);
      toast.success("Task created successfully!");
      onTaskCreated?.(response.data);
      handleClose();
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setTranscript("");
    setParsedTask(null);
    setEditMode(false);
    setIsListening(false);
    recognitionRef.current?.stop();
    onOpenChange(false);
  };

  const updateParsedTask = (field, value) => {
    setParsedTask((prev) => ({ ...prev, [field]: value }));
  };

  // Check if browser supports speech recognition
  const speechSupported = typeof window !== "undefined" && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Voice Task Creator
          </DialogTitle>
          <DialogDescription>
            Speak to create a task. Try saying things like "Create a high priority task to call John tomorrow"
          </DialogDescription>
        </DialogHeader>

        {!speechSupported ? (
          <div className="text-center py-8">
            <MicOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Voice recognition is not supported in your browser. 
              Please use Chrome, Edge, or Safari.
            </p>
          </div>
        ) : !editMode ? (
          <div className="py-6">
            {/* Microphone Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={toggleListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
                data-testid="voice-mic-btn"
              >
                {isListening ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
              <p className="text-sm text-muted-foreground">
                {isListening ? "Listening... Tap to stop" : "Tap to start speaking"}
              </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="mt-6 p-4 bg-secondary rounded-sm">
                <Label className="text-xs text-muted-foreground">WHAT I HEARD:</Label>
                <p className="mt-1 text-sm">{transcript}</p>
              </div>
            )}

            {/* Process Button */}
            {transcript && !isListening && (
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleProcessVoice}
                  className="flex-1"
                  disabled={isProcessing}
                  data-testid="process-voice-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Save Task
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setTranscript("")}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Voice Command Examples */}
            <div className="mt-6 text-xs text-muted-foreground">
              <p className="font-medium mb-2">Try saying:</p>
              <ul className="space-y-1">
                <li>• "Call the dentist tomorrow"</li>
                <li>• "High priority meeting with client today"</li>
                <li>• "Buy groceries next week low priority"</li>
                <li>• "Urgent submit report by end of day"</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Edit Parsed Task */}
            <div>
              <Label>Task Title</Label>
              <Input
                value={parsedTask?.title || ""}
                onChange={(e) => updateParsedTask("title", e.target.value)}
                className="mt-1"
                data-testid="voice-task-title"
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={parsedTask?.description || ""}
                onChange={(e) => updateParsedTask("description", e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={parsedTask?.priority || "medium"}
                  onValueChange={(value) => updateParsedTask("priority", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_important">🔥 Super Important</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={parsedTask?.scheduled_date || ""}
                  onChange={(e) => updateParsedTask("scheduled_date", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {groups.length > 0 && (
              <div>
                <Label>Task Group</Label>
                <Select
                  value={parsedTask?.group_id || "none"}
                  onValueChange={(value) => updateParsedTask("group_id", value === "none" ? null : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-sm p-3 text-sm">
              <p className="text-green-800 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Ready to create this task!
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Back
              </Button>
              <Button onClick={handleCreateTask} disabled={isProcessing} data-testid="confirm-voice-task-btn">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTaskCreator;
