import { buildFactoryManifest, type FactoryToolManifest } from './ai-tool-factory';
import type { KeywordSignal, ToolBlueprint } from './tool-autopilot';

export type FactoryStageStatus = 'passed' | 'failed' | 'skipped';
export type FactoryPipelineStage = { id: 'analyze' | 'blueprint' | 'build' | 'regression' | 'safety' | 'review'; status: FactoryStageStatus; detail: string };
export type AutonomousFactoryResult = {
  accepted: boolean;
  requiresHumanReview: true;
  publishable: false;
  blueprint?: ToolBlueprint;
  manifest?: FactoryToolManifest;
  stages: FactoryPipelineStage[];
  reason?: string;
};

/** A safe autonomous pipeline: it may prepare a candidate, but cannot execute generated code or publish. */
export function runAutonomousFactoryPipeline(signal: KeywordSignal): AutonomousFactoryResult {
  const stages: FactoryPipelineStage[] = [];
  stages.push({ id: 'analyze', status: signal.keyword.trim().length >= 2 ? 'passed' : 'failed', detail: 'Validated keyword signal and source fields.' });
  if (stages[0].status === 'failed') return { accepted: false, requiresHumanReview: true, publishable: false, stages, reason: 'Keyword must contain at least two characters.' };

  const built = buildFactoryManifest(signal);
  stages.push({ id: 'blueprint', status: built ? 'passed' : 'failed', detail: built ? `Mapped to reviewed processor: ${built.blueprint.kind}.` : 'No matching reviewed processor or blueprint is available.' });
  if (!built) return { accepted: false, requiresHumanReview: true, publishable: false, stages, reason: 'Unsupported tool idea. Routed to engineering review; no generated code is executed.' };

  stages.push({ id: 'build', status: 'passed', detail: 'Built a manifest using the existing trusted processor registry.' });
  const regressionPassed = built.manifest.quality.checks.every((check) => check.passed);
  stages.push({ id: 'regression', status: regressionPassed ? 'passed' : 'failed', detail: `${built.manifest.quality.checks.filter((check) => check.passed).length}/${built.manifest.quality.checks.length} checks passed.` });
  const safe = built.manifest.safety.arbitraryCode === false && built.manifest.safety.networkAccess === false && built.manifest.safety.fileAccess === false && built.manifest.safety.processor === 'reviewed-built-in';
  stages.push({ id: 'safety', status: safe ? 'passed' : 'failed', detail: safe ? 'No arbitrary code, network, or file access; reviewed built-in processor only.' : 'Safety policy failed.' });
  const accepted = regressionPassed && safe;
  stages.push({ id: 'review', status: accepted ? 'passed' : 'failed', detail: accepted ? 'Candidate is eligible for admin review; publication remains disabled.' : 'Candidate rejected by quality or safety gates.' });
  return { accepted, requiresHumanReview: true, publishable: false, blueprint: built.blueprint, manifest: built.manifest, stages, ...(accepted ? {} : { reason: 'Quality or safety gate failed.' }) };
}
