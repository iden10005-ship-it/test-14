import React from 'react';
import {
  Eye,
  Inbox,
  LogOut,
  Pencil,
  Settings,
  Shield,
} from 'lucide-react';

interface AdminToolbarProps {
  isEditMode: boolean;
  inquiryCount: number;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onOpenInquiries: () => void;
  onExitAdmin: () => void;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  isEditMode,
  inquiryCount,
  onToggleEditMode,
  onOpenSettings,
  onOpenInquiries,
  onExitAdmin,
}) => {
  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 z-[60]">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
            <Shield className="w-4 h-4 shrink-0" />
            <span>관리자 모드</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {isEditMode
              ? '편집 활성화됨 — 화면의 글자나 이미지 변경 버튼을 눌러 바로 수정하세요.'
              : '미리보기 중 — 방문자와 동일한 화면입니다. 편집 모드를 켜면 바로 수정할 수 있습니다.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleEditMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isEditMode
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>편집 중 (미리보기 전환)</span>
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" />
                <span>바로 편집 켜기</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenInquiries}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Inbox className="w-3.5 h-3.5 text-blue-400" />
            <span>견적문의</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] tabular-nums">
              {inquiryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>사이트 설정</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>관리자 종료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
