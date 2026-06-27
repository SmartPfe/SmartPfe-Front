import { Link } from "react-router-dom";

const SETTINGS_OPTIONS = [
  {
    icon: "assignment",
    title: "Edit Onboarding",
    description: "Update your project information, technical context, methodology, and technologies.",
    path: "/workspace/settings/onboarding",
    action: "Open project settings",
  },
  {
    icon: "account_circle",
    title: "Edit My Profile",
    description: "Manage the account information displayed in your workspace.",
    path: "/workspace/account",
    action: "Open account settings",
  },
];

export default function Settings() {
  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider">Settings</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">What would you like to edit?</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Choose whether you want to update your project onboarding data or your account settings.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {SETTINGS_OPTIONS.map((option) => (
          <Link
            key={option.path}
            to={option.path}
            className="group bg-surface border border-outline-variant rounded-lg p-xl flex flex-col gap-lg hover:border-primary hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-container text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[26px]">{option.icon}</span>
            </div>
            <div className="flex flex-col gap-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{option.title}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{option.description}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-xs font-label-md text-label-md text-primary">
              {option.action}
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
