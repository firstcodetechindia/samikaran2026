"""
Advanced AI Proctoring Microservice
Features: Face detection, Eye gaze tracking, Head pose estimation, Object detection
"""

import base64
import io
import time
import math
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Advanced AI Proctoring Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')

user_frame_history: Dict[str, Dict[str, Any]] = {}
user_behavior_history: Dict[str, Dict[str, Any]] = {}

BRIGHTNESS_LOW_THRESHOLD = 30
BRIGHTNESS_HIGH_THRESHOLD = 250
VARIANCE_THRESHOLD = 100
FREEZE_DIFF_THRESHOLD = 500
FACE_CONFIDENCE_THRESHOLD = 0.5
GAZE_DEVIATION_THRESHOLD = 0.25
HEAD_TURN_THRESHOLD = 0.15
LOOKING_AWAY_FRAMES_THRESHOLD = 3


class AnalyzeRequest(BaseModel):
    image: str
    user_id: str
    exam_id: str
    timestamp: Optional[str] = None


class AdvancedAnalyzeResponse(BaseModel):
    camera_status: str
    face_detected: bool
    face_count: int
    has_multiple_faces: bool
    face_confidence: float
    brightness_score: float
    frame_variance_score: float
    confidence_score: float
    violation_type: Optional[str]
    violation_severity: Optional[str]
    message: str
    eye_gaze: Optional[Dict[str, Any]] = None
    head_pose: Optional[Dict[str, Any]] = None
    behavior_analysis: Optional[Dict[str, Any]] = None
    trust_score: float = 100.0
    warnings: List[str] = []


def convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    return obj


def decode_image(image_data: str) -> np.ndarray:
    """Decode base64 image to numpy array"""
    try:
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        if len(image_np.shape) == 3 and image_np.shape[2] == 4:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
        elif len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        
        return image_np
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode image: {str(e)}")


def calculate_brightness(image: np.ndarray) -> float:
    """Calculate average brightness of the image"""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    return float(np.mean(gray))


def calculate_variance(image: np.ndarray) -> float:
    """Calculate color variance to detect uniform colors (covered camera)"""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    return float(np.var(gray))


def calculate_edge_density(image: np.ndarray) -> float:
    """Calculate edge density using Canny edge detection"""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size * 100
    return float(edge_density)


def check_frame_freeze(current_frame: np.ndarray, previous_frame: Optional[np.ndarray]) -> Tuple[bool, float]:
    """Check if the frame is frozen by comparing with previous frame"""
    if previous_frame is None:
        return False, 0.0
    
    try:
        current_gray = cv2.cvtColor(current_frame, cv2.COLOR_RGB2GRAY)
        previous_gray = cv2.cvtColor(previous_frame, cv2.COLOR_RGB2GRAY)
        
        if current_gray.shape != previous_gray.shape:
            previous_gray = cv2.resize(previous_gray, (current_gray.shape[1], current_gray.shape[0]))
        
        diff = cv2.absdiff(current_gray, previous_gray)
        diff_score = float(np.sum(diff))
        
        is_frozen = diff_score < FREEZE_DIFF_THRESHOLD
        return is_frozen, diff_score
    except Exception:
        return False, 0.0


