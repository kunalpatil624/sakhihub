'use client';

import React from 'react';
import { 
  User, ShieldCheck, MapPin, Phone, Mail, 
  Users, Briefcase, Sparkles, Target, 
  FileText, CreditCard, PieChart, Activity,
  ChevronRight, Link2, ExternalLink, Calendar,
  CheckCircle2, Clock, AlertCircle, X,
  FileCheck, Landmark, UserCheck, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface HierarchyDetailViewProps {
  data: {
    user: any;
    counts: {
      subVendors: number;
      employees: number;
      members: number;
      paidMembers: number;
      freeMembers: number;
      groups: number;
      campaigns: number;
      pendingApprovals: number;
    };
    hierarchy: {
      subVendors: any[];
      employees: any[];
      members: any[];
      groups: any[];
    };
  };
  onClose: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

export default function HierarchyDetailView({ data, onClose, onStatusUpdate }: HierarchyDetailViewProps) {
  const { user, counts, hierarchy } = data;
  const [activeTab, setActiveTab] = React.useState('overview');

  const getDocStatusMeta = (status?: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', className: 'bg-green-100 text-green-600', accent: 'border-green-100 bg-green-50/20' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-100 text-red-600', accent: 'border-red-100 bg-red-50/20' };
      case 'reupload_required':
        return { label: 'Re-upload Required', className: 'bg-red-100 text-red-600', accent: 'border-red-100 bg-red-50/20' };
      case 'under_review':
        return { label: 'Under Review', className: 'bg-amber-100 text-amber-600', accent: 'border-amber-100 bg-amber-50/20' };
      case 'missing':
        return { label: 'Pending Upload', className: 'bg-gray-200 text-gray-500', accent: 'border-gray-100 bg-gray-50/30' };
      case 'uploaded':
      case 'pending':
      default:
        return { label: 'Uploaded', className: 'bg-primary/10 text-primary', accent: 'border-primary/20 bg-primary/5' };
    }
  };

  const formatFileSize = (size?: string) => size || 'File size unavailable';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'network', label: 'Network', icon: Users },
    { id: 'ops', label: 'Operations', icon: Target },
    { id: 'docs', label: 'Compliance', icon: ShieldCheck },
  ];

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-soft flex items-center gap-4 hover:border-primary/20 transition-all group">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-secondary mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-white rounded-[40px] shadow-2xl border border-gray-100 min-h-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-secondary-dark to-secondary p-8 md:p-10 text-white relative shrink-0">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 md:right-10 md:top-10 w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-20"
          title="Close Details"
        ><X size={20} /></button>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[40px] bg-white text-secondary flex items-center justify-center text-4xl md:text-6xl font-black shadow-2xl border-4 border-white/20">
            {user.fullName?.[0] || 'U'}
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">{user.fullName}</h2>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-center md:self-auto ${user.status === 'active' ? 'bg-green-400 text-secondary' : 'bg-amber-400 text-secondary'}`}>
                {user.status}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold border border-white/10">
                <ShieldCheck size={14} className="text-primary-light" />
                <span>{user.role.replace('_', ' ').toUpperCase()}: {user.vendorCode || user.subVendorCode || user.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold border border-white/10">
                <MapPin size={14} className="text-primary-light" />
                <span>{user.district}, {user.state}</span>
              </div>
              {user.parentVendorId && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold border border-white/10">
                  <Link2 size={14} className="text-primary-light" />
                  <span>Parent: {user.parentVendorId.fullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-12 bg-white/5 p-1.5 rounded-[24px] border border-white/10 w-fit overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-secondary shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 md:p-10">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {user.role === 'vendor' && <StatCard label="Sub-Vendors" value={counts.subVendors} icon={Sparkles} color="bg-primary/10 text-primary" />}
              <StatCard label="Total Employees" value={counts.employees} icon={Briefcase} color="bg-secondary/10 text-secondary" />
              <StatCard label="Total Members" value={counts.members} icon={Users} color="bg-green-50 text-green-600" />
              <StatCard label="Women Groups" value={counts.groups} icon={Activity} color="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Detail List */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <FileText size={14} /> Profile Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Mobile', value: user.mobile, icon: Phone },
                      { label: 'Email', value: user.email || 'N/A', icon: Mail },
                      { label: 'Joined', value: new Date(user.createdAt).toLocaleDateString(), icon: Calendar },
                      { label: 'Area', value: `${user.block || 'All Blocks'}, ${user.district}`, icon: MapPin },
                      { label: 'Pincode', value: user.pincode || 'N/A', icon: MapPin },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 shadow-sm">
                          <item.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                          <p className="font-bold text-secondary text-sm">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Summary */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <CreditCard size={14} /> Membership Status
                  </h4>
                  <div className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[40px] border border-primary/10 flex flex-wrap gap-12 items-center justify-around">
                    <div className="text-center">
                      <p className="text-3xl font-black text-secondary">{counts.paidMembers}</p>
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Paid Members</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-secondary">{counts.freeMembers}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Free Members</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-secondary">{counts.pendingApprovals}</p>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Pending Approval</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                 <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Target size={14} /> Active Campaigns
                  </h4>
                  <div className="space-y-3">
                    {user.assignedCampaigns?.length > 0 ? user.assignedCampaigns.map((camp: any) => (
                      <div key={camp._id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-primary transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">C</div>
                          <p className="font-bold text-secondary text-sm">{camp.title}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                      </div>
                    )) : (
                      <div className="p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                        <p className="text-xs font-bold text-gray-400 italic">No assigned campaigns</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'network' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
             {/* Sub-Vendors (Only for Vendor) */}
             {user.role === 'vendor' && (
               <div>
                 <div className="flex justify-between items-end mb-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Sparkles size={14} /> Sub-Vendor Partners ({hierarchy.subVendors.length})
                   </h4>
                   <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Network</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {hierarchy.subVendors.length > 0 ? hierarchy.subVendors.map(sv => (
                     <div key={sv._id} className="p-5 bg-white border border-gray-100 rounded-[32px] shadow-sm flex items-center justify-between group hover:border-primary transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-lg">S</div>
                         <div>
                           <p className="font-black text-secondary leading-tight">{sv.fullName}</p>
                           <p className="text-[10px] text-primary font-black mt-0.5 uppercase tracking-widest">{sv.subVendorCode}</p>
                         </div>
                       </div>
                       <button className="p-2 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-primary group-hover:text-white transition-all"><ExternalLink size={14} /></button>
                     </div>
                   )) : (
                     <div className="col-span-2 p-10 bg-gray-50 rounded-[32px] border border-dashed border-gray-200 text-center">
                        <AlertCircle size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-400">No sub-vendors registered under this vendor yet.</p>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Employees */}
             <div>
                <div className="flex justify-between items-end mb-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Briefcase size={14} /> Field Operations Staff ({hierarchy.employees.length})
                  </h4>
                </div>
                <div className="overflow-hidden rounded-[32px] border border-gray-100 shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID & Role</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Region</th>
                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {hierarchy.employees.length > 0 ? hierarchy.employees.map(emp => (
                        <tr key={emp._id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="p-5 font-black text-secondary text-sm">{emp.fullName}</td>
                          <td className="p-5">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{emp.employeeId}</span>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{emp.designation}</p>
                          </td>
                          <td className="p-5 text-xs text-gray-500 font-bold">{emp.block || 'All'}, {emp.district}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${emp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="p-10 text-center text-xs font-bold text-gray-400">No field staff found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* Groups/Members Summary */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Recent Groups ({hierarchy.groups.length})</h4>
                   <div className="space-y-3">
                     {hierarchy.groups.slice(0, 5).map(g => (
                       <div key={g._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                         <div>
                           <p className="font-bold text-secondary text-sm">{g.groupName}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{g.village}, {g.totalMembers} Members</p>
                         </div>
                         <div className="text-[9px] font-black text-primary uppercase tracking-widest">Ldr: {g.leaderName}</div>
                       </div>
                     ))}
                   </div>
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Network Members ({hierarchy.members.length})</h4>
                   <div className="space-y-3">
                     {hierarchy.members.slice(0, 5).map(m => (
                       <div key={m._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                         <div>
                           <p className="font-bold text-secondary text-sm">{m.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{m.village} • {m.mobile}</p>
                         </div>
                         <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${m.membershipStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                           {m.membershipStatus}
                         </span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'ops' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="p-10 bg-gray-50 rounded-[40px] border border-gray-100 text-center">
               <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
               <h3 className="text-xl font-black text-secondary">Operations Dashboard</h3>
               <p className="text-sm text-gray-400 font-bold mt-2 max-w-md mx-auto">This section will display advanced metrics, support ticket history, and real-time field reports from the network.</p>
               <button className="btn-primary px-8 py-3 mt-6 text-[10px]">Open Analytics Portal</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
             <div className="flex flex-col lg:flex-row gap-12">
               {/* Main Document List */}
               <div className="flex-1 space-y-8">
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <FileText size={14} /> Document Review Workspace
                   </h4>
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    {[
                      { id: 'ngoCertificate', label: 'NGO Registration Certificate', icon: FileCheck },
                      { id: 'panCard', label: 'PAN Card (Org/Proprietor)', icon: CreditCard },
                      { id: 'aadhaarCard', label: 'Aadhaar Card (Auth. Person)', icon: UserCheck },
                      { id: 'bankPassbook', label: 'Bank Passbook / Cheque', icon: Landmark }
                    ].map((doc) => {
                      const docInfo = user.documents?.[doc.id];
                      const status = docInfo?.status || 'missing';
                      const isUploaded = !!docInfo?.url;
                      const statusMeta = getDocStatusMeta(status);

                      return (
                        <div key={doc.id} className={`p-6 md:p-8 rounded-[40px] border-2 transition-all flex flex-col gap-4 ${
                          statusMeta.accent || (isUploaded ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50/30')
                        }`}>
                          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center w-full">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-sm ${
                              status === 'approved' ? 'bg-green-500 text-white' :
                              status === 'rejected' ? 'bg-red-500 text-white' :
                              isUploaded ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                              <doc.icon size={28} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h5 className="font-black text-secondary text-lg truncate">{doc.label}</h5>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {docInfo?.uploadedAt ? new Date(docInfo.uploadedAt).toLocaleString() : 'Not Uploaded'}</span>
                                {isUploaded && <span className="flex items-center gap-1.5"><FileText size={12} /> PDF Document</span>}
                              </div>
                              {isUploaded && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                  <div className="p-3 rounded-2xl bg-white border border-gray-100">
                                    <p className="text-[9px] text-gray-300 mb-1">File Name</p>
                                    <p className="text-secondary truncate">{docInfo.fileName || 'Unnamed document'}</p>
                                  </div>
                                  <div className="p-3 rounded-2xl bg-white border border-gray-100">
                                    <p className="text-[9px] text-gray-300 mb-1">File Size</p>
                                    <p className="text-secondary">{formatFileSize(docInfo.fileSize)}</p>
                                  </div>
                                  {docInfo.publicId && (
                                    <div className="p-3 rounded-2xl bg-white border border-gray-100 md:col-span-2">
                                      <p className="text-[9px] text-gray-300 mb-1">Cloudinary Public ID</p>
                                      <p className="text-secondary truncate">{docInfo.publicId}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                              {isUploaded ? (
                                <>
                                  <a 
                                    href={docInfo.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white text-secondary font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    Open File <ExternalLink size={14} />
                                  </a>
                                  
                                  {status !== 'approved' && (
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => onStatusUpdate?.(user._id, `doc:${doc.id}:approved`)}
                                        className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-green-200"
                                        title="Approve"
                                      ><CheckCircle2 size={18} /></button>
                                      <button 
                                        onClick={() => {
                                          const remarks = prompt("Enter rejection remarks:");
                                          if (remarks) onStatusUpdate?.(user._id, `doc:${doc.id}:rejected:${remarks}`);
                                        }}
                                        className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-red-200"
                                        title="Reject"
                                      ><X size={18} /></button>
                                      <button 
                                        onClick={() => {
                                          const remarks = prompt("Enter re-upload instructions for the vendor:");
                                          if (remarks) onStatusUpdate?.(user._id, `doc:${doc.id}:reupload_required:${remarks}`);
                                        }}
                                        className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-amber-200"
                                        title="Request Re-upload"
                                      ><RefreshCw size={18} /></button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="px-6 py-3 bg-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-gray-200 cursor-not-allowed">
                                  Waiting for upload
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Review Metadata Section (Moved to Bottom) */}
                          {(docInfo?.reviewedAt || (docInfo?.remarks && ['rejected', 'reupload_required'].includes(status))) && (
                            <div className="flex flex-col gap-3 pt-4 border-t border-black/5 mt-2 w-full">
                              {docInfo?.reviewedAt && (
                                <div className="w-full text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <Clock size={10} /> Reviewed: {new Date(docInfo.reviewedAt).toLocaleString()}
                                </div>
                              )}

                              {docInfo?.remarks && ['rejected', 'reupload_required'].includes(status) && (
                                <div className="w-full p-4 bg-white/50 rounded-2xl border border-red-100 flex items-start gap-3">
                                   <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                   <div>
                                     <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mb-0.5">Admin Remark</p>
                                     <p className="text-[10px] text-red-600 font-bold leading-relaxed">{docInfo.remarks}</p>
                                   </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                 </div>
               </div>

               {/* Verification Summary Sidebar */}
               <div className="lg:w-80 space-y-8">
                 <div className="bg-secondary-dark p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                    <h4 className="text-xl font-black mb-6 relative z-10">Compliance Summary</h4>
                    
                    <div className="space-y-6 relative z-10">
                       {[
                         { label: 'Total Required', value: 4, icon: FileText, color: 'bg-white/10' },
                         { label: 'Uploaded', value: Object.keys(user.documents || {}).filter(k => ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'].includes(k) && user.documents[k]?.url).length, icon: CheckCircle2, color: 'bg-primary/40' },
                         { label: 'Approved', value: Object.keys(user.documents || {}).filter(k => ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'].includes(k) && user.documents[k]?.status === 'approved').length, icon: ShieldCheck, color: 'bg-green-500' },
                         { label: 'Rejected', value: Object.keys(user.documents || {}).filter(k => ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'].includes(k) && user.documents[k]?.status === 'rejected').length, icon: AlertCircle, color: 'bg-red-500' }
                       ].map((stat, i) => (
                         <div key={i} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                              <stat.icon size={20} />
                            </div>
                            <div>
                               <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
                               <p className="text-lg font-black">{stat.value}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                       <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${
                         Object.keys(user.documents || {}).filter(k => ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'].includes(k) && user.documents[k]?.status === 'approved').length === 4 
                         ? 'bg-green-500 text-white' 
                         : 'bg-white/10 text-white/60'
                       }`}>
                         {Object.keys(user.documents || {}).filter(k => ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'].includes(k) && user.documents[k]?.status === 'approved').length === 4 
                          ? 'All Documents Verified' 
                          : 'Verification Pending'}
                       </div>
                    </div>
                 </div>

                 <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
                    <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Clock size={14} /> Review Policy
                    </h5>
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                       Final approval of the vendor should only be granted once all 4 mandatory documents are marked as "approved". Rejected documents will prompt the vendor to re-upload.
                    </p>
                 </div>
               </div>
             </div>
          </motion.div>
        )}
      </div>

      {/* Footer / Approval Actions */}
      <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto shrink-0">
        <div className="flex items-center gap-4">
           <Activity size={20} className="text-primary animate-pulse" />
           <div>
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Network Health</p>
             <p className="font-bold text-secondary text-sm">Operational & Active</p>
           </div>
        </div>

        <div className="flex gap-4">
           {['pending', 'documents_uploaded', 'under_review', 'reupload_required'].includes(user.status) ? (
             <>
               <button 
                 onClick={() => onStatusUpdate?.(user._id, 'rejected')}
                 className="px-8 py-4 rounded-2xl border-2 border-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
               >Reject Partner</button>
               <button 
                 onClick={() => {
                   const requiredDocs = ['ngoCertificate', 'panCard', 'aadhaarCard', 'bankPassbook'];
                   const allApproved = requiredDocs.every(id => user.documents?.[id]?.status === 'approved');
                   
                   if (user.role === 'vendor' && !allApproved) {
                     alert("Cannot approve vendor: All 4 documents must be individually verified and approved first. Go to the Compliance tab to review each document.");
                     return;
                   }
                   onStatusUpdate?.(user._id, 'active');
                 }}
                 className="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all"
               >Approve & Activate</button>
             </>
           ) : (
             <button 
               onClick={onClose}
               className="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all"
             >Close Record</button>
           )}
        </div>
      </div>
    </div>
  );
}
