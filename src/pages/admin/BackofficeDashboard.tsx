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

type AdminProject = {
  _id: string;
  basics?: {
    title?: string;
    domain?: string;
    academicYear?: string;
  };
  user?: {
    fullName?: string;
    email?: string;
  };
  createdAt: string;
};

type DashboardData = {
  totals: {
    users: number;
    students: number;
    admins: number;
    projects: number;
    completedOnboarding: number;
  };
  charts: {
    userGrowth: ChartItem[];
    projectGrowth: ChartItem[];
    onboardingStatus: ChartItem[];
    complexities: ChartItem[];
    domains: ChartItem[];
    methodologies: ChartItem[];
  };
  recentUsers: AdminUser[];
  recentProjects: AdminProject[];
};

type ChartItem = {
  label: string;
  value: number;
};

const emptyDashboard: DashboardData = {
  totals: {
    users: 0,
    students: 0,
    admins: 0,
    projects: 0,
    completedOnboarding: 0,
  },
  charts: {
    userGrowth: [],
    projectGrowth: [],
    onboardingStatus: [],
    complexities: [],
    domains: [],
    methodologies: [],
  },
  recentUsers: [],
  recentProjects: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({ icon, label, value, helper }: { icon: string; label: string; value: number; helper: string }) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-lg flex items-start justify-between gap-md">
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
        <p className="font-headline-lg text-headline-lg text-on-surface mt-xs">{value}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">{helper}</p>
      </div>
      <div className="w-11 h-11 rounded-lg bg-primary-container text-primary flex items-center justify-center">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
    </section>
  );
}

function BarChart({ title, description, data }: { title: string; description: string; data: ChartItem[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-base">{description}</p>
      </div>
      <div className="flex items-end gap-sm h-52 border-b border-outline-variant pt-md">
        {data.map((item) => (
          <div key={item.label} className="flex-1 min-w-0 h-full flex flex-col justify-end gap-xs">
            <span className="font-label-sm text-label-sm text-on-surface text-center">{item.value}</span>
            <div
              className="w-full rounded-t-lg bg-primary-container border border-primary/20 min-h-2"
              style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 2)}%` }}
              title={`${item.label}: ${item.value}`}
            ></div>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-center truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HorizontalChart({ title, description, data }: { title: string; description: string; data: ChartItem[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-base">{description}</p>
      </div>
      <div className="flex flex-col gap-sm">
        {data.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">No data available.</p>
        ) : (
          data.map((item) => (
            <div key={item.label} className="flex flex-col gap-base">
              <div className="flex items-center justify-between gap-md">
                <span className="font-label-md text-label-md text-on-surface truncate">{item.label}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 6 : 0)}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DonutChart({ title, description, data }: { title: string; description: string; data: ChartItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const completed = data[0]?.value || 0;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const legendColors = ["bg-primary", "bg-surface-container-highest"];

  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-lg flex flex-col gap-md">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-base">{description}</p>
      </div>
      <div className="flex items-center gap-lg">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(var(--theme-primary) ${percentage}%, var(--theme-surface-container-high) ${percentage}% 100%)`,
          }}
        >
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
            <span className="font-headline-sm text-headline-sm text-on-surface">{percentage}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-sm min-w-0">
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center gap-xs">
              <span className={`w-3 h-3 rounded-full ${legendColors[index] || "bg-outline"}`}></span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function BackofficeDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchApi("/admin/dashboard");
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load backoffice dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completionRate = dashboard.totals.users
    ? Math.round((dashboard.totals.completedOnboarding / dashboard.totals.users) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Backoffice</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Dashboard</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Monitor students, onboarding progress, and created PFE projects.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-outline-variant bg-surface p-xl text-on-surface-variant">
          Loading backoffice data...
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-md">
              <StatCard icon="group" label="Total Users" value={dashboard.totals.users} helper="All registered accounts" />
              <StatCard icon="school" label="Students" value={dashboard.totals.students} helper="Role: etudiant" />
              <StatCard icon="admin_panel_settings" label="Admins" value={dashboard.totals.admins} helper="Backoffice access" />
              <StatCard icon="folder_managed" label="Projects" value={dashboard.totals.projects} helper="Created workspaces" />
              <StatCard icon="task_alt" label="Completion" value={completionRate} helper="Onboarding completion %" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
              <BarChart
                title="User Growth"
                description="New users registered during the last 6 months."
                data={dashboard.charts.userGrowth}
              />
              <BarChart
                title="Project Creation"
                description="New PFE projects created during the last 6 months."
                data={dashboard.charts.projectGrowth}
              />
              <DonutChart
                title="Onboarding Status"
                description="Student onboarding completion across all accounts."
                data={dashboard.charts.onboardingStatus}
              />
              <HorizontalChart
                title="Project Complexity"
                description="Created projects grouped by declared complexity."
                data={dashboard.charts.complexities}
              />
              <HorizontalChart
                title="Projects by Domain"
                description="Most common PFE domains in created projects."
                data={dashboard.charts.domains}
              />
              <HorizontalChart
                title="Projects by Methodology"
                description="Methodologies selected during onboarding."
                data={dashboard.charts.methodologies}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-lg">
              <section id="users" className="rounded-lg border border-outline-variant bg-surface p-lg">
                <div className="flex items-center justify-between gap-md mb-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Users</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Latest registered accounts.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">person_add</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant text-on-surface-variant font-label-sm text-label-sm">
                        <th className="py-sm pr-sm">Name</th>
                        <th className="py-sm pr-sm">Role</th>
                        <th className="py-sm pr-sm">Onboarding</th>
                        <th className="py-sm">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentUsers.map((item) => (
                        <tr key={item._id} className="border-b border-outline-variant last:border-b-0">
                          <td className="py-sm pr-sm">
                            <p className="font-label-md text-label-md text-on-surface">{item.fullName}</p>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">{item.email}</p>
                          </td>
                          <td className="py-sm pr-sm">
                            <span className="px-sm py-base rounded-full bg-primary-container text-primary font-label-sm text-label-sm">
                              {item.role}
                            </span>
                          </td>
                          <td className="py-sm pr-sm text-on-surface-variant">
                            {item.hasCompletedOnboarding ? "Completed" : "Pending"}
                          </td>
                          <td className="py-sm text-on-surface-variant">{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="projects" className="rounded-lg border border-outline-variant bg-surface p-lg">
                <div className="flex items-center justify-between gap-md mb-md">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Projects</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Latest PFE workspaces.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">dashboard</span>
                </div>

                <div className="flex flex-col divide-y divide-outline-variant">
                  {dashboard.recentProjects.length === 0 ? (
                    <p className="py-lg text-on-surface-variant">No projects created yet.</p>
                  ) : (
                    dashboard.recentProjects.map((project) => (
                      <div key={project._id} className="py-sm flex items-start justify-between gap-md">
                        <div className="min-w-0">
                          <p className="font-label-md text-label-md text-on-surface truncate">
                            {project.basics?.title || "Untitled Project"}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {project.user?.fullName || "Unknown student"} - {project.basics?.domain || "No domain"}
                          </p>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant shrink-0">
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
        </>
      )}
    </div>
  );
}
