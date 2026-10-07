import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { useTranslation } from "react-i18next";
import { displayOptionLabel } from "@/lib/onboardingOptions";

type AdminProject = {
  _id: string;
  basics?: {
    title?: string;
    type?: string;
    domain?: string;
    academicYear?: string;
    university?: string;
  };
  technicalContext?: {
    methodology?: string;
    technologies?: string[];
  };
  user?: {
    fullName?: string;
    email?: string;
    role?: string;
  };
  createdAt: string;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminProjects() {
  const { t, i18n } = useTranslation("adminManagement");
  const tOnboarding = i18n.getFixedT(i18n.resolvedLanguage || i18n.language, "onboarding");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError("");
      setErrorKey(null);

      try {
        const data = await fetchApi("/admin/projects");
        setProjects(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else { setError(""); setErrorKey("projectsPage.error"); }
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const needle = query.trim().toLowerCase();
  const filteredProjects = needle
    ? projects.filter((project) => [project.basics?.title, project.basics?.domain, project.user?.fullName, project.user?.email]
      .some((value) => String(value || "").toLowerCase().includes(needle)))
    : projects;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
      <header className="flex flex-col gap-1">
        <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.18em]">{t("common.administration")}</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">{t("projectsPage.title")}</h1>
        <p className="text-sm text-on-surface-variant max-w-3xl">
          {t("projectsPage.description")}
        </p>
      </header>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface p-3 shadow-2xs">
        <div className="relative max-w-md">
          <HugeiconsIcon icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("projectsPage.search")} className="h-10 w-full rounded-xl border border-outline-variant bg-surface pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
      </section>

      {(error || errorKey) && (
        <div className="rounded-lg border border-error bg-error-container px-md py-sm text-on-error-container font-body-md text-body-md">
          {errorKey ? t(errorKey) : error}
        </div>
      )}

      <section className="rounded-2xl border border-outline-variant/80 bg-surface overflow-hidden shadow-2xs">
        <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-on-surface-variant">
          {t("common.showing", { shown: filteredProjects.length, total: projects.length, item: t("projectsPage.projects") })}
        </div>
        {isLoading ? (
          <div className="p-xl text-on-surface-variant">{t("projectsPage.loading")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="px-md py-sm">{t("projectsPage.table.project")}</th>
                  <th className="px-md py-sm">{t("projectsPage.table.student")}</th>
                  <th className="px-md py-sm">{t("projectsPage.table.methodology")}</th>
                  <th className="px-md py-sm">{t("projectsPage.table.technologies")}</th>
                  <th className="px-md py-sm">{t("projectsPage.table.created")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-md py-xl text-center text-on-surface-variant">
                      {t("projectsPage.empty")}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project._id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                      <td className="px-md py-sm min-w-64">
                        <p className="font-label-md text-label-md text-on-surface">{project.basics?.title || t("projectsPage.fallback.untitled")}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {project.basics?.domain ? displayOptionLabel(project.basics.domain, "domain", tOnboarding) : t("projectsPage.fallback.noDomain")} - {project.basics?.academicYear || t("projectsPage.fallback.noAcademicYear")}
                        </p>
                      </td>
                      <td className="px-md py-sm">
                        <p className="font-label-md text-label-md text-on-surface">{project.user?.fullName || t("projectsPage.fallback.unknown")}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{project.user?.email || t("projectsPage.fallback.noEmail")}</p>
                      </td>
                      <td className="px-md py-sm text-on-surface-variant">
                        {project.technicalContext?.methodology ? displayOptionLabel(project.technicalContext.methodology, "methodology", tOnboarding) : t("projectsPage.fallback.notProvided")}
                      </td>
                      <td className="px-md py-sm text-on-surface-variant max-w-xs">
                        {project.technicalContext?.technologies?.length
                          ? project.technicalContext.technologies.join(", ")
                          : t("projectsPage.fallback.notProvided")}
                      </td>
                      <td className="px-md py-sm text-on-surface-variant">{formatDate(project.createdAt, i18n.language)}</td>
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
