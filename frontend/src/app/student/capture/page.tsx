"use client";

import { useState, useRef, useCallback, useEffect } from "react";
// import Webcam from "react-webcam";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Camera, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function StudentCapturePage() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";
  const pythonBaseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8000/api";

  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [showProxyOverlay, setShowProxyOverlay] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const capture = useCallback(() => {
    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg");

    setImageSrc(image);
  },
    [videoRef]);

  const verifyFace = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${pythonBaseUrl}/face/recognize`, {
        imageBase64: imageSrc
      });

      if (response.data?.success && response.data.data?.matched) {
        setResult(response.data.data);
        setStudentId(response.data.data.studentId);

        // Trigger Node OTP to be sent via email
        try {
          await axios.post(`${apiBaseUrl}/otp/generate`, {
            studentId: response.data.data.studentId,
            deliveryMethod: "EMAIL"
          });
          setOtpSent(true);
        } catch (otpErr: any) {
          const detailedError = otpErr.response?.data?.message || otpErr.response?.data?.error || "OTP Service Error";
          setError(`Face verified, but OTP failed: ${detailedError}`);
          console.error("OTP Generation Error:", otpErr.response?.data);
        }
      } else {
        setError("Face not recognized. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to communicate with Face Verification Service.");
    } finally {
      setLoading(false);
    }
  };

  const submitOtpAndMark = async () => {
    if (!studentId || !otp) return;
    setLoading(true);
    setError(null);
    try {
      // Post to Node.js Attendance endpoint with auth token
      const response = await axios.post(`${apiBaseUrl}/attendance/mark`, {
        studentId: studentId,
        subjectCode: "CS101", // Hardcoded for demo
        confidenceScore: result?.confidenceScore ?? 0,
        otp: otp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult({ ...result, attendanceMarked: true, message: response.data.message });
      setOtpSent(false); // Reset flow
      stopCamera();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to verify OTP or mark attendance.";
      setError(errorMsg);

      if (errorMsg.includes("Proxy Detected")) {
        setError("Invalid OTP. Proxy Detected!");
        setShowProxyOverlay(true);
        // Play double beep sound for proxy detection
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

          const playBeep = (time: number) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, time);
            oscillator.frequency.exponentialRampToValueAtTime(400, time + 0.2);
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start(time);
            oscillator.stop(time + 0.2);
          };

          playBeep(audioCtx.currentTime);
          playBeep(audioCtx.currentTime + 0.3);
        } catch (audioErr) {
          console.error("Audio playback failed", audioErr);
        }

        // Auto-close overlay after 5 seconds
        setTimeout(() => setShowProxyOverlay(false), 5000);
      }
    } finally {
      setOtp("");
      setLoading(false);
    }
  };

  const retake = () => {
    stopCamera();
    setCameraReady(false);

    setImageSrc(null);
    setResult(null);
    setError(null);
    setOtpSent(false);
    setOtp("");
    setStudentId(null);

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to restart camera");
      });
  };
  const stopCamera = () => {
    const video = videoRef.current;

    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;

      stream.getTracks().forEach((track) => {
        track.stop();
      });

      video.pause();
      video.srcObject = null;
    }

    setCameraReady(false);
  };
  // Cleanup: Ensure camera tracks are stopped when component unmounts
  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;


          // console.log("Camera started");
          setCameraReady(true);
          setError(null);
        }
      } catch (err: any) {
        console.error("Camera Error:", err);

        setError(
          err?.message || "Unable to access webcam"
        );
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-zinc-50">Live Attendance Capture</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Position your face in the frame to mark your attendance via facial recognition.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center min-h-[300px] justify-center">
          {!imageSrc ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-[350px] object-cover bg-black"
            />
          ) : (
            <img
              src={imageSrc}
              alt="Captured face"
              className="w-full h-auto aspect-video object-cover"
            />
          )}
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
              Initializing Camera...
            </div>
          )}
          <div className="p-6 w-full flex justify-center border-t dark:border-zinc-800">
            {!imageSrc ? (
              <button
                onClick={capture}
                disabled={false}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
              >
                <Camera size={20} />
                Capture Face
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={retake}
                  disabled={loading || result?.attendanceMarked}
                  className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
                >
                  <RefreshCw size={20} />
                  Retake
                </button>

                {!result?.attendanceMarked && !otpSent && (
                  <button
                    onClick={verifyFace}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Send OTP"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-start">
          <h2 className="text-xl font-semibold mb-4 dark:text-zinc-50">Results & Status</h2>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 mb-4 ${error.includes("Proxy Detected")
              ? "bg-red-600 text-white animate-proxy-flash"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              }`}>
              <AlertCircle size={24} className="mt-0.5 shrink-0" />
              <div>
                {error.includes("Proxy Detected") && <p className="font-bold text-lg">🚨 PROXY DETECTED 🚨</p>}
                <p className="text-sm font-medium">{error.replace("🚨 Proxy Detected!!! ", "")}</p>
              </div>
            </div>
          )}

          {result?.matched && !result.attendanceMarked && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-start gap-3 mb-4">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Face Verified Successfully!</p>
                <p className="text-xs opacity-90">Student ID: {result.studentId}</p>
                <p className="text-xs opacity-90">Confidence: {(result.confidenceScore).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {otpSent && (
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">OTP Sent 📩</h3>
                <p className="text-sm text-zinc-500 mt-1">An OTP has been sent to your registered email. Enter it below to confirm attendance.</p>
              </div>

              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="px-4 py-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />

              <button
                onClick={submitOtpAndMark}
                disabled={otp.length !== 6 || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Confirm & Mark Attendance"}
              </button>
            </div>
          )}

          {result?.attendanceMarked && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-6 rounded-xl flex flex-col items-center justify-center gap-3 mt-4 text-center">
              <CheckCircle size={40} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-lg">Attendance Logged</h3>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
              <button
                onClick={retake}
                className="mt-4 px-6 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition"
              >
                Scan Another
              </button>
            </div>
          )}

          {!result && !error && !otpSent && (
            <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
              Waiting for capture...
            </div>
          )}
        </div>
      </div>

      {/* PROXY DETECTION OVERLAY */}
      {showProxyOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-600/90 backdrop-blur-md animate-proxy-flash">
          <div className="text-center p-8 bg-black/40 rounded-3xl border-4 border-white/20 shadow-2xl max-w-md mx-4 transform animate-bounce">
            <AlertCircle size={80} className="mx-auto text-white mb-6" />
            <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
              Proxy Detected!
            </h1>
            <p className="text-white text-lg font-bold mb-8">
              Invalid OTP attempt. <br />
              This incident has been logged for Admin review.
            </p>
            <button
              onClick={() => setShowProxyOverlay(false)}
              className="bg-white text-red-600 px-8 py-3 rounded-xl font-black hover:bg-zinc-100 transition shadow-lg"
            >
              I UNDERSTAND
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
