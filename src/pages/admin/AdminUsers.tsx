import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "etudiant";
  hasCompletedOnboarding: boolean;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchApi("/admin/users");
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => roleFilter === "all" || user.role === roleFilter);

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Backoffice</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Users</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          View and monitor every registered account on the platform.
        </p>
      </header>

      <section className="rounded-lg border border-outline-variant bg-surface p-md flex justify-end">
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="h-11 px-sm bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="etudiant">Students</option>
        </select>
      </section>

      {error && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-outline-variant bg-surface overflow-hidden">
        <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant">
          Showing {filteredUsers.length} of {users.length} users
        </div>
        {isLoading ? (
          <div className="p-xl text-on-surface-variant">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="px-md py-sm">User</th>
                  <th className="px-md py-sm">Role</th>
                  <th className="px-md py-sm">Onboarding</th>
                  <th className="px-md py-sm">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-md py-xl text-center text-on-surface-variant">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                      <td className="px-md py-sm">
                        <p className="font-label-md text-label-md text-on-surface">{user.fullName}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</p>
                      </td>
                      <td className="px-md py-sm">
                        <span className="px-sm py-base rounded-full bg-primary-container text-primary font-label-sm text-label-sm uppercase">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-md py-sm text-on-surface-variant">
                        {user.hasCompletedOnboarding ? "Completed" : "Pending"}
                      </td>
                      <td className="px-md py-sm text-on-surface-variant">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
