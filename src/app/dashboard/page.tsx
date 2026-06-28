import { DashboardOverview } from "@/components/DashboardOverview";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900">학습 진행 대시보드</h1>
          <p className="text-sm text-zinc-500">
            요약, 퀴즈, 오답 노트, 학습 계획 진행 상황을 한눈에 확인하세요.
          </p>
        </header>
        <DashboardOverview />
      </div>
    </div>
  );
}
