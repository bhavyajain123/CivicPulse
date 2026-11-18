export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase().replace(/ /g, '-')}`}>
      {status}
    </span>
  );
}