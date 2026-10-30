import { CHECKPOINT_ANSWERS } from '@/content/data/checkpoints';
import { parseCheckpointQuestions } from '@/lib/checkpoints';
import { CheckpointBox } from './CheckpointBox';

// Wraps one chapter's Checkpoint box. The questions stay in the page HTML; the key points come from
// content/data/checkpoints.ts and must line up one for one, so a question added to a page without an answer
// fails the build instead of silently leaving the box un-enhanced.
export function Checkpoints({ page, html }: { page: string; html?: string }) {
  if (html === undefined) throw new Error(`${page}: checkpoints must wrap the Checkpoint box's HTML`);
  const answers = CHECKPOINT_ANSWERS[page];
  if (!answers) throw new Error(`${page}: no checkpoint answers in content/data/checkpoints.ts`);
  const questions = parseCheckpointQuestions(html);
  if (questions.length !== answers.length) {
    throw new Error(`${page}: ${questions.length} checkpoint questions but ${answers.length} answers. Questions are matched to answers by position.`);
  }
  const title = /<div class="box-title">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '● CHECKPOINT';
  return <CheckpointBox page={page} titleHtml={title} questions={questions} answers={answers} />;
}
