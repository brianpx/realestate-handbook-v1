import { describe, expect, it } from 'vitest';
import { CHECKPOINT_ANSWERS, CHECKPOINT_TOTAL } from '@/content/data/checkpoints';
import { KNOWLEDGE_CHECKS } from '@/content/data/knowledge-checks';
import { readFileSync } from 'node:fs';
import { blankVerdict, checkpointConfident, parseCheckpointQuestions, rollupText } from './checkpoints';

describe('parseCheckpointQuestions', () => {
  it('reads bullets split on <br>, without the title', () => {
    const html = '\n<div class="box-title">CHECKPOINT</div>\n • First <em>one</em>?<br>\n • Second?<br>\n • Third?\n';
    expect(parseCheckpointQuestions(html)).toEqual(['First one?', 'Second?', 'Third?']);
  });
});

describe('the shipped checkpoints', () => {
  it('give every question in chapters 1 to 13 an answer', () => {
    for (const [page, answers] of Object.entries(CHECKPOINT_ANSWERS)) {
      const html = readFileSync(`content/pages/${page}.html`, 'utf8');
      const inner = /<!--widget:checkpoints-->([\s\S]*?)<!--\/widget:checkpoints-->/.exec(html)?.[1];
      expect(inner, page).toBeDefined();
      expect(parseCheckpointQuestions(inner!).length, page).toBe(answers.length);
    }
    expect(Object.keys(CHECKPOINT_ANSWERS)).toHaveLength(13);
    expect(CHECKPOINT_TOTAL).toBe(43); // 36 on the static site, plus Chapters 4 and 5 (one each), 8 and 11 (one each) and 13 (three)
  });
});

describe('rollup', () => {
  it('counts only got-it answers', () => {
    expect(checkpointConfident({ 'ch1:0': { status: 'got' }, 'ch1:1': { status: 'review' }, 'ch1:2': { text: 'x' }, 'ch2:0': { status: 'got' } })).toBe(2);
    expect(checkpointConfident(undefined)).toBe(0);
    expect(rollupText(2)).toBe('2 of 43 checkpoint questions confident');
  });
});

describe('knowledge checks', () => {
  it('cover chapters 1 to 13 with three questions and a blank each', () => {
    expect(Object.keys(KNOWLEDGE_CHECKS)).toHaveLength(13);
    for (const [page, quiz] of Object.entries(KNOWLEDGE_CHECKS)) {
      expect(quiz.mcq, page).toHaveLength(3);
      for (const q of quiz.mcq) expect(q.answer).toBeLessThan(q.options.length);
      expect(quiz.blank.accept).toContain(quiz.blank.answer.toLowerCase());
    }
  });
  it('words the blank result', () => {
    const blank = KNOWLEDGE_CHECKS.ch13!.blank; // "Open it ___, update it last." -> first
    expect(blankVerdict(' First ', blank).prefix).toBe('✓ Correct. ');
    expect(blankVerdict('last', blank).prefix).toBe('✗ Not quite. ');
    expect(blankVerdict('  ', blank)).toEqual({ prefix: '', text: 'The answer is "first". ' });
  });
});
