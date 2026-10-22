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

// Widget name -> component. Filled in as each widget is ported (phase 3). Unknown names render nothing,
// so the static chapter markup around the marker is what a reader sees until the port lands.
// Components are server-rendered too, so their first HTML is the no-JavaScript version of the tool.
// `html` is the page HTML a wrapping marker encloses (undefined for stand-alone widgets).
type WidgetProps = { page: string; id: string; html?: string };
// Some entries are async server components (they read page tables); React renders those, the cast only keeps
// TypeScript's ComponentType, which predates async components, from rejecting them.
const WIDGETS: Record<string, ComponentType<WidgetProps>> = {
  'crm-checklists': Checklists,
  scorecard: Scorecard,
  'scorecard-change': ScoreChange,
  'goal-calculator': GoalCalculator,
  'speed-to-lead': SpeedToLead,
  'response-timer': ResponseTimer,
  'nurture-timeline': NurtureTimeline,
  'script-practice': ScriptPractice,
  'objection-trainer': ObjectionTrainer,
  'qualifying-drill': QualifyingDrill as unknown as ComponentType<WidgetProps>,
  'pitfall-cycle': PitfallCycle,
  'error-self-score': ErrorSelfScore as unknown as ComponentType<WidgetProps>,
  'consultation-lab': ConsultationLab,
  'fair-housing-drill': FairHousingDrill,
  checkpoints: Checkpoints,
  'knowledge-check': KnowledgeCheckEntry,
  'lead-sources': LeadSources,
  'pipeline-calculator': PipelineCalculator,
  'timeblock-planner': TimeBlockPlanner,
  'postclose-scheduler': PostCloseScheduler as unknown as ComponentType<WidgetProps>,
};

// The five tools "Essential tools only" keeps (ESSENTIAL_WIDGETS in the static site), plus the pieces that belong
// to them or switch themselves (checklists show as plain boxes, the response timer hides itself).
const ALWAYS_BUILT = new Set(['scorecard', 'scorecard-change', 'goal-calculator', 'speed-to-lead', 'script-practice', 'objection-trainer', 'crm-checklists', 'response-timer']);
// Original markup that a gated tool replaces, put back when the tool is not built.
function gatedFallback(name: string, html?: string): string | undefined {
  if (name === 'nurture-timeline') return NURTURE_STATIC_HTML;
  if (name === 'pitfall-cycle') return PITFALL_STATIC_HTML;
  if (name === 'checkpoints' && html !== undefined) return `<aside class="box checkpoint">${html}</aside>`; // the marker replaced this box's outer element
  return undefined;
}

// `id` is the stable instance id (page:name) widgets use as their persistence key and deep-link anchor.
export function Widget({ id, name, html }: { id: string; name: string; html?: string }) {
  const Component = WIDGETS[name];
  if (!Component) return null;
  const tool = <Component page={id.split(':')[0]!} id={id} html={html} />;
  return ALWAYS_BUILT.has(name) ? tool : <ToolGate fallbackHtml={gatedFallback(name, html)}>{tool}</ToolGate>;
}
