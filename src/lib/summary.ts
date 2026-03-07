import type { WizardState, Architecture } from "@/lib/types";
import { generateArchitecture } from "@/lib/architecture";
import { estimateMonthlyCost } from "@/lib/cost";
import { wellArchitectedScore } from "@/lib/wafr";
import { validateState } from "@/lib/validate";

export interface ArchSummary {
  headline: string;
  oneLiner: string;
  complexity: { level: string; score: number; factors: string[] };
  teamReqs: { minDevs: number; roles: string[]; skills: string[] };
  keyServices: { name: string; role: string; icon: string }[];
  rolloutPath: { phase: string; duration: string; tasks: string[] }[];
  stats: {
    monthlyCost: number;
    availability: string;
    wafrScore: number;
    errors: number;
    warnings: number;
  };
  nextSteps: string[];
  warnings: string[];
}

const WORKLOAD_LABELS: Record<string, string> = {
  web_api: "\uC6F9/API",
  ecommerce: "\uC774\uCEE4\uBA38\uC2A4",
  ticketing: "\uD2F0\uCF13\uD305/\uC608\uC57D",
  realtime: "\uC2E4\uC2DC\uAC04",
  data: "\uB370\uC774\uD130 \uD30C\uC774\uD504\uB77C\uC778",
  saas: "SaaS",
  iot: "IoT",
  internal: "\uC0AC\uB0B4 \uB3C4\uAD6C",
};

const COMPUTE_LABELS: Record<string, string> = {
  serverless: "\uC11C\uBC84\uB9AC\uC2A4(\uC11C\uBC84 \uAD00\uB9AC \uBD88\uD544\uC694)",
  container: "\uCEE8\uD14C\uC774\uB108(\uC571 \uD328\uD0A4\uC9D5 \uC2E4\uD589)",
  vm: "\uAC00\uC0C1 \uC11C\uBC84(EC2)",
  hybrid: "\uD558\uC774\uBE0C\uB9AC\uB4DC(\uD63C\uD569)",
};

const ORCH_LABELS: Record<string, string> = {
  ecs: "ECS Fargate(\uAD00\uB9AC\uD615 \uCEE8\uD14C\uC774\uB108)",
  eks: "EKS(\uCFE0\uBC84\uB124\uD2F0\uC2A4)",
};

