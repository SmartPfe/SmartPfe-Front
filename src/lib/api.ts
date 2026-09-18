const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000/api";
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBaseUrl();
export const PROJECT_DATA_UPDATED_EVENT = "smartpfe:project-data-updated";
export const CREDITS_UPDATED_EVENT = "smartpfe:credits-updated";
export const CREDIT_ERROR_EVENT = "smartpfe:credit-error";

type CreditPolicyHeader = { key: string; version: number };
let creditPolicies = new Map<string, CreditPolicyHeader>();

export const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const registerCreditPolicies = (policies: CreditPolicyHeader[]) => {
  creditPolicies = new Map((policies || []).map((policy) => [policy.key, policy]));
};

const readBodyValue = (body: BodyInit | null | undefined, key: string) => {
  if (body instanceof FormData) return body.get(key);
  if (typeof body !== "string" || !body) return undefined;
  try {
    return JSON.parse(body)?.[key];
  } catch {
    return undefined;
  }
};

const creditActionForRequest = (endpoint: string, options: RequestInit) => {
  if (!endpoint.startsWith("/ai/") || getRequestMethod(options) !== "POST") return "";
  if (endpoint.includes("/translate")) return "translation";
  const staticMappings: Array<[string, string]> = [
    ["/ai/problem-statement/", "problem_statement"],
    ["/ai/actors/", "actors"],
    ["/ai/existing-solutions/", "existing_solutions"],
    ["/ai/functional-requirements/", "functional_requirements"],
    ["/ai/non-functional-requirements/", "nonfunctional_requirements"],
    ["/ai/product-backlog/", "product_backlog"],
    ["/ai/uml-preparation/", "uml_preparation"],
    ["/ai/report-structure/", "report_structure"],
    ["/ai/report-studio/chapter/generate", "report_section"],
    ["/ai/report-studio/final/generate", "final_report_compile"],
    ["/ai/presentation/generate", "presentation_full"],
    ["/ai/pitch/generate", "pitch_full"],
    ["/ai/pitch/refine", "pitch_full"],
    ["/ai/pitch/slide/generate", "pitch_slide"],
    ["/ai/pitch/slide/refine", "pitch_slide"],
    ["/ai/jury-simulation/analyze", "jury_simulation"],
  ];
  if (endpoint === "/ai/report-studio/chapter/action") {
    const action = String(readBodyValue(options.body, "action") || "");
    const selectedText = String(readBodyValue(options.body, "selectedText") || "").trim();
    if (action === "Translate") return "translation";
    if (selectedText) return "report_polish_light";
    return ["Expand", "Improve Academic Style", "Make More Technical", "Explain Better", "Continue Writing", "Regenerate Selection", "Rewrite Selection"].includes(action)
      ? "report_polish_contextual"
      : "report_polish_light";
  }
  if (endpoint === "/ai/presentation/refine") {
    return readBodyValue(options.body, "slideId") ? "presentation_slide" : "presentation_full";
  }
  if (/\/ai\/jury-qa\/[^/]+\/(answer|finalize)$/.test(endpoint)) return "jury_qa_included";
  if (endpoint === "/ai/jury-qa/generate") return ""; // Server resolves new session vs resume atomically.
  return staticMappings.find(([prefix]) => endpoint.startsWith(prefix))?.[1] || "";
};

const getRequestMethod = (options: RequestInit) => String(options.method || "GET").toUpperCase();

const shouldRefreshProjectWorkflow = (endpoint: string, options: RequestInit) => {
  const method = getRequestMethod(options);
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;

  return (
    endpoint.startsWith("/projects") ||
    endpoint === "/ai/report-studio/final/generate" ||
    endpoint.includes("/ai/jury-qa/")
  );
};

const notifyProjectDataUpdated = (endpoint: string, options: RequestInit) => {
  if (typeof window === "undefined" || !shouldRefreshProjectWorkflow(endpoint, options)) return;
  window.dispatchEvent(
    new CustomEvent(PROJECT_DATA_UPDATED_EVENT, {
      detail: { endpoint, method: getRequestMethod(options) },
    })
  );
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const actionKey = creditActionForRequest(endpoint, options);
  if (endpoint.startsWith("/ai/") && getRequestMethod(options) === "POST") {
    if (!headers.has("X-Idempotency-Key")) headers.set("X-Idempotency-Key", createIdempotencyKey());
    const policy = creditPolicies.get(actionKey);
    if (policy && !headers.has("X-Credit-Policy-Version")) {
      headers.set("X-Credit-Policy-Version", String(policy.version));
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = { message: "Failed to parse server response as JSON." };
    }
  } else {
    const rawText = await response.text();
    data = { message: rawText.slice(0, 300) || `Server error (status ${response.status})` };
  }

  if (!response.ok) {
    if (data?.code?.startsWith?.("CREDIT_") || data?.code === "INSUFFICIENT_CREDITS") {
      window.dispatchEvent(new CustomEvent(CREDIT_ERROR_EVENT, { detail: data }));
    }
    throw Object.assign(new Error(data.message || "Something went wrong"), data);
  }

  if (data?.creditUsage) {
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT, { detail: data.creditUsage }));
  }

  notifyProjectDataUpdated(endpoint, options);

  return data;
};
