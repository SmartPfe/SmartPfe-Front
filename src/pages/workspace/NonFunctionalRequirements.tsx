import React from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function NonFunctionalRequirements() {
  const categories = [
    {
      name: "Performance & Scalability",
      icon: "speed",
      color: "text-secondary",
      bg: "bg-secondary-container/30",
      requirements: [
        {
          id: "NFR-P-01",
          title: "Response Time",
          description: "Dashboard load time must not exceed 2 seconds for datasets up to 1 million rows under average network conditions."
        },
        {
          id: "NFR-P-02",
          title: "Concurrent Users",
          description: "System must support at least 500 concurrent active users without performance degradation."
        }
      ]
    },
    {
      name: "Security & Privacy",
      icon: "shield_lock",
      color: "text-primary",
      bg: "bg-primary-container/30",
      requirements: [
        {
          id: "NFR-S-01",
          title: "Data Encryption",
          description: "All sensitive user data and credentials must be encrypted in transit using TLS 1.3 and at rest using AES-256."
        },
        {
          id: "NFR-S-02",
          title: "Session Management",
          description: "Active sessions must automatically expire after 30 minutes of inactivity."
        }
      ]
    },
    {
      name: "Usability & Accessibility",
      icon: "accessibility_new",
      color: "text-[#d97706]", // Amber
      bg: "bg-[#fef3c7]",
      requirements: [
        {
          id: "NFR-U-01",
          title: "WCAG Compliance",
          description: "The web interface shall comply with WCAG 2.1 Level AA accessibility standards."
        },
        {
          id: "NFR-U-02",
          title: "Responsive Design",
          description: "The UI must be fully functional and optimized for mobile devices (viewport widths 320px and above)."
        }
      ]
    },
    {
      name: "Reliability & Availability",
      icon: "cloud_done",
      color: "text-[#059669]", // Emerald
      bg: "bg-[#d1fae5]",
      requirements: [
        {
          id: "NFR-R-01",
          title: "Uptime",
          description: "The production system shall maintain a 99.9% uptime guarantee during business hours (8 AM - 6 PM PST)."
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Non-Functional Requirements
            <InfoTooltip 
              label="Non-Func Reqs" 
              tooltip="Define system attributes like performance, security, and scalability." 
            />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Specify the criteria that judge the operation of the system, rather than specific behaviors. Define quality attributes like performance, security, and usability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Suggestions
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add NFR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        {categories.map((category) => (
          <div key={category.name} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/50 pb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", category.bg, category.color)}>
                <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">{category.name}</h2>
              <span className="ml-auto text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                {category.requirements.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {category.requirements.map((req) => (
                <div key={req.id} className="bg-surface border border-outline-variant rounded-xl p-5 hover:shadow-sm transition-shadow group relative overflow-hidden">
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", category.bg)}></div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-outline-variant bg-surface-container px-2 py-0.5 rounded uppercase tracking-wider">
                        {req.id}
                      </span>
                      <h3 className="font-bold text-on-surface text-sm leading-tight">{req.title}</h3>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {req.description}
                  </p>
                </div>
              ))}
              
              <button className="flex items-center gap-2 px-4 py-3 border border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container hover:text-on-surface transition-colors justify-center">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add {category.name.split(' & ')[0]} Req
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
