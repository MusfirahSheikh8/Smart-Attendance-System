"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";
import { Camera, CheckCircle, AlertCircle, RefreshCw, UserPlus } from "lucide-react";

export default function StudentEnrollment() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { token, role, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') {
      router.push('/auth/login');
    }
  }, [isAuthenticated, role, router]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";
  const pythonBaseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8000/api";
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("CS");

  // UI State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) setImageSrc(image);
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const stopCamera = () => {
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject as MediaStream;

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      webcamRef.current.video.pause();
      webcamRef.current.video.srcObject = null;
    }
  };

  const submitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Step 1: Create Student Record inside the Node.js Database
      const dbResponse = await axios.post(`${apiBaseUrl}/students`, {
        name,
        email,
        program
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newStudentId = dbResponse.data.data.studentId;

      // Step 2: Register the Face via Python Microservice (ONLY IF IMAGE CAPTURED)
      if (imageSrc) {
        // Strip base64 header
        const base64Data = imageSrc.split(",")[1];

        await axios.post(`${pythonBaseUrl}/face/register`, {
          studentId: newStudentId,
          imageBase64: base64Data
        });
        setSuccessMsg(`Successfully enrolled ${name} (ID: ${newStudentId}) with biometric signature!`);

        stopCamera();

      } else {

        setSuccessMsg(`Successfully enrolled ${name} (ID: ${newStudentId}) without a biometric signature.`);

        stopCamera();
      }

      // Reset Form
      setName("");
      setEmail("");
      setImageSrc(null);

    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setErrorMsg("Session expired. Please log in again.");
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setErrorMsg(err.response?.data?.message || err.response?.data?.error || "An error occurred during enrollment.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup: Ensure camera tracks are stopped when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const [cameraMounted, setCameraMounted] = useState(false);

  useEffect(() => {
    // Small delay to allow previous camera sessions to release
    const timer = setTimeout(() => setCameraMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRetryCamera = () => {
    setErrorMsg(null);
    setCameraMounted(false);
    setTimeout(() => setCameraMounted(true), 500);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-zinc-50">Student Face Enrollment</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Register new system subjects & attach their multidimensional face encoding securely to the database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Side: Form */}
        <form onSubmit={submitEnrollment} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-xl font-semibold dark:text-zinc-50 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Student Profile
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="px-4 py-3 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">University Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="px-4 py-3 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Program / Major</label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="px-4 py-3 rounded-lg border dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
            >
              <option value="CS">Computer Science</option>
              <option value="SE">Software Engineering</option>
              <option value="IT">Information Technology</option>
              <option value="DS">Data Science</option>
            </select>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold transition disabled:opacity-50"
          >
            {loading ? "Registering..." : imageSrc ? "Enroll Student with Biometrics" : "Enroll Student without Biometrics"}
          </button>

        </form>

        {/* Right Side: Biometric Capture */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-xl w-full text-left font-semibold dark:text-zinc-50 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Biometric Registration
          </h2>

          <div className="w-full aspect-video bg-zinc-100 dark:bg-zinc-950 rounded-xl overflow-hidden relative border dark:border-zinc-800 flex items-center justify-center">
            {!imageSrc ? (
              cameraMounted ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  mirrored={true}
                  // onUserMediaError={(err) => {
                  //   const message = err instanceof Error ? err.message : String(err);
                  //   if (message.includes("Timeout") || message.includes("AbortError")) {
                  //     setErrorMsg("Camera Error: Hardware timeout. Please click retry below.");
                  //   } else {
                  //     setErrorMsg(`Camera Error: ${message}`);
                  //   }
                  // }}
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw size={40} className="text-blue-600 animate-spin" />
                  <p className="text-sm text-zinc-500">Initializing Enrollment Camera...</p>
                </div>
              )
            ) : (
              <img src={imageSrc} alt="Captured face" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="mt-6 w-full flex justify-center">
            {errorMsg?.includes("Camera") ? (
              <button
                onClick={(e) => { e.preventDefault(); handleRetryCamera(); }}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition"
              >
                <RefreshCw size={20} />
                Retry Camera
              </button>
            ) : !imageSrc ? (
              <button
                onClick={(e) => { e.preventDefault(); capture(); }}
                disabled={!cameraMounted}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50"
              >
                <Camera size={20} />
                Snap Final Picture
              </button>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); retake(); }}
                className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-6 py-3 rounded-xl font-medium transition"
              >
                <RefreshCw size={20} />
                Discard & Retake
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-4 text-center">
            Ensure the subject is placed well-lit within the frame, looking straight at the camera. Only 1 clear photo is needed to construct the multidimensional face vector.
          </p>
        </div>

      </div>
    </div>
  );
}