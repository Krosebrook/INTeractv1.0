import pytest
import os
import json
from pathlib import Path
from src.tools.refactor_tools import analyze_complexity, find_duplicates, suggest_refactoring

@pytest.fixture
def temp_repo(tmp_path):
    # Create a temporary repository structure
    repo = tmp_path / "repo"
    repo.mkdir()
    
    # Create a normal file
    file1 = repo / "small_func.py"
    file1.write_text("def hello():\n    print('hello')\n")
    
    # Create a file with a long function
    file2 = repo / "long_func.py"
    long_content = "def very_long_function():\n"
    for i in range(100):
        long_content += f"    print('line {i}')\n"
    file2.write_text(long_content)
    
    # Create duplicates
    file3 = repo / "dup1.py"
    file4 = repo / "dup2.py"
    dup_content = "def duplicate_me():\n    x = 1\n    y = 2\n    z = x + y\n    return z\n"
    file3.write_text(dup_content)
    file4.write_text(dup_content)
    
    return repo

@pytest.mark.asyncio
async def test_analyze_complexity_small(temp_repo):
    file_path = str(temp_repo / "small_func.py")
    result = await analyze_complexity.fn({"file_path": file_path})
    data = json.loads(result["content"][0]["text"])
    
    assert data["file"] == file_path
    assert data["cyclomatic_complexity"] >= 1
    assert data["function_count"] == 1
    assert len(data["long_functions"]) == 0

@pytest.mark.asyncio
async def test_analyze_complexity_long(temp_repo):
    file_path = str(temp_repo / "long_func.py")
    result = await analyze_complexity.fn({"file_path": file_path})
    data = json.loads(result["content"][0]["text"])
    
    assert data["function_count"] == 1
    assert len(data["long_functions"]) == 1
    assert data["long_functions"][0]["name"] == "very_long_function"
    assert data["long_functions"][0]["lines"] > 50
    assert any("exceed 50 lines" in s for s in data["suggestions"])

@pytest.mark.asyncio
async def test_find_duplicates(temp_repo):
    result = await find_duplicates.fn({"directory": str(temp_repo), "min_lines": 3})
    data = json.loads(result["content"][0]["text"])
    
    assert data["duplicates_found"] >= 1
    # Check if our duplicate function was found
    found_dup = False
    for dup in data["duplicates"]:
        files = [loc["file"] for loc in dup["locations"]]
        if "dup1.py" in files and "dup2.py" in files:
            found_dup = True
            break
    assert found_dup

@pytest.mark.asyncio
async def test_suggest_refactoring(temp_repo):
    file_path = str(temp_repo / "long_func.py")
    result = await suggest_refactoring.fn({"file_path": file_path})
    data = json.loads(result["content"][0]["text"])
    
    assert "suggestions" in data

if __name__ == "__main__":
    import asyncio
    import tempfile
    from pathlib import Path

    async def run_manual_tests():
        with tempfile.TemporaryDirectory() as tmp_dir:
            repo = Path(tmp_dir) / "repo"
            repo.mkdir()
            
            f1 = repo / "small.py"
            f1.write_text("def a(): pass")
            
            f2 = repo / "long.py"
            f2.write_text("def long():\n" + "\n".join([f"    print({i})" for i in range(100)]))
            
            print("Running analyze_complexity check...")
            res = await analyze_complexity.fn({"file_path": str(f2)})
            print(res["content"][0]["text"])
            
            print("\nRunning find_duplicates check...")
            f3 = repo / "d1.py"
            f4 = repo / "d2.py"
            dup = "def d():\n  x=1\n  y=2\n  return x+y\n"
            f3.write_text(dup)
            f4.write_text(dup)
            res = await find_duplicates.fn({"directory": str(repo), "min_lines": 3})
            print(res["content"][0]["text"])

    asyncio.run(run_manual_tests())
