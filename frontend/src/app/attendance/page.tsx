"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function AttendancePage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000/api";
  const pythonBaseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8000/api";
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [showProxyOverlay, setShowProxyOverlay] = useState(false);

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setImageSrc(image);
    }
  }, [webcamRef]);

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
        
        // 2. Trigger Node OTP to be sent via email
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
        // Post to Node.js Attendance endpoint
        const response = await axios.post(`${apiBaseUrl}/attendance/mark`, {
            studentId: studentId,
            subjectCode: "CS101", // Hardcoded for demo
            confidenceScore: result?.confidenceScore ?? 0,
            otp: otp
        });
        setResult({ ...result, attendanceMarked: true, message: response.data.message });
        setOtpSent(false); // Reset flow
    } catch (err: any) {
        const errorMsg = err.response?.data?.error || "Failed to verify OTP or mark attendance.";
        setError(errorMsg);

        if (errorMsg.includes("Proxy Detected")) {
            setError("Invalid OTP. Proxy Detected!");
            setShowProxyOverlay(true);
            try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
            } catch (audioErr) {
                console.error("Audio playback failed", audioErr);
            }
            
            setTimeout(() => setShowProxyOverlay(false), 5000);
        }
    } finally {
        setOtp("");
        setLoading(false);
    }
  };

  const retake = () => {
    setImageSrc(null);
    setResult(null);
    setError(null);
    setOtpSent(false);
    setOtp("");
    setStudentId(null);
  };

  // Cleanup: Ensure camera tracks are stopped when component unmounts
  useEffect(() => {
    return () => {
      if (webcamRef.current && webcamRef.current.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  const [cameraMounted, setCameraMounted] = useState(false);

  useEffect(() => {
    // Small delay to allow previous camera sessions to release
    const timer = setTimeout(() => setCameraMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRetryCamera = () => {
    setError(null);
    setCameraMounted(false);
    setTimeout(() => setCameraMounted(true), 500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-zinc-50">Live Attendance Capture</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Position your face in the frame to mark your attendance via facial recognition.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center min-h-[300px] justify-center">
          {!imageSrc ? (
            cameraMounted ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480 }}
                mirrored={true}
                onUserMedia={() => {}}
                onUserMediaError={(err) => {
                  console.error("Camera Error:", err);
                  const message = err instanceof Error ? err.message : String(err);
                  if (message.includes("Timeout") || message.includes("AbortError")) {
                    setError("Camera initialization timed out. Please click retry below.");
                  } else {
                    setError(`Camera Error: ${message}. Please ensure no other app is using your webcam.`);
                  }
                }}
                className="w-full h-auto aspect-video object-cover bg-black"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-20">
                <RefreshCw size={40} className="text-blue-600 animate-spin" />
                <p className="text-sm text-zinc-500">Initializing Secure Camera Stream...</p>
              </div>
            )
          ) : (
            <img src={imageSrc} alt="Captured face" className="w-full h-auto aspect-video object-cover" />
          )}

          <div className="p-6 w-full flex justify-center border-t dark:border-zinc-800">
            {error?.includes("Camera") ? (
              <button
                onClick={handleRetryCamera}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition"
              >
                <RefreshCw size={20} />
                Retry Camera Connection
              </button>
            ) : !imageSrc ? (
              <button
                onClick={capture}
                disabled={!cameraMounted}
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
            <div className={`p-4 rounded-xl flex items-start gap-3 mb-4 ${
                error.includes("Proxy Detected") 
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

               <button
                  onClick={async () => {
                    if (!studentId) return;
                    setLoading(true);
                    try {
                      await axios.post(`${apiBaseUrl}/otp/resend`, { studentId });
                      alert("OTP resent successfully!");
                    } catch (err) {
                      setError("Failed to resend OTP.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:underline transition disabled:opacity-50"
               >
                  Resend OTP
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