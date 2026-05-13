'use client';

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/features/dashboard/DashboardLayout";
import { 
  FileText, Upload, ExternalLink, ShieldCheck, Download,
  Clock, AlertCircle, CreditCard, UserCheck, Landmark
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

const docTypes = [
  { id: 'panCard', label: 'PAN Card', icon: CreditCard, desc: 'Organizational or Proprietor PAN card' },
  { id: 'aadhaarCard', label: 'Aadhaar Card', icon: UserCheck, desc: 'Aadhaar card of the authorized person' },
  { id: 'bankPassbook', label: 'Bank Passbook / Cheque', icon: Landmark, desc: 'Cancelled cheque or first page of passbook' },
];

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
    case 'uploaded':
      return { label: 'Uploaded', className: 'bg-primary/10 text-primary' };
    case 'pending':
    default:
      return { label: 'Pending Upload', className: 'bg-gray-100 text-gray-400' };
  }
};

export default function SubVendorDocuments() {
  const [documents, setDocuments] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/vendor/documents');
      if (res.data.success) {
        setDocuments(res.data.data.documents || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploading === type) return;

    if (file.type !== 'application/pdf') {
      alert("Only PDF documents are accepted for verification.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size should be less than 10MB");
      return;
    }

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
        await fetchDocuments();
      } else {
        throw new Error(res.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const uploadedCount = docTypes.filter(d => documents[d.id]?.url).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-black text-secondary">Compliance Documents</h1>
          <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">Manage your KYC and partnership agreements</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-soft">
            <h2 className="text-xl font-black text-secondary mb-8">Document Upload</h2>
            <div className="flex flex-col gap-5">
              {docTypes.map((doc) => {
                const docInfo = documents[doc.id];
                const isUploaded = !!docInfo?.url;
                const status = docInfo?.status || 'pending';
                const statusMeta = getStatusMeta(status);
                const DocIcon = doc.icon;

                return (
                  <div key={doc.id} className={`p-6 rounded-3xl border-2 transition-all ${
                    status === 'approved' ? 'border-green-100 bg-green-50/30' :
                    status === 'rejected' || status === 'reupload_required' ? 'border-red-100 bg-red-50/30' :
                    isUploaded ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          status === 'approved' ? 'bg-green-500 text-white' :
                          isUploaded ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          <DocIcon size={22} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-secondary">{doc.label}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          {isUploaded && (
                            <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                              {docInfo.fileName || 'Document.pdf'}
                              {docInfo.uploadedAt && (
                                <span className="ml-2 inline-flex items-center gap-1"><Clock size={10} /> {new Date(docInfo.uploadedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                          {docInfo?.remarks && ['rejected', 'reupload_required'].includes(status) && (
                            <div className="mt-2 p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                              <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-red-600 font-bold leading-relaxed">{docInfo.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUploaded && (
                          <a href={docInfo.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white rounded-xl text-primary shadow-sm hover:bg-primary hover:text-white transition-all border border-gray-100" title="Open Document">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <label className={`cursor-pointer px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          uploading === doc.id ? 'bg-gray-100 text-gray-400 cursor-wait' :
                          status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100 cursor-not-allowed' :
                          isUploaded ? 'bg-white border border-gray-100 text-gray-500 hover:text-primary hover:border-primary/20' :
                          'bg-primary text-white shadow-lg shadow-primary/20'
                        }`}>
                          {uploading === doc.id ? (
                            <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> ...</span>
                          ) : status === 'approved' ? (
                            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Done</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><Upload size={14} /> {isUploaded ? 'Replace' : 'Upload'}</span>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf" 
                            disabled={uploading === doc.id || status === 'approved'}
                            onChange={(e) => handleUpload(e, doc.id)} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-secondary p-8 rounded-[40px] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <ShieldCheck size={48} className="text-primary mb-6" />
              <h3 className="text-2xl font-black mb-4">Verification Status</h3>
              <p className="text-white/60 mb-8 leading-relaxed">Your account remains in 'Pending' status until all mandatory documents are approved by the SakhiHub compliance team.</p>
              <div className="space-y-3">
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold">Documents Uploaded</span>
                  <span className="text-xl font-black text-primary">{uploadedCount}/{docTypes.length}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary-light transition-all duration-1000"
                    style={{ width: `${(uploadedCount / docTypes.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
