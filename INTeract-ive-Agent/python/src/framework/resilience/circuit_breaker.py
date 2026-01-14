
import asyncio
import time
from typing import TypedDict, Optional

class CircuitBreakerConfig(TypedDict):
    failure_threshold: int
    reset_timeout: float
    half_open_requests: int

class CircuitBreaker:
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = 'closed'
        self.failures = 0
        self.last_failure = 0.0
        self.half_open_successes = 0

    async def execute(self, func, *args, **kwargs):
        if self.state == 'open':
            if self._should_attempt_reset():
                self.state = 'half-open'
                self.half_open_successes = 0
            else:
                raise Exception("Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        return (time.time() - self.last_failure) >= self.config['reset_timeout']

    def _on_success(self):
        if self.state == 'half-open':
            self.half_open_successes += 1
            if self.half_open_successes >= self.config['half_open_requests']:
                self.state = 'closed'
                self.failures = 0
        else:
            self.failures = 0

    def _on_failure(self):
        self.failures += 1
        self.last_failure = time.time()
        
        if(self.state == 'half-open' or self.failures >= self.config['failure_threshold']):
            self.state = 'open'
