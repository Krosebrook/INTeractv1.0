
import asyncio
import time
import json
from typing import TypedDict, Optional, Dict, List, Any
from src.framework.core.agent import Agent

# Type definitions
TaskStatus = str # 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

class Task(TypedDict):
    id: str
    type: str # capability needed
    input: Any
    status: TaskStatus
    priority: int
    result: Optional[Any]
    error: Optional[str]
    created_at: float
    started_at: Optional[float]
    completed_at: Optional[float]
    retry_count: int

class WorkerAgent(TypedDict):
    id: str
    agent: Agent
    capabilities: List[str]
    current_task: Optional[Task]
    healthy: bool
    last_health_check: float

class SupervisorConfig(TypedDict):
    max_concurrent_tasks: int
    task_timeout_ms: int
    max_retries: int

class SupervisorAgent:
    def __init__(self, config: Optional[SupervisorConfig] = None):
        self.config = config or {
            "max_concurrent_tasks": 5,
            "task_timeout_ms": 30000,
            "max_retries": 3
        }
        self.workers: Dict[str, WorkerAgent] = {}
        self.task_queue: List[Task] = []
        self.active_tasks: Dict[str, Task] = {}
        self.completed_tasks: Dict[str, Task] = {}
        self.is_running = False

    def register_worker(self, id: str, agent: Agent, capabilities: List[str]):
        self.workers[id] = {
            "id": id,
            "agent": agent,
            "capabilities": capabilities,
            "current_task": None,
            "healthy": True,
            "last_health_check": time.time()
        }

    async def submit_task(self, task_input: Dict[str, Any]) -> str:
        task: Task = {
            "id": task_input["id"],
            "type": task_input["type"],
            "input": task_input["input"],
            "status": "pending",
            "priority": task_input.get("priority", 0),
            "result": None,
            "error": None,
            "created_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "retry_count": 0
        }
        
        inserted = False
        for i, t in enumerate(self.task_queue):
            if t["priority"] < task["priority"]:
                self.task_queue.insert(i, task)
                inserted = True
                break
        if not inserted:
            self.task_queue.append(task)
            
        return task["id"]

    async def orchestrate(self):
        if self.is_running:
            return
        
        self.is_running = True
        try:
            while self.task_queue or self.active_tasks:
                
                while self.task_queue and len(self.active_tasks) < self.config["max_concurrent_tasks"]:
                    task = self.task_queue[0]
                    worker = self._select_worker(task)
                    
                    if not worker:
                        break
                    
                    self.task_queue.pop(0)
                    asyncio.create_task(self._start_task(task, worker))
                    
                if self.active_tasks:
                    # Yield control to let tasks run
                    await asyncio.sleep(0.1)
                else:
                    break

        finally:
            self.is_running = False

    def _select_worker(self, task: Task) -> Optional[WorkerAgent]:
        for worker in self.workers.values():
            if (worker["healthy"] and 
                worker["current_task"] is None and 
                task["type"] in worker["capabilities"]):
                return worker
        return None

    async def _start_task(self, task: Task, worker: WorkerAgent):
        task["status"] = "running"
        task["started_at"] = time.time()
        worker["current_task"] = task
        self.active_tasks[task["id"]] = task

        try:
            # Prepare prompt for subagent
            if isinstance(task["input"], dict):
                prompt = json.dumps(task["input"])
            else:
                prompt = str(task["input"])

            result = await asyncio.wait_for(
                worker["agent"].run(prompt),
                timeout=self.config["task_timeout_ms"] / 1000.0
            )
            task["status"] = "completed"
            task["result"] = result["response"] # Use the text response
            task["completed_at"] = time.time()
        except Exception as e:
            error_msg = str(e)
            if task["retry_count"] < self.config["max_retries"]:
                task["retry_count"] += 1
                task["status"] = "pending"
                self.task_queue.insert(0, task)
            else:
                task["status"] = "failed"
                task["error"] = error_msg
                task["completed_at"] = time.time()
        finally:
            worker["current_task"] = None
            if task["status"] in ["completed", "failed"]:
                self.completed_tasks[task["id"]] = task
            if task["id"] in self.active_tasks:
                del self.active_tasks[task["id"]]
    
    def get_task_status(self, task_id: str) -> Optional[Task]:
        return (self.completed_tasks.get(task_id) or 
                self.active_tasks.get(task_id) or 
                next((t for t in self.task_queue if t["id"] == task_id), None))
