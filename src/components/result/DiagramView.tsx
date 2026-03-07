"use client";

import { useState, useMemo } from "react";
import type { Architecture, ArchService, WizardState } from "@/lib/types";
import { generateDiagramXml } from "@/lib/diagram-xml";

const SVC_MAP: [string, string, string, string][] = [
  ["route 53","#7C3AED","\uD83D\uDD35","Route 53"],
  ["certificate manager","#7C3AED","\uD83D\uDD12","ACM"],
  ["cloudfront","#F59E0B","\u26A1","CloudFront"],
  ["bot control","#DC2626","\uD83E\uDD16","Bot Control"],
  ["shield","#DC2626","\uD83D\uDEE1\uFE0F","Shield Adv"],
  ["waf","#EF4444","\uD83D\uDEE1\uFE0F","WAF"],
  ["websocket api","#3B82F6","\uD83D\uDD0C","WebSocket API"],
  ["alb","#3B82F6","\u2696\uFE0F","ALB"],
  ["nlb","#3B82F6","\uD83D\uDD00","NLB"],
  ["api gateway","#3B82F6","\uD83D\uDEAA","API Gateway"],
  ["ecs fargate","#10B981","\uD83D\uDCE6","ECS Fargate"],
  ["fargate","#10B981","\uD83D\uDCE6","ECS Fargate"],
  ["eks","#10B981","\u2699\uFE0F","EKS"],
  ["lambda","#F59E0B","\u03BB","Lambda"],
  ["ec2 auto","#10B981","\uD83D\uDDA5\uFE0F","EC2 ASG"],
  ["systems manager","#6B7280","\uD83D\uDD27","SSM"],
  ["amazon ecr","#10B981","\uD83D\uDCCB","ECR"],
  ["ecr","#10B981","\uD83D\uDCCB","ECR"],
  ["rds proxy","#7C3AED","\uD83D\uDD0C","RDS Proxy"],
  ["cognito","#8B5CF6","\uD83D\uDC64","Cognito"],
  ["iam identity center","#8B5CF6","\uD83D\uDD11","IAM SSO"],
  ["\uC778\uC99D \uC774\uC911","#8B5CF6","\uD83D\uDD17","\uC774\uC911 \uC778\uC99D"],
  ["\uC790\uCCB4 \uC778\uC99D","#6B7280","\uD83D\uDD11","\uC790\uCCB4 JWT"],
  ["elasticache","#DC2626","\u26A1","ElastiCache Redis"],
  ["dax","#F59E0B","\u26A1","DynamoDB DAX"],
  ["aurora postgresql","#7C3AED","\uD83D\uDDC4\uFE0F","Aurora PG"],
  ["aurora mysql","#7C3AED","\uD83D\uDDC4\uFE0F","Aurora MySQL"],
  ["aurora global","#7C3AED","\uD83C\uDF0D","Aurora Global"],
  ["aurora","#7C3AED","\uD83D\uDDC4\uFE0F","Aurora"],
  ["rds postgresql","#2563EB","\uD83D\uDDC4\uFE0F","RDS PG"],
  ["rds mysql","#2563EB","\uD83D\uDDC4\uFE0F","RDS MySQL"],
  ["dynamodb pitr","#F59E0B","\u23EA","DynamoDB PITR"],
  ["dynamodb global","#F59E0B","\uD83C\uDF0D","Global Tables"],
  ["dynamodb","#F59E0B","\u26A1","DynamoDB"],
  ["opensearch","#10B981","\uD83D\uDD0D","OpenSearch"],
  ["timestream","#7C3AED","\u23F1\uFE0F","Timestream"],
  ["aws backup","#059669","\uD83D\uDCBE","AWS Backup"],
  ["s3 cross","#16A34A","\uD83C\uDF0D","S3 CRR"],
  ["s3","#16A34A","\uD83E\uDEA3","S3"],
  ["efs","#0891B2","\uD83D\uDCC1","EFS"],
  ["ebs","#6B7280","\uD83D\uDCBE","EBS gp3"],
  ["iot core","#0891B2","\uD83D\uDCE1","IoT Core"],
  ["aws glue","#D97706","\uD83D\uDD27","Glue ETL"],
  ["amazon athena","#D97706","\uD83D\uDD0D","Athena"],
  ["amazon redshift","#2563EB","\uD83C\uDFEA","Redshift"],
  ["redshift","#2563EB","\uD83C\uDFEA","Redshift"],
  ["lake formation","#D97706","\uD83C\uDFD4\uFE0F","Lake Formation"],
  ["\uD14C\uB09C\uD2B8 \uACA9\uB9AC","#8B5CF6","\uD83C\uDFE2","\uD14C\uB09C\uD2B8 \uACA9\uB9AC"],
  ["eventbridge scheduler","#7C3AED","\uD83D\uDD50","EventBridge Scheduler"],
  ["aws step functions","#7C3AED","\uD83D\uDD00","Step Functions"],
  ["step functions","#7C3AED","\uD83D\uDD00","Step Functions"],
  ["aws batch","#6366f1","\u26A1","AWS Batch"],
  ["ecs scheduled","#10B981","\uD83D\uDCCB","ECS Scheduled Task"],
  ["aws glue schema","#D97706","\uD83D\uDCCB","Glue Schema Registry"],
  ["confluent schema","#D97706","\uD83D\uDCCB","Confluent Schema Registry"],
  ["api \uBC84\uC804 \uAD00\uB9AC","#6B7280","\uD83C\uDFF7\uFE0F","API \uBC84\uC804\uAD00\uB9AC"],
  ["sqs","#D97706","\uD83D\uDCEC","SQS"],
  ["sns","#D97706","\uD83D\uDCE2","SNS"],
  ["eventbridge","#D97706","\uD83D\uDD14","EventBridge"],
  ["kinesis","#0891B2","\uD83C\uDF0A","Kinesis"],
  ["msk","#D97706","\uD83D\uDCE1","MSK Kafka"],
  ["failover \uB77C\uC6B0","#8B5CF6","\uD83D\uDD04","R53 Failover"],
  ["\uB808\uC774\uD134\uC2DC \uAE30\uBC18","#8B5CF6","\uD83D\uDD04","R53 Latency"],
  ["route 53 failover","#8B5CF6","\uD83D\uDD04","R53 Failover"],
  ["global database","#7C3AED","\uD83C\uDF0D","Aurora Global"],
  ["global tables","#F59E0B","\uD83C\uDF0D","Global Tables"],
  ["cross-region replication","#16A34A","\uD83C\uDF0D","S3 CRR"],
  ["iam roles","#DC2626","\uD83D\uDC6E","IAM Roles"],
  ["security group","#DC2626","\uD83D\uDD12","Security Group"],
  ["secrets manager","#DC2626","\uD83D\uDD10","Secrets Manager"],
  ["kms","#DC2626","\uD83D\uDD11","KMS CMK"],
  ["config","#6B7280","\uD83D\uDCCB","Config+SecurityHub"],
  ["guardduty","#DC2626","\uD83D\uDEE1\uFE0F","GuardDuty"],
  ["inspector","#DC2626","\uD83D\uDD2C","Inspector v2"],
  ["macie","#DC2626","\uD83D\uDD0E","Macie"],
  ["vpc flow","#6B7280","\uD83D\uDCCA","VPC Flow Logs"],
  ["cloudtrail","#6B7280","\uD83D\uDCDC","CloudTrail"],
  ["cloudwatch","#374151","\uD83D\uDCCA","CloudWatch"],
  ["x-ray","#374151","\uD83D\uDD2D","X-Ray"],
  ["terraform","#7C3AED","\uD83C\uDFD7\uFE0F","Terraform"],
  ["aws cdk","#F59E0B","\uD83C\uDFD7\uFE0F","AWS CDK"],
  ["cloudformation","#F59E0B","\uD83C\uDFD7\uFE0F","CloudFormation"],
  ["github actions","#24292f","\uD83D\uDC19","GitHub Actions"],
  ["codepipeline","#0891B2","\uD83D\uDD04","CodePipeline"],
  ["gitlab","#FC6D26","\uD83E\uDD8A","GitLab CI"],
  ["blue/green","#10B981","\uD83D\uDD35","Blue/Green"],
  ["canary","#F59E0B","\uD83D\uDC24","Canary \uBC30\uD3EC"],
  ["\uBC30\uD3EC \uC804\uB7B5","#6B7280","\uD83D\uDE80","\uBC30\uD3EC \uC804\uB7B5"],
  ["rolling","#6B7280","\uD83D\uDD04","Rolling \uBC30\uD3EC"],
  ["external secrets","#DC2626","\uD83D\uDD10","External Secrets"],
  ["secrets store csi","#DC2626","\uD83D\uDD11","Secrets CSI"],
  ["k8s secret","#6B7280","\uD83D\uDD11","K8s Secret"],
  ["kyverno","#6366f1","\uD83D\uDEE1\uFE0F","Kyverno"],
  ["opa gatekeeper","#DC2626","\uD83D\uDC6E","OPA Gatekeeper"],
  ["pod security admission","#6B7280","\uD83D\uDD12","PSA"],
  ["vpc cni networkpolicy","#3B82F6","\uD83C\uDF10","NetworkPolicy"],
  ["cilium","#F97316","\uD83D\uDC1D","Cilium eBPF"],
  ["velero","#059669","\uD83D\uDCBE","Velero"],
  ["keda","#6366f1","\uD83D\uDCC8","KEDA"],
  ["vpa","#F59E0B","\u2195\uFE0F","VPA"],
  ["\uBA40\uD2F0 \uD074\uB7EC\uC2A4\uD130","#374151","\uD83C\uDFE2","\uBA40\uD2F0 \uD074\uB7EC\uC2A4\uD130"],
  ["karpenter","#6366f1","\uD83D\uDE80","Karpenter"],
  ["cluster autoscaler","#6366f1","\uD83D\uDCC8","Cluster Autoscaler"],
  ["aws alb ingress","#3B82F6","\u2696\uFE0F","ALB Controller"],
  ["nginx ingress","#10B981","\uD83D\uDD00","NGINX Ingress"],
  ["kong gateway","#D97706","\uD83E\uDD81","Kong Gateway"],
  ["traefik","#0891B2","\uD83D\uDD37","Traefik"],
  ["istio","#6366f1","\uD83D\uDD78\uFE0F","Istio"],
  ["kiali","#6366f1","\uD83D\uDDFA\uFE0F","Kiali"],
  ["aws app mesh","#7C3AED","\uD83C\uDF10","App Mesh"],
  ["argocd","#F97316","\u267B\uFE0F","ArgoCD"],
  ["flux","#16A34A","\uD83D\uDD04","Flux v2"],
  ["prometheus operator","#F59E0B","\uD83D\uDCCA","Prometheus"],
  ["grafana","#F97316","\uD83D\uDCC8","Grafana"],
  ["cloudwatch container","#374151","\uD83D\uDCCA","Container Insights"],
  ["cloudwatch + prometheus","#374151","\uD83D\uDCCA","CW+Prometheus"],
  ["helm","#0F172A","\u26F5","Helm"],
  ["cert-manager","#059669","\uD83D\uDD12","cert-manager"],
  ["spring boot","#6DB33F","\u2615","Spring Boot"],
  ["spring cloud gateway","#6DB33F","\uD83D\uDEAA","Spring GW"],
  ["node.js","#339933","\u2B21","Node.js"],
  ["python","#3776AB","\uD83D\uDC0D","FastAPI"],
  ["go","#00ADD8","\uD83D\uDC39","Go"],
  ["rust","#CE422B","\uD83E\uDD80","Rust"],
  ["\uD3F4\uB9AC\uAE00\uB7CF","#6B7280","\uD83C\uDF10","\uD3F4\uB9AC\uAE00\uB7CF"],
  ["aws api gateway","#3B82F6","\uD83D\uDEAA","API Gateway"],
  ["alb \uC9C1\uC811","#3B82F6","\u2696\uFE0F","ALB \uC9C1\uC811"],
  ["grpc","#244C5A","\uD83D\uDCE1","gRPC+Protobuf"],
  ["apollo server","#311C87","\uD83D\uDE80","Apollo GraphQL"],
  ["aws appsync","#7C3AED","\uD83D\uDE80","AppSync"],
  ["rest (\uC678\uBD80)","#10B981","\uD83C\uDF10","REST+gRPC \uD63C\uD569"],
  ["k8s \uB0B4\uC7A5 dns","#326CE5","\uD83D\uDD0D","K8s DNS"],
  ["aws cloud map","#D97706","\uD83D\uDDFA\uFE0F","Cloud Map"],
  ["spring cloud eureka","#6DB33F","\uD83D\uDCCB","Eureka"],
  ["vpn + dx","#0891B2","\uD83D\uDD17","VPN+DX"],
  ["nat gw","#6B7280","\uD83D\uDD04","NAT GW"],
  ["nat gateway","#6B7280","\uD83D\uDD04","NAT GW"],
  ["vpc endpoint","#6B7280","\uD83D\uDD17","VPC Endpoint"],
  ["transit gateway","#6B7280","\uD83D\uDD04","Transit GW"],
  ["site-to-site","#6B7280","\uD83D\uDD10","VPN"],
  ["direct connect","#0891B2","\uD83D\uDCF6","Direct Connect"],
  ["aws organizations","#374151","\uD83C\uDFE2","Organizations"],
  ["\uD658\uACBD\uBCC4 \uACC4\uC815","#374151","\uD83C\uDFE2","\uACC4\uC815 \uBD84\uB9AC"],
  ["\uB2E8\uC77C \uACC4\uC815","#374151","\uD83C\uDFE2","\uB2E8\uC77C \uACC4\uC815"],
];

