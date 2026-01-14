/**
 * Supervisor Pattern for Multi-Agent Orchestration
 */

import { Agent, AgentResult } from '../core/agent.js';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  type: string;
  input: any;
  status: TaskStatus;
  priority?: number;
  result?: AgentResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
}

export interface WorkerAgent {
  id: string;
  agent: Agent;
  capabilities: string[];
  currentTask?: Task;
  healthy: boolean;
  lastHealthCheck?: Date;
}

export interface SupervisorConfig {
  maxConcurrentTasks?: number;
  taskTimeoutMs?: number;
  maxRetries?: number;
}

export class SupervisorAgent {
  private workers: Map<string, WorkerAgent> = new Map();
  private taskQueue: Task[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private config: Required<SupervisorConfig>;
  private isRunning: boolean = false;

  constructor(config: SupervisorConfig = {}) {
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
      taskTimeoutMs: config.taskTimeoutMs ?? 60000,
      maxRetries: config.maxRetries ?? 3
    };
  }

  registerWorker(id: string, agent: Agent, capabilities: string[]): void {
    this.workers.set(id, {
      id,
      agent,
      capabilities,
      healthy: true,
      lastHealthCheck: new Date()
    });
  }

  async submitTask(taskInput: { id: string; type: string; input: any; priority?: number }): Promise<string> {
    const task: Task = {
      ...taskInput,
      status: 'pending',
      priority: taskInput.priority ?? 0,
      createdAt: new Date(),
      retryCount: 0
    };

    const insertIndex = this.taskQueue.findIndex(t => (t.priority ?? 0) > (task.priority ?? 0));
    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }

    return task.id;
  }

  async orchestrate(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      while (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
        while (
          this.taskQueue.length > 0 &&
          this.activeTasks.size < this.config.maxConcurrentTasks
        ) {
          const task = this.taskQueue[0];
          const worker = this.selectWorker(task);

          if (!worker) break;

          this.taskQueue.shift();
          await this.startTask(task, worker);
        }

        if (this.activeTasks.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async startTask(task: Task, worker: WorkerAgent): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    worker.currentTask = task;
    this.activeTasks.set(task.id, task);

    try {
      const result = await Promise.race([
        worker.agent.run(JSON.stringify(task.input)),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Task timeout')), this.config.taskTimeoutMs)
        )
      ]);

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if ((task.retryCount ?? 0) < this.config.maxRetries) {
        task.retryCount = (task.retryCount ?? 0) + 1;
        task.status = 'pending';
        this.taskQueue.unshift(task);
      } else {
        task.status = 'failed';
        task.error = errorMessage;
        task.completedAt = new Date();
      }
    } finally {
      worker.currentTask = undefined;
      this.activeTasks.delete(task.id);
      this.completedTasks.set(task.id, task);
    }
  }

  private selectWorker(task: Task): WorkerAgent | undefined {
    for (const [, worker] of this.workers) {
      if (worker.healthy && !worker.currentTask && worker.capabilities.includes(task.type)) {
        return worker;
      }
    }
    return undefined;
  }

  getTaskStatus(taskId: string): Task | undefined {
    return this.completedTasks.get(taskId) || this.activeTasks.get(taskId) || this.taskQueue.find(t => t.id === taskId);
  }
}
