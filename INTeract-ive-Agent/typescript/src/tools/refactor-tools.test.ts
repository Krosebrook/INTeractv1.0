import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs/promises';
import { _analyzeComplexityImpl, _findDuplicatesImpl, _suggestRefactoringImpl } from './refactor-tools.js';

vi.mock('fs/promises');

describe('refactor-tools', () => {
  describe('_analyzeComplexityImpl', () => {
    it('should correctly measure cyclomatic complexity for nested code', async () => {
      const code = `
        function complex(a, b) {
          if (a) {
            if (b) {
              return 1;
            } else {
              return 2;
            }
          }
          return 3;
        }
      `;
      vi.mocked(fs.readFile).mockResolvedValue(code);

      const result = await _analyzeComplexityImpl('test.ts');
      
      // Base (1) + 2 Ifs + 1 Else = 4
      expect(result.cyclomaticComplexity).toBe(4);
      expect(result.functionCount).toBe(1);
    });

    it('should detect long functions', async () => {
        let longCode = 'function longOne() {\n';
        for (let i = 0; i < 60; i++) {
            longCode += `  console.log(${i});\n`;
        }
        longCode += '}';
        vi.mocked(fs.readFile).mockResolvedValue(longCode);

        const result = await _analyzeComplexityImpl('test.ts');
        expect(result.longFunctions.length).toBe(1);
        expect(result.longFunctions[0].name).toBe('longOne');
        expect(result.longFunctions[0].lines).toBeGreaterThan(50);
    });
  });

  describe('_findDuplicatesImpl', () => {
    it('should find duplicate blocks', async () => {
      const dupCode = 'function shared() {\n  console.log("hello");\n  console.log("world");\n  console.log("foo");\n  console.log("bar");\n}';
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'file1.ts', isFile: () => true, isDirectory: () => false } as any,
        { name: 'file2.ts', isFile: () => true, isDirectory: () => false } as any,
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(dupCode);

      const result = await _findDuplicatesImpl('dir', 5);
      expect(result.duplicatesFound).toBeGreaterThan(0);
    });
  });
});