export function generateSummary(
  state: WizardState,
  precomputed?: {
    arch?: Architecture;
    cost?: { totalMid: number };
    wafr?: { overall: number };
    issues?: { severity: "error" | "warn"; title: string; message: string }[];
  }
): ArchSummary {
  const arch = precomputed?.arch || generateArchitecture(state);
  const cost = precomputed?.cost || estimateMonthlyCost(state);
  const wafr = precomputed?.wafr || wellArchitectedScore(state);
  const issues = precomputed?.issues || validateState(state);

  // headline
  const types: string[] = state.workload?.type || [];
  const typeLabel = types.map((t) => WORKLOAD_LABELS[t] || t).join(" + ");
  const pattern = state.compute?.arch_pattern || "container";
  const orch = state.compute?.orchestration;
  const computeLabel = orch ? ORCH_LABELS[orch] || orch : COMPUTE_LABELS[pattern] || pattern;
  const headline = `${computeLabel} \uAE30\uBC18 ${typeLabel} \uC11C\uBE44\uC2A4`;

  // oneLiner
  const stage = state.workload?.growth_stage || "mvp";
  const stageMap: Record<string, string> = {
    mvp: "\uBE60\uB978 \uAC80\uC99D\uC744 \uC704\uD55C \uCD5C\uC18C \uBE44\uC6A9 \uAD6C\uC131",
    growth: "\uC0AC\uC6A9\uC790 \uD655\uBCF4\uC640 \uC548\uC815\uC131\uC744 \uB3D9\uC2DC\uC5D0 \uC7A1\uB294 \uAD6C\uC131",
    scale: "\uB300\uADDC\uBAA8 \uD2B8\uB798\uD53D\uC744 \uC548\uC815\uC801\uC73C\uB85C \uCC98\uB9AC\uD558\uB294 \uAD6C\uC131",
    mature: "\uBE44\uC6A9 \uCD5C\uC801\uD654\uC640 \uACE0\uAC00\uC6A9\uC131\uC744 \uBAA8\uB450 \uB2EC\uC131\uD558\uB294 \uAD6C\uC131",
  };
  const oneLiner = stageMap[stage] || stageMap.mvp;

  // complexity
  let score = 1;
  const factors: string[] = [];
  if (orch === "eks") { score += 3; factors.push("\uCFE0\uBC84\uB124\uD2F0\uC2A4 \uC0AC\uC6A9"); }
  if (state.platform?.service_mesh === "istio") { score += 2; factors.push("\uC11C\uBE44\uC2A4 \uAC04 \uD1B5\uC2E0 \uAD00\uB9AC"); }
  if (state.slo?.region === "active") { score += 2; factors.push("\uB2E4\uC911 \uB9AC\uC804 \uB3D9\uC2DC \uC6B4\uC601"); }
  else if (state.slo?.region === "dr") { score += 1; factors.push("\uC7AC\uD574 \uBCF5\uAD6C\uC6A9 \uBCF4\uC870 \uB9AC\uC804"); }
  const cert: string[] = state.compliance?.cert || [];
  if (cert.includes("pci") || cert.includes("hipaa")) { score += 2; factors.push("\uADDC\uC815 \uC900\uC218 \uD544\uC218"); }
  if (cert.includes("sox")) { score += 1; factors.push("\uC7AC\uBB34 \uAC10\uC0AC \uC900\uC218"); }
  if (types.length > 2) { score += 1; factors.push(`${types.length}\uAC1C \uC6CC\uD06C\uB85C\uB4DC \uBCF5\uD569`); }
  const dau = state.scale?.dau;
  if (dau === "xlarge") { score += 2; factors.push("\uC77C\uC77C \uC0AC\uC6A9\uC790 100\uB9CC+"); }
  else if (dau === "large") { score += 1; factors.push("\uC77C\uC77C \uC0AC\uC6A9\uC790 10\uB9CC+"); }
  if (state.platform?.gitops === "argocd" || state.platform?.gitops === "flux") { score += 1; factors.push("\uC790\uB3D9 \uBC30\uD3EC \uAD00\uB9AC"); }
  score = Math.min(score, 10);

  const level = score <= 3 ? "\uC27D\uC6C0" : score <= 5 ? "\uBCF4\uD1B5" : score <= 7 ? "\uBCF5\uC7A1" : "\uB9E4\uC6B0 \uBCF5\uC7A1";

  // teamReqs
  let minDevs: number;
  const roles: string[] = [];
  const skills: string[] = [];

  if (score <= 3) {
    minDevs = 1;
    roles.push("\uD480\uC2A4\uD0DD \uAC1C\uBC1C\uC790");
    skills.push("AWS \uAE30\uBCF8 \uC0AC\uC6A9\uBC95", "\uC778\uD504\uB77C \uC790\uB3D9\uD654 \uC785\uBB38");
  } else if (score <= 5) {
    minDevs = 3;
    roles.push("\uBC31\uC5D4\uB4DC \uAC1C\uBC1C\uC790", "\uC778\uD504\uB77C/\uBC30\uD3EC \uACB8\uC9C1");
    skills.push("\uCEE8\uD14C\uC774\uB108/DB \uC6B4\uC601", "\uC790\uB3D9 \uBC30\uD3EC \uAD6C\uCD95", "\uC778\uD504\uB77C \uCF54\uB4DC\uD654");
  } else if (score <= 7) {
    minDevs = 5;
    roles.push("\uBC31\uC5D4\uB4DC \uAC1C\uBC1C\uC790", "\uC778\uD504\uB77C \uC5D4\uC9C0\uB2C8\uC5B4", "\uD504\uB860\uD2B8\uC5D4\uB4DC \uAC1C\uBC1C\uC790");
    skills.push("\uCFE0\uBC84\uB124\uD2F0\uC2A4 \uAD00\uB9AC", "\uC778\uD504\uB77C \uC790\uB3D9\uD654", "\uC2DC\uC2A4\uD15C \uBAA8\uB2C8\uD130\uB9C1", "\uBCF4\uC548 \uAD00\uB9AC");
  } else {
    minDevs = 8;
    roles.push("\uBC31\uC5D4\uB4DC", "\uC2DC\uC2A4\uD15C \uC548\uC815\uC131(SRE)", "\uBCF4\uC548", "\uD504\uB860\uD2B8\uC5D4\uB4DC", "DB \uAD00\uB9AC\uC790");
    skills.push("\uCFE0\uBC84\uB124\uD2F0\uC2A4 \uC6B4\uC601", "\uC11C\uBE44\uC2A4 \uBA54\uC2DC", "\uC790\uB3D9 \uBC30\uD3EC/\uBCF5\uAD6C", "\uB2E4\uC911 \uB9AC\uC804 \uC6B4\uC601", "\uADDC\uC815 \uC900\uC218 \uAD00\uB9AC");
  }

  // keyServices - prioritize important layers (compute, data, edge) over infra (org, network)
  // Beginner-friendly Korean descriptions for common AWS service names
  const SVC_KR: Record<string, string> = {
    "Amazon Aurora": "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 (Aurora)",
    "Amazon RDS": "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 (RDS)",
    "Amazon DynamoDB": "\uACE0\uC18D DB (DynamoDB)",
    "DynamoDB": "\uACE0\uC18D DB (DynamoDB)",
    "ElastiCache Redis": "\uCE90\uC2DC \uC11C\uBC84 (Redis)",
    "Amazon S3": "\uD30C\uC77C \uC800\uC7A5\uC18C (S3)",
    "Lambda": "\uC11C\uBC84\uB9AC\uC2A4 \uD568\uC218 (Lambda)",
    "ECS Fargate": "\uCEE8\uD14C\uC774\uB108 \uC2E4\uD589 (Fargate)",
    "Amazon ECS": "\uCEE8\uD14C\uC774\uB108 \uAD00\uB9AC (ECS)",
    "Amazon EKS": "\uCFE0\uBC84\uB124\uD2F0\uC2A4 (EKS)",
    "CloudFront": "\uCF58\uD150\uCE20 \uBE60\uB978 \uC804\uC1A1 (CDN)",
    "Route 53": "DNS/\uB3C4\uBA54\uC778 \uAD00\uB9AC",
    "ALB": "\uD2B8\uB798\uD53D \uBD84\uC0B0\uAE30 (ALB)",
    "API Gateway": "API \uC5F0\uACB0 \uAD00\uB9AC",
    "Amazon SQS": "\uBA54\uC2DC\uC9C0 \uB300\uAE30\uC5F4 (SQS)",
    "Amazon SNS": "\uC54C\uB9BC \uBC1C\uC1A1 (SNS)",
    "EventBridge": "\uC774\uBCA4\uD2B8 \uB77C\uC6B0\uD305",
    "Amazon Kinesis": "\uC2E4\uC2DC\uAC04 \uC2A4\uD2B8\uB9BC (Kinesis)",
    "Amazon ECR": "\uCEE8\uD14C\uC774\uB108 \uC774\uBBF8\uC9C0 \uC800\uC7A5\uC18C",
    "AWS WAF": "\uC6F9 \uBCF4\uC548 \uBC29\uD654\uBCBD (WAF)",
    "Amazon Cognito": "\uB85C\uADF8\uC778/\uC778\uC99D (Cognito)",
    "AWS KMS": "\uC554\uD638\uD654 \uD0A4 \uAD00\uB9AC",
    "CloudWatch": "\uC2DC\uC2A4\uD15C \uBAA8\uB2C8\uD130\uB9C1",
    "CloudTrail": "\uC791\uC5C5 \uAE30\uB85D \uCD94\uC801",
    "Step Functions": "\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC790\uB3D9\uD654",
    "OpenSearch": "\uAC80\uC0C9 \uC5D4\uC9C4 (OpenSearch)",
    "Terraform": "\uC778\uD504\uB77C \uCF54\uB4DC\uD654 (Terraform)",
    "GitHub Actions": "\uC790\uB3D9 \uBC30\uD3EC (GitHub Actions)",
    "VPC": "\uAC00\uC0C1 \uB124\uD2B8\uC6CC\uD06C (VPC)",
    "NAT Gateway": "\uC678\uBD80 \uC811\uC18D \uAD00\uBB38 (NAT)",
    "GuardDuty": "\uBCF4\uC548 \uC704\uD611 \uAC10\uC9C0",
    "AWS Config": "\uC124\uC815 \uBCC0\uACBD \uCD94\uC801",
    "Secrets Manager": "\uBE44\uBC00\uBC88\uD638 \uAD00\uB9AC",
  };
  const keyServices: { name: string; role: string; icon: string }[] = [];
  const priorityOrder = ["compute", "data", "edge", "messaging", "platform", "appstack", "cicd", "security", "dr", "batch", "observability", "network", "org", "cost"];
  const sortedLayers = [...arch.layers].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.id);
    const bi = priorityOrder.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  for (const layer of sortedLayers) {
    for (const svc of layer.services) {
      if (keyServices.length >= 8) break;
      keyServices.push({
        name: SVC_KR[svc.name] || svc.name,
        role: svc.detail || svc.reason || "",
        icon: layer.icon,
      });
    }
  }

  // rolloutPath
  const rolloutPath = buildRolloutPath(state);

  // stats
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warn").length;

  // nextSteps — beginner-friendly Korean
  const nextSteps: string[] = [];
  if (!state.cicd?.iac || state.cicd.iac === "none")
    nextSteps.push("\uC778\uD504\uB77C \uC790\uB3D9\uD654 \uB3C4\uAD6C \uB3C4\uC785\uD558\uAE30 \u2014 \uC11C\uBC84/\uB124\uD2B8\uC6CC\uD06C\uB97C \uCF54\uB4DC\uB85C \uAD00\uB9AC\uD558\uBA74 \uC2E4\uC218\uAC00 \uC904\uACE0 \uBC18\uBCF5 \uC791\uC5C5\uC774 \uC5C6\uC5B4\uC9D1\uB2C8\uB2E4");
  else {
    const iacName = state.cicd.iac === "terraform" ? "Terraform" : state.cicd.iac === "cdk" ? "CDK" : "CloudFormation";
    nextSteps.push(`${iacName}\uC73C\uB85C \uAE30\uBCF8 \uB124\uD2B8\uC6CC\uD06C \uAD6C\uC131 \uCF54\uB4DC \uC791\uC131\uD558\uAE30 \u2014 \uC11C\uBC84\uB4E4\uC774 \uD1B5\uC2E0\uD560 \uAE30\uBCF8 \uD658\uACBD\uC744 \uB9CC\uB4ED\uB2C8\uB2E4`);
  }

  if (pattern === "container")
    nextSteps.push(`\uCEE8\uD14C\uC774\uB108 \uC2E4\uD589 \uD658\uACBD \uB9CC\uB4E4\uACE0 \uCCA8 \uC11C\uBE44\uC2A4 \uBC30\uD3EC\uD558\uAE30 \u2014 \uC571\uC744 \uD328\uD0A4\uC9D5\uD574\uC11C \uD074\uB77C\uC6B0\uB4DC\uC5D0 \uC62C\uB9BD\uB2C8\uB2E4`);
  else if (pattern === "serverless")
    nextSteps.push("\uC11C\uBC84\uB9AC\uC2A4 \uD568\uC218\uC640 API \uC5F0\uACB0 \uC124\uC815\uD558\uAE30 \u2014 \uC694\uCCAD\uC774 \uC62C \uB54C\uB9CC \uC2E4\uD589\uB418\uC5B4 \uBE44\uC6A9\uC774 \uC808\uC57D\uB429\uB2C8\uB2E4");

  nextSteps.push("\uC790\uB3D9 \uBC30\uD3EC \uD30C\uC774\uD504\uB77C\uC778 \uAD6C\uCD95\uD558\uAE30 \u2014 \uCF54\uB4DC \uBCC0\uACBD \uC2DC \uAC1C\uBC1C\u2192\uD14C\uC2A4\uD2B8\u2192\uC6B4\uC601 \uD658\uACBD\uC73C\uB85C \uC790\uB3D9 \uBC30\uD3EC\uB429\uB2C8\uB2E4");
  nextSteps.push("\uC2DC\uC2A4\uD15C \uBAA8\uB2C8\uD130\uB9C1 \uBC0F \uC54C\uB78C \uC124\uC815\uD558\uAE30 \u2014 \uC7A5\uC560 \uBC1C\uC0DD \uC2DC \uC989\uC2DC \uC54C\uB9BC\uC744 \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4");
  nextSteps.push("\uBCF4\uC548 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uAC80\uD1A0\uD558\uAE30 \u2014 \uACC4\uC815\uBCC4 \uCD5C\uC18C \uAD8C\uD55C\uB9CC \uBD80\uC5EC\uD558\uACE0 \uBCF4\uC548 \uC124\uC815\uC744 \uD655\uC778\uD569\uB2C8\uB2E4");

  // warnings
  const critWarnings = issues
    .filter((i) => i.severity === "error")
    .map((i) => `${i.title}: ${i.message}`);

  return {
    headline,
    oneLiner,
    complexity: { level, score, factors },
    teamReqs: { minDevs, roles, skills },
    keyServices,
    rolloutPath,
    stats: {
      monthlyCost: cost.totalMid,
      availability: state.slo?.availability || "99.9",
      wafrScore: wafr.overall,
      errors,
      warnings,
    },
    nextSteps,
    warnings: critWarnings,
  };
}

