import React, { useState } from 'react';
import { Download, Lock, RotateCcw, Settings, Upload, X } from 'lucide-react';
import type { SiteData } from '@/src/types/clearworks';

interface SiteSettingsModalProps {
  isOpen: boolean;
  siteData: SiteData;
  onClose: () => void;
  onUpdateSiteData: React.Dispatch<React.SetStateAction<SiteData>>;
  onResetDefaults: () => void;
}

export const SiteSettingsModal: React.FC<SiteSettingsModalProps> = ({
  isOpen,
  siteData,
  onClose,
  onUpdateSiteData,
  onResetDefaults,
}) => {
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const updateCompany = (field: keyof SiteData['company'], val: string) => {
    onUpdateSiteData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: val },
    }));
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearworks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.company || !parsed.hero || !parsed.services) {
          setImportError('올바른 클리어웍스 백업 JSON 파일이 아닙니다.');
          return;
        }
        onUpdateSiteData(parsed);
        onClose();
      } catch {
        setImportError('JSON 파일을 해석하는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">사이트 기본 정보 &amp; 백업 설정</h3>
              <p className="text-xs text-slate-500">수정 내용은 즉시 반영되며 브라우저에 자동 저장됩니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Company Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              업체 기본 정보
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">상호명</label>
                <input
                  type="text"
                  value={siteData.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">서비스 대표 지역</label>
                <input
                  type="text"
                  value={siteData.company.region}
                  onChange={(e) => updateCompany('region', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대표 전화번호</label>
                <input
                  type="text"
                  value={siteData.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">카카오톡 상담 링크</label>
                <input
                  type="text"
                  value={siteData.company.kakaoLink}
                  onChange={(e) => updateCompany('kakaoLink', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대표자명</label>
                <input
                  type="text"
                  value={siteData.company.representative}
                  onChange={(e) => updateCompany('representative', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">사업자등록번호</label>
                <input
                  type="text"
                  value={siteData.company.bizNumber}
                  onChange={(e) => updateCompany('bizNumber', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">운영시간</label>
                <input
                  type="text"
                  value={siteData.company.operatingHours}
                  onChange={(e) => updateCompany('operatingHours', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">사업장 주소</label>
                <input
                  type="text"
                  value={siteData.company.address}
                  onChange={(e) => updateCompany('address', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Admin PIN */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>관리자 모드 비밀번호 설정</span>
            </h4>
            <input
              type="text"
              value={siteData.adminPin}
              onChange={(e) =>
                onUpdateSiteData((prev) => ({ ...prev, adminPin: e.target.value }))
              }
              placeholder="1234"
              className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
            <p className="text-[11px] text-slate-500">
              외부 방문자에게는 관리자 도구가 표시되지 않으며, 하단 &lsquo;관리자&rsquo; 버튼 또는{' '}
              <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">/#/admin</code> 경로로 접속할 수 있습니다.
            </p>
          </div>

          {/* Backup & Reset */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900">데이터 백업 · 복원 · 초기화</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>수정 내역 JSON 다운로드</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>백업 JSON 불러오기</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기값으로 되돌리기</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-red-700">정말 초기화할까요?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaults();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-1 rounded-lg bg-white text-slate-600 text-[11px] font-bold border border-slate-200 cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
            {importError && <p className="text-xs text-red-600">{importError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
