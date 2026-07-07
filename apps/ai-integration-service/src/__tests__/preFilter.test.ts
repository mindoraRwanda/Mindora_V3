import { describe, expect, it } from 'vitest';
import { runPreFilter } from '../preFilter.js';

describe('runPreFilter', () => {
  it('clean message returns 0', async () => {
    expect(await runPreFilter('Hello, how are you today?')).toBe(0);
  });

  it('Level 1 phrase returns 1', async () => {
    expect(await runPreFilter('I feel so sad and lonely')).toBe(1);
  });

  it('Level 3 phrase returns 3', async () => {
    expect(await runPreFilter('I want to die')).toBe(3);
  });

  it('Level 5 phrase returns 5', async () => {
    expect(await runPreFilter("I'm going to kill myself")).toBe(5);
  });

  it('message containing both a Level 1 and a Level 5 phrase returns 5, not 1', async () => {
    expect(await runPreFilter("I feel so sad. I'm going to kill myself")).toBe(
      5
    );
  });

  it('Level 5 phrase in ALL CAPS returns 5 (normalisation)', async () => {
    expect(await runPreFilter("I'M GOING TO KILL MYSELF")).toBe(5);
  });

  it('"I want to die!!!" returns 3 (punctuation stripping)', async () => {
    expect(await runPreFilter('I want to die!!!')).toBe(3);
  });

  it('empty string returns 0', async () => {
    expect(await runPreFilter('')).toBe(0);
  });
});
