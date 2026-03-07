import { ProvisionStep } from "./provision-v3";

export interface ProvisionJob {
  id: string;
  status: "running" | "done";
  steps: ProvisionStep[];
  result?: {
    success: boolean;
    password?: string;
    dashboardUrl?: string;
    error?: string;
  };
}

// Use globalThis to survive Next.js hot reloads and module re-evaluation in dev mode.
// Without this, POST and GET route handlers get different Map instances.
const globalForJobs = globalThis as unknown as {
  __provisionJobs: Map<string, ProvisionJob>;
};

if (!globalForJobs.__provisionJobs) {
  globalForJobs.__provisionJobs = new Map<string, ProvisionJob>();
}

const jobs = globalForJobs.__provisionJobs;

export function createJob(id: string): ProvisionJob {
  const job: ProvisionJob = { id, status: "running", steps: [] };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ProvisionJob | undefined {
  return jobs.get(id);
}

export function updateStep(jobId: string, step: ProvisionStep) {
  const job = jobs.get(jobId);
  if (!job) return;
  const idx = job.steps.findIndex((s) => s.step === step.step);
  if (idx >= 0) {
    job.steps[idx] = step;
  } else {
    job.steps.push(step);
  }
}

export function completeJob(
  jobId: string,
  result: ProvisionJob["result"]
) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = "done";
  job.result = result;
  // Clean up after 10 minutes
  setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000);
}

// Get the latest active job (for resume after navigation)
export function getActiveJob(): ProvisionJob | undefined {
  for (const job of jobs.values()) {
    if (job.status === "running") return job;
  }
  return undefined;
}
