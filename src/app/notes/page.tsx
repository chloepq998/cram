import { WrongNotesList } from "@/components/WrongNotesList";

export default function NotesPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50">
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900">오답 노트</h1>
          <p className="text-sm text-zinc-500">
            틀린 문제를 모아 다시 풀어보고 복습 상태를 관리하세요.
          </p>
        </header>
        <WrongNotesList />
      </div>
    </div>
  );
}
