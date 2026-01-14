"""Type definitions for INTeract-ive Agent"""

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class RepositoryConfig:
    """Configuration for a repository to analyze."""
    path: str
    branches: list[str] = field(default_factory=list)
    target_branch: str | None = None


@dataclass
class RefactoringConfig:
    """Configuration for the refactoring agent."""
    repositories: list[RepositoryConfig] = field(default_factory=list)
    output_format: Literal["detailed", "summary", "json"] = "detailed"
    auto_apply: bool = False
    dry_run: bool = False


@dataclass
class RefactoringSuggestion:
    """A single refactoring suggestion."""
    id: str
    type: str
    severity: Literal["low", "medium", "high", "critical"]
    file: str
    start_line: int
    end_line: int
    description: str
    suggested_change: str
    before_code: str
    after_code: str


@dataclass
class CodePattern:
    """A detected code pattern or issue."""
    name: str
    description: str
    severity: Literal["info", "warning", "error"]
    locations: list[dict]


@dataclass
class CodeMetrics:
    """Code metrics for a repository."""
    total_files: int
    total_lines: int
    average_complexity: float
    duplicate_blocks: int
    code_smells: int


@dataclass
class AnalysisReport:
    """Complete analysis report for a repository."""
    repository: str
    branch: str
    timestamp: str
    patterns: list[CodePattern]
    suggestions: list[RefactoringSuggestion]
    metrics: CodeMetrics


@dataclass
class GitBranch:
    """Git branch information."""
    name: str
    current: bool
    last_commit: str
    last_commit_date: str


@dataclass
class GitCommit:
    """Git commit information."""
    hash: str
    author: str
    date: str
    message: str