def detect_face_with_features(image: np.ndarray) -> Tuple[bool, float, int, Optional[Tuple], Optional[List]]:
    """
    Detect face and facial features (eyes) for gaze/pose estimation
    Returns: (face_detected, confidence, face_count, face_rect, eye_rects)
    Uses multiple detection passes for better mobile camera support
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply histogram equalization to improve contrast for various lighting
        gray = cv2.equalizeHist(gray)
        
        # First pass: Standard frontal face detection with relaxed parameters for mobile
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,  # Smaller scale for more detections
            minNeighbors=3,    # Reduced from 5 for mobile cameras
            minSize=(40, 40)   # Reduced from 60 for smaller faces
        )
        
        # Second pass: Try with different parameters if no face found
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.15,  # Larger scale, faster
                minNeighbors=2,    # More lenient
                minSize=(30, 30)   # Smaller faces
            )
        
        # Third pass: Try profile face if still no detection
        if len(faces) == 0:
            faces = profile_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=2,
                minSize=(40, 40)
            )
        
        if len(faces) > 0 and len(faces) < 2:
            multi_faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=2,
                minSize=(30, 30)
            )
            if len(multi_faces) > len(faces):
                faces = multi_faces

        face_count = len(faces)
        
        if face_count > 0:
            x, y, w, h = faces[0]
            face_area = w * h
            image_area = gray.shape[0] * gray.shape[1]
            confidence = min(0.95, 0.5 + (face_area / image_area) * 2)
            
            face_roi = gray[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(
                face_roi,
                scaleFactor=1.1,
                minNeighbors=2,    # More lenient for mobile
                minSize=(15, 15)   # Smaller eyes
            )
            
            eye_rects = [(ex + x, ey + y, ew, eh) for (ex, ey, ew, eh) in eyes]
            
            return True, float(confidence), face_count, (x, y, w, h), eye_rects
        
        return False, 0.0, 0, None, None
    except Exception:
        return False, 0.0, 0, None, None


def estimate_gaze_direction(image: np.ndarray, face_rect: Tuple, eye_rects: List) -> Dict[str, Any]:
    """
    Estimate eye gaze direction based on eye position within face
    Returns gaze analysis with looking_away indicator
    """
    if not face_rect or not eye_rects or len(eye_rects) < 1:
        return {
            "detected": False,
            "looking_at_screen": True,
            "gaze_deviation": 0.0,
            "direction": "unknown"
        }
    
    try:
        fx, fy, fw, fh = face_rect
        face_center_x = fx + fw / 2
        
        valid_eyes = [e for e in eye_rects if e[1] < fy + fh * 0.6][:2]
        
        if len(valid_eyes) == 0:
            return {
                "detected": False,
                "looking_at_screen": True,
                "gaze_deviation": 0.0,
                "direction": "unknown"
            }
        
        eye_centers = []
        for (ex, ey, ew, eh) in valid_eyes:
            eye_centers.append((ex + ew / 2, ey + eh / 2))
        
        avg_eye_x = sum(e[0] for e in eye_centers) / len(eye_centers)
        
        deviation = (avg_eye_x - face_center_x) / (fw / 2)
        deviation = max(-1, min(1, deviation))
        
        abs_deviation = abs(deviation)
        looking_at_screen = abs_deviation < GAZE_DEVIATION_THRESHOLD
        
        if deviation < -0.2:
            direction = "left"
        elif deviation > 0.2:
            direction = "right"
        else:
            direction = "center"
        
        return {
            "detected": True,
            "looking_at_screen": looking_at_screen,
            "gaze_deviation": float(deviation),
            "direction": direction,
            "eye_count": len(valid_eyes)
        }
    except Exception:
        return {
            "detected": False,
            "looking_at_screen": True,
            "gaze_deviation": 0.0,
            "direction": "unknown"
        }


def estimate_head_pose(image: np.ndarray, face_rect: Tuple) -> Dict[str, Any]:
    """
    Estimate head pose (looking straight, turned left/right, looking down)
    Based on face aspect ratio and position in frame
    """
    if not face_rect:
        return {
            "detected": False,
            "facing_camera": True,
            "head_turn": 0.0,
            "direction": "unknown"
        }
    
    try:
        fx, fy, fw, fh = face_rect
        image_height, image_width = image.shape[:2]
        
        face_center_x = fx + fw / 2
        frame_center_x = image_width / 2
        
        horizontal_offset = (face_center_x - frame_center_x) / (image_width / 2)
        horizontal_offset = max(-1, min(1, horizontal_offset))
        
        aspect_ratio = fw / fh if fh > 0 else 1.0
        normal_aspect = 0.75
        aspect_deviation = abs(aspect_ratio - normal_aspect) / normal_aspect
        
        is_profile = aspect_ratio < 0.5 or aspect_ratio > 1.2
        
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        profiles = profile_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(60, 60))
        profile_detected = len(profiles) > 0
        
        head_turn = abs(horizontal_offset)
        if is_profile or profile_detected:
            head_turn = max(head_turn, 0.5)
        
        facing_camera = head_turn < HEAD_TURN_THRESHOLD and not is_profile
        
        if horizontal_offset < -0.12:
            direction = "turned_left"
        elif horizontal_offset > 0.12:
            direction = "turned_right"
        elif fy > image_height * 0.4:
            direction = "looking_down"
        else:
            direction = "facing_camera"
        
        return {
            "detected": True,
            "facing_camera": facing_camera,
            "head_turn": float(head_turn),
            "direction": direction,
            "horizontal_offset": float(horizontal_offset),
            "aspect_ratio": float(aspect_ratio)
        }
    except Exception:
        return {
            "detected": False,
            "facing_camera": True,
            "head_turn": 0.0,
            "direction": "unknown"
        }


def detect_suspicious_objects(image: np.ndarray) -> Dict[str, Any]:
    """
    Detect potentially suspicious objects (phone-like rectangles, secondary screens)
    Uses edge detection and contour analysis
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        image_area = image.shape[0] * image.shape[1]
        suspicious_objects = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < image_area * 0.01 or area > image_area * 0.3:
                continue
            
            rect = cv2.minAreaRect(contour)
            width, height = rect[1]
            if width == 0 or height == 0:
                continue
            
            aspect = max(width, height) / min(width, height)
            
            if 1.5 < aspect < 2.5:
                suspicious_objects.append({
                    "type": "phone_like",
                    "area_ratio": area / image_area,
                    "aspect_ratio": aspect
                })
            elif 1.3 < aspect < 2.0 and area > image_area * 0.05:
                suspicious_objects.append({
                    "type": "screen_like",
                    "area_ratio": area / image_area,
                    "aspect_ratio": aspect
                })
        
        return {
            "detected": len(suspicious_objects) > 0,
            "count": len(suspicious_objects),
            "objects": suspicious_objects[:3]
        }
    except Exception:
        return {
            "detected": False,
            "count": 0,
            "objects": []
        }


