'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, FileText, Upload, CheckCircle2, 
  AlertCircle, Clock, ChevronRight, 
  FileCheck, Landmark, CreditCard, UserCheck,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, name: 'Basic Info', status: 'completed' },
  { id: 2, name: 'Document Upload', status: 'current' },
  { id: 3, name: 'Admin Verification', status: 'upcoming' },
  { id: 4, name: 'Dashboard Access', status: 'upcoming' },
];

const docTypes = [
  { id: 'ngoCertificate', name: 'NGO Registration', icon: FileCheck, desc: 'Registration certificate issued by government' },
  { id: 'panCard', name: 'PAN Card', icon: CreditCard, desc: 'Organizational or Proprietor PAN card' },
  { id: 'aadhaarCard', name: 'Aadhaar Card', icon: UserCheck, desc: 'Aadhaar card of the authorized person' },
  { id: 'bankPassbook', name: 'Bank Document', icon: Landmark, desc: 'Cancelled cheque or first page of passbook' },
];

export default function VendorOnboarding() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [fileStates, setFileStates] = useState<{[key: string]: { name: string, size: string, error?: string }}>({});

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

  const getStatusMeta = (status?: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', className: 'bg-green-100 text-green-600' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-100 text-red-600' };
      case 'reupload_required':
        return { label: 'Re-upload Required', className: 'bg-red-100 text-red-600' };
      case 'under_review':
        return { label: 'Under Review', className: 'bg-amber-100 text-amber-600' };
      case 'documents_uploaded':
        return { label: 'Submitted', className: 'bg-primary/10 text-primary' };
      case 'uploaded':
      case 'pending':
      default:
        return { label: 'Pending Upload', className: 'bg-gray-100 text-gray-400' };
    }
  };

  const formatFileSize = (size?: string) => size || 'File size unavailable';

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setProfile(res.data.data);
        if (['active', 'approved'].includes(res.data.data.status)) {
          router.push('/vendor/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploading === type) return;

    // Strict PDF Validation
    if (file.type !== 'application/pdf') {
      alert("Only PDF documents are accepted for verification.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // Increased to 10MB for high-quality PDFs
      alert("File size should be less than 10MB");
      return;
    }

    setFileStates(prev => ({
      ...prev,
      [type]: { 
        name: file.name, 
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB" 
      }
    }));

    setUploading(type);
    try {
      const base64 = await fileToDataUrl(file);
      const res = await axios.post('/api/vendor/documents', {
        file: base64,
        type,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        mimeType: file.type,
      });

      if (res.data.success) {
        await fetchProfile();

        setFileStates(prev => {
          const newState = { ...prev };
          delete newState[type];
          return newState;
        });
      } else {
        throw new Error(res.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setFileStates(prev => ({
        ...prev,
        [type]: { ...prev[type], error: err.response?.data?.message || 'Upload failed' }
      }));
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const allUploaded = docTypes.every(doc => profile?.documents?.[doc.id]?.url);
  const allVerified = docTypes.every(doc => profile?.documents?.[doc.id]?.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-6 sticky top-0 z-30">
        <div className="container flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">S</div>
            <div>
              <h1 className="text-lg font-black text-secondary tracking-tight">SakhiHub Vendor</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verification Portal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="container max-w-5xl mt-12 px-4">
        {/* Progress Stepper */}
        <div className="flex justify-between mb-16 relative">
          <div className="absolute top-[18px] left-0 w-full h-[2px] bg-gray-100 z-0"></div>
          {steps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                profile?.status === 'active' ? 'bg-green-500 text-white' :
                step.id === 1 ? 'bg-green-500 text-white' :
                step.id === 2 ? 'bg-primary text-white ring-8 ring-primary/10' :
                'bg-white text-gray-300 border-2 border-gray-100'
              }`}>
                {step.id < 2 || profile?.status === 'active' ? <CheckCircle2 size={18} /> : step.id}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step.id === 2 ? 'text-primary' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-3xl font-black text-secondary mb-2">Complete Verification</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Please upload high-quality PDF or Image scans of the following documents</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {docTypes.map((doc) => {
                const docInfo = profile?.documents?.[doc.id];
                const isUploaded = !!docInfo?.url;
                const status = docInfo?.status || 'pending';
                const statusMeta = getStatusMeta(status);

                return (
                  <div key={doc.id} className={`p-8 rounded-[40px] border-2 transition-all relative overflow-hidden group ${
                    status === 'approved' ? 'border-green-100 bg-green-50/30' :
                    status === 'rejected' ? 'border-red-100 bg-red-50/30' :
                    isUploaded ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-white hover:border-primary/20'
                  }`}>
                    {status === 'approved' && (
                      <div className="absolute top-4 right-4 text-green-500">
                        <ShieldCheck size={24} />
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
                      status === 'approved' ? 'bg-green-500 text-white' :
                      status === 'rejected' ? 'bg-red-500 text-white' :
                      isUploaded ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      <doc.icon size={28} />
                    </div>

                    <h3 className="text-xl font-black text-secondary mb-2">{doc.name}</h3>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FileText size={12} /> PDF ONLY
                    </p>
                    <p className="text-xs text-gray-400 font-bold leading-relaxed mb-6">{doc.desc}</p>

                    <div className="flex flex-col gap-4">
                      {isUploaded ? (
                        <div className="flex flex-col gap-4 bg-white/70 p-4 rounded-3xl border border-gray-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-100 text-green-600">
                                  Uploaded
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <p className="text-sm font-black text-secondary truncate">{docInfo.fileName || doc.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{formatFileSize(docInfo.fileSize)}</p>
                              {docInfo.uploadedAt && (
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                  Uploaded {new Date(docInfo.uploadedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <a
                              href={docInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-2xl text-primary border border-gray-100 shadow-sm hover:bg-primary hover:text-white transition-all shrink-0"
                              title="Open uploaded document"
                            >
                              <ChevronRight size={16} />
                            </a>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                            <a href={docInfo.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2">
                              Preview / Open <ChevronRight size={14} />
                            </a>
                            {docInfo.publicId && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[180px]">
                                Cloudinary: {docInfo.publicId}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Selected File Preview */}
                      {fileStates[doc.id] && !isUploaded && (
                        <div className="p-3 bg-white/80 rounded-2xl border border-primary/10 flex flex-col gap-1">
                          <p className="text-[10px] font-black text-secondary truncate">{fileStates[doc.id].name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{fileStates[doc.id].size}</p>
                        </div>
                      )}

                      <label className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest cursor-pointer transition-all ${
                        uploading === doc.id ? 'bg-gray-100 text-gray-400 cursor-wait' :
                        isUploaded ? 'bg-white border-2 border-gray-100 text-gray-400 hover:border-primary/20 hover:text-primary' : 
                        'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'
                      }`}>
                        {uploading === doc.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        ) : (
                          <><Upload size={16} /> {isUploaded ? 'Re-upload' : 'Choose PDF'}</>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf" 
                          disabled={uploading === doc.id}
                          onChange={(e) => handleFileUpload(e, doc.id)} 
                        />
                      </label>
                    </div>

                    {/* Review Metadata Section (Bottom stacked) */}
                    {(docInfo?.reviewedAt || (docInfo?.remarks && ['rejected', 'reupload_required'].includes(status))) && (
                      <div className="flex flex-col gap-3 pt-4 border-t border-black/5 mt-4 w-full">
                        {docInfo?.reviewedAt && (
                          <div className="w-full text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1">
                            <Clock size={10} /> Reviewed: {new Date(docInfo.reviewedAt).toLocaleString()}
                          </div>
                        )}

                        {['rejected', 'reupload_required'].includes(status) && docInfo?.remarks && (
                          <div className="w-full p-4 bg-white/50 rounded-2xl border border-red-100 flex items-start gap-3">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">
                                {status === 'reupload_required' ? 'Re-upload Instructions' : 'Reason for Rejection'}
                              </p>
                              <p className="text-[10px] text-red-500 font-bold leading-relaxed">{docInfo.remarks}</p>
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

          {/* Sidebar / Status Area */}
          <div className="space-y-8">
            <div className="bg-secondary-dark p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
               <h4 className="text-2xl font-black mb-6 relative z-10">Verification Status</h4>
               
               <div className="space-y-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${allUploaded ? 'bg-green-500' : 'bg-white/10'}`}>
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Documents</p>
                      <p className="font-bold text-sm">{allUploaded ? 'All Uploaded' : 'Pending Uploads'}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${['documents_uploaded', 'under_review'].includes(profile?.status) ? 'bg-amber-500 animate-pulse' : profile?.status === 'reupload_required' ? 'bg-red-500' : 'bg-white/10'}`}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Review Process</p>
                      <p className="font-bold text-sm">
                        {profile?.status === 'documents_uploaded' ? 'Documents Submitted' :
                         profile?.status === 'under_review' ? 'In Progress' :
                         profile?.status === 'reupload_required' ? 'Re-upload Required' :
                         'Waiting for Upload'}
                      </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${['active', 'approved'].includes(profile?.status) ? 'bg-green-500' : 'bg-white/10'}`}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Final Approval</p>
                      <p className="font-bold text-sm">{['active', 'approved'].includes(profile?.status) ? 'Access Granted' : 'Pending Approval'}</p>
                    </div>
                 </div>
               </div>

               <div className="mt-12 pt-8 border-t border-white/10 relative z-10 text-center">
                 <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                   Once all documents are uploaded, our compliance team will verify your organization within 24-48 business hours.
                 </p>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100">
              <h5 className="text-sm font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-primary" /> Security Note
              </h5>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                Your data is stored securely using enterprise-grade encryption. We only use these documents for government compliance and NGO verification purposes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
