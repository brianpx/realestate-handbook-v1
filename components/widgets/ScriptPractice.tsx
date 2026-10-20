import { htmlText } from '@/lib/html-text';
import { ScriptBox, type TranscriptLine } from './ScriptBox';

// Wraps one `.box.script` from the page HTML. Server side it only splits the title from the script text, so the
// client component gets plain strings. The title text is the saved-practice key, as it was on the static site.
// Role-play recordings, keyed by the widget instance id (page:name#slug). `step` names the move the agent is making.
const EXAMPLE_AUDIO: Record<string, { src: string; transcript: TranscriptLine[] }> = {
  'ch6:script-practice#objection-i-m-just-looking': {
    src: '/audio/objection-just-looking-role-play.mp3',
    transcript: [
      { who: 'Agent', text: 'Hi, welcome in. Thanks for coming by. Have you seen this neighborhood before, or is this your first time through?' },
      { who: 'Prospect', text: 'First time. We’re just looking.' },
      { who: 'Agent', step: 'Acknowledge', text: 'That’s completely fine. Most people start that way.' },
      { who: 'Agent', step: 'Offer value / Respond', text: 'Would it help if I sent you a few homes that match what you described, so you can see what’s out there? No pressure either way.' },
      { who: 'Prospect', text: 'Yeah, that could be useful. We’re still figuring things out.' },
      { who: 'Agent', step: 'Clarify', text: 'Perfect. Just so I send the right ones—what’s most important to you right now? A quiet street, backyard, schools, number of bedrooms, or a specific neighborhood?' },
      { who: 'Prospect', text: 'Probably a quiet street and a decent backyard for the kids.' },
      { who: 'Agent', step: 'Check + Next step', text: 'Got it. I’ll put together 3–4 homes that fit that and email them to you by tomorrow. What’s the best email?' },
      { who: 'Prospect', text: 'It’s sarah@email.com.' },
      { who: 'Agent', text: 'Great. I’ll send those over tomorrow and check in next week to see if any stood out or if your timeline has shifted at all. Still zero pressure—just want to be a helpful resource if and when the timing feels right. Does that work?' },
      { who: 'Prospect', text: 'Sure, that works.' },
      { who: 'Agent', text: 'Perfect. Feel free to look around as long as you’d like. I’ll get those homes over to you tomorrow. Talk soon.' },
    ],
  },
};

export function ScriptPractice({ id, html }: { id: string; html?: string }) {
  if (html === undefined) throw new Error(`${id}: script-practice must wrap the script box's HTML`);
  const m = /^\s*<div class="box-title">([\s\S]*?)<\/div>([\s\S]*)$/.exec(html);
  if (!m) throw new Error(`${id}: script-practice expects a .box-title first`);
  return <ScriptBox titleHtml={m[1]!} bodyHtml={m[2]!} storageKey={htmlText(m[1]!)} example={EXAMPLE_AUDIO[id]} />;
}
