# pyrefly: ignore [missing-import]
import base64
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import face_recognition
import os
from app.utils.logger import logger
# from app.utils.db import fetch_all_student_encodings

class FaceService:
    @staticmethod
    def _decode_base64_image(base64_string):
        """Converts a base64 image string to a OpenCV numpy array."""
        try:
            # Strip standard web base64 prefix if present (e.g., data:image/jpeg;base64,...)
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
                
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Failed to decode image.")
                
            # OpenCV loads as BGR, face_recognition needs RGB
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            return rgb_img
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            raise ValueError("Invalid image format.")

    @staticmethod
    def extract_encoding(base64_image):
        """Extracts a 128-d face encoding from a base64 string."""
        rgb_img = FaceService._decode_base64_image(base64_image)
        
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            return None, "No face detected in the frame."
        
        if len(face_locations) > 1:
            return None, "Multiple faces detected. Please ensure only one person is in frame."
            
        # Get the encoding for the single detected face
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if len(face_encodings) > 0:
            # Convert NumPy array to standard Python list for JSON storage
            return face_encodings[0].tolist(), "Success"
        else:
            return None, "Failed to extract facial features."

    @staticmethod
    # def recognize_face(base64_image):
    def recognize_face(base64_image, mock_encodings):
        """
        Takes a webcam frame, extracts the face, and compares it against all registered students.
        Returns the matched student ID and confidence score.
        """
        # 1. Extract encoding from current frame
        unknown_encoding, msg = FaceService.extract_encoding(base64_image)
        
        if not unknown_encoding:
            return {
                "faceDetected": False,
                "matched": False,
                "confidenceScore": 0,
                "message": msg
            }
            
        unknown_encoding_np = np.array(unknown_encoding)
        
        if not mock_encodings:
            return {
                "faceDetected": True,
                "matched": False,
                "confidenceScore": 0,
                "message": "No registered faces in system."
    }
        # 2. Fetch all known student encodings from DB
        # try:
        #     registered_students = fetch_all_student_encodings()
        # except Exception as e:
        #     return {
        #         "faceDetected": True,
        #         "matched": False,
        #         "confidenceScore": 0,
        #         "message": "Database error retrieving registered faces."
        #     }
            
        # if not registered_students:
        #     return {
        #         "faceDetected": True,
        #         "matched": False,
        #         "confidenceScore": 0,
        #         "message": "No students are currently registered in the system."
        #     }

        # 3. Compare the unkown face to all known faces
        # known_encodings = [np.array(student['encoding']) for student in registered_students]

        known_encodings = []
        student_ids = []

        for student_id, enc_list in mock_encodings.items():
            if not enc_list:
                continue
            
            # Ensure student_id is an integer for the backend (it might be a string key from JSON)
            try:
                sid = int(student_id)
            except (ValueError, TypeError):
                sid = student_id

            # agar multiple encodings hain
            if isinstance(enc_list[0], list):
                for enc in enc_list:
                    known_encodings.append(np.array(enc))
                    student_ids.append(sid)
            else:
                # fallback (single encoding case)
                known_encodings.append(np.array(enc_list))
                student_ids.append(sid)

        # 🔥 safety check (IMPORTANT)
        if len(known_encodings) == 0:
            return {
                    "faceDetected": True,
                    "matched": False,
                    "confidenceScore": 0,
                    "message": "No encodings available"
            }

        # Calculate distances (lower distance = closer match)
        face_distances = face_recognition.face_distance(known_encodings, unknown_encoding_np)

        # Find the best match
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]

        # Tolerance scale:
        # face_recognition library suggests 0.6 as a good default for strictness.
        # tolerance = float(os.environ.get('FACE_MATCH_TOLERANCE', 0.45))
        tolerance = 0.55

        # Convert distance to a 0-100% confidence score
        confidence = max(0, min(100, (1.0 - best_distance) * 100))
        confidence = round(confidence, 2)

        if best_distance <= tolerance:
        # We found a positive match
        # matched_student = registered_students[best_match_index]
        # logger.info(f"Match found: {matched_student['name']} (ID: {matched_student['student_id']}) with {confidence}% confidence. (Dist: {best_distance:.3f})")

            matched_id = student_ids[best_match_index]

            logger.info(
        f"Match found: ID {matched_id} with {confidence}% confidence. (Dist: {best_distance:.3f})"
            )

            return {
                    "faceDetected": True,
                    "matched": True,
        # "studentId": matched_student['student_id'],
        # "studentName": matched_student['name'],
                    "studentId": matched_id,
                    "confidenceScore": confidence,
                    "message": f"Verified successfully (Student ID: {matched_id})"
        # "message": f"Verified successfully as {matched_student['name']}"
            }

        else:
        # Face detected, but distance was too high (not a match)
            logger.warning(f"Face rejected: Closest match was {best_distance:.3f} (Required: <= {tolerance})")

            return {
                    "faceDetected": True,
                    "matched": False,
                    "confidenceScore": confidence,
                    "message": "Face did not securely match any registered student."
            }
