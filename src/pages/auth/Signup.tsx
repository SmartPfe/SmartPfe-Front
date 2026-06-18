import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="w-full max-w-[420px] bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col gap-lg relative overflow-hidden">
      <header className="flex flex-col items-center text-center gap-xs mt-sm">
        <div className="w-12 h-12 bg-primary-container text-on-primary rounded-lg flex items-center justify-center mb-xs">
          <span className="material-symbols-outlined text-[28px]">school</span>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface">Create your Workspace</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px]">Join your academic journey and start building your PFE project.</p>
        <div className="mt-xs pt-xs border-t border-outline-variant w-full max-w-[200px] flex justify-center">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">PFE Guidance · Academic Year 2023-24</span>
        </div>
      </header>
      
      <form className="flex flex-col gap-md mt-sm">
        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">Full Name</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">person</span>
            <input type="text" id="fullName" placeholder="Jane Doe" required className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">University Email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">mail</span>
            <input type="email" id="email" placeholder="jane.doe@university.edu" required className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-base">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">lock</span>
            <input type="password" id="password" minLength={8} placeholder="••••••••" required className="w-full bg-surface h-12 pl-10 pr-sm border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors outline-none" />
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Must be at least 8 characters.</p>
        </div>

        <div className="mt-sm flex flex-col gap-md">
          <Link to="/onboarding/1" className="w-full h-12 bg-primary text-on-primary rounded-lg font-body-md text-body-md font-medium hover:bg-on-surface-variant transition-colors flex items-center justify-center gap-xs">
            Create Account
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
          <div className="text-center font-body-md text-body-md text-on-surface-variant">
            Already have an account? 
            <Link to="/login" className="text-primary hover:text-secondary font-medium transition-colors border-b border-transparent hover:border-secondary ml-1">Log in</Link>
          </div>
        </div>
      </form>

      <footer className="mt-md pt-md border-t border-surface-container text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
          By signing up, you agree to our 
          <a href="#" className="text-on-surface hover:text-primary underline transition-colors mx-1">Terms of Service</a> 
          and 
          <a href="#" className="text-on-surface hover:text-primary underline transition-colors ml-1">Privacy Policy</a>.
        </p>
      </footer>
    </div>
  );
}
