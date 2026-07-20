import React, { useState } from "react";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";

export default function UmlPreparation() {
  const [activeDiagram, setActiveDiagram] = useState("class");
  const [activeView, setActiveView] = useState("elements");

  const diagrams = [
    { id: "usecase", name: "Use Case Diagram", icon: "person_play" },
    { id: "class", name: "Class Diagram", icon: "account_tree" },
    { id: "sequence", name: "Sequence Diagram", icon: "sync_alt" },
    { id: "activity", name: "Activity Diagram", icon: "schema" },
  ];

  const diagramsData: Record<string, any> = {
    usecase: {
      description: "Define the actors and the specific actions (use cases) they can perform in the system.",
      markup: `flowchart LR
    Customer --> (Login)
    Customer --> (View Dashboard)
    Customer --> (Export Reports)
    
    Admin --> (Manage Users)
    Admin --> (Configure System)
    
    (View Dashboard) --> AnalyticsEngine
    AnalyticsEngine --> (Generate Predictions)`,
      elements: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                <span className="font-bold text-on-surface">Actors</span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {["Customer", "Admin", "AnalyticsEngine"].map(actor => (
                <div key={actor} className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{actor}</span>
                  <button className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              ))}
              <button className="mt-2 px-3 py-2 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Actor
              </button>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">play_circle</span>
                <span className="font-bold text-on-surface">Use Cases</span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {["Login", "View Dashboard", "Export Reports", "Manage Users", "Generate Predictions", "Configure System"].map(uc => (
                <div key={uc} className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{uc}</span>
                  <button className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              ))}
              <button className="mt-2 px-3 py-2 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Use Case
              </button>
            </div>
          </div>
        </div>
      )
    },
    class: {
      description: "Define the structural entities before generating the diagram. AI can suggest attributes based on your Product Backlog.",
      markup: `classDiagram
    class User {
        <<Abstract>>
        +UUID id
        +String email
        +String passwordHash
        +login()
        +logout()
        +resetPassword()
    }
    
    class Customer {
        +Address shippingAddress
        +String paymentMethod
        +placeOrder()
        +viewHistory()
    }
    
    class Order {
        +UUID orderId
        +DateTime date
        +Float total
        +OrderStatus status
        +calculateTotal()
        +updateStatus()
    }

    User <|-- Customer
    Customer "1" *-- "*" Order : places`,
      elements: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              name: "User",
              type: "Abstract Class",
              attributes: ["id: UUID", "email: String", "passwordHash: String"],
              methods: ["login()", "logout()", "resetPassword()"]
            },
            {
              name: "Customer",
              type: "Class extends User",
              attributes: ["shippingAddress: Address", "paymentMethod: String"],
              methods: ["placeOrder()", "viewHistory()"]
            },
            {
              name: "Order",
              type: "Class",
              attributes: ["orderId: UUID", "date: DateTime", "total: Float", "status: OrderStatus"],
              methods: ["calculateTotal()", "updateStatus()"]
            }
          ].map((el, i) => (
            <div key={i} className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">data_object</span>
                  <span className="font-bold text-on-surface">{el.name}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-outline-variant tracking-wider bg-surface-container px-2 py-0.5 rounded">
                  {el.type}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <h4 className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">remove</span>
                    Attributes
                  </h4>
                  <ul className="flex flex-col gap-1 text-sm font-mono text-on-surface">
                    {el.attributes.map((attr, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-outline"></span>
                        {attr}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-outline-variant/50 pt-4">
                  <h4 className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">function</span>
                    Methods
                  </h4>
                  <ul className="flex flex-col gap-1 text-sm font-mono text-on-surface">
                    {el.methods.map((method, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                        {method}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <button className="min-h-[200px] border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors bg-surface/50">
            <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container-lowest">
              <span className="material-symbols-outlined">add</span>
            </div>
            <span className="text-sm font-medium">Add New Class</span>
          </button>
        </div>
      )
    },
    sequence: {
      description: "Define the objects participating in the interaction and the messages exchanged between them in time sequence.",
      markup: `sequenceDiagram
    actor User
    participant Frontend
    participant AuthService
    participant Database

    User->>Frontend: Enter credentials
    Frontend->>AuthService: POST /login
    AuthService->>Database: Query User
    Database-->>AuthService: Return User details
    AuthService-->>Frontend: JWT Token
    Frontend-->>User: Redirect to Dashboard`,
      elements: (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#059669] text-[18px]">group</span>
                <span className="font-bold text-on-surface">Participants</span>
              </div>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {["User (Actor)", "Frontend", "AuthService", "Database"].map(p => (
                <span key={p} className="px-3 py-1.5 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant text-sm font-medium flex items-center gap-2">
                  {p} <button className="text-outline-variant hover:text-error ml-1"><span className="material-symbols-outlined text-[14px]">close</span></button>
                </span>
              ))}
              <button className="px-3 py-1.5 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Add
              </button>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">swap_horiz</span>
                <span className="font-bold text-on-surface">Messages (In Order)</span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {[
                { source: "User", target: "Frontend", msg: "Enter credentials" },
                { source: "Frontend", target: "AuthService", msg: "POST /login" },
                { source: "AuthService", target: "Database", msg: "Query User" },
                { source: "Database", target: "AuthService", msg: "Return User details" },
                { source: "AuthService", target: "Frontend", msg: "JWT Token" },
                { source: "Frontend", target: "User", msg: "Redirect to Dashboard" },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                  <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-outline-variant">{i + 1}</div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <span className="font-semibold text-on-surface w-24 truncate">{m.source}</span>
                    <span className="material-symbols-outlined text-outline-variant text-[16px] hidden sm:block">arrow_forward</span>
                    <span className="font-semibold text-on-surface w-24 truncate">{m.target}</span>
                    <span className="text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/30 flex-1">{m.msg}</span>
                  </div>
                  <button className="text-outline-variant hover:text-error"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              ))}
              <button className="mt-2 py-3 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Message
              </button>
            </div>
          </div>
        </div>
      )
    },
    activity: {
      description: "Map the flow of control or data through the system's operations and workflows.",
      markup: `stateDiagram-v2
    [*] --> Login
    Login --> ValidateCredentials
    ValidateCredentials --> Dashboard : Success
    ValidateCredentials --> Login : Failure
    Dashboard --> ProcessData
    ProcessData --> GenerateReport
    GenerateReport --> [*]`,
      elements: (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d97706] text-[18px]">account_tree</span>
                <span className="font-bold text-on-surface">Workflow Steps</span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {[
                { from: "[*] (Start)", to: "Login", label: "" },
                { from: "Login", to: "ValidateCredentials", label: "" },
                { from: "ValidateCredentials", to: "Dashboard", label: "Success" },
                { from: "ValidateCredentials", to: "Login", label: "Failure" },
                { from: "Dashboard", to: "ProcessData", label: "" },
                { from: "ProcessData", to: "GenerateReport", label: "" },
                { from: "GenerateReport", to: "[*] (End)", label: "" },
              ].map((step, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/50">
                  <span className="text-sm font-medium text-on-surface min-w-32">{step.from}</span>
                  <span className="material-symbols-outlined text-outline-variant text-[16px]">arrow_right_alt</span>
                  <span className="text-sm font-medium text-on-surface min-w-32">{step.to}</span>
                  {step.label && (
                    <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant/50">
                      [ {step.label} ]
                    </span>
                  )}
                  <button className="text-outline-variant hover:text-error ml-auto"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              ))}
              <button className="mt-2 py-3 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Transition
              </button>
            </div>
          </div>
        </div>
      )
    }
  };

  const currentData = diagramsData[activeDiagram];

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            UML Preparation
            <InfoTooltip 
              label="UML" 
              tooltip="Design the system architecture using Unified Modeling Language diagrams." 
            />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Prepare your system models. Define entities, map relationships, and generate diagram code (Mermaid/PlantUML) based on your project's requirements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-md text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export All
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 pb-8">
        {/* Left Sidebar: Diagram Selector */}
        <div className="w-full xl:w-64 flex flex-col gap-2 shrink-0">
          <h3 className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-2 px-2">Diagrams</h3>
          {diagrams.map((diag) => (
            <button
              key={diag.id}
              onClick={() => setActiveDiagram(diag.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left",
                activeDiagram === diag.id
                  ? "bg-primary-container text-on-primary-container shadow-sm border border-primary/20"
                  : "bg-surface text-on-surface-variant border border-transparent hover:bg-surface-container hover:border-outline-variant"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{diag.icon}</span>
              {diag.name}
            </button>
          ))}

          <div className="mt-4 p-4 rounded-xl bg-surface border border-outline-variant border-dashed">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
              <span className="material-symbols-outlined text-[18px]">add</span>
            </div>
            <p className="text-xs font-medium text-on-surface mb-1">Custom Diagram</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">Add state machine, component, or deployment diagrams.</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm min-w-0">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-outline-variant bg-surface-container-lowest gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  {diagrams.find(d => d.id === activeDiagram)?.icon}
                </span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-on-surface">
                  {diagrams.find(d => d.id === activeDiagram)?.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Synced with Requirements
                  </span>
                  <span>•</span>
                  <span>Last edited 2h ago</span>
                </div>
              </div>
            </div>

            <div className="flex bg-surface-container border border-outline-variant rounded-lg p-1 shrink-0">
              <button
                onClick={() => setActiveView("elements")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeView === "elements" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Entities Preview
              </button>
              <button
                onClick={() => setActiveView("code")}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                  activeView === "code" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined text-[16px]">code</span>
                Markup
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-surface-container-low/30">
            {activeView === "elements" ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between bg-secondary-container/20 p-4 rounded-xl border border-secondary/10">
                  <p className="text-sm text-on-surface-variant flex gap-3 items-start">
                    <span className="material-symbols-outlined text-secondary mt-0.5 text-[20px]">lightbulb</span>
                    <span>{currentData.description}</span>
                  </p>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-surface text-on-surface border border-outline-variant rounded text-xs font-bold hover:bg-surface-container transition-colors shrink-0 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    AI Suggest
                  </button>
                </div>

                {currentData.elements}
              </div>
            ) : (
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-on-surface">Mermaid.js Markup</span>
                    <span className="text-on-surface-variant">Generated from your entities</span>
                  </div>
                  <button className="text-primary text-sm font-medium hover:underline">Copy Code</button>
                </div>
                <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-outline-variant p-4 overflow-hidden relative group font-mono text-sm">
                  <pre className="text-[#d4d4d4] h-full overflow-y-auto">
{currentData.markup}
                  </pre>
                  <button className="absolute top-4 right-4 w-8 h-8 rounded bg-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex items-center justify-between shrink-0">
            <span className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              You can import this markup directly into draw.io, Notion, or Github.
            </span>
            <button className="px-5 py-2 bg-primary text-on-primary rounded-md text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
              Validate Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
