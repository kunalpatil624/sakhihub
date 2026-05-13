'use client';

import React, { useEffect, useState } from "react";
import { 
  Network, 
  MapPin, 
  UserPlus, 
  ShieldAlert, 
  RefreshCcw, 
  LogOut 
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PendingAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        const user = res.data.data;
        
        // If assignment is now completed, redirect to the appropriate dashboard
        if (user.assignmentStatus === 'completed') {
          const dashMap: any = {
            super_admin: '/admin/dashboard',
            vendor: '/vendor/dashboard',
            sub_vendor: '/sub-vendor/dashboard',
            employee: '/employee/dashboard',
            member: '/member/dashboard'
          };
          router.push(dashMap[user.role] || '/');
          return;
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Optional: Poll every 30 seconds to catch admin changes without refresh
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full">
        {/* Animated Icon Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>
          <div className="relative w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mx-auto border border-primary/10">
            <Network size={64} className="text-primary animate-bounce-slow" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
            Hierarchy Setup
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl md:text-5xl font-black text-secondary mb-6 leading-tight">
          Awaiting <span className="text-primary">Hierarchy</span> Mapping
        </h1>
        
        <p className="text-gray-500 text-lg md:text-xl font-medium mb-12 leading-relaxed max-w-xl mx-auto">
          You've successfully registered! Our administration team is now assigning you to the correct 
          <span className="text-secondary font-bold"> Vendor network</span> and 
          <span className="text-secondary font-bold"> Campaign area</span>.
        </p>

        {/* Status Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registration</p>
            <p className="text-sm font-bold text-secondary">Completed</p>
          </div>

          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 ring-2 ring-primary/20">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center animate-pulse">
              <RefreshCcw size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Hierarchy</p>
            <p className="text-sm font-bold text-secondary">In Progress</p>
          </div>

          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 opacity-50">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center">
              <RefreshCcw size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dashboard</p>
            <p className="text-sm font-bold text-secondary">Locked</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <button 
            onClick={checkStatus}
            className="flex items-center gap-3 px-8 py-4 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all"
          >
            <RefreshCcw size={16} /> Check Status Now
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="mt-20 flex items-center justify-center gap-3 text-gray-300">
          <ShieldAlert size={16} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">SakhiHub Protocol 2026</p>
        </div>
      </div>
    </div>
  );
}
