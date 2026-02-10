export default function ToolPreviewLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/[0.06] border-t-white/60 rounded-full  mx-auto mb-4" />
        <p className="text-sm text-white/40">Loading preview...</p>
      </div>
    </div>
  );
}
