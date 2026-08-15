import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export type AiTaskStatus = "pending" | "generating" | "refining" | "acting" | "translating" | "finalizing" | "completed" | "error";

export interface AiTask {
  id: string; // unique task identifier, e.g. "report-builder:sec-1.2"
  scope: string; // e.g. "report-builder", "problem-statement", "actors"
  targetId?: string; // e.g. sectionId
  title: string; // User-facing task title e.g. "Chapter 1.2: Problem Formulation"
  subTitle?: string; // e.g. "Generating initial draft..."
  pageRoute: string; // Route to navigate to, e.g. "/workspace/report-builder"
  navigationState?: Record<string, any>; // State to pass to navigate, e.g. { activeSectionId: "sec-1.2" }
  status: AiTaskStatus;
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: any;
}

export interface StartTaskOptions {
  id: string;
  scope: string;
  targetId?: string;
  title: string;
  subTitle?: string;
  pageRoute: string;
  navigationState?: Record<string, any>;
  status?: AiTaskStatus;
  runner: (signal?: AbortSignal) => Promise<any>;
}

interface AiGenerationContextValue {
  tasks: Record<string, AiTask>;
  activeTasksList: AiTask[];
  completedTasksList: AiTask[];
  activeRouteState: { pathname: string; sectionId?: string };
  setActiveRouteState: (state: { pathname: string; sectionId?: string }) => void;
  startTask: <T = any>(options: StartTaskOptions) => Promise<T>;
  getTask: (taskId: string) => AiTask | undefined;
  isTaskActive: (taskId: string) => boolean;
  isScopeActive: (scope: string) => boolean;
  cancelTask: (taskId: string) => void;
  dismissTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  jumpToTask: (task: AiTask) => void;
}

const AiGenerationContext = createContext<AiGenerationContextValue | null>(null);

const MAX_CONCURRENT_TASKS = 2;

export function AiGenerationProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Record<string, AiTask>>({});
  const [activeRouteState, setActiveRouteState] = useState<{ pathname: string; sectionId?: string }>({
    pathname: window.location.pathname,
  });
  const navigate = useNavigate();
  const tasksRef = useRef<Record<string, AiTask>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<AiTask>) => {
    setTasks((prev) => {
      const existing = prev[taskId];
      if (!existing && !updates.title) return prev;
      const updated: AiTask = {
        ...existing,
        ...updates,
        id: taskId,
      } as AiTask;
      return {
        ...prev,
        [taskId]: updated,
      };
    });
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    if (abortControllersRef.current[taskId]) {
      abortControllersRef.current[taskId].abort();
      delete abortControllersRef.current[taskId];
    }
    setTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => {
      const next: Record<string, AiTask> = {};
      Object.entries(prev).forEach(([key, task]) => {
        if (task.status !== "completed" && task.status !== "error") {
          next[key] = task;
        }
      });
      return next;
    });
  }, []);

  const jumpToTask = useCallback(
    (task: AiTask) => {
      if (!task.pageRoute) return;
      // Add a timestamp nonce to ensure React Router always registers state changes
      navigate(task.pageRoute, {
        state: {
          ...task.navigationState,
          _navTimestamp: Date.now(),
        },
      });
    },
    [navigate]
  );

  const startTask = useCallback(
    async <T = any>(options: StartTaskOptions): Promise<T> => {
      const {
        id,
        scope,
        targetId,
        title,
        subTitle = "Generating content with AI...",
        pageRoute,
        navigationState,
        status = "generating",
        runner,
      } = options;

      // Enforce 2 concurrent generation tasks limit
      const currentActiveCount = Object.values(tasksRef.current).filter(
        (t) => t.status !== "completed" && t.status !== "error" && t.id !== id
      ).length;

      if (currentActiveCount >= MAX_CONCURRENT_TASKS) {
        const limitTaskId = `system:concurrency-limit-${Date.now()}`;
        const limitTask: AiTask = {
          id: limitTaskId,
          scope: "system",
          title: "Maximum Concurrent Generations",
          subTitle: `You can only generate up to ${MAX_CONCURRENT_TASKS} sections in parallel. Please wait for one to finish.`,
          pageRoute: pageRoute,
          navigationState: navigationState,
          status: "error",
          startedAt: Date.now(),
          completedAt: Date.now(),
          error: `Limit reached: ${MAX_CONCURRENT_TASKS} tasks running`,
        };

        setTasks((prev) => ({
          ...prev,
          [limitTaskId]: limitTask,
        }));

        throw new Error(`AI is busy processing ${MAX_CONCURRENT_TASKS} active tasks. Please wait for one to finish.`);
      }

      const controller = new AbortController();
      abortControllersRef.current[id] = controller;

      const newTask: AiTask = {
        id,
        scope,
        targetId,
        title,
        subTitle,
        pageRoute,
        navigationState,
        status,
        startedAt: Date.now(),
      };

      setTasks((prev) => ({
        ...prev,
        [id]: newTask,
      }));

      try {
        const result = await runner(controller.signal);
        delete abortControllersRef.current[id];
        updateTask(id, {
          status: "completed",
          completedAt: Date.now(),
          result,
          subTitle: "Ready",
        });
        return result as T;
      } catch (err: any) {
        delete abortControllersRef.current[id];
        if (controller.signal.aborted) {
          // If aborted, task was cancelled
          return undefined as any;
        }
        const errorMessage = err?.message || "Generation failed";
        updateTask(id, {
          status: "error",
          completedAt: Date.now(),
          error: errorMessage,
          subTitle: "Failed",
        });
        throw err;
      }
    },
    [updateTask]
  );

  const getTask = useCallback((taskId: string) => tasksRef.current[taskId] || tasks[taskId], [tasks]);

  const isTaskActive = useCallback(
    (taskId: string) => {
      const task = tasks[taskId];
      return Boolean(task && task.status !== "completed" && task.status !== "error");
    },
    [tasks]
  );

  const isScopeActive = useCallback(
    (scope: string) => {
      return Object.values(tasks).some(
        (task) => task.scope === scope && task.status !== "completed" && task.status !== "error"
      );
    },
    [tasks]
  );

  const activeTasksList = Object.values(tasks).filter(
    (t) => t.status !== "completed" && t.status !== "error"
  );

  const completedTasksList = Object.values(tasks).filter(
    (t) => t.status === "completed" || t.status === "error"
  );

  return (
    <AiGenerationContext.Provider
      value={{
        tasks,
        activeTasksList,
        completedTasksList,
        activeRouteState,
        setActiveRouteState,
        startTask,
        getTask,
        isTaskActive,
        isScopeActive,
        cancelTask,
        dismissTask,
        clearCompletedTasks,
        jumpToTask,
      }}
    >
      {children}
    </AiGenerationContext.Provider>
  );
}

export function useAiGeneration() {
  const context = useContext(AiGenerationContext);
  if (!context) {
    throw new Error("useAiGeneration must be used within an AiGenerationProvider");
  }
  return context;
}
