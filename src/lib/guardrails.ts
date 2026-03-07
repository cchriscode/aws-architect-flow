import type { WizardState } from "@/lib/types";

export interface GuardrailWarning {
  questionId: string;
  optionValue: string;
  level: "warning" | "caution";
  message: string;
}

interface AdvancedOption {
  minExp: "mid" | "senior";
  message: string;
}

// Options requiring team experience
const ADVANCED_OPTIONS: Record<string, AdvancedOption> = {
  // senior required
  istio:            { minExp: "senior", message: "Istio\uB294 \uC6B4\uC601 \uBCF5\uC7A1\uB3C4\uAC00 \uB9E4\uC6B0 \uB192\uC2B5\uB2C8\uB2E4. \uC11C\uBE44\uC2A4 \uBA54\uC2DC \uACBD\uD5D8\uC774 \uC788\uB294 \uC2DC\uB2C8\uC5B4 \uC5D4\uC9C0\uB2C8\uC5B4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." },
  opa_gatekeeper:   { minExp: "senior", message: "OPA/Rego \uC5B8\uC5B4 \uD559\uC2B5\uC774 \uD544\uC694\uD558\uACE0 \uB514\uBC84\uAE45\uC774 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. Kyverno\uAC00 \uB354 \uC811\uADFC\uD558\uAE30 \uC27D\uC2B5\uB2C8\uB2E4." },
  cilium:           { minExp: "senior", message: "eBPF \uAE30\uBC18 \uB124\uD2B8\uC6CC\uD0B9\uC740 \uACE0\uAE09 \uB9AC\uB205\uC2A4 \uCEE4\uB110 \uC9C0\uC2DD\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." },
  flux:             { minExp: "senior", message: "Flux\uB294 CLI \uC911\uC2EC \uB3C4\uAD6C\uB85C ArgoCD\uBCF4\uB2E4 \uD559\uC2B5 \uC790\uB8CC\uAC00 \uC801\uC2B5\uB2C8\uB2E4." },
  rust:             { minExp: "senior", message: "Rust\uB294 \uD559\uC2B5 \uACE1\uC120\uC774 \uB9E4\uC6B0 \uAC00\uD30C\uB985\uB2C8\uB2E4. \uC219\uB828\uB41C \uD300\uC774 \uC544\uB2C8\uBA74 Go\uB098 Python\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4." },
  kong:             { minExp: "senior", message: "Kong\uC740 \uBCC4\uB3C4 DB\uC640 \uD50C\uB7EC\uADF8\uC778 \uAD00\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. ALB Ingress\uAC00 \uB354 \uB2E8\uC21C\uD569\uB2C8\uB2E4." },
  msk:              { minExp: "senior", message: "Kafka \uC6B4\uC601\uC740 \uBE0C\uB85C\uCEE4/\uD30C\uD2F0\uC158/\uB9AC\uBC38\uB7F0\uC2F1 \uAE4A\uC740 \uC774\uD574\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. SQS/Kinesis\uAC00 \uB354 \uC27D\uC2B5\uB2C8\uB2E4." },
  // mid required
  eks:              { minExp: "mid", message: "\uCFE0\uBC84\uB124\uD2F0\uC2A4\uB294 \uC6B4\uC601 \uBCF5\uC7A1\uB3C4\uAC00 \uB192\uC2B5\uB2C8\uB2E4. \uC785\uBB38 \uD300\uC740 ECS Fargate\uBD80\uD130 \uC2DC\uC791\uD558\uC138\uC694." },
  ec2_node:         { minExp: "mid", message: "EC2 \uC9C1\uC811 \uAD00\uB9AC\uB294 OS \uD328\uCE58/\uBAA8\uB2C8\uD130\uB9C1 \uACBD\uD5D8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. Fargate\uAC00 \uB354 \uC27D\uC2B5\uB2C8\uB2E4." },
  prometheus_grafana: { minExp: "mid", message: "Prometheus \uC124\uCE58/\uC6B4\uC601\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. CloudWatch Container Insights\uAC00 \uB354 \uC27D\uC2B5\uB2C8\uB2E4." },
  canary:           { minExp: "mid", message: "\uCE74\uB098\uB9AC \uBC30\uD3EC\uB294 \uBAA8\uB2C8\uD130\uB9C1/\uB864\uBC31 \uC790\uB3D9\uD654 \uACBD\uD5D8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. Rolling\uC774 \uB354 \uC548\uC804\uD569\uB2C8\uB2E4." },
  cfn:              { minExp: "mid", message: "CloudFormation YAML\uC740 \uC7A5\uD669\uD574\uC9C0\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. Terraform\uC774 \uD559\uC2B5 \uC790\uB8CC\uAC00 \uB354 \uB9CE\uC2B5\uB2C8\uB2E4." },
  opensearch:       { minExp: "mid", message: "OpenSearch \uD074\uB7EC\uC2A4\uD130 \uAD00\uB9AC/\uC778\uB371\uC2F1 \uACBD\uD5D8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. DB \uAC80\uC0C9\uC73C\uB85C \uCDA9\uBD84\uD55C\uC9C0 \uBA3C\uC800 \uD655\uC778\uD558\uC138\uC694." },
  kinesis:          { minExp: "mid", message: "\uC2E4\uC2DC\uAC04 \uC2A4\uD2B8\uB9BC \uCC98\uB9AC\uB294 \uC0E4\uB4DC \uAD00\uB9AC \uACBD\uD5D8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. SQS\uAC00 \uB354 \uC27D\uC2B5\uB2C8\uB2E4." },
};

