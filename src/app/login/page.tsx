'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { usePortalStore, DEMO_USERS } from '@/lib/store';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, switchRole } = usePortalStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  const handleQuickLogin = (role: UserRole) => {
    switchRole(role);
    setEmail(DEMO_USERS[role].email);
    setLoginMsg(`Logged in successfully as ${role.toUpperCase()} (${DEMO_USERS[role].fullName})`);
    setTimeout(() => {
      router.push(role === 'admin' ? '/admin' : '/');
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase().includes('admin')) {
      handleQuickLogin('admin');
    } else if (email.toLowerCase().includes('reporter') || email.toLowerCase().includes('ward')) {
      handleQuickLogin('reporter');
    } else {
      handleQuickLogin('public');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-md">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">NepalDRR Authentication Portal</h1>
        <p className="text-xs text-slate-500">
          Sign in to access municipal reporting desks or national command capabilities.
        </p>
      </div>

      {loginMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{loginMsg}</span>
        </div>
      )}

      {/* 1-Click Fast Demo Login Switcher */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1-Click Demo Evaluation Logins
          </span>
          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950 px-2 py-0.5 rounded border border-purple-900">
            Hackathon Ready
          </span>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleQuickLogin('admin')}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between transition group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Administrator (NEOC)</span>
                <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  Full Access
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">admin.neoc@nepaldrr.gov.np</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-400 transition" />
          </button>

          <button
            onClick={() => handleQuickLogin('reporter')}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between transition group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Reporter (Municipal Officer)</span>
                <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  Report Incident
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">reporter.melamchi@nepaldrr.gov.np</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-400 transition" />
          </button>

          <button
            onClick={() => handleQuickLogin('public')}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between transition group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Public Viewer</span>
                <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  Read Only
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">citizen.viewer@nepaldrr.gov.np</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-400 transition" />
          </button>
        </div>
      </div>

      {/* Manual Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@nepaldrr.gov.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-md"
          >
            Sign In with Supabase Auth
          </button>
        </form>
      </div>
    </div>
  );
}
