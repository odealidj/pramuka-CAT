"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FileDown, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { previewImportExcelApi, confirmImportExcelApi } from "@/services/question.service";
import type { ImportQuestionsPreviewResponse, ImportQuestionRow } from "@/types/auth";
import { isAxiosError } from "axios";

type Phase = "upload" | "preview";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportQuestionsPreviewResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setPhase("upload");
    setFile(null);
    setPreviewData(null);
    setApiError(null);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setApiError(null);
      setIsLoading(true);

      try {
        const data = await previewImportExcelApi(selectedFile);
        setPreviewData(data);
        setPhase("preview");
      } catch (err: any) {
        if (isAxiosError(err) && err.response?.status === 422) {
          // This means there are validation errors per row
          setPreviewData(err.response.data.data);
          setPhase("preview");
        } else {
          const msg = isAxiosError(err)
            ? err.response?.data?.message || "Gagal memproses file Excel"
            : "Terjadi kesalahan";
          setApiError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setIsLoading(true);
    setApiError(null);
    try {
      await confirmImportExcelApi({ questions: previewData.data });
      onSuccess();
      handleClose();
    } catch (err: any) {
      const msg = isAxiosError(err)
        ? err.response?.data?.message || "Gagal menyimpan data import"
        : "Terjadi kesalahan";
      setApiError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? handleClose : undefined}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Import Soal via Excel</h3>
              <p className="text-sm text-gray-500">Unggah file Excel untuk menambah banyak soal sekaligus.</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>{apiError}</p>
            </div>
          )}

          {phase === "upload" ? (
            <div className="space-y-6">


              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-gray-900 font-semibold mb-1">Pilih atau letakkan file Excel di sini</h4>
                <p className="text-gray-500 text-sm mb-6">Mendukung format .xlsx</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx"
                  onChange={handleFileChange}
                />
                
                <button
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Pilih File Excel"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview Stats */}
              {previewData && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Baris</p>
                    <p className="text-2xl font-bold text-gray-900">{previewData.total_rows}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm text-emerald-600 mb-1">Baris Valid</p>
                    <p className="text-2xl font-bold text-emerald-700">{previewData.valid_rows}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-sm text-red-600 mb-1">Baris Error</p>
                    <p className="text-2xl font-bold text-red-700">{previewData.error_rows}</p>
                  </div>
                </div>
              )}

              {previewData && previewData.error_rows > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-800 font-semibold text-sm">Terdapat data yang tidak valid</h4>
                    <p className="text-amber-700 text-sm mt-1">Harap perbaiki file Excel Anda dan unggah ulang, atau baris yang error tidak dapat disimpan.</p>
                  </div>
                </div>
              )}

              {/* Data Table */}
              {previewData && previewData.data.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Baris</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Soal</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Opsi</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Kunci</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewData.data.map((row) => (
                          <tr key={row.row} className={row.is_valid ? "hover:bg-gray-50" : "bg-red-50/50 hover:bg-red-50"}>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.row}</td>
                            <td className="px-4 py-3">
                              {row.is_valid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-xs font-semibold whitespace-nowrap">
                                  <CheckCircle2 size={12} /> Valid
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex w-fit items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 text-xs font-semibold whitespace-nowrap">
                                    <AlertCircle size={12} /> Error
                                  </span>
                                  <span className="text-xs text-red-600">{row.error}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 min-w-[200px]">
                              <p className="line-clamp-2 text-gray-900">{row.question_text || "-"}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs min-w-[150px]">
                              A: {row.option_a}<br/>
                              B: {row.option_b}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{row.correct_answer || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          {phase === "preview" && (
            <>
              <button
                onClick={() => {
                  setPhase("upload");
                  setPreviewData(null);
                  setFile(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Upload Ulang
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || !previewData || previewData.error_rows > 0}
                className="px-6 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Simpan {previewData?.valid_rows || 0} Soal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
