"""Subagent definitions for the refactoring agent."""

from .pattern_detector import pattern_detector_agent
from .code_analyzer import code_analyzer_agent
from .diff_generator import diff_generator_agent

__all__ = [
    "pattern_detector_agent",
    "code_analyzer_agent",
    "diff_generator_agent",
]
