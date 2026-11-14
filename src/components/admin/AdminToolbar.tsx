import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Inbox,
  Loader2,
  LogOut,
  Pencil,
  Save,
  Settings,
  Shield,
} from 'lucide-react';

export type CodeSyncStatus = 'checking' | 'saved' | 'saving' | 'readonly' | 'error';

interface AdminToolbarProps {
  isEditMode: boolean;
  inquiryCount: number;
  blogCount?: number;
  codeSyncStatus: CodeSyncStatus;
  onSaveNow: () => void;
  onToggleEditMode: () => void;
  onOpenBlogManager: () => void;
  onOpenSettings: () => void;
  onOpenInquiries: () => void;
  onExitAdmin: () => void;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  isEditMode,
  inquiryCount,
  blogCount = 0,
  codeSyncStatus,
  onSaveNow,
  onToggleEditMode,
  onOpenBlogManager,
  onOpenSettings,
  onOpenInquiries,
  onExitAdmin,
}) => {
  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 z-[60]">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
            <Shield className="w-4 h-4 shrink-0" />
            <span>관리자 모드</span>
          </div>

          {codeSyncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>코드에 저장 중...</span>
            </span>
          )}
          {codeSyncStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>실제 코드 반영 완료</span>
            </span>
          )}
          {codeSyncStatus === 'readonly' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold">
              <span>배포 미리보기 모드</span>
            </span>
          )}
          {codeSyncStatus === 'error' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[11px] font-bold">
              <span>코드 저장 오류</span>
            </span>
          )}

          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            {isEditMode
              ? '수정 시 소스코드(siteContent.json · uploads)에 자동 반영됩니다.'
              : '방문자 화면 미리보기 중입니다.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {codeSyncStatus !== 'readonly' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="수정된 내용을 실제 코드 파일에 즉시 저장합니다"
            >
              <Save className="w-3.5 h-3.5" />
              <span>코드 즉시 저장</span>
            </button>
          )}

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
            onClick={onOpenBlogManager}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="업계 팁 및 프로젝트 소식 블로그 작성·관리"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Blog</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-200 text-[10px] tabular-nums">
              {blogCount}
            </span>
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
