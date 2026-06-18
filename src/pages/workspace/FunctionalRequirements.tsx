import React, { useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function FunctionalRequirements() {
  const [activeTab, setActiveTab] = useState("all");

  const requirements = [
    {
      id: "FR-01",
      module: "Authentication",
      title: "User Login",
      description: "The system shall allow users to log in using their email and password.",
      priority: "Must Have",
      status: "Approved",
    },
    {
      id: "FR-02",
      module: "Authentication",
      title: "Password Reset",
      description: "The system must provide an automated password reset feature via email link.",
      priority: "Should Have",
      status: "Draft",
    },
    {
      id: "FR-03",
      module: "Data Ingestion",
      title: "CSV Upload",
      description: "Users shall be able to upload retail dataset files in CSV format up to 500MB.",
      priority: "Must Have",
      status: "Approved",
    },
    {
      id: "FR-04",
      module: "Analytics",
      title: "Sales Forecasting",
      description: "The system should generate a 30-day predictive sales forecast based on historical data.",
      priority: "Could Have",
      status: "In Review",
    },
    {
      id: "FR-05",
      module: "Reporting",
      title: "Export Dashboard",
      description: "Users must be able to export their current dashboard view as a PDF document.",
      priority: "Should Have",
      status: "Draft",
    }
  ];

  const priorities: Record<string, string> = {
    "Must Have": "bg-error-container text-on-error-container border-error/20",
    "Should Have": "bg-secondary-container text-on-secondary-container border-secondary/20",
    "Could Have": "bg-primary-container text-on-primary-container border-primary/20",
    "Won't Have": "bg-surface-container-high text-on-surface border-outline-variant/50",
  };

  const statuses: Record<string, string> = {
    "Approved": "text-secondary",
    "In Review": "text-primary",
    "Draft": "text-outline",
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            Functional Requirements
            <InfoTooltip 
              label="Func Reqs" 
              tooltip="Specify the exact behaviors and features the system must support." 
            />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            List and organize the specific behaviors and functions your system must support. These define what the system is supposed to accomplish.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Generate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Requirement
          </button>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex gap-2 relative">
            {["All", "Authentication", "Data Ingestion", "Analytics", "Reporting"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === tab.toLowerCase()
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Search FRs..." 
              className="pl-9 pr-4 py-1.5 bg-surface border border-outline-variant rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider w-32">Priority</th>
                <th className="px-6 py-3 border-b border-outline-variant text-[10px] font-bold text-outline-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 border-b border-outline-variant w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono font-medium text-primary bg-primary-container/30 px-2 py-1 rounded inline-flex">
                      {req.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-outline-variant/50"></span>
                      {req.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-sm text-on-surface">{req.title}</span>
                      <span className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 pr-8">{req.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border",
                      priorities[req.priority]
                    )}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                      <span className={cn("material-symbols-outlined text-[16px]", statuses[req.status])}>
                        {req.status === "Approved" ? "check_circle" : req.status === "In Review" ? "pending" : "edit_document"}
                      </span>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-outline-variant hover:text-on-surface opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
