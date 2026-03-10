import type { WizardState } from "@/lib/types";

export type BudgetPriority = "cost_first" | "balanced" | "perf_first";

export interface QuickTemplate {
  id: string;
  label: string;
  icon: string;
  desc: string;
  state: WizardState;
}

export interface BudgetAdjustResult {
  state: WizardState;
  changes: string[];
}

export const TEMPLATES: QuickTemplate[] = [
  {
    id: "ecommerce_mvp",
    label: "\uC774\uCEE4\uBA38\uC2A4 MVP",
    icon: "\uD83D\uDED2",
    desc: "온라인 쇼핑몰을 빠르게 시작. 결제·장바구니 안정적 처리, Blue/Green 배포 + Bot 방어",
    state: {
      workload: {
        type: ["ecommerce"],
        ecommerce_detail: "general_shop",
        growth_stage: "mvp",
        business_model: "transaction",
        data_sensitivity: "critical",
        user_type: ["b2c"],
      },
      scale: {
        dau: "small",
        peak_rps: "mid",
        traffic_pattern: ["spike"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "strict",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "node_express",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      data: {
        primary_db: ["aurora_pg"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns"],
        api_type: "alb",
        batch_workflow: ["eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "bot",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
        monitoring: ["cloudwatch", "xray"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "b2b_saas",
    label: "B2B SaaS",
    icon: "\uD83D\uDCBC",
    desc: "\uAE30\uC5C5 \uACE0\uAC1D\uC6A9 \uD50C\uB7AB\uD3FC. \uACE0\uAC1D\uC0AC\uBCC4 \uB370\uC774\uD130 \uACA9\uB9AC\u00B7SSO \uB85C\uADF8\uC778 \uD3EC\uD568. \uC911\uAE09+ \uD300 \uAD8C\uC7A5",
    state: {
      workload: {
        type: ["saas", "web_api"],
        saas_detail: "multi_shared",
        growth_stage: "growth",
        business_model: "saas_license",
        data_sensitivity: "sensitive",
        user_type: ["b2b"],
      },
      scale: {
        dau: "medium",
        peak_rps: "mid",
        traffic_pattern: ["steady"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["isms"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.95",
        rto: "lt10min",
        rpo: "15min",
        region: "single",
      },
      team: {
        team_size: "medium",
        cloud_exp: "senior",
        ops_model: "devops",
        language: "spring_boot",
      },
      network: {
        account_structure: "envs",
        az_count: "3az",
        subnet_tier: "3tier",
        nat_strategy: "per_az",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "eks",
        compute_node: "mixed",
        scaling: ["ecs_asg", "keda"],
      },
      platform: {
        node_provisioner: "karpenter",
        ingress: "alb_controller",
        service_mesh: "none",
        gitops: "argocd",
        k8s_monitoring: "prometheus_grafana",
        k8s_secrets: "external_secrets",
        pod_security: "kyverno",
        network_policy: "vpc_cni",
        k8s_backup: "velero",
        autoscaling_strategy: "hpa_keda",
        cluster_strategy: "multi_cluster",
      },
      data: {
        primary_db: ["aurora_pg"],
        db_ha: "multi_az_read",
        cache: "redis",
        storage: ["s3"],
        search: "opensearch",
      },
      integration: {
        auth: ["sso"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns", "eventbridge"],
        api_type: "alb",
        batch_workflow: ["step_functions", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "spring_gateway",
        protocol: "rest",
        service_discovery: "k8s_dns",
        api_versioning: "url_path",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
      },
      cost: {
        priority: "balanced",
        commitment: "1yr",
        spot_usage: "partial",
      },
    },
  },
  {
    id: "internal_tool",
    label: "\uC0AC\uB0B4 \uAD00\uB9AC \uB3C4\uAD6C",
    icon: "\uD83C\uDFE2",
    desc: "\uC9C1\uC6D0\uC6A9 \uAD00\uB9AC \uB3C4\uAD6C. \uC11C\uBC84 \uAD00\uB9AC \uC5C6\uC774 \uCD5C\uC18C \uBE44\uC6A9\uC73C\uB85C \uC6B4\uC601. \uCD08\uBCF4\uC790 \uCD5C\uC801",
    state: {
      workload: {
        type: ["internal"],
        growth_stage: "mvp",
        business_model: "internal_tool",
        data_sensitivity: "internal",
        user_type: ["internal"],
      },
      scale: {
        dau: "tiny",
        peak_rps: "low",
        traffic_pattern: ["business"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "basic",
        network_iso: "basic",
      },
      slo: {
        availability: "99",
        rto: "hours",
        rpo: "24h",
        region: "single",
      },
      team: {
        team_size: "solo",
        cloud_exp: "beginner",
        ops_model: "managed",
        language: "python_fastapi",
      },
      network: {
        account_structure: "single",
        az_count: "1az",
        subnet_tier: "2tier",
        nat_strategy: "endpoint",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "serverless",
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "single_az",
        cache: "no",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "sync_only",
        api_type: "api_gateway",
        batch_workflow: ["none"],
      },
      appstack: {
        api_gateway_impl: "aws_apigw",
        protocol: "rest",
      },
      edge: {
        cdn: "no",
        dns: "basic",
        waf: "no",
      },
      cicd: {
        iac: "none",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "dev_prod",
        monitoring: ["cloudwatch"],
      },
      cost: {
        priority: "cost_first",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "realtime_chat",
    label: "\uC2E4\uC2DC\uAC04 \uCC44\uD305/\uC54C\uB9BC",
    icon: "\uD83D\uDCAC",
    desc: "\uCC44\uD305\u00B7\uC54C\uB9BC \uC11C\uBE44\uC2A4. \uC2E4\uC2DC\uAC04 \uBA54\uC2DC\uC9C0 \uC804\uC1A1\uACFC \uB300\uB7C9 \uC811\uC18D \uCC98\uB9AC \uB300\uBE44",
    state: {
      workload: {
        type: ["realtime", "web_api"],
        realtime_detail: "chat",
        growth_stage: "growth",
        business_model: "freemium",
        data_sensitivity: "sensitive",
        user_type: ["b2c"],
      },
      scale: {
        dau: "medium",
        peak_rps: "high",
        traffic_pattern: ["burst"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "node_express",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "per_az",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      data: {
        primary_db: ["aurora_pg", "dynamodb"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "opensearch",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns", "kinesis"],
        api_type: "alb",
        batch_workflow: ["eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
        monitoring: ["cloudwatch", "xray"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "data_pipeline",
    label: "\uB370\uC774\uD130 \uD30C\uC774\uD504\uB77C\uC778",
    icon: "\uD83D\uDCCA",
    desc: "\uB85C\uADF8\u00B7\uC774\uBCA4\uD2B8 \uC218\uC9D1\u00B7\uBD84\uC11D. \uC11C\uBC84 \uC5C6\uC774 \uB300\uC6A9\uB7C9 \uB370\uC774\uD130 \uCC98\uB9AC. \uBE44\uC6A9 \uCD5C\uC18C\uD654",
    state: {
      workload: {
        type: ["data"],
        data_detail: "log_analytics",
        growth_stage: "growth",
        business_model: "internal_tool",
        data_sensitivity: "internal",
        user_type: ["internal"],
      },
      scale: {
        dau: "small",
        peak_rps: "mid",
        traffic_pattern: ["steady"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "managed",
        language: "python_fastapi",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "endpoint",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "serverless",
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "multi_az",
        cache: "no",
        storage: ["s3"],
        search: "opensearch",
      },
      integration: {
        auth: ["none"],
        sync_async: "async",
        queue_type: ["kinesis", "eventbridge"],
        api_type: "api_gateway",
        batch_workflow: ["step_functions", "glue", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "aws_apigw",
        protocol: "rest",
      },
      edge: {
        cdn: "no",
        dns: "basic",
        waf: "no",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "dev_prod",
        monitoring: ["cloudwatch", "grafana"],
      },
      cost: {
        priority: "cost_first",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "generic_web_api",
    label: "\uBC94\uC6A9 \uC6F9 API",
    icon: "\uD83C\uDF10",
    desc: "\uC77C\uBC18 \uC6F9/\uC571 API \uC11C\uBC84. \uAC00\uC7A5 \uBCF4\uD3B8\uC801\uC778 \uAD6C\uC131\uC73C\uB85C \uBE60\uB974\uAC8C \uC2DC\uC791",
    state: {
      workload: {
        type: ["web_api"],
        growth_stage: "mvp",
        business_model: "freemium",
        data_sensitivity: "sensitive",
        user_type: ["b2c"],
      },
      scale: {
        dau: "small",
        peak_rps: "mid",
        traffic_pattern: ["business"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "node_express",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      data: {
        primary_db: ["rds_pg"],
        db_ha: "multi_az",
        cache: "no",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "sync_only",
        api_type: "alb",
        batch_workflow: ["none"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "dev_prod",
        monitoring: ["cloudwatch"],
      },
      cost: {
        priority: "cost_first",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "ticketing",
    label: "티켓팅/예약",
    icon: "🎫",
    desc: "콘서트·공연 예매, 선착순 이벤트. Redis+DynamoDB 동시성 제어, 순간 폭증 트래픽 대비",
    state: {
      workload: {
        type: ["ticketing"],
        ticketing_detail: "concert",
        growth_stage: "growth",
        business_model: "transaction",
        data_sensitivity: "critical",
        user_type: ["b2c"],
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "node_express",
      },
      scale: {
        dau: "medium",
        peak_rps: "high",
        traffic_pattern: ["burst", "spike"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "strict",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      data: {
        primary_db: ["aurora_pg", "dynamodb"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "no",
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "mixed",
        scaling: ["ecs_asg", "scheduled"],
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns"],
        api_type: "alb",
        batch_workflow: ["eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "bot",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
        monitoring: ["cloudwatch", "xray"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "iot_platform",
    label: "IoT 플랫폼",
    icon: "📡",
    desc: "산업 센서·디바이스 데이터 수집·분석. Kinesis 스트리밍 + DynamoDB 시계열 저장",
    state: {
      workload: {
        type: ["iot"],
        iot_detail: "industrial",
        growth_stage: "growth",
        business_model: "subscription",
        data_sensitivity: "sensitive",
        user_type: ["b2b"],
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "python_fastapi",
      },
      scale: {
        dau: "medium",
        peak_rps: "high",
        traffic_pattern: ["steady"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "opensearch",
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      integration: {
        auth: ["cognito"],
        sync_async: "async",
        queue_type: ["kinesis", "sqs", "eventbridge"],
        api_type: "alb",
        batch_workflow: ["step_functions", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "no",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "three",
        monitoring: ["cloudwatch", "grafana"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "partial",
      },
    },
  },
  {
    id: "ai_ml_serving",
    label: "AI/ML 서빙",
    icon: "🤖",
    desc: "모델 추론 API 서빙. SageMaker 비동기 추론 + DynamoDB 메타데이터 + S3 모델 저장소",
    state: {
      workload: {
        type: ["data", "web_api"],
        data_detail: "ml_pipeline",
        growth_stage: "growth",
        business_model: "subscription",
        data_sensitivity: "sensitive",
        user_type: ["b2b", "b2c"],
      },
      scale: {
        dau: "medium",
        peak_rps: "mid",
        traffic_pattern: ["burst"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "python_fastapi",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns"],
        api_type: "api_gateway",
        batch_workflow: ["step_functions", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "aws_apigw",
        protocol: "rest",
      },
      edge: {
        cdn: "no",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
        monitoring: ["cloudwatch", "xray"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "partial",
      },
    },
  },
  {
    id: "mobile_backend",
    label: "모바일 백엔드",
    icon: "📱",
    desc: "모바일 앱 BaaS. Cognito 인증 + DynamoDB + S3 미디어 업로드 + 푸시 알림",
    state: {
      workload: {
        type: ["web_api"],
        growth_stage: "mvp",
        business_model: "freemium",
        data_sensitivity: "sensitive",
        user_type: ["b2c"],
      },
      scale: {
        dau: "medium",
        peak_rps: "mid",
        traffic_pattern: ["spike"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "managed",
        language: "node_express",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "2tier",
        nat_strategy: "endpoint",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "serverless",
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "multi_az",
        cache: "no",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns"],
        api_type: "api_gateway",
        batch_workflow: ["eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "aws_apigw",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "basic",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "three",
        monitoring: ["cloudwatch"],
      },
      cost: {
        priority: "cost_first",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "media_streaming",
    label: "미디어/스트리밍",
    icon: "🎬",
    desc: "영상 업로드·트랜스코딩·HLS 스트리밍. MediaConvert + S3 + CloudFront 구성",
    state: {
      workload: {
        type: ["web_api", "data"],
        data_detail: "stream_analytics",
        growth_stage: "growth",
        business_model: "subscription",
        data_sensitivity: "sensitive",
        user_type: ["b2c"],
      },
      scale: {
        dau: "medium",
        peak_rps: "mid",
        traffic_pattern: ["spike"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["none"],
        encryption: "standard",
        network_iso: "strict",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "1h",
        region: "single",
      },
      team: {
        team_size: "small",
        cloud_exp: "mid",
        ops_model: "devops",
        language: "node_express",
      },
      network: {
        account_structure: "envs",
        az_count: "2az",
        subnet_tier: "3tier",
        nat_strategy: "shared",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "ecs",
        compute_node: "fargate",
        scaling: ["ecs_asg"],
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "multi_az",
        cache: "redis",
        storage: ["s3"],
        search: "opensearch",
      },
      integration: {
        auth: ["cognito"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns", "eventbridge"],
        api_type: "alb",
        batch_workflow: ["step_functions", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "alb_only",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "bot",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
        monitoring: ["cloudwatch", "xray"],
      },
      cost: {
        priority: "balanced",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
  {
    id: "multitenant_microservices",
    label: "멀티테넌트 마이크로서비스",
    icon: "🏢",
    desc: "대규모 EKS 마이크로서비스. Istio 서비스 메시 + 테넌트 격리 + ArgoCD GitOps",
    state: {
      workload: {
        type: ["saas", "web_api"],
        saas_detail: "multi_shared",
        growth_stage: "scale",
        business_model: "saas_license",
        data_sensitivity: "critical",
        user_type: ["b2b"],
      },
      scale: {
        dau: "large",
        peak_rps: "high",
        traffic_pattern: ["steady"],
        data_volume: "tb",
      },
      compliance: {
        cert: ["isms"],
        encryption: "strict",
        network_iso: "strict",
      },
      slo: {
        availability: "99.99",
        rto: "lt10min",
        rpo: "15min",
        region: "single",
      },
      team: {
        team_size: "large",
        cloud_exp: "senior",
        ops_model: "platform",
        language: "spring_boot",
      },
      network: {
        account_structure: "envs",
        az_count: "3az",
        subnet_tier: "3tier",
        nat_strategy: "per_az",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "container",
        orchestration: "eks",
        compute_node: "mixed",
        scaling: ["ecs_asg", "keda"],
      },
      platform: {
        node_provisioner: "karpenter",
        ingress: "alb_controller",
        service_mesh: "istio",
        gitops: "argocd",
        k8s_monitoring: "prometheus_grafana",
        k8s_secrets: "external_secrets",
        pod_security: "kyverno",
        network_policy: "cilium",
        k8s_backup: "velero",
        autoscaling_strategy: "hpa_keda",
        cluster_strategy: "multi_cluster",
      },
      data: {
        primary_db: ["aurora_pg", "dynamodb"],
        db_ha: "multi_az_read",
        cache: "redis",
        storage: ["s3"],
        search: "opensearch",
      },
      integration: {
        auth: ["sso"],
        sync_async: "mixed",
        queue_type: ["sqs", "sns", "eventbridge"],
        api_type: "alb",
        batch_workflow: ["step_functions", "eventbridge_sch"],
      },
      appstack: {
        api_gateway_impl: "spring_gateway",
        protocol: "grpc",
        service_discovery: "k8s_dns",
        api_versioning: "url_path",
      },
      edge: {
        cdn: "yes",
        dns: "health",
        waf: "bot",
      },
      cicd: {
        iac: "terraform",
        pipeline: "github",
        deploy_strategy: "bluegreen",
        env_count: "three",
      },
      cost: {
        priority: "balanced",
        commitment: "1yr",
        spot_usage: "partial",
      },
    },
  },
  {
    id: "static_jamstack",
    label: "정적 웹사이트 / JAMstack",
    icon: "⚡",
    desc: "S3 + CloudFront 정적 호스팅. Lambda 서버리스 API + DynamoDB. 최저 비용",
    state: {
      workload: {
        type: ["web_api"],
        growth_stage: "mvp",
        business_model: "freemium",
        data_sensitivity: "internal",
        user_type: ["b2c"],
      },
      scale: {
        dau: "small",
        peak_rps: "low",
        traffic_pattern: ["business"],
        data_volume: "gb",
      },
      compliance: {
        cert: ["none"],
        encryption: "basic",
        network_iso: "basic",
      },
      slo: {
        availability: "99.9",
        rto: "minutes",
        rpo: "24h",
        region: "single",
      },
      team: {
        team_size: "solo",
        cloud_exp: "beginner",
        ops_model: "managed",
        language: "node_express",
      },
      network: {
        account_structure: "single",
        az_count: "1az",
        subnet_tier: "2tier",
        nat_strategy: "endpoint",
        hybrid: ["no"],
      },
      compute: {
        arch_pattern: "serverless",
      },
      data: {
        primary_db: ["dynamodb"],
        db_ha: "single_az",
        cache: "no",
        storage: ["s3"],
        search: "no",
      },
      integration: {
        auth: ["none"],
        sync_async: "sync_only",
        api_type: "api_gateway",
        batch_workflow: ["none"],
      },
      appstack: {
        api_gateway_impl: "aws_apigw",
        protocol: "rest",
      },
      edge: {
        cdn: "yes",
        dns: "basic",
        waf: "no",
      },
      cicd: {
        iac: "none",
        pipeline: "github",
        deploy_strategy: "rolling",
        env_count: "dev_prod",
        monitoring: ["cloudwatch"],
      },
      cost: {
        priority: "cost_first",
        commitment: "none",
        spot_usage: "no",
      },
    },
  },
];

/* ── deep clone helper ── */
function cloneState(s: WizardState): WizardState {
  return JSON.parse(JSON.stringify(s));
}

/* ── helpers to read / write nested state safely ── */
function getArr(s: WizardState, phase: string, key: string): string[] {
  const v = s[phase]?.[key];
  return Array.isArray(v) ? v : [];
}

function has(s: WizardState, phase: string, key: string, val: string): boolean {
  const v = s[phase]?.[key];
  return Array.isArray(v) ? v.includes(val) : v === val;
}

function set(s: WizardState, phase: string, key: string, val: unknown) {
  if (!s[phase]) s[phase] = {};
  s[phase][key] = val;
}

function get(s: WizardState, phase: string, key: string): unknown {
  return s[phase]?.[key];
}

/* ── workload type helpers ── */
function isWorkload(s: WizardState, ...types: string[]) {
  return types.some((t) => has(s, "workload", "type", t));
}

function isTx(s: WizardState) {
  return isWorkload(s, "ticketing", "ecommerce") || has(s, "workload", "business_model", "transaction");
}

function isRealtime(s: WizardState) {
  return isWorkload(s, "realtime", "ticketing");
}

/* ── cost_first adjustments ── */
function applyCostFirst(s: WizardState): string[] {
  const changes: string[] = [];

  // cost priority (commitment preserved — 1yr RI saves 35%)
  set(s, "cost", "priority", "cost_first");

  // spot for data/iot
  if (isWorkload(s, "data", "iot")) {
    set(s, "cost", "spot_usage", "partial");
    changes.push("Spot Instances partial");
  }

  // primary_db: aurora → rds (skip SaaS, ticketing, serverless — Aurora Serverless v2 cheaper at low scale)
  if (!isWorkload(s, "saas", "ticketing") && get(s, "compute", "arch_pattern") !== "serverless") {
    const dbs = getArr(s, "data", "primary_db");
    const mapped = dbs.map((db) => {
      if (db === "aurora_pg") return "rds_pg";
      if (db === "aurora_mysql") return "rds_mysql";
      return db;
    });
    if (mapped.join() !== dbs.join()) {
      set(s, "data", "primary_db", mapped);
      changes.push("Aurora → RDS (20-28% savings)");
    }
  }

  // db_ha downgrade
  const dbHa = get(s, "data", "db_ha") as string;
  if (dbHa === "multi_az_read" || dbHa === "global") {
    set(s, "data", "db_ha", "multi_az");
    changes.push("DB HA → Multi-AZ (no read replica)");
  }

  // az_count → 2az
  if (get(s, "network", "az_count") === "3az") {
    set(s, "network", "az_count", "2az");
    changes.push("3AZ → 2AZ");
  }

  // nat_strategy downgrade
  const nat = get(s, "network", "nat_strategy") as string;
  if (nat === "per_az") {
    set(s, "network", "nat_strategy", "shared");
    changes.push("NAT per-AZ → shared ($43/mo savings per GW)");
  } else if (nat === "shared") {
    set(s, "network", "nat_strategy", "endpoint");
    changes.push("NAT GW → VPC Endpoint (free for S3/DDB)");
  }

  // cache: remove redis if not tx/realtime/iot (IoT needs Redis as ingestion buffer)
  if (!isTx(s) && !isRealtime(s) && !isWorkload(s, "iot") && get(s, "data", "cache") === "redis") {
    set(s, "data", "cache", "no");
    changes.push("Redis removed");
  }

  // search: remove opensearch if not data/iot workload (IoT needs analytics)
  if (!isWorkload(s, "data", "iot") && get(s, "data", "search") === "opensearch") {
    set(s, "data", "search", "no");
    changes.push("OpenSearch removed");
  }

  // deploy: bluegreen → rolling (skip tx/realtime — persistent connections need zero-downtime deploy)
  if (!isTx(s) && !isRealtime(s) && get(s, "cicd", "deploy_strategy") === "bluegreen") {
    set(s, "cicd", "deploy_strategy", "rolling");
    changes.push("Blue/Green → Rolling deploy");
  }

  // waf: shield → basic
  const waf = get(s, "edge", "waf") as string;
  if (waf === "shield") {
    set(s, "edge", "waf", "basic");
    changes.push("Shield ($3,000/mo) → WAF Basic");
  }

  // env_count → dev_prod (skip SaaS — needs staging for tenant impact testing)
  if (get(s, "cicd", "env_count") === "three" && !isWorkload(s, "saas")) {
    set(s, "cicd", "env_count", "dev_prod");
    changes.push("3 envs → dev/prod only");
  }

  // B2B SaaS special: EKS → ECS (skip scale+large — platform layer too critical)
  if (isWorkload(s, "saas") && get(s, "compute", "orchestration") === "eks"
      && get(s, "workload", "growth_stage") !== "scale"
      && !["large", "xlarge"].includes(get(s, "scale", "dau") as string)) {
    set(s, "compute", "orchestration", "ecs");
    set(s, "compute", "compute_node", "fargate");
    const scaling = getArr(s, "compute", "scaling").filter((v) => v !== "keda");
    set(s, "compute", "scaling", scaling.length ? scaling : ["ecs_asg"]);
    delete s.platform;
    // fix appstack that depends on k8s
    if (get(s, "appstack", "service_discovery") === "k8s_dns") {
      delete s.appstack!.service_discovery;
    }
    if (get(s, "appstack", "api_gateway_impl") === "spring_gateway") {
      set(s, "appstack", "api_gateway_impl", "alb_only");
    }
    changes.push("EKS → ECS Fargate (lower ops cost)");
  }

  return changes;
}

/* ── perf_first adjustments ── */
function applyPerfFirst(s: WizardState): string[] {
  const changes: string[] = [];

  // cost priority & commitment
  set(s, "cost", "priority", "perf_first");
  set(s, "cost", "commitment", "1yr");
  changes.push("1-year Reserved (30-40% savings)");

  // spot: disable for tx/realtime
  if (isTx(s) || isRealtime(s)) {
    set(s, "cost", "spot_usage", "no");
  }

  // primary_db: rds → aurora
  const dbs = getArr(s, "data", "primary_db");
  const mapped = dbs.map((db) => {
    if (db === "rds_pg") return "aurora_pg";
    if (db === "rds_mysql") return "aurora_mysql";
    return db;
  });
  if (mapped.join() !== dbs.join()) {
    set(s, "data", "primary_db", mapped);
    changes.push("RDS → Aurora (5x performance)");
  }

  // db_ha upgrade
  const dbHa = get(s, "data", "db_ha") as string;
  if (dbHa === "multi_az" || dbHa === "single_az") {
    set(s, "data", "db_ha", "multi_az_read");
    changes.push("DB + read replica");
  }

  // az_count → 3az
  if (get(s, "network", "az_count") !== "3az") {
    set(s, "network", "az_count", "3az");
    changes.push("→ 3AZ (fault tolerance)");
  }

  // nat → per_az
  if (get(s, "network", "nat_strategy") !== "per_az") {
    set(s, "network", "nat_strategy", "per_az");
    changes.push("NAT per-AZ (AZ isolation)");
  }

  // cache: add redis if not internal
  if (!isWorkload(s, "internal") && get(s, "data", "cache") !== "redis") {
    set(s, "data", "cache", "redis");
    changes.push("+ Redis cache");
  }

  // deploy: rolling → bluegreen
  if (get(s, "cicd", "deploy_strategy") === "rolling") {
    set(s, "cicd", "deploy_strategy", "bluegreen");
    changes.push("Rolling → Blue/Green (instant rollback)");
  }

  // waf upgrade for external services
  if (!isWorkload(s, "internal")) {
    const waf = get(s, "edge", "waf") as string;
    if (waf === "no") {
      set(s, "edge", "waf", "basic");
      changes.push("+ WAF Basic");
    } else if (waf === "basic") {
      set(s, "edge", "waf", "bot");
      changes.push("WAF → Bot Control");
    }
  }

  // env_count → three
  if (get(s, "cicd", "env_count") !== "three") {
    set(s, "cicd", "env_count", "three");
    changes.push("+ Staging environment");
  }

  return changes;
}

/**
 * Adjust a template's WizardState for a given budget priority.
 * Returns the adjusted state and a list of human-readable changes.
 */
export function adjustTemplateForBudget(
  original: WizardState,
  priority: BudgetPriority,
): BudgetAdjustResult {
  if (priority === "balanced") {
    return { state: cloneState(original), changes: [] };
  }
  const s = cloneState(original);
  const changes = priority === "cost_first" ? applyCostFirst(s) : applyPerfFirst(s);
  return { state: s, changes };
}
