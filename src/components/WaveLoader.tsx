// A small ocean-wave loading indicator (bars travelling in a wave).
// Inherits its colour from the surrounding text via currentColor.
export default function WaveLoader({ className }: { className?: string }) {
  return (
    <span className={`wave-loader ${className ?? ""}`} aria-label="loading">
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
