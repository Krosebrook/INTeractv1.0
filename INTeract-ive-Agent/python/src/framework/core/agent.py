
import asyncio
from typing import List, Dict, Any, Optional, TypedDict, Callable, Awaitable
from anthropic import AsyncAnthropic
from anthropic.types import MessageParam

# Type definitions matching the TS implementation
class Tool(TypedDict):
    name: str
    description: str
    input_schema: Dict[str, Any]
    handler: Callable[[Any], Awaitable[Any]]

class AgentConfig(TypedDict):
    name: str
    model: str
    max_tokens: int
    tools: List[Tool]
    system_prompt: str
    max_iterations: Optional[int]

class AgentTokenUsage(TypedDict):
    input: int
    output: int

class AgentResult(TypedDict):
    response: str
    iterations: int
    tools_used: List[str]
    total_tokens: AgentTokenUsage

class Agent:
    """Core Agent implementation."""

    def __init__(self, config: AgentConfig):
        self.client = AsyncAnthropic()
        self.config = config
        self.config['max_iterations'] = config.get('max_iterations', 10)
        self.conversation_history: List[MessageParam] = []

    async def run(self, user_message: str) -> AgentResult:
        tools_used: List[str] = []
        iterations = 0
        total_input_tokens = 0
        total_output_tokens = 0

        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        # Prepare tools for Anthropic API
        api_tools = [
            {
                "name": t['name'],
                "description": t['description'],
                "input_schema": t['input_schema']
            }
            for t in self.config['tools']
        ]

        response = await self.client.messages.create(
            model=self.config['model'],
            max_tokens=self.config['max_tokens'],
            system=self.config['system_prompt'],
            tools=api_tools,
            messages=self.conversation_history
        )

        # Accumulate tokens (approximate or extracted from usage)
        if response.usage:
            total_input_tokens += response.usage.input_tokens
            total_output_tokens += response.usage.output_tokens

        while response.stop_reason == 'tool_use' and iterations < self.config['max_iterations']:
            iterations += 1
            
            # Extract tool use blocks
            tool_use_blocks = [block for block in response.content if block.type == 'tool_use']
            
            tool_results = []
            
            for tool_use in tool_use_blocks:
                tool_def = next((t for t in self.config['tools'] if t['name'] == tool_use.name), None)
                
                if not tool_def:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": f"Error: Unknown tool {tool_use.name}",
                        "is_error": True
                    })
                    continue
                
                tools_used.append(tool_def['name'])
                
                try:
                    result = await tool_def['handler'](tool_use.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": result if isinstance(result, str) else str(result)
                    })
                except Exception as e:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use.id,
                        "content": f"Error: {str(e)}",
                        "is_error": True
                    })

            self.conversation_history.append({
                "role": "assistant",
                "content": response.content
            })
            
            self.conversation_history.append({
                "role": "user",
                "content": tool_results
            })

            response = await self.client.messages.create(
                model=self.config['model'],
                max_tokens=self.config['max_tokens'],
                system=self.config['system_prompt'],
                tools=api_tools,
                messages=self.conversation_history
            )

            if response.usage:
                total_input_tokens += response.usage.input_tokens
                total_output_tokens += response.usage.output_tokens

        # Extract final response
        text_block = next((block for block in response.content if block.type == 'text'), None)
        final_response = text_block.text if text_block else ""

        self.conversation_history.append({
            "role": "assistant",
            "content": response.content
        })

        return {
            "response": final_response,
            "iterations": iterations,
            "tools_used": list(set(tools_used)),
            "total_tokens": {
                "input": total_input_tokens,
                "output": total_output_tokens
            }
        }
    
    def reset(self):
        self.conversation_history = []
