import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 4.3 Test Coverage Matrix Integrity', () => {
  it('fails if test-matrix.json does not exist or has zero tests', () => {
    const matrixPath = path.resolve(__dirname, '../public/test-matrix.json');
    expect(fs.existsSync(matrixPath)).toBe(true);

    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    expect(matrix.totalMatrixTests).toBeGreaterThanOrEqual(250);
    expect(matrix.categories.length).toBe(8);

    // Verify sum of categories equals totalMatrixTests
    const sum = matrix.categories.reduce((acc: number, c: any) => acc + c.testCount, 0);
    expect(sum).toBe(matrix.totalMatrixTests);
  });
});

