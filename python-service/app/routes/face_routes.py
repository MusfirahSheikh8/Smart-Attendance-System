# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify
from app.services.face_service import FaceService
from app.utils.logger import logger

face_bp = Blueprint('face', __name__)

# ✅ TEMP MEMORY STORE (multiple encodings per student)
mock_encodings = {}

# =========================================
# 🔵 RECOGNIZE
# =========================================
@face_bp.route('/recognize', methods=['POST'])
def recognize():
    try:
        data = request.get_json()
        
        if not data or 'imageBase64' not in data:
            return jsonify({"success": False, "error": "Missing imageBase64 payload"}), 400
            
        base64_image = data['imageBase64']

        # ✅ PASS MEMORY DATA
        result = FaceService.recognize_face(base64_image, mock_encodings)

        return jsonify({
            "success": True,
            "data": result
        }), 200
        
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error in /recognize: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


# =========================================
# 🟢 REGISTER (IMPORTANT FIX HERE)
# =========================================
@face_bp.route('/register', methods=['POST'])
def register_face():
    try:
        data = request.get_json()
        
        if not data or 'studentId' not in data or 'imageBase64' not in data:
            return jsonify({"success": False, "error": "Missing payload fields"}), 400
            
        student_id = data['studentId']
        base64_image = data['imageBase64']
        
        # 1. Extract encoding
        encoding_list, msg = FaceService.extract_encoding(base64_image)
        
        if not encoding_list:
            return jsonify({
                "success": False,
                "error": msg
            }), 400

        # ✅ 🔥 IMPORTANT FIX — STORE MULTIPLE ENCODINGS
        if student_id not in mock_encodings:
            mock_encodings[student_id] = []

        mock_encodings[student_id].append(encoding_list)

        # logger.info(f"(MOCK) Stored encoding for student {student_id} (Total: {len(mock_encodings[student_id])})")

        return jsonify({
            "success": True,
            "message": f"Face registered successfully (Total samples: {len(mock_encodings[student_id])})"
        }), 201

    except Exception as e:
        logger.error(f"Error in /register: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
