export interface Option {
  v: string;
  l: string;
  d?: string;
}

export interface Question {
  id: string;
  q: string;
  help?: string;
  multi: boolean;
  opts: Option[];
  skip?: boolean;
}

export interface Phase {
  id: string;
  no: number;
  label: string;
  icon: string;
  desc: string;
  tip?: string;
  skipPhase?: (state: WizardState) => boolean;
}

export interface InfoEntry {
  title: string;
  summary: string;
  services?: { name: string; role: string; connects?: string }[];
  flow?: string;
  tip?: string;
}

export interface ArchService {
  name: string;
  detail?: string;
  reason?: string;
  cost?: string;
  opt?: string;
}

export interface ArchLayer {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  services: ArchService[];
  insights?: string[];
}

export interface Architecture {
  layers: ArchLayer[];
  waScore: Record<string, number>;
}

export interface CostCategory {
  name: string;
  total: { min: number; max: number };
  items: { name: string; desc: string; min: number; max: number }[];
}

export interface CostEstimate {
  totalMin: number;
  totalMid: number;
  totalMax: number;
  hasCommit: boolean;
  hasSpot: boolean;
  categories: CostCategory[];
}

export interface ValidationIssue {
  severity: "error" | "warn";
  title: string;
  message: string;
  phases?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  detail?: string;
  critical: boolean;
}

export interface ChecklistPhase {
  phase: string;
  label: string;
  icon: string;
  items: ChecklistItem[];
}

export interface ChecklistResult {
  phases: ChecklistPhase[];
  totalItems: number;
  criticalItems: number;
}

export interface SecurityGroup {
  id: string;
  name: string;
  desc: string;
  color: string;
  inbound: { port: string; from: string }[];
  outbound: { port: string; to: string }[];
}

export interface SecurityGroupResult {
  groups: SecurityGroup[];
  code: string;
  iac: string;
}

export interface WafrItem {
  q: string;
  maxPts: number;
  earnedPts: number;
  rec?: string;
}

export interface WafrPillarResult {
  items: WafrItem[];
  score: number;
}

export interface WafrResult {
  overall: number;
  pillars: Record<string, WafrPillarResult>;
}

export interface CodeSnippet {
  title: string;
  desc: string;
  category: string;
  lang: string;
  code: string;
}

export interface Recommendation {
  badge: string;
  reason: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WizardState = Record<string, Record<string, any>>;
