'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { FileText, Upload, ShieldCheck, Download, Lock } from 'lucide-react';
import { DocumentItem } from '@/types';

export default function DocumentsPage() {
  const documents: DocumentItem[] = [
    {
      id: 'doc-1',
      employeeId: 'emp-201',
      title: 'Executed Employment Contract & IP Assignment',
      category: 'CONTRACT',
      fileUrl: '/uploads/EMP00201_Agreement.pdf',
      fileSize: 412500,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isVirusScanned: true,
      createdAt: '2022-04-01T09:00:00Z'
    },
    {
      id: 'doc-2',
      employeeId: 'emp-201',
      title: 'Government Identity & Passport Scan',
      category: 'ID_PROOF',
      fileUrl: '/uploads/EMP00201_Passport.pdf',
      fileSize: 184500,
      checksum: '7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c65dd0f32937b4e35',
      isVirusScanned: true,
      createdAt: '2022-04-01T09:15:00Z'
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole="ADMINISTRATOR" />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Secure Document Vault</h1>
              <p className="text-sm text-slate-500">
                Assessment 08: Encrypted personnel documents with SHA-256 integrity hashes & virus validation.
              </p>
            </div>

            <button className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">File Size</th>
                  <th className="px-6 py-3.5">SHA-256 Checksum</th>
                  <th className="px-6 py-3.5">Virus Scan</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      {doc.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500 truncate max-w-xs" title={doc.checksum}>
                      {doc.checksum.slice(0, 16)}...
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED CLEAN
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 ml-auto">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
