export default function UsersList() {
  // Placeholder: will call supabase admin APIs when wired
  const users = [
    { id: "u1", email: "alice@example.com", role: "user" },
    { id: "u2", email: "bob@example.com", role: "admin" },
  ];

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center justify-between p-3 bg-card border border-border rounded-md"
        >
          <div>
            <div className="font-medium">{u.email}</div>
            <div className="text-xs text-foreground/60">Role: {u.role}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              title="Not connected to the live database yet"
              className="text-sm text-destructive/50 cursor-not-allowed"
            >
              Remove
            </button>
            <button
              disabled
              title="Not connected to the live database yet"
              className="text-sm text-accent/50 cursor-not-allowed"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