// Context-aware warnings (shown regardless of team level)
interface ContextWarning {
  check: (state: WizardState, optionValue: string) => boolean;
  level: "warning" | "caution";
  message: string;
}

const CONTEXT_WARNINGS: Record<string, ContextWarning> = {
  // Compliance - warn about operational burden
  pci:    { check: () => true, level: "caution", message: "PCI DSS \uC778\uC99D\uC740 \uBCF4\uC548 \uAC10\uC0AC\uC640 \uBD84\uAE30\uBCC4 \uC810\uAC80\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. PG\uC0AC(\uD1A0\uC2A4 \uB4F1)\uC5D0 \uACB0\uC81C\uB97C \uC704\uC784\uD558\uBA74 \uBC94\uC704\uAC00 \uD06C\uAC8C \uC904\uC5B4\uB4ED\uB2C8\uB2E4." },
  hipaa:  { check: () => true, level: "caution", message: "HIPAA\uB294 AWS\uC640 BAA \uACC4\uC57D\uC774 \uD544\uC694\uD558\uACE0, \uD5C8\uC6A9\uB41C \uC11C\uBE44\uC2A4\uB9CC \uC0AC\uC6A9\uD574\uC57C \uD569\uB2C8\uB2E4. \uC758\uB8CC \uB370\uC774\uD130\uAC00 \uC544\uB2C8\uBA74 \uD574\uB2F9 \uC5C6\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4." },
  sox:    { check: () => true, level: "caution", message: "SOX\uB294 \uBBF8\uAD6D \uC0C1\uC7A5\uC0AC \uB300\uC0C1\uC785\uB2C8\uB2E4. \uC7AC\uBB34 \uB370\uC774\uD130\uB97C \uB2E4\uB8E8\uC9C0 \uC54A\uB294\uB2E4\uBA74 \uBD88\uD544\uC694\uD569\uB2C8\uB2E4." },
  // SLO - warn about cost/complexity implications
  "99.99": {
    check: (s) => {
      const stage = s.workload?.growth_stage;
      return stage === "mvp" || stage === "growth";
    },
    level: "caution",
    message: "99.99%\uB294 \uC5F0\uAC04 53\uBD84\uB9CC \uD5C8\uC6A9\uD558\uBA70 \uBE44\uC6A9\uC774 2\uBC30 \uC774\uC0C1 \uC99D\uAC00\uD569\uB2C8\uB2E4. MVP/\uC131\uC7A5\uAE30\uC5D0\uB294 99.9%\uB85C \uCDA9\uBD84\uD55C \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4.",
  },
  // Encryption strict
  strict: {
    check: (s) => {
      const cert = s.compliance?.cert || [];
      return !cert.includes("pci") && !cert.includes("hipaa") && !cert.includes("sox");
    },
    level: "caution",
    message: "\uAC15\uD654 \uC554\uD638\uD654\uB294 \uADDC\uC815 \uC900\uC218\uAC00 \uD544\uC694\uD55C \uACBD\uC6B0\uC5D0 \uC801\uD569\uD569\uB2C8\uB2E4. \uC77C\uBC18 \uC11C\uBE44\uC2A4\uB294 '\uC804\uC1A1+\uC800\uC7A5 \uC554\uD638\uD654'\uB85C \uCDA9\uBD84\uD569\uB2C8\uB2E4.",
  },
  // Network - private is very restrictive
  private: {
    check: (s) => {
      const cert = s.compliance?.cert || [];
      return !cert.includes("pci") && !cert.includes("hipaa");
    },
    level: "caution",
    message: "\uC644\uC804 \uD504\uB77C\uC774\uBE57\uC740 VPN/\uC804\uC6A9\uC120\uC774 \uD544\uC218\uC785\uB2C8\uB2E4. \uADDC\uC815 \uC900\uC218\uAC00 \uC544\uB2C8\uB77C\uBA74 '\uAC15\uD55C \uACA9\uB9AC'\uAC00 \uC801\uD569\uD569\uB2C8\uB2E4.",
  },
};

const EXP_LEVEL: Record<string, number> = {
  beginner: 0,
  mid: 1,
  senior: 2,
};

export function checkGuardrails(
  state: WizardState,
  _phaseId: string,
  qId: string,
  optionValue: string
): GuardrailWarning | null {
  // 1. Check context-aware warnings (work without team phase being filled)
  const ctx = CONTEXT_WARNINGS[optionValue];
  if (ctx && ctx.check(state, optionValue)) {
    return {
      questionId: qId,
      optionValue,
      level: ctx.level,
      message: ctx.message,
    };
  }

  // 2. Check experience-based warnings (require team phase)
  const adv = ADVANCED_OPTIONS[optionValue];
  if (!adv) return null;

  const teamExp = state.team?.cloud_exp as string | undefined;
  if (!teamExp) return null;

  const userLevel = EXP_LEVEL[teamExp] ?? 1;
  const requiredLevel = EXP_LEVEL[adv.minExp] ?? 1;

  if (userLevel >= requiredLevel) return null;

  return {
    questionId: qId,
    optionValue,
    level: teamExp === "beginner" && adv.minExp === "senior" ? "warning" : "caution",
    message: adv.message,
  };
}
