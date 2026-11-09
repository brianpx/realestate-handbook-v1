import Link from 'next/link';
import type { ComponentType } from 'react';
import { Checkpoints } from './Checkpoints';
import { Checklists } from './Checklists';
import { ConsultationLab } from './ConsultationLab';
import { ErrorSelfScore } from './ErrorSelfScore';
import { FairHousingDrill } from './FairHousingDrill';
import { GoalCalculator } from './GoalCalculator';
import { NurtureTimeline } from './NurtureTimeline';
import { KnowledgeCheckEntry } from './CoachCheck';
import { LeadSources } from './LeadSources';
import { ObjectionTrainer } from './ObjectionTrainer';
import { PageDataTable } from './PageDataTable';
import { PipelineCalculator } from './PipelineCalculator';
import { PitfallCycle } from './PitfallCycle';
import { PostCloseScheduler } from './PostCloseScheduler';
import { QualifyingDrill } from './QualifyingDrill';
import { ResponseTimer } from './ResponseTimer';
import { Scorecard, ScoreChange } from './Scorecard';
import { ScriptPractice } from './ScriptPractice';
import { SpeedToLead } from './SpeedToLead';
import { TimeBlockPlanner } from './TimeBlockPlanner';
import { ToolGate } from './ToolGate';
import { NURTURE_STATIC_HTML } from '@/content/data/nurture-static';
import { PITFALL_STATIC_HTML } from '@/content/data/pitfall-static';
import { isWidgetName, type WidgetName } from '@/lib/widget-markers';

// Widget name -> component. Filled in as each widget is ported (phase 3). Unknown names render nothing,
// so the static chapter markup around the marker is what a reader sees until the port lands.
// Components are server-rendered too, so their first HTML is the no-JavaScript version of the tool.
// `html` is the page HTML a wrapping marker encloses (undefined for stand-alone widgets).
type WidgetProps = { page: string; id: string; html?: string };
const WIDGETS: Record<WidgetName, ComponentType<WidgetProps>> = {
  'crm-checklists': Checklists,
  scorecard: Scorecard,
  'scorecard-change': ScoreChange,
  'goal-calculator': GoalCalculator,
  'speed-to-lead': SpeedToLead,
  'response-timer': ResponseTimer,
  'nurture-timeline': NurtureTimeline,
  'script-practice': ScriptPractice,
  'objection-trainer': ObjectionTrainer,
  'qualifying-drill': QualifyingDrill,
  'pitfall-cycle': PitfallCycle,
  'error-self-score': ErrorSelfScore,
  'consultation-lab': ConsultationLab,
  'fair-housing-drill': FairHousingDrill,
  checkpoints: Checkpoints,
  'knowledge-check': KnowledgeCheckEntry,
  'lead-sources': LeadSources,
  'data-table': PageDataTable,
  'pipeline-calculator': PipelineCalculator,
  'timeblock-planner': TimeBlockPlanner,
  'postclose-scheduler': PostCloseScheduler,
};

// The five tools "Essential tools only" keeps (ESSENTIAL_WIDGETS in the static site), plus the pieces that belong
// to them or switch themselves (checklists show as plain boxes, the response timer hides itself). Sortable reference
// tables are page content, not tools, so the setting leaves them alone too.
const ALWAYS_BUILT = new Set<WidgetName>(['scorecard', 'scorecard-change', 'goal-calculator', 'speed-to-lead', 'script-practice', 'objection-trainer', 'crm-checklists', 'response-timer', 'data-table']);
// Original markup that a gated tool replaces, put back when the tool is not built.
function gatedFallback(name: WidgetName, html?: string): string | undefined {
  if (name === 'nurture-timeline') return NURTURE_STATIC_HTML;
  if (name === 'pitfall-cycle') return PITFALL_STATIC_HTML;
  if (name === 'checkpoints' && html !== undefined) return `<aside class="box checkpoint">${html}</aside>`; // the marker replaced this box's outer element
  return undefined;
}

// `id` is the stable instance id (page:name) widgets use as their persistence key and deep-link anchor.
export function Widget({ id, name, html }: { id: string; name: string; html?: string }) {
  if (!isWidgetName(name)) return null;
  const Component = WIDGETS[name];
  const tool = <Component page={id.split(':')[0]!} id={id} html={html} />;
  return ALWAYS_BUILT.has(name) ? tool : <ToolGate fallbackHtml={gatedFallback(name, html)}>{tool}</ToolGate>;
}

// A tool outside the reader's plan (Basic on a member page, see PRO_ONLY_WIDGETS): the page's original markup where
// the tool replaced some, and one line saying which plan builds it. Decided on the server, so the tool's code and
// data never reach the browser.
export function LockedWidget({ name, html }: { name: string; html?: string }) {
  if (!isWidgetName(name)) return null;
  const fallback = gatedFallback(name, html);
  return (
    <>
      {fallback && <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: fallback }} />}
      {/* data-widget so a tool shortcut (DeepLinks) lands here, on the note, instead of reporting the tool missing */}
      <aside className="box tool-locked" data-locked-tool={name} data-widget={name} tabIndex={-1}>
        <div className="box-title">Interactive tool: Pro</div>
        <p>This tool is built for Pro members. Your plan includes every chapter and the five essential tools. <Link href="/pricing">See plans</Link>.</p>
      </aside>
    </>
  );
}