function getSvcDisplay(name: string) {
  const n = (name || "").toLowerCase();
  for (const [kw, color, icon, label] of SVC_MAP) {
    if (n.includes(kw)) return { color, icon, label };
  }
  const words = (name || "").split(/[\s(]+/).slice(0, 3).join(" ");
  return { color: "#6B7280", icon: "\u2601\uFE0F", label: words };
}

interface Zones {
  account: ArchService[];
  networkExtras: ArchService[];
  edge: ArchService[];
  lb: ArchService[];
  app: ArchService[];
  platform: ArchService[];
  appstack: ArchService[];
  cache: ArchService[];
  db: ArchService[];
  backup: ArchService[];
  storage: ArchService[];
  iot: ArchService[];
  datapipe: ArchService[];
  saas: ArchService[];
  messaging: ArchService[];
  batch: ArchService[];
  dr: ArchService[];
  security: ArchService[];
  observability: ArchService[];
  cicd: ArchService[];
  cost: ArchService[];
}

function buildDiagramZones(arch: Architecture): Zones {
  const z: Zones = {
    account: [], networkExtras: [], edge: [],
    lb: [], app: [], platform: [], appstack: [],
    cache: [], db: [], backup: [],
    storage: [], iot: [], datapipe: [], saas: [],
    messaging: [], batch: [], dr: [],
    security: [], observability: [], cicd: [], cost: [],
  };
  arch.layers.forEach((layer) => {
    const svcs = layer.services.filter(
      (s) => s && s.name && s.detail !== undefined
    );
    if (layer.id === "org") { z.account.push(...svcs); return; }
    if (layer.id === "network") {
      svcs.forEach((svc) => {
        const nm = svc.name.toLowerCase();
        if (nm.includes("vpc") || nm.includes("\uC11C\uBE0C\uB137") || nm.includes("subnet")) return;
        z.networkExtras.push(svc);
      });
      return;
    }
    if (layer.id === "edge") { z.edge.push(...svcs); return; }
    if (layer.id === "compute") {
      svcs.forEach((svc) => {
        const nm = svc.name.toLowerCase();
        if (nm.includes("alb") || nm.includes("nlb") || nm.includes("api gateway") || nm.includes("load balancer"))
          z.lb.push(svc);
        else z.app.push(svc);
      });
      return;
    }
    if (layer.id === "platform") { z.platform.push(...svcs); return; }
    if (layer.id === "appstack") { z.appstack.push(...svcs); return; }
    if (layer.id === "data") {
      svcs.forEach((svc) => {
        const nm = svc.name.toLowerCase();
        if (nm.includes("elasticache") || nm.includes("redis") || nm.includes("dax"))
          z.cache.push(svc);
        else if (nm.includes("dynamodb pitr") || nm.includes("aws backup"))
          z.backup.push(svc);
        else if (nm.includes("aurora") || nm.includes("rds") || nm.includes("dynamodb") || nm.includes("opensearch") || nm.includes("timestream"))
          z.db.push(svc);
        else if (nm.includes("s3") || nm.includes("efs") || nm.includes("ebs"))
          z.storage.push(svc);
        else if (nm.includes("iot core"))
          z.iot.push(svc);
        else if (nm.includes("glue") || nm.includes("athena") || nm.includes("redshift") || nm.includes("lake formation"))
          z.datapipe.push(svc);
        else if (nm.includes("\uD14C\uB09C\uD2B8"))
          z.saas.push(svc);
        else z.db.push(svc);
      });
      return;
    }
    if (layer.id === "messaging") { z.messaging.push(...svcs); return; }
    if (layer.id === "batch") { z.batch.push(...svcs); return; }
    if (layer.id === "dr") { z.dr.push(...svcs); return; }
    if (layer.id === "security") { z.security.push(...svcs); return; }
    if (layer.id === "observability") { z.observability.push(...svcs); return; }
    if (layer.id === "cicd") { z.cicd.push(...svcs); return; }
    if (layer.id === "cost") { z.cost.push(...svcs); return; }
  });
  return z;
}

function SCard({ svc }: { svc: ArchService }) {
  const { color, icon, label } = getSvcDisplay(svc.name);
  const [hov, setHov] = useState(false);
  const tooltip = [
    svc.detail,
    svc.reason && `\u2192 ${svc.reason}`,
    svc.opt && `\uD83D\uDCA1 ${svc.opt}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      title={tooltip}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex w-24 min-h-[72px] shrink-0 cursor-default flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white px-1.5 pb-1.5 pt-[7px] transition-all"
      style={{
        borderLeft: `2px solid ${hov ? color : color + "55"}`,
        borderRight: `2px solid ${hov ? color : color + "55"}`,
        borderBottom: `2px solid ${hov ? color : color + "55"}`,
        borderTop: `3px solid ${color}`,
        boxShadow: hov ? `0 6px 18px ${color}30` : "0 2px 6px rgba(0,0,0,0.07)",
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      <div className="text-[22px] leading-none">{icon}</div>
      <div
        className="max-w-[88px] break-words text-center text-[9.5px] font-bold leading-tight transition-colors"
        style={{ color: hov ? color : "#1f2937" }}
      >
        {label}
      </div>
      {svc.cost && (
        <div className="mt-0.5 text-[8px] font-semibold text-amber-600">
          {svc.cost
            .split("/")[0]
            .replace(/~|\$|무료|free/gi, (m) => m)
            .trim()
            .slice(0, 12)}
        </div>
      )}
    </div>
  );
}

function SRow({ svcs }: { svcs: ArchService[] }) {
  if (!svcs || !svcs.length) return null;
  return (
    <div className="flex flex-wrap items-start gap-2 p-2.5 px-3">
      {svcs.map((s, i) => (
        <SCard key={i} svc={s} />
      ))}
    </div>
  );
}

function ZBand({
  label,
  color,
  bg,
  children,
}: {
  label: string;
  color: string;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-1.5 overflow-hidden rounded-[10px]"
      style={{
        border: `1.5px solid ${color}40`,
        borderLeft: `4px solid ${color}`,
        background: bg || "#fff",
      }}
    >
      <div
        className="border-b px-3.5 py-[7px] text-xs font-bold"
        style={{
          background: color + "18",
          borderColor: color + "22",
          color,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SubnetBand({
  label,
  color,
  svcs,
}: {
  label: string;
  color: string;
  svcs: ArchService[];
}) {
  if (!svcs || !svcs.length) return null;
  return (
    <div
      className="mx-2 my-1 rounded-lg"
      style={{
        border: `1.5px dashed ${color}70`,
        background: color + "08",
      }}
    >
      <div
        className="px-2.5 pt-1 text-[10px] font-bold"
        style={{ color: color + "BB" }}
      >
        {label}
      </div>
      <SRow svcs={svcs} />
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="my-0.5 flex flex-col items-center">
      {label && (
        <div className="mb-0.5 text-[9px] text-gray-400">{label}</div>
      )}
      <div className="h-4 w-[1.5px] bg-gray-300" />
      <div
        className="h-0 w-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #D1D5DB",
        }}
      />
    </div>
  );
}

function DrawioPreview({ xml }: { xml: string }) {
  const srcdoc = useMemo(() => {
    const config = JSON.stringify({
      highlight: "#0000ff",
      nav: true,
      resize: true,
      toolbar: "zoom layers lightbox",
      xml,
    });
    const escaped = config.replace(/&/g, "&amp;").replace(/'/g, "&#39;");
    return [
      "<!DOCTYPE html>",
      '<html><head><meta charset="utf-8">',
      "<style>body{margin:0;background:#f9fafb}</style>",
      "</head><body>",
      `<div class="mxgraph" style="max-width:100%" data-mxgraph='${escaped}'></div>`,
      '<script src="https://viewer.diagrams.net/js/viewer-static.min.js"><\/script>',
      "</body></html>",
    ].join("\n");
  }, [xml]);

  return (
    <iframe
      srcDoc={srcdoc}
      className="w-full rounded-lg border border-gray-200 bg-gray-50"
      style={{ height: "calc(100vh - 200px)", minHeight: "700px" }}
      title="Architecture Diagram"
    />
  );
}

interface DiagramViewProps {
  arch: Architecture;
  state: WizardState;
}

export function DiagramView({ arch, state }: DiagramViewProps) {
  const z = buildDiagramZones(arch);
  const subnetTier = state.network?.subnet_tier || "2tier";
  const [viewMode, setViewMode] = useState<"card" | "drawio">("card");

  const diagramXml = useMemo(() => generateDiagramXml(arch, state), [arch, state]);

  const downloadDrawio = () => {
    const blob = new Blob([diagramXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `architecture-${new Date().toISOString().slice(0, 10)}.drawio`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInDrawio = () => {
    const win = window.open("https://embed.diagrams.net/?embed=1&proto=json&spin=1", "_blank");
    if (!win) return;
    const onMsg = (evt: MessageEvent) => {
      if (evt.source !== win) return;
      try {
        const msg = typeof evt.data === "string" ? JSON.parse(evt.data) : null;
        if (!msg) return;
        if (msg.event === "init") {
          win.postMessage(JSON.stringify({ action: "load", xml: diagramXml }), "*");
        }
        if (msg.event === "exit") window.removeEventListener("message", onMsg);
      } catch { /* non-JSON */ }
    };
    window.addEventListener("message", onMsg);
  };
  const az =
    state.network?.az_count === "3az"
      ? "3AZ"
      : state.network?.az_count === "1az"
        ? "1AZ"
        : "2AZ";
  const hasVpc =
    z.lb.length + z.app.length + z.cache.length + z.db.length > 0;
  const hasDat = z.datapipe.length + z.iot.length + z.saas.length > 0;
  const total = Object.values(z).flat().length;

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
        <span className="text-xs font-bold text-gray-700">
          {"\uD83D\uDCD0"} 아키텍처 다이어그램
        </span>
        <span className="text-[11px] text-gray-500">
          12개 단계에서 선택된 서비스{" "}
          <strong className="text-indigo-600">{total}개</strong> 전부 표시
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-md border border-gray-300 text-[11px] font-bold">
            <button
              onClick={() => setViewMode("card")}
              className={`rounded-l-md px-3 py-1.5 transition-colors ${viewMode === "card" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              카드 뷰
            </button>
            <button
              onClick={() => setViewMode("drawio")}
              className={`rounded-r-md px-3 py-1.5 transition-colors ${viewMode === "drawio" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              draw.io 뷰
            </button>
          </div>
          <button
            onClick={openInDrawio}
            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            {"\u270F\uFE0F"} draw.io에서 편집
          </button>
          <button
            onClick={downloadDrawio}
            className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            {"\u2B07"} 다운로드
          </button>
        </div>
      </div>

      {viewMode === "drawio" ? (
        <DrawioPreview xml={diagramXml} />
      ) : (
      <div className="mx-auto max-w-[980px]">
        {/* 인터넷 */}
        <div className="mb-1 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-sky-200 bg-sky-50 px-7 py-2.5">
            <span className="text-2xl">{"\uD83C\uDF10"}</span>
            <span className="text-[13px] font-bold text-sky-700">
              인터넷 / 클라이언트
            </span>
          </div>
        </div>
        <FlowArrow label="HTTPS / TLS 1.2+" />

        {/* 엣지 */}
        {z.edge.length > 0 && (
          <>
            <ZBand
              label={"\uD83D\uDE80 \uC5E3\uC9C0 / CDN \u00B7 \uC0AC\uC6A9\uC790 \uC804\uB2EC \uACC4\uCE35"}
              color="#0891B2"
              bg="#ECFEFF"
            >
              <SRow svcs={z.edge} />
            </ZBand>
            <FlowArrow />
          </>
        )}

        {/* AWS 리전 */}
        <div className="mb-1.5 rounded-[14px] border-[1.5px] border-gray-200 bg-[#FAFAFA] p-2 pb-2.5">
          <div className="px-1.5 pb-1.5 text-[10px] font-bold tracking-[1.2px] text-gray-400">
            {"\u2601\uFE0F"} AWS REGION {"\u00B7"} ap-northeast-2 (서울)
          </div>

          {z.account.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-100 px-2.5 py-1.5">
              <span className="mr-1 text-[10px] font-bold text-gray-700">
                {"\uD83C\uDFE2"} 계정 / 조직 구조
              </span>
              {z.account.map((s, i) => (
                <SCard key={i} svc={s} />
              ))}
            </div>
          )}

          {hasVpc && (
            <div className="mb-1.5 rounded-xl border-[1.5px] border-dashed border-gray-400 bg-white p-1.5 pb-2">
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wide text-gray-500">
                {"\uD83C\uDF10"} VPC {"\u00B7"} /16 CIDR {"\u00B7"} {az}
              </div>
              {z.networkExtras.length > 0 && (
                <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-dashed border-gray-200 px-2.5 pb-2 pt-1">
                  <span className="mr-1 self-center text-[9px] font-bold text-gray-400">
                    네트워크 기반 (NAT / VPN / DX / VPC Endpoint)
                  </span>
                  {z.networkExtras.map((s, i) => (
                    <SCard key={i} svc={s} />
                  ))}
                </div>
              )}
              <SubnetBand
                label={`퍼블릭 서브넷 (Public Subnet) \u00B7 ${az} \u2014 로드밸런서 \u00B7 API 게이트웨이`}
                color="#3B82F6"
                svcs={z.lb}
              />
              {z.app.length > 0 && (
                <SubnetBand
                  label={`프라이빗 서브넷 (Private Subnet) \u00B7 ${az} \u2014 애플리케이션 \u00B7 인증`}
                  color="#10B981"
                  svcs={z.app}
                />
              )}
              {z.cache.length > 0 && (
                <SubnetBand
                  label={`프라이빗 서브넷 (Cache Zone) \u00B7 ${az} \u2014 캐시 계층`}
                  color="#EF4444"
                  svcs={z.cache}
                />
              )}
              {(z.db.length + z.backup.length) > 0 && (
                <SubnetBand
                  label={`${subnetTier === "3tier" ? "격리 서브넷 (Isolated Subnet)" : "프라이빗 서브넷 (DB Zone)"} \u00B7 ${az} \u2014 데이터베이스 \u00B7 백업`}
                  color="#7C3AED"
                  svcs={[...z.db, ...z.backup]}
                />
              )}
            </div>
          )}

          {z.storage.length > 0 && (
            <ZBand
              label={"\uD83D\uDCE6 \uC2A4\uD1A0\uB9AC\uC9C0 (\uAD00\uB9AC\uD615 \uC11C\uBE44\uC2A4 \u00B7 VPC \uC678\uBD80 \u00B7 S3 / EFS / EBS)"}
              color="#16A34A"
              bg="#F0FDF4"
            >
              <SRow svcs={z.storage} />
            </ZBand>
          )}
        </div>

        {z.messaging.length > 0 && (
          <>
            <FlowArrow label="비동기 이벤트 / 메시지" />
            <ZBand
              label={"\uD83D\uDCE8 \uBA54\uC2DC\uC9D5 / \uC774\uBCA4\uD2B8 \uC2A4\uD2B8\uB9AC\uBC0D \u00B7 \uBE44\uB3D9\uAE30 \uD1B5\uD569"}
              color="#D97706"
              bg="#FFFBEB"
            >
              <SRow svcs={z.messaging} />
            </ZBand>
          </>
        )}

        {z.batch.length > 0 && (
          <>
            <FlowArrow label="스케줄 / 트리거" />
            <ZBand
              label={"\u2699\uFE0F \uBC30\uCE58 \uCC98\uB9AC / \uC6CC\uD06C\uD50C\uB85C \uC624\uCF00\uC2A4\uD2B8\uB808\uC774\uC158"}
              color="#7C3AED"
              bg="#F5F3FF"
            >
              <SRow svcs={z.batch} />
            </ZBand>
          </>
        )}

        {hasDat && (
          <>
            <FlowArrow />
            <ZBand
              label={"\uD83D\uDCCA \uB370\uC774\uD130 \uD30C\uC774\uD504\uB77C\uC778 / IoT / SaaS \uBD84\uC11D \uACC4\uCE35"}
              color="#D97706"
              bg="#FFFBEB"
            >
              <SRow svcs={[...z.iot, ...z.datapipe, ...z.saas]} />
            </ZBand>
          </>
        )}

        {z.dr.length > 0 && (
          <>
            <FlowArrow label="리전 간 복제 / 페일오버" />
            <ZBand
              label={"\uD83C\uDF0D DR / \uBA40\uD2F0\uB9AC\uC804 \uC804\uB7B5"}
              color="#7C3AED"
              bg="#F5F3FF"
            >
              <SRow svcs={z.dr} />
            </ZBand>
          </>
        )}

        {z.platform.length > 0 && (
          <>
            <FlowArrow />
            <ZBand
              label={"\u2699\uFE0F K8s \uC0DD\uD0DC\uACC4 \uD50C\uB7AB\uD3FC (Karpenter \u00B7 Ingress \u00B7 Istio \u00B7 ArgoCD \u00B7 Prometheus)"}
              color="#6366f1"
              bg="#eef2ff"
            >
              <SRow svcs={z.platform} />
            </ZBand>
          </>
        )}

        {z.appstack.length > 0 && (
          <>
            <FlowArrow />
            <ZBand
              label={"\uD83D\uDDA5\uFE0F \uC560\uD50C\uB9AC\uCF00\uC774\uC158 \uC2A4\uD0DD (\uC5B8\uC5B4 \u00B7 API Gateway \uAD6C\uD604 \u00B7 \uD504\uB85C\uD1A0\uCF5C \u00B7 \uC11C\uBE44\uC2A4 \uB514\uC2A4\uCEE4\uBC84\uB9AC)"}
              color="#0891b2"
              bg="#ecfeff"
            >
              <SRow svcs={z.appstack} />
            </ZBand>
          </>
        )}

        {/* 보안 + 모니터링 2열 */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {z.security.length > 0 && (
            <ZBand
              label={"\uD83D\uDD10 \uBCF4\uC548 \u00B7 \uCEF4\uD50C\uB77C\uC774\uC5B8\uC2A4"}
              color="#DC2626"
              bg="#FFF5F5"
            >
              <SRow svcs={z.security} />
            </ZBand>
          )}
          {z.observability.length > 0 && (
            <ZBand
              label={"\uD83D\uDCCA \uBAA8\uB2C8\uD130\uB9C1 \u00B7 \uAD00\uCE21\uC131 \u00B7 \uB85C\uAE45"}
              color="#374151"
              bg="#F9FAFB"
            >
              <SRow svcs={z.observability} />
            </ZBand>
          )}
        </div>

        {/* CI/CD + 비용 2열 */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {z.cicd.length > 0 && (
            <ZBand
              label={"\uD83D\uDD04 CI/CD \u00B7 \uBC30\uD3EC \uD30C\uC774\uD504\uB77C\uC778 \u00B7 IaC"}
              color="#0891B2"
              bg="#ECFEFF"
            >
              <SRow svcs={z.cicd} />
            </ZBand>
          )}
          {z.cost.length > 0 && (
            <ZBand
              label={"\uD83D\uDCB0 \uBE44\uC6A9 \uCD5C\uC801\uD654 \uC804\uB7B5"}
              color="#059669"
              bg="#ECFDF5"
            >
              <SRow svcs={z.cost} />
            </ZBand>
          )}
        </div>

        <div className="mt-3.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[10px] leading-[1.8] text-gray-400">
          {"\u24D8"} 12개 단계에서 선택하신{" "}
          <strong className="text-gray-700">{total}개 서비스 전부</strong>가
          AWS 네트워크 영역별로 배치되어 있습니다. 화살표({"\u2193"})는 주 요청
          흐름(사용자{"\u2192"}엣지{"\u2192"}앱{"\u2192"}DB)을 나타냅니다.
          서비스 카드의 색상 상단 테두리는 AWS 서비스 카테고리를 구분하며, 카드
          위에 마우스를 올리면 상세 설명{"\u00B7"}권고사항{"\u00B7"}비용이
          표시됩니다.
        </div>
      </div>
      )}
    </div>
  );
}
