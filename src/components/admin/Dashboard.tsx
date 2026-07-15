import UsersList from "./UsersList";
import ReadingsList from "./ReadingsList";
import ApiCheck from "./ApiCheck";

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <section className="section-surface p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Site Activity</h3>
          <p className="text-sm text-foreground/70">Quick overview and recent readings.</p>
          <ReadingsList />
        </section>

        <section className="section-surface p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">User Management</h3>
          <UsersList />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="section-surface p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">API & Workflow Checks</h3>
          <ApiCheck />
        </section>
      </aside>
    </div>
  );
}
