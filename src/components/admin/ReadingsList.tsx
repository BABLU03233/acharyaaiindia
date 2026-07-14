export default function ReadingsList() {
  const items = [
    { id: "r1", user: "alice@example.com", status: "completed" },
    { id: "r2", user: "guest@anon", status: "pending" },
  ];

  return (
    <div className="space-y-3 mt-4">
      {items.map((it) => (
        <div
          key={it.id}
          className="p-3 bg-card border border-border rounded-md flex items-center justify-between"
        >
          <div>
            <div className="font-medium">{it.user}</div>
            <div className="text-xs text-foreground/60">Status: {it.status}</div>
          </div>
          <div className="text-xs text-foreground/60">{it.id}</div>
        </div>
      ))}
    </div>
  );
}