def calculate_trust_score(
    face_detected: bool,
    face_confidence: float,
    gaze_analysis: Dict,
    head_pose: Dict,
    suspicious_objects: Dict,
    behavior_history: Dict
) -> Tuple[float, List[str]]:
    """
    Calculate overall trust score based on all proctoring signals
    Returns score (0-100) and list of warnings
    """
    score = 100.0
    warnings = []
    
    if not face_detected:
        score -= 25
        warnings.append("Face not visible")
    else:
        score -= (1 - face_confidence) * 10
    
    if gaze_analysis.get("detected") and not gaze_analysis.get("looking_at_screen"):
        deviation = abs(gaze_analysis.get("gaze_deviation", 0))
        penalty = min(15, deviation * 20)
        score -= penalty
        warnings.append(f"Looking {gaze_analysis.get('direction', 'away')}")
    
    if head_pose.get("detected") and not head_pose.get("facing_camera"):
        turn = head_pose.get("head_turn", 0)
        penalty = min(20, turn * 40)
        score -= penalty
        warnings.append(f"Head {head_pose.get('direction', 'turned')}")
    
    if suspicious_objects.get("detected"):
        count = suspicious_objects.get("count", 0)
        score -= min(20, count * 8)
        warnings.append(f"Suspicious object detected")
    
    looking_away_count = behavior_history.get("looking_away_count", 0)
    if looking_away_count > 3:
        score -= min(15, looking_away_count * 2)
    
    frequent_violations = behavior_history.get("violation_count", 0)
    if frequent_violations > 5:
        score -= min(20, frequent_violations * 2)
    
    return max(0, min(100, score)), warnings


