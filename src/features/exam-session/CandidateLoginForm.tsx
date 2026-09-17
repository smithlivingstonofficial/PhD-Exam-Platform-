"use client";

import { useState } from "react";
import { candidateLoginAction, CandidateSessionPayload } from "./actions";
import { GraduationCap, ShieldCheck, ArrowRight, Lock, KeyRound, AlertCircle, Sparkles } from "lucide-react";

interface CandidateLoginFormProps {
  onLoginSuccess: (payload: CandidateSessionPayload) => void;
}

export function CandidateLoginForm({ onLoginSuccess }: CandidateLoginFormProps) {
  const [regNumber, setRegNumber] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim() || !accessCode.trim()) return;

    setIsLoading(true);
    setErrorMsg("");

    const res = await candidateLoginAction({
      regNumber: regNumber.trim(),
      accessCode: accessCode.trim(),
    });

    setIsLoading(false);

    if (res.success && res.payload) {
      onLoginSuccess(res.payload);
    } else {
      setErrorMsg(res.error || "Authentication failed.");
    }
  };

  const handleQuickDemo = (reg: string, pin: string) => {
    setRegNumber(reg);
    setAccessCode(pin);
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
          Official entrance & coursework examination console for Ph.D research scholars
        </p>
      </div>

      {/* Main Login Card */}
      <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-100/60 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Secure Candidate Verification
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Scholar Registration / Roll Number *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. PHD26-CSE-001"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Examination Access PIN *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="6-digit examination PIN"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono tracking-widest placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? "Verifying Credentials..." : "Enter Examination Waiting Room"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Institutional Demo Credentials Helper */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Demo Credentials (1-Click Fill):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("PHD26-CSE-001", "998877")}
              className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors text-[11px]"
            >
              <span className="font-bold text-slate-800 block">Ananya Sharma (CSE)</span>
              <span className="font-mono text-[10px] text-slate-500">PHD26-CSE-001 • 998877</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("PHD26-MECH-001", "998877")}
              className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors text-[11px]"
            >
              <span className="font-bold text-slate-800 block">Rahul Verma (MECH)</span>
              <span className="font-mono text-[10px] text-slate-500">PHD26-MECH-001 • 998877</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Edge-AI Continuous Visual & Audio Proctoring Enforced</span>
      </div>
    </div>
  );
}
