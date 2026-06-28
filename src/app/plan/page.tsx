import { StudyPlanWorkspace } from "@/components/StudyPlanWorkspace";

export default function PlanPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900">개인별 학습 계획</h1>
          <p className="text-sm text-zinc-500">
            시험 날짜와 과목별 분량을 입력하면 AI가 일별 학습 계획을 짜드려요.
          </p>
        </header>
        <StudyPlanWorkspace />
      </div>
    </div>
  );
}
