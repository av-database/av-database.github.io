import SkeletonGrid from "../../components/SkeletonGrid";

export default function HomeLoading() {
  return (
    <main className="max-w-5xl mx-auto w-full p-3">
      <div className="border-b-2 pb-2 mb-6">
        <h1 className="text-2xl font-bold">作品一覧</h1>
      </div>
      <SkeletonGrid variant="video" />
    </main>
  );
}
