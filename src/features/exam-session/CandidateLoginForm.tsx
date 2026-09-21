"use client";

import { useState } from "react";
import { candidateLoginAction, CandidateSessionPayload } from "./actions";
import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  KeyRound, 
  AlertCircle, 
  Sparkles,
  Eye,
  EyeOff,
  Info
} from "lucide-react";

interface CandidateLoginFormProps {
  onLoginSuccess: (payload: CandidateSessionPayload) => void;
}

export function CandidateLoginForm({ onLoginSuccess }: CandidateLoginFormProps) {
  const [regNumber, setRegNumber] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim() || !accessCode.trim()) {
      setErrorMsg("Please enter both your Registration Number and Access PIN.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await candidateLoginAction({
        regNumber: regNumber.trim().toUpperCase(),
        accessCode: accessCode.trim(),
      });

      if (res.success && res.payload) {
        onLoginSuccess(res.payload);
      } else {
        setErrorMsg(res.error || "Authentication failed. Please check your credentials.");
      }
    } catch {
      setErrorMsg("Unable to connect to examination server. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/25">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Doctoral Candidate Portal
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Official entrance & coursework qualifying examination workstation for Ph.D research scholars
        </p>
      </div>

      {/* Main Login Card */}
      <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100/60 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Candidate Verification
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Live Biometrics
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Scholar Registration / Roll Number *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. PHD26-CSE-001"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-xs"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              As issued on your official Doctoral Examination Admit Card
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Examination Access PIN *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="6-digit examination access PIN"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title={showPassword ? "Hide PIN" : "Show PIN"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? "Verifying Credentials with University Server..." : "Enter Examination Waiting Room"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Guidance Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Admit Card & Invigilation Notice</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Ensure your webcam and microphone are connected before signing in. The waiting room opens 15 minutes prior to the scheduled start time for biometric check-in.
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Continuous Edge-AI Facial & Acoustic Monitoring Active</span>
      </div>
    </div>
  );
}