def update_behavior_history(user_key: str, gaze: Dict, head: Dict, violation: bool) -> Dict:
    """Track user behavior patterns over time"""
    if user_key not in user_behavior_history:
        user_behavior_history[user_key] = {
            "looking_away_count": 0,
            "looking_away_streak": 0,
            "head_turn_count": 0,
            "violation_count": 0,
            "total_frames": 0,
            "suspicious_frames": 0
        }
    
    history = user_behavior_history[user_key]
    history["total_frames"] += 1
    
    is_looking_away = gaze.get("detected") and not gaze.get("looking_at_screen")
    is_head_turned = head.get("detected") and not head.get("facing_camera")
    
    if is_looking_away:
        history["looking_away_streak"] += 1
        if history["looking_away_streak"] >= LOOKING_AWAY_FRAMES_THRESHOLD:
            history["looking_away_count"] += 1
            history["looking_away_streak"] = 0
    else:
        history["looking_away_streak"] = 0
    
    if is_head_turned:
        history["head_turn_count"] += 1
    
    if violation:
        history["violation_count"] += 1
    
    if is_looking_away or is_head_turned:
        history["suspicious_frames"] += 1
    
    suspicious_ratio = history["suspicious_frames"] / max(1, history["total_frames"])
    
    return {
        "looking_away_count": history["looking_away_count"],
        "head_turn_count": history["head_turn_count"],
        "violation_count": history["violation_count"],
        "suspicious_ratio": round(suspicious_ratio, 3),
        "total_frames": history["total_frames"]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0", "timestamp": datetime.now().isoformat()}


@app.post("/analyze-frame", response_model=AdvancedAnalyzeResponse)
async def analyze_frame(request: AnalyzeRequest):
    """Advanced frame analysis with gaze tracking, head pose, and behavior analysis"""
    
    image = decode_image(request.image)
    user_key = f"{request.user_id}_{request.exam_id}"
    
    brightness = calculate_brightness(image)
    variance = calculate_variance(image)
    edge_density = calculate_edge_density(image)
    
    previous_frame = user_frame_history.get(user_key, {}).get("frame")
    is_frozen, frame_diff = check_frame_freeze(image, previous_frame)
    
    face_detected, face_confidence, face_count, face_rect, eye_rects = detect_face_with_features(image)
    has_multiple_faces = face_count > 1
    
    gaze_analysis = estimate_gaze_direction(image, face_rect, eye_rects) if face_detected else None
    head_pose = estimate_head_pose(image, face_rect) if face_detected else None
    suspicious_objects = detect_suspicious_objects(image)
    
    user_frame_history[user_key] = {
        "frame": image.copy(),
        "timestamp": time.time(),
        "face_detected": face_detected
    }
    
    camera_status = "OK"
    violation_type = None
    violation_severity = None
    message = "Camera check passed"
    
    if brightness < BRIGHTNESS_LOW_THRESHOLD:
        camera_status = "BLOCKED"
        violation_type = "CAMERA_COVERED"
        violation_severity = "high"
        message = "Camera appears to be covered - too dark"
    elif variance < VARIANCE_THRESHOLD:
        camera_status = "WARNING"
        violation_type = "CAMERA_OBSTRUCTED"
        violation_severity = "medium"
        message = "Camera shows uniform color - possible obstruction"
    elif is_frozen:
        camera_status = "WARNING"
        violation_type = "CAMERA_FROZEN"
        violation_severity = "medium"
        message = "Camera feed appears frozen"
    elif has_multiple_faces:
        camera_status = "WARNING"
        violation_type = "MULTIPLE_FACES"
        violation_severity = "high"
        message = f"Multiple faces detected ({face_count}) - only one person allowed"
    elif not face_detected:
        camera_status = "WARNING"
        violation_type = "FACE_NOT_DETECTED"
        violation_severity = "medium"
        message = "Face not detected in camera frame"
    elif gaze_analysis and not gaze_analysis.get("looking_at_screen"):
        camera_status = "WARNING"
        violation_type = "LOOKING_AWAY"
        violation_severity = "low"
        message = f"Looking {gaze_analysis.get('direction', 'away')} from screen"
    elif head_pose and not head_pose.get("facing_camera"):
        camera_status = "WARNING"
        violation_type = "HEAD_TURNED"
        violation_severity = "low"
        message = f"Head {head_pose.get('direction', 'turned')}"
    
    behavior = update_behavior_history(user_key, gaze_analysis or {}, head_pose or {}, violation_type is not None)
    
    trust_score, warnings = calculate_trust_score(
        face_detected,
        face_confidence,
        gaze_analysis or {},
        head_pose or {},
        suspicious_objects,
        user_behavior_history.get(user_key, {})
    )
    
    confidence_score = trust_score
    
    if violation_type:
        history = user_frame_history.get(user_key, {})
        violation_count = history.get("violation_count", 0) + 1
        user_frame_history[user_key]["violation_count"] = violation_count
        
        if violation_count >= 3 and violation_severity == "low":
            violation_severity = "medium"
        if violation_count >= 5:
            violation_severity = "high"
    
    return AdvancedAnalyzeResponse(
        camera_status=str(camera_status),
        face_detected=bool(face_detected),
        face_count=int(face_count),
        has_multiple_faces=bool(has_multiple_faces),
        face_confidence=float(face_confidence),
        brightness_score=float(brightness),
        frame_variance_score=float(variance),
        confidence_score=int(confidence_score),
        violation_type=str(violation_type) if violation_type else None,
        violation_severity=str(violation_severity) if violation_severity else None,
        message=str(message),
        eye_gaze=convert_numpy_types(gaze_analysis) if gaze_analysis else None,
        head_pose=convert_numpy_types(head_pose) if head_pose else None,
        behavior_analysis=convert_numpy_types(behavior) if behavior else None,
        trust_score=float(trust_score),
        warnings=list(warnings)
    )


@app.post("/reset-user")
async def reset_user(user_id: str, exam_id: str):
    """Reset user's frame and behavior history (for new exam session)"""
    user_key = f"{user_id}_{exam_id}"
    if user_key in user_frame_history:
        del user_frame_history[user_key]
    if user_key in user_behavior_history:
        del user_behavior_history[user_key]
    return {"status": "reset", "user_key": user_key}


@app.get("/user-stats/{user_id}/{exam_id}")
async def get_user_stats(user_id: str, exam_id: str):
    """Get behavior statistics for a user during exam"""
    user_key = f"{user_id}_{exam_id}"
    behavior = user_behavior_history.get(user_key, {})
    return {
        "user_id": user_id,
        "exam_id": exam_id,
        "behavior_stats": behavior
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