function buildRolloutPath(
  state: WizardState
): { phase: string; duration: string; tasks: string[] }[] {
  const stage = state.workload?.growth_stage || "mvp";
  const pattern = state.compute?.arch_pattern || "container";

  if (stage === "mvp") {
    return [
      { phase: "1\uB2E8\uACC4: \uAE30\uBC18 \uAD6C\uCD95", duration: "2\u20134\uC8FC", tasks: ["\uB124\uD2B8\uC6CC\uD06C \uD658\uACBD \uC0DD\uC131 (\uC11C\uBC84\uB4E4\uC774 \uD1B5\uC2E0\uD560 \uAE30\uBCF8 \uD658\uACBD)", "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC0DD\uC131", "\uC790\uB3D9 \uBC30\uD3EC \uD658\uACBD \uC124\uC815"] },
      { phase: "2\uB2E8\uACC4: MVP \uBC30\uD3EC", duration: "1\u20132\uC8FC", tasks: [pattern === "serverless" ? "\uC11C\uBC84\uB9AC\uC2A4 \uD568\uC218 \uBC30\uD3EC" : "\uCCA8 \uC11C\uBE44\uC2A4 \uBC30\uD3EC", "\uB3C4\uBA54\uC778 \uC5F0\uACB0 \uBC0F \uBCF4\uC548 \uC811\uC18D(HTTPS) \uC801\uC6A9", "\uC2DC\uC2A4\uD15C \uC0C1\uD0DC \uBAA8\uB2C8\uD130\uB9C1 \uAE30\uBCF8 \uC124\uC815"] },
      { phase: "3\uB2E8\uACC4: \uC548\uC815\uD654", duration: "2\u20134\uC8FC", tasks: ["\uC811\uC18D\uC790 \uC99D\uAC00 \uC2DC \uC790\uB3D9 \uD655\uC7A5 \uD14C\uC2A4\uD2B8", "\uC7A5\uC560 \uBC1C\uC0DD \uC2DC \uBCF5\uAD6C \uD6C8\uB828", "\uBE44\uC6A9 \uCD5C\uC801\uD654 \uAC80\uD1A0"] },
    ];
  }

  if (stage === "growth") {
    return [
      { phase: "1\uB2E8\uACC4: \uC778\uD504\uB77C \uAE30\uBC18", duration: "3\u20134\uC8FC", tasks: ["\uC778\uD504\uB77C\uB97C \uCF54\uB4DC\uB85C \uAD00\uB9AC\uD558\uAE30 (\uC218\uB3D9 \uC124\uC815 \uC81C\uAC70)", "\uB2E4\uC911 \uAC00\uC6A9 \uC601\uC5ED \uAD6C\uC131 (\uC7A5\uC560 \uC2DC \uC790\uB3D9 \uC804\uD658)", "\uD658\uACBD \uBD84\uB9AC (\uAC1C\uBC1C/\uD14C\uC2A4\uD2B8/\uC6B4\uC601)"] },
      { phase: "2\uB2E8\uACC4: \uC11C\uBE44\uC2A4 \uBC30\uD3EC", duration: "2\u20133\uC8FC", tasks: ["\uC571 \uBC30\uD3EC \uBC0F \uC2E4\uD589 \uD658\uACBD \uAD6C\uCD95", "\uC790\uC8FC \uC4F0\uB294 \uB370\uC774\uD130 \uCE90\uC2DC \uCD94\uAC00 (\uC18D\uB3C4 \uD5A5\uC0C1)", "\uC804 \uC138\uACC4 \uBE60\uB978 \uC751\uB2F5\uC744 \uC704\uD55C CDN \uC124\uC815"] },
      { phase: "3\uB2E8\uACC4: \uC6B4\uC601 \uACE0\uB3C4\uD654", duration: "2\u20134\uC8FC", tasks: ["\uBE44\uC6A9 \uBD84\uC11D \uBC0F \uC7A5\uAE30 \uD560\uC778 \uC694\uAE08\uC81C \uAC80\uD1A0", "\uBCF4\uC548 \uC790\uB3D9 \uAC10\uC0AC \uC124\uC815", "\uBD80\uD558 \uD14C\uC2A4\uD2B8 \uBC0F \uC790\uB3D9 \uD655\uC7A5 \uC870\uC815"] },
    ];
  }

  return [
    { phase: "1\uB2E8\uACC4: \uC124\uACC4 \uBC0F \uAE30\uBC18", duration: "4\u20136\uC8FC", tasks: ["\uD300/\uD658\uACBD\uBCC4 \uBCC4\uB3C4 AWS \uACC4\uC815 \uAD6C\uC131", "\uB124\uD2B8\uC6CC\uD06C \uC124\uACC4 (\uC11C\uBC84 \uAC04 \uD1B5\uC2E0 \uD658\uACBD)", "\uC778\uD504\uB77C \uCF54\uB4DC \uBAA8\uB4C8\uD654 (\uC7AC\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uBE14\uB85D)"] },
    { phase: "2\uB2E8\uACC4: \uD575\uC2EC \uC11C\uBE44\uC2A4", duration: "3\u20134\uC8FC", tasks: ["\uCEE8\uD14C\uC774\uB108 \uC2E4\uD589 \uD50C\uB7AB\uD3FC \uAD6C\uCD95", "DB \uACE0\uAC00\uC6A9\uC131 \uAD6C\uC131 (\uC7A5\uC560 \uC2DC \uC790\uB3D9 \uC804\uD658)", "\uC11C\uBE44\uC2A4 \uAC04 \uBA54\uC2DC\uC9D5 \uC778\uD504\uB77C \uAD6C\uCD95"] },
    { phase: "3\uB2E8\uACC4: \uC6B4\uC601 \uD50C\uB7AB\uD3FC", duration: "2\u20134\uC8FC", tasks: ["\uC2DC\uC2A4\uD15C \uBAA8\uB2C8\uD130\uB9C1/\uB85C\uADF8 \uC218\uC9D1 \uD50C\uB7AB\uD3FC", "\uC790\uB3D9 \uBC30\uD3EC \uD30C\uC774\uD504\uB77C\uC778 \uAD6C\uCD95", "\uBCF4\uC548 \uAC15\uD654 (\uAD8C\uD55C \uAD00\uB9AC, \uC554\uD638\uD654)"] },
    { phase: "4\uB2E8\uACC4: \uCD5C\uC801\uD654", duration: "2\u20134\uC8FC", tasks: ["\uBE44\uC6A9 \uCD5C\uC801\uD654 (\uC7A5\uAE30 \uD560\uC778/\uC5EC\uC720 \uC11C\uBC84 \uD65C\uC6A9)", "\uC131\uB2A5 \uCD5C\uC801\uD654 (\uBCD1\uBAA9 \uD574\uC18C)", "\uC7AC\uD574 \uBCF5\uAD6C \uD6C8\uB828 (\uC7A5\uC560 \uB300\uBE44 \uC2DC\uB098\uB9AC\uC624)"] },
  ];
}
