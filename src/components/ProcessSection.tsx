import React from 'react';
import { Calculator, CheckCircle2, PhoneCall, Sparkles } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ProcessStep } from '@/src/types/clearworks';

interface ProcessSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  steps: ProcessStep[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateStep: (step: number, field: 'title' | 'description', val: string) => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  steps,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateStep,
}) => {
  const icons = [
    <PhoneCall key="p1" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />,
    <Calculator key="p2" className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />,
    <Sparkles key="p3" className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />,
    <CheckCircle2 key="p4" className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />,
  ];

  return (
    <section
      id="process"
      className="py-11 md:py-16 bg-slate-200/70 relative overflow-hidden border-b border-slate-300/75"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Work Process
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="작업과정 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="작업과정 부제목 수정"
            />
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 -translate-y-12 z-0" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 relative z-10">
            {steps.map((item, idx) => (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-5">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-2xs">
                      {icons[idx % icons.length]}
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-slate-200 tabular-nums">
                      0{item.step}
                    </span>
                  </div>
                  <h3 className="text-[14px] sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2.5 leading-snug">
                    <EditableText
                      value={item.title}
                      onSave={(v) => onUpdateStep(item.step, 'title', v)}
                      isEditMode={isEditMode}
                      label={`단계 ${item.step} 제목 수정`}
                    />
                  </h3>
                  <p className="text-[11.5px] sm:text-sm text-slate-600 leading-snug sm:leading-relaxed">
                    <EditableText
                      value={item.description}
                      onSave={(v) => onUpdateStep(item.step, 'description', v)}
                      isEditMode={isEditMode}
                      label={`단계 ${item.step} 설명 수정`}
                      multiline
                    />
                  </p>
                </div>

                <div className="mt-3 sm:mt-5 pt-2.5 sm:pt-3 border-t border-slate-100">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tabular-nums">
                    STEP {item.step}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
