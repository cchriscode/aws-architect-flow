/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";
import { toArray, toArrayFiltered, azToNum } from "@/lib/shared";

import { t, type Lang } from "./checklist-dict";

export function generateChecklist(state: WizardState, lang: Lang = "ko") {
  const types    = toArray(state.workload?.type);
  const dau      = state.scale?.dau;
  const azNum    = azToNum(state.network?.az_count);
  const orchest  = state.compute?.orchestration;
  const archP    = state.compute?.arch_pattern;
  const nodeType = state.compute?.compute_node;
  const dbArr    = toArrayFiltered(state.data?.primary_db);
  const dbHa     = state.data?.db_ha;
  const cache    = state.data?.cache;
  const search   = state.data?.search;
  const storArr  = toArray(state.data?.storage);
  const cert     = toArray(state.compliance?.cert);
  const encr     = state.compliance?.encryption;
  const netIso   = state.compliance?.network_iso;
  const subnet   = state.network?.subnet_tier;
  const natStrat = state.network?.nat_strategy;
  const account  = state.network?.account_structure;
  const hybrid   = state.network?.hybrid;
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const dns      = state.edge?.dns;
  const iac      = state.cicd?.iac;
  const pipeline = state.cicd?.pipeline;
  const deploy   = state.cicd?.deploy_strategy;
  const envCnt   = state.cicd?.env_count;
  const avail    = state.slo?.availability;
  const region   = state.slo?.region;
  const authArr  = toArray(state.integration?.auth);
  const syncMode = state.integration?.sync_async;
  const queueArr = toArray(state.integration?.queue_type);
  const apiType  = state.integration?.api_type;
  const batchArr = toArrayFiltered(state.integration?.batch_workflow);
  const gitops   = state.platform?.gitops;
  const nodeP    = state.platform?.node_provisioner;
  const secrets  = state.platform?.k8s_secrets;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const stage    = state.workload?.growth_stage;
  const teamSize = state.team?.team_size;
  const exp      = state.team?.cloud_exp;

  const hasCritCert = cert.some((c) => ["pci", "hipaa", "sox"].includes(c));
  const hasPersonal = ["sensitive","critical"].includes(state.workload?.data_sensitivity);
  const isTx        = types.includes("ecommerce") || types.includes("ticketing") || state.workload?.business_model === "transaction";
  const isEks       = orchest === "eks";
  const isEcs       = orchest === "ecs" || (archP === "container" && !isEks);
  const isServerless= archP === "serverless";
  const isLarge     = dau === "large" || dau === "xlarge";
  const isGlobal    = toArray(state.workload?.user_type).includes("global");

  let id = 0;
  const item = (text: string, detail = "", critical = false, link = "") => ({
    id: ++id, text, detail, critical, link,
  });

  const phases: any[] = [];

  // ── PHASE 1: AWS Account & Organization Setup
  const p1: any = { phase: "Phase 1", label: t("p1_label", lang), icon: "\u{1F3E2}", items: [] };
  if (account === "org") {
    p1.items.push(item(t("p1_org_root", lang), t("p1_org_root_d", lang), true));
    p1.items.push(item(t("p1_control_tower", lang), t("p1_control_tower_d", lang), false, "https://docs.aws.amazon.com/controltower/latest/userguide/getting-started-with-control-tower.html"));
    p1.items.push(item(t("p1_scp", lang), t("p1_scp_d", lang)));
    p1.items.push(item(t("p1_member_accounts", lang), t("p1_member_accounts_d", lang)));
  } else if (account === "envs") {
    p1.items.push(item(t("p1_envs_prod", lang), t("p1_envs_prod_d", lang), true));
    p1.items.push(item(t("p1_envs_mfa", lang), t("p1_envs_mfa_d", lang)));
    p1.items.push(item(t("p1_envs_sso", lang), t("p1_envs_sso_d", lang)));
  } else {
    p1.items.push(item(t("p1_single_mfa", lang), t("p1_single_mfa_d", lang), true));
    p1.items.push(item(t("p1_single_billing", lang), t("p1_single_billing_d", lang)));
  }
  p1.items.push(item(t("p1_mfa_recovery", lang), t("p1_mfa_recovery_d", lang), true));
  p1.items.push(item(t("p1_s3_block", lang), t("p1_s3_block_d", lang), true));
  p1.items.push(item(t("p1_cloudtrail", lang), t("p1_cloudtrail_d", lang), hasCritCert));
  p1.items.push(item(t("p1_config", lang), t("p1_config_d", lang), hasCritCert));
  p1.items.push(item(t("p1_budget", lang), t("p1_budget_d", lang)));
  phases.push(p1);

  // ── PHASE 2: VPC & Network Configuration
  const p2: any = { phase: "Phase 2", label: t("p2_label", lang), icon: "\u{1F310}", items: [] };
  p2.items.push(item(t("p2_vpc", lang), t("p2_vpc_d", lang), true));
  p2.items.push(item(t("p2_pub_subnet", lang, azNum), t(azNum === 3 ? "p2_pub_subnet_d_3" : "p2_pub_subnet_d_other", lang), true));
  if (subnet !== "private") {
    p2.items.push(item(t("p2_priv_subnet", lang, azNum), t(azNum === 3 ? "p2_priv_subnet_d_3" : "p2_priv_subnet_d_other", lang), true));
  }
  if (subnet === "3tier" || hasCritCert) {
    p2.items.push(item(t("p2_iso_subnet", lang, azNum), t(azNum === 3 ? "p2_iso_subnet_d_3" : "p2_iso_subnet_d_other", lang), true));
  }
  p2.items.push(item(t("p2_igw", lang), t("p2_igw_d", lang)));
  if (natStrat === "per_az") {
    p2.items.push(item(t("p2_nat_per_az", lang, azNum), t("p2_nat_per_az_d", lang), true));
  } else if (natStrat === "shared" || natStrat === "endpoint") {
    p2.items.push(item(t("p2_nat_shared", lang), t("p2_nat_shared_d", lang)));
  }
  p2.items.push(item(t("p2_vpce_gw", lang), t("p2_vpce_gw_d", lang), false, ""));
  if (hasCritCert || encr === "strict") {
    p2.items.push(item(t("p2_vpce_if", lang), t("p2_vpce_if_d", lang), true));
  }
  const hybridArr = Array.isArray(hybrid) ? hybrid : (hybrid ? [hybrid] : []);
  if (hybridArr.includes("vpn")) {
    p2.items.push(item(t("p2_vpn", lang), t("p2_vpn_d", lang)));
  }
  if (hybridArr.includes("dx")) {
    p2.items.push(item(t("p2_dx", lang), t("p2_dx_d", lang), true));
  }
  p2.items.push(item(t("p2_flow_logs", lang), t("p2_flow_logs_d", lang), hasCritCert));
  phases.push(p2);

  // ── PHASE 3: Security & IAM
  const p3: any = { phase: "Phase 3", label: t("p3_label", lang), icon: "\u{1F512}", items: [] };
  p3.items.push(item(t("p3_kms", lang), encr === "strict" ? t("p3_kms_strict_d", lang) : t("p3_kms_default_d", lang), encr === "strict"));
  if (hasCritCert) {
    p3.items.push(item(t("p3_kms_policy", lang), t("p3_kms_policy_d", lang), true));
  }
  p3.items.push(item(t("p3_acm_apne2", lang), t("p3_acm_apne2_d", lang), true));
  if (cdn !== "no" || isGlobal) {
    p3.items.push(item(t("p3_acm_use1", lang), t("p3_acm_use1_d", lang), true));
  }
  p3.items.push(item(t("p3_secrets", lang), t("p3_secrets_d", lang), hasPersonal || hasCritCert));
  if (authArr.includes("cognito")) {
    p3.items.push(item(t("p3_cognito_pool", lang), t("p3_cognito_pool_d", lang)));
    p3.items.push(item(t("p3_cognito_client", lang), t("p3_cognito_client_d", lang)));
  }
  if (authArr.includes("sso")) {
    p3.items.push(item(t("p3_saml", lang), t("p3_saml_d", lang), true));
  }
  if (isEks) {
    p3.items.push(item(t("p3_eks_irsa", lang), t("p3_eks_irsa_d", lang)));
  }
  if (isEcs) {
    p3.items.push(item(t("p3_ecs_exec_role", lang), t("p3_ecs_exec_role_d", lang)));
    p3.items.push(item(t("p3_ecs_task_role", lang), t("p3_ecs_task_role_d", lang)));
  }
  if (archP === "app_runner") {
    p3.items.push(item(t("p3_apprunner_svc", lang), t("p3_apprunner_svc_d", lang), true));
    p3.items.push(item(t("p3_apprunner_domain", lang), t("p3_apprunner_domain_d", lang)));
  }
  if (pipeline === "github" || pipeline === "gitlab") {
    p3.items.push(item(t("p3_cicd_oidc", lang), t("p3_cicd_oidc_d", lang)));
  }
  p3.items.push(item(t("p3_guardduty", lang), t("p3_guardduty_d", lang), hasCritCert));
  if (hasCritCert) {
    p3.items.push(item(t("p3_securityhub", lang), t("p3_securityhub_d", lang), true));
    p3.items.push(item(t("p3_config_rules", lang), t("p3_config_rules_d", lang), true));
  }
  phases.push(p3);

  // ── PHASE 4: Data Layer
  const p4: any = { phase: "Phase 4", label: t("p4_label", lang), icon: "\u{1F5C4}\uFE0F", items: [] };
  if (dbArr.includes("aurora_mysql") || dbArr.includes("aurora_pg")) {
    const eng = dbArr.includes("aurora_pg") ? "PostgreSQL 16.x" : "MySQL 8.0";
    const maxAcu = dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4;
    p4.items.push(item(t("p4_aurora_subnet", lang, eng), t("p4_aurora_subnet_d", lang), true));
    p4.items.push(item(t("p4_aurora_param", lang, eng), t("p4_aurora_param_d", lang)));
    p4.items.push(item(t("p4_aurora_cluster", lang, eng), t("p4_aurora_cluster_d", lang, maxAcu), true));
    if (dbHa === "multi_az_read") {
      p4.items.push(item(t("p4_aurora_replica", lang), t("p4_aurora_replica_d", lang)));
    }
    p4.items.push(item(t("p4_aurora_backup", lang), t("p4_aurora_backup_d", lang)));
    p4.items.push(item(t("p4_aurora_del_prot", lang), t("p4_aurora_del_prot_d", lang), true));
    p4.items.push(item(t("p4_db_schema", lang), t("p4_db_schema_d", lang)));
    p4.items.push(item(t("p4_db_secrets", lang), t("p4_db_secrets_d", lang)));
  }
  if (dbArr.includes("rds_mysql") || dbArr.includes("rds_pg")) {
    p4.items.push(item(t("p4_rds_param", lang), t("p4_rds_param_d", lang)));
    p4.items.push(item(t("p4_rds_instance", lang), t("p4_rds_instance_d", lang, dbHa === "multi_az"), true));
    p4.items.push(item(t("p4_rds_snapshot", lang), t("p4_rds_snapshot_d", lang)));
  }
  if (dbArr.includes("dynamodb")) {
    p4.items.push(item(t("p4_ddb_table", lang), t("p4_ddb_table_d", lang), true));
    p4.items.push(item(t("p4_ddb_pitr", lang), t("p4_ddb_pitr_d", lang), true));
    p4.items.push(item(t("p4_ddb_streams", lang), t("p4_ddb_streams_d", lang)));
    if (hasCritCert) {
      p4.items.push(item(t("p4_ddb_cmk", lang), t("p4_ddb_cmk_d", lang), true));
    }
  }
  if (cache === "redis" || cache === "both") {
    const instanceType = dau === "xlarge" ? "cache.r7g.xlarge" : dau === "large" ? "cache.r7g.large" : "cache.r7g.medium";
    p4.items.push(item(t("p4_elasticache_subnet", lang), t("p4_elasticache_subnet_d", lang)));
    p4.items.push(item(t("p4_elasticache_cluster", lang), t("p4_elasticache_cluster_d", lang, instanceType, azNum > 1)));
    p4.items.push(item(t("p4_redis_secrets", lang), t("p4_redis_secrets_d", lang)));
  }
  if (cache === "dax" || cache === "both") {
    p4.items.push(item(t("p4_dax_subnet", lang), t("p4_dax_subnet_d", lang)));
    p4.items.push(item(t("p4_dax_cluster", lang), t("p4_dax_cluster_d", lang)));
  }
  if (storArr.includes("s3")) {
    p4.items.push(item(t("p4_s3_bucket", lang), t("p4_s3_bucket_d", lang), true));
    p4.items.push(item(t("p4_s3_policy", lang), hasCritCert ? t("p4_s3_policy_strict_d", lang) : t("p4_s3_policy_default_d", lang)));
    p4.items.push(item(t("p4_s3_versioning", lang), t("p4_s3_versioning_d", lang)));
    p4.items.push(item(t("p4_s3_tiering", lang), t("p4_s3_tiering_d", lang)));
  }
  if (storArr.includes("efs")) {
    p4.items.push(item(t("p4_efs_fs", lang), t("p4_efs_fs_d", lang)));
    p4.items.push(item(t("p4_efs_mount", lang), t("p4_efs_mount_d", lang, azNum)));
  }
  if (search === "opensearch") {
    p4.items.push(item(t("p4_opensearch", lang), t("p4_opensearch_d", lang, azNum)));
    p4.items.push(item(t("p4_opensearch_index", lang), t("p4_opensearch_index_d", lang)));
  }
  if (dbArr.includes("documentdb")) {
    p4.items.push(item(t("p4_docdb_cluster", lang), t("p4_docdb_cluster_d", lang), true));
    p4.items.push(item(t("p4_docdb_driver", lang), t("p4_docdb_driver_d", lang)));
  }
  if (dbArr.includes("neptune")) {
    p4.items.push(item(t("p4_neptune_cluster", lang), t("p4_neptune_cluster_d", lang), true));
    p4.items.push(item(t("p4_neptune_loader", lang), t("p4_neptune_loader_d", lang)));
  }
  if (dbArr.includes("timestream")) {
    p4.items.push(item(t("p4_timestream_db", lang), t("p4_timestream_db_d", lang), true));
  }
  if (cache === "memorydb") {
    p4.items.push(item(t("p4_memorydb_cluster", lang), t("p4_memorydb_cluster_d", lang), true));
  }
  if (types.includes("data") && state.workload?.data_detail === "ai_genai") {
    p4.items.push(item(t("p4_bedrock_access", lang), t("p4_bedrock_access_d", lang), true));
    p4.items.push(item(t("p4_bedrock_kb", lang), t("p4_bedrock_kb_d", lang)));
  }
  phases.push(p4);

  // ── PHASE 5: Compute Layer
  const p5: any = { phase: "Phase 5", label: t("p5_label", lang), icon: "\u{1F5A5}\uFE0F", items: [] };
  p5.items.push(item(t("p5_ecr", lang), t("p5_ecr_d", lang), true));
  p5.items.push(item(t("p5_docker", lang), t("p5_docker_d", lang)));
  if (isEks) {
    p5.items.push(item(t("p5_eks_cluster", lang), t("p5_eks_cluster_d", lang), true));
    p5.items.push(item(t("p5_eks_addons", lang), t("p5_eks_addons_d", lang)));
    if (nodeP === "karpenter") {
      p5.items.push(item(t("p5_karpenter", lang), t("p5_karpenter_d", lang), true));
    } else {
      p5.items.push(item(t("p5_eks_mng", lang), t("p5_eks_mng_d", lang, azNum, dau === "xlarge" ? 50 : 20)));
    }
    p5.items.push(item(t("p5_alb_controller", lang), t("p5_alb_controller_d", lang), true));
    if (gitops === "argocd") {
      p5.items.push(item(t("p5_argocd", lang), t("p5_argocd_d", lang)));
    }
    p5.items.push(item(t("p5_ns", lang), t("p5_ns_d", lang)));
    p5.items.push(item(t("p5_hpa", lang), t("p5_hpa_d", lang)));
  } else if (isEcs) {
    const cpu = dau === "xlarge" ? 2048 : dau === "large" ? 1024 : 512;
    const mem = dau === "xlarge" ? 4096 : dau === "large" ? 2048 : 1024;
    p5.items.push(item(t("p5_ecs_cluster", lang), t("p5_ecs_cluster_d", lang), true));
    p5.items.push(item(t("p5_ecs_taskdef", lang), t("p5_ecs_taskdef_d", lang, cpu, mem), true));
    if (apiType === "nlb") {
      p5.items.push(item(t("p5_nlb", lang), t("p5_nlb_d", lang)));
    } else {
      p5.items.push(item(t("p5_ecs_alb", lang), t("p5_ecs_alb_d", lang)));
    }
    const deployStr = deploy === "bluegreen" ? t("p5_ecs_deploy_bg", lang) : t("p5_ecs_deploy_rolling", lang);
    p5.items.push(item(t("p5_ecs_service", lang), t("p5_ecs_service_d", lang, azNum, deployStr), true));
    p5.items.push(item(t("p5_ecs_autoscaling", lang), "CPU 70% Target Tracking. min=2 max=" + (dau === "xlarge" ? 50 : 20)));
  } else if (isServerless) {
    p5.items.push(item(t("p5_lambda", lang), t("p5_lambda_d", lang), true));
    p5.items.push(item(t("p5_apigw", lang), t("p5_apigw_d", lang)));
    p5.items.push(item(t("p5_lambda_concurrency", lang), t("p5_lambda_concurrency_d", lang)));
  }
  if (types.includes("data") && (state.workload?.data_detail === "log_analytics" || state.workload?.data_detail === "bi_dashboard")) {
    p5.items.push(item(t("p5_athena", lang), t("p5_athena_d", lang)));
    p5.items.push(item(t("p5_glue", lang), t("p5_glue_d", lang)));
  }
  if (types.includes("data") && state.workload?.data_detail === "bi_dashboard") {
    p5.items.push(item(t("p5_redshift", lang), t("p5_redshift_d", lang)));
    p5.items.push(item(t("p5_quicksight", lang), t("p5_quicksight_d", lang)));
  }
  if (types.includes("data") && state.workload?.data_detail === "stream_analytics") {
    p5.items.push(item(t("p5_firehose", lang), t("p5_firehose_d", lang)));
  }
  phases.push(p5);

  // ── PHASE 6: Edge & DNS
  const p6: any = { phase: "Phase 6", label: t("p6_label", lang), icon: "\u26A1", items: [] };
  p6.items.push(item(t("p6_r53_zone", lang), t("p6_r53_zone_d", lang), true));
  if (cdn !== "no") {
    p6.items.push(item(t("p6_cf_dist", lang), t("p6_cf_dist_d", lang), true));
    p6.items.push(item(t("p6_cf_cache", lang), t("p6_cf_cache_d", lang)));
    p6.items.push(item(t("p6_cf_origin", lang), t("p6_cf_origin_d", lang)));
    if (storArr.includes("s3")) {
      p6.items.push(item(t("p6_cf_s3_oac", lang), t("p6_cf_s3_oac_d", lang), true));
    }
  }
  if (waf && waf !== "no") {
    const hasCf = cdn !== "no" && !!cdn;
    p6.items.push(item(t("p6_waf_acl", lang, hasCf), t("p6_waf_acl_d", lang, hasCf), true));
    p6.items.push(item(t("p6_waf_managed", lang), t("p6_waf_managed_d", lang)));
    if (waf === "bot") {
      p6.items.push(item(t("p6_bot", lang), t("p6_bot_d", lang), true));
    }
    if (waf === "shield") {
      p6.items.push(item(t("p6_shield", lang), t("p6_shield_d", lang), true));
    }
  }
  if (dns === "health" || dns === "latency") {
    p6.items.push(item(t("p6_r53_health", lang), t("p6_r53_health_d", lang)));
    p6.items.push(item(t("p6_r53_failover", lang), t("p6_r53_failover_d", lang)));
  }
  p6.items.push(item(t("p6_r53_alias", lang), t("p6_r53_alias_d", lang)));
  phases.push(p6);

  // ── PHASE 7: Messaging & Integration
  if (syncMode !== "sync_only" || types.includes("iot")) {
    const p7: any = { phase: "Phase 7", label: t("p7_label", lang), icon: "\u{1F4E8}", items: [] };
    if (queueArr.includes("sqs") || isTx) {
      p7.items.push(item(t("p7_sqs_fifo", lang), t("p7_sqs_fifo_d", lang), true));
      p7.items.push(item(t("p7_sqs_dlq", lang), t("p7_sqs_dlq_d", lang)));
    }
    if (queueArr.includes("sns")) {
      p7.items.push(item(t("p7_sns_topic", lang), t("p7_sns_topic_d", lang)));
      p7.items.push(item(t("p7_sns_sqs", lang), t("p7_sns_sqs_d", lang)));
    }
    if (queueArr.includes("kinesis")) {
      const shards = dau === "xlarge" ? 20 : dau === "large" ? 10 : 4;
      p7.items.push(item(t("p7_kinesis", lang), t("p7_kinesis_d", lang, shards)));
      p7.items.push(item(t("p7_firehose", lang), t("p7_firehose_d", lang)));
    }
    if (queueArr.includes("eventbridge")) {
      p7.items.push(item(t("p7_eb_bus", lang), t("p7_eb_bus_d", lang)));
      p7.items.push(item(t("p7_eb_rule", lang), t("p7_eb_rule_d", lang)));
    }
    if (queueArr.includes("msk")) {
      p7.items.push(item(t("p7_msk_cluster", lang), t("p7_msk_cluster_d", lang), true));
      p7.items.push(item(t("p7_msk_topic", lang), t("p7_msk_topic_d", lang)));
      p7.items.push(item(t("p7_msk_iam", lang), t("p7_msk_iam_d", lang)));
    }
    if (queueArr.includes("amazon_mq")) {
      p7.items.push(item(t("p7_mq_broker", lang), t("p7_mq_broker_d", lang), true));
      p7.items.push(item(t("p7_mq_queue", lang), t("p7_mq_queue_d", lang)));
    }
    if (types.includes("iot")) {
      p7.items.push(item(t("p7_iot", lang), t("p7_iot_d", lang), true));
      p7.items.push(item(t("p7_iot_rule", lang), t("p7_iot_rule_d", lang)));
    }
    if (batchArr.includes("step_functions")) {
      p7.items.push(item(t("p7_sfn_workflow", lang), t("p7_sfn_workflow_d", lang)));
      p7.items.push(item(t("p7_sfn_role", lang), t("p7_sfn_role_d", lang)));
    }
    if (batchArr.includes("eventbridge_sch")) {
      p7.items.push(item(t("p7_eb_scheduler", lang), t("p7_eb_scheduler_d", lang)));
    }
    if (batchArr.includes("ecs_scheduled")) {
      p7.items.push(item(t("p7_ecs_scheduled", lang), t("p7_ecs_scheduled_d", lang)));
    }
    if (batchArr.includes("aws_batch")) {
      p7.items.push(item(t("p7_batch_env", lang), t("p7_batch_env_d", lang)));
      p7.items.push(item(t("p7_batch_queue", lang), t("p7_batch_queue_d", lang)));
    }
    phases.push(p7);
  }

  // ── PHASE 8: CI/CD Pipeline
  const p8: any = { phase: "Phase 8", label: t("p8_label", lang), icon: "\u{1F680}", items: [] };
  if (iac === "terraform") {
    p8.items.push(item(t("p8_tf_state", lang), t("p8_tf_state_d", lang), true));
    p8.items.push(item(t("p8_tf_modules", lang), t("p8_tf_modules_d", lang)));
    p8.items.push(item(t("p8_tf_workspace", lang), t("p8_tf_workspace_d", lang)));
    p8.items.push(item(t("p8_tf_plan", lang), t("p8_tf_plan_d", lang)));
    p8.items.push(item(t("p8_tf_apply", lang), t("p8_tf_apply_d", lang), true));
  } else if (iac === "cdk") {
    p8.items.push(item(t("p8_cdk_bootstrap", lang), t("p8_cdk_bootstrap_d", lang), true));
    p8.items.push(item(t("p8_cdk_stacks", lang), t("p8_cdk_stacks_d", lang)));
    p8.items.push(item(t("p8_cdk_synth", lang), t("p8_cdk_synth_d", lang)));
    p8.items.push(item(t("p8_cdk_deploy", lang), t("p8_cdk_deploy_d", lang), true));
  }
  if (pipeline === "github") {
    p8.items.push(item(t("p8_gh_oidc", lang), t("p8_gh_oidc_d", lang), true));
    const deployLabel = deploy === "bluegreen" ? "Blue/Green" : deploy === "canary" ? "Canary" : "Rolling";
    p8.items.push(item(t("p8_gh_workflow", lang), t("p8_gh_workflow_d", lang, deployLabel)));
    p8.items.push(item(t("p8_gh_secrets", lang), t("p8_gh_secrets_d", lang)));
  }
  if (iac === "terraform") {
    p8.items.push(item(t("p8_infracost", lang), t("p8_infracost_d", lang)));
  }
  const envLabel = envCnt === "four" ? "dev/stage/preprod/prod" : envCnt === "three" ? "dev/stage/prod" : "dev/prod";
  p8.items.push(item(t("p8_env_sep", lang, envLabel), t("p8_env_sep_d", lang), true));
  if (state.platform?.service_mesh === "vpc_lattice") {
    p8.items.push(item(t("p8_lattice_network", lang), t("p8_lattice_network_d", lang), true));
    p8.items.push(item(t("p8_lattice_service", lang), t("p8_lattice_service_d", lang)));
  }
  p8.items.push(item(t("p8_first_deploy", lang), t("p8_first_deploy_d", lang)));
  phases.push(p8);

  // ── PHASE 9: Monitoring & Operations
  const p9: any = { phase: "Phase 9", label: t("p9_label", lang), icon: "\u{1F4CA}", items: [] };
  p9.items.push(item(t("p9_cw_logs", lang), t("p9_cw_logs_d", lang)));
  p9.items.push(item(t("p9_cw_dashboard", lang), t("p9_cw_dashboard_d", lang)));
  p9.items.push(item(t("p9_alb_alarm", lang), t("p9_alb_alarm_d", lang), true));
  if (isEcs) p9.items.push(item(t("p9_ecs_alarm", lang), t("p9_ecs_alarm_d", lang)));
  if (isEks) p9.items.push(item(t("p9_eks_insights", lang), t("p9_eks_insights_d", lang)));
  if (dbArr.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"))) {
    p9.items.push(item(t("p9_rds_alarm", lang), t("p9_rds_alarm_d", lang), true));
  }
  if (dbArr.includes("dynamodb")) {
    p9.items.push(item(t("p9_ddb_alarm", lang), t("p9_ddb_alarm_d", lang)));
  }
  if (cache === "redis" || cache === "both") {
    p9.items.push(item(t("p9_cache_alarm", lang), t("p9_cache_alarm_d", lang)));
  }
  if (avail === "99.9" || avail === "99.95" || avail === "99.99") {
    p9.items.push(item(t("p9_synthetics", lang), t("p9_synthetics_d", lang), true));
  }
  p9.items.push(item(t("p9_sns_oncall", lang), t("p9_sns_oncall_d", lang)));
  p9.items.push(item(t("p9_xray", lang), t("p9_xray_d", lang)));
  if (hasCritCert) {
    p9.items.push(item(t("p9_ct_integrity", lang), t("p9_ct_integrity_d", lang), true));
    p9.items.push(item(t("p9_cost_anomaly", lang), t("p9_cost_anomaly_d", lang), true));
  }
  p9.items.push(item(t("p9_guardduty", lang), t("p9_guardduty_d", lang), true));
  if (hasCritCert || hasPersonal) {
    p9.items.push(item(t("p9_inspector", lang), t("p9_inspector_d", lang)));
  }
  if (cert.includes("isms_p") || cert.includes("pci") || hasPersonal) {
    p9.items.push(item(t("p9_macie", lang), t("p9_macie_d", lang)));
  }
  p9.items.push(item(t("p9_iam_analyzer", lang), t("p9_iam_analyzer_d", lang)));
  if (hasCritCert) {
    p9.items.push(item(t("p9_audit_manager", lang), t("p9_audit_manager_d", lang)));
  }
  phases.push(p9);

  // ── PHASE 10: Performance Testing & Launch Preparation
  const p10: any = { phase: "Phase 10", label: t("p10_label", lang), icon: "\u{1F3AF}", items: [] };
  const durationStr = (dau === "xlarge" || dau === "large")
    ? t("p10_load_test_long", lang)
    : t("p10_load_test_short", lang);
  p10.items.push(item(t("p10_load_test", lang), t("p10_load_test_d", lang, durationStr)));
  p10.items.push(item(t("p10_autoscale_verify", lang), t("p10_autoscale_verify_d", lang)));
  p10.items.push(item(t("p10_db_failover", lang), t("p10_db_failover_d", lang), true));
  p10.items.push(item(t("p10_dr_doc", lang), t("p10_dr_doc_d", lang)));
  p10.items.push(item(t("p10_vuln_scan", lang), t("p10_vuln_scan_d", lang), hasCritCert));
  if (hasCritCert) {
    p10.items.push(item(t("p10_pentest", lang), t("p10_pentest_d", lang), true));
    p10.items.push(item(t("p10_compliance_docs", lang), t("p10_compliance_docs_d", lang, cert.join("+"))));
  }
  const rollbackDetail = deploy === "bluegreen"
    ? t("p10_rollback_bg", lang)
    : deploy === "canary"
      ? t("p10_rollback_canary", lang)
      : t("p10_rollback_rolling", lang);
  p10.items.push(item(t("p10_rollback", lang), rollbackDetail));
  p10.items.push(item(t("p10_dashboard_share", lang), t("p10_dashboard_share_d", lang)));
  p10.items.push(item(t("p10_launch", lang), t("p10_launch_d", lang)));
  phases.push(p10);

  const totalItems = phases.reduce((s: number, p: any) => s + p.items.length, 0);
  const criticalItems = phases.reduce((s: number, p: any) => s + p.items.filter((i: any) => i.critical).length, 0);

  return { phases, totalItems, criticalItems };
}
