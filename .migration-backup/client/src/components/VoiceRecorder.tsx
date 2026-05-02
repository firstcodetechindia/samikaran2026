import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Play, Square, AlertCircle, Volume2, RotateCcw, Keyboard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VoiceRecorderProps {
  attemptId: number;
  questionId: number;
  maxDuration: number; // seconds
  allowTextFallback: boolean;
  onRecordingComplete: (audioBlob: Blob | null, textAnswer?: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "requesting_permission" | "ready" | "recording" | "recorded" | "playing";

export function VoiceRecorder({
  attemptId,
  questionId,
  maxDuration = 60,
  allowTextFallback = true,
  onRecordingComplete,
  disabled = false,
}: VoiceRecorderProps) {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedTime, setRecordedTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const requestMicPermission = async () => {
    setRecordingState("requesting_permission");
    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setRecordingState("ready");
    } catch (err: any) {
      console.error("Mic permission error:", err);
      setMicError(err.message || "Failed to access microphone");
      setRecordingState("idle");
      
      if (allowTextFallback) {
        toast({
          title: "Microphone not available",
          description: "You can type your answer instead.",
          variant: "destructive"
        });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Use the MediaRecorder's actual mimeType for consistency
        const actualMimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState("recorded");
        stream.getTracks().forEach(track => track.stop());
        
        // Process voice answer through backend
        await processVoiceAnswer(blob);
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setRecordedTime(0);

      timerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Recording error:", err);
      setMicError(err.message || "Failed to start recording");
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const processVoiceAnswer = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64 for API transmission
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
      const audioData = await base64Promise;

      // Send to backend for processing
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/process-voice`, {
        questionId,
        audioBase64: audioData,
        mimeType: blob.type
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.id) {
        // Successfully processed - result contains the answer with evaluation
        toast({
          title: "Voice answer processed",
          description: result.transcript 
            ? `Transcribed: "${result.transcript.substring(0, 50)}${result.transcript.length > 50 ? '...' : ''}"`
            : "Your answer has been recorded and evaluated."
        });
        onRecordingComplete(blob);
      } else {
        toast({
          title: "Processing failed",
          description: result.message || "Could not process your voice answer. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Voice processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process voice answer. Please try again or use text input.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = () => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setRecordingState("recorded");
    }
    
    audioRef.current.play();
    setRecordingState("playing");
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRecordingState("recorded");
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      onRecordingComplete(null, textAnswer.trim());
      toast({ title: "Answer saved", description: "Your text answer has been submitted." });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = (recordedTime / maxDuration) * 100;

  // Text fallback mode
  if (useTextFallback) {
    return (
      <Card className="border-violet-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-sm">Text Answer</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseTextFallback(false)}
              data-testid="button-switch-to-voice"
            >
              <Mic className="w-4 h-4 mr-1" /> Use Voice
            </Button>
          </div>
          <Textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px]"
            disabled={disabled}
            data-testid="textarea-voice-fallback"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleTextSubmit}
              disabled={!textAnswer.trim() || disabled}
              data-testid="button-submit-text-answer"
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 transition-all",
      recordingState === "recording" ? "border-red-400 bg-red-50" : "border-violet-200"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Mic className={cn(
              "w-5 h-5",
              recordingState === "recording" ? "text-red-600 animate-pulse" : "text-violet-600"
            )} />
            <span className="font-medium text-sm">Voice Answer</span>
            {recordingState === "recording" && (
              <Badge variant="destructive" className="animate-pulse text-xs">Recording</Badge>
            )}
            {recordingState === "recorded" && (
              <Badge className="bg-green-100 text-green-700 text-xs">Recorded</Badge>
            )}
          </div>
          {allowTextFallback && recordingState !== "recording" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => setUseTextFallback(true)}
              data-testid="button-switch-to-text"
            >
              <Keyboard className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Type Instead</span><span className="sm:hidden">Text</span>
            </Button>
          )}
        </div>

        {/* Error State */}
        {micError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{micError}</span>
          </div>
        )}

        {/* Recording UI */}
        <div className="flex flex-col items-center py-4 space-y-4">
          {/* Time Display */}
          {(recordingState === "recording" || recordingState === "recorded" || recordingState === "playing") && (
            <div className="text-center">
              <div className={cn(
                "text-2xl sm:text-3xl font-mono font-bold",
                recordingState === "recording" && recordedTime > maxDuration - 10 ? "text-red-600" : "text-gray-700"
              )}>
                {formatTime(recordedTime)}
              </div>
              {recordingState === "recording" && (
                <p className="text-xs text-muted-foreground">Max: {formatTime(maxDuration)}</p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {recordingState === "recording" && (
            <Progress value={progressPercent} className="h-2 w-36 sm:w-48" />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {recordingState === "idle" && (
              <Button
                onClick={requestMicPermission}
                size="lg"
                className="gap-2 bg-violet-600 hover:bg-violet-700"
                disabled={disabled}
                data-testid="button-request-mic"
              >
                <Mic className="w-5 h-5" />
                Enable Microphone
              </Button>
            )}

            {recordingState === "requesting_permission" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent" />
                Requesting permission...
              </div>
            )}

            {recordingState === "ready" && (
              <Button
                onClick={startRecording}
                size="lg"
                className="gap-2 bg-red-600 hover:bg-red-700 rounded-full w-16 h-16"
                disabled={disabled}
                data-testid="button-start-recording"
              >
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "recording" && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="gap-2 rounded-full w-16 h-16"
                data-testid="button-stop-recording"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}

            {recordingState === "recorded" && !isProcessing && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={playRecording}
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  data-testid="button-play-recording"
                >
                  <Play className="w-5 h-5" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  Click to listen
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-violet-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing your answer...</span>
                </div>
                <p className="text-xs text-muted-foreground">Transcribing and evaluating</p>
              </div>
            )}

            {recordingState === "playing" && (
              <Button
                onClick={stopPlayback}
                size="icon"
                variant="outline"
                className="rounded-full w-12 h-12"
                data-testid="button-stop-playback"
              >
                <Square className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Ready Prompt */}
          {recordingState === "ready" && (
            <p className="text-sm text-muted-foreground text-center">
              Click the button above to start recording your answer
            </p>
          )}

          {/* Recorded Status */}
          {recordingState === "recorded" && (
            <div className="flex items-center gap-2 text-green-600">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">Answer recorded successfully</span>
            </div>
          )}
        </div>

        {/* Duration Note */}
        {recordingState === "idle" || recordingState === "ready" ? (
          <p className="text-xs text-center text-muted-foreground">
            Maximum recording duration: {formatTime(maxDuration)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default VoiceRecorder;
