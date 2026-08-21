const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000/api";
  return `${window.location.protocol}//${window.location.hostname}:5000/api`;
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBaseUrl();
export const PROJECT_DATA_UPDATED_EVENT = "smartpfe:project-data-updated";

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
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw Object.assign(new Error(data.message || "Something went wrong"), data);
  }

  notifyProjectDataUpdated(endpoint, options);

  return data;
};
