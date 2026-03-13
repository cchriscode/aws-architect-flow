# etcd Backup / Velero / DR Strategy

> You've learned deploying apps on K8s, scaling, monitoring, and [troubleshooting](./14-troubleshooting). But — **what if the cluster itself dies?** [Architecture](./01-architecture) showed etcd is "the cluster's brain". If the brain gets damaged, everything vanishes. This lesson teaches you how to **backup and recover K8s clusters**.

---

## 🎯 Why Learn This?

```
When you need K8s backup/DR:
• "Someone deleted the production namespace"              → Restore workloads
• "etcd data corrupted"                                   → Restore from snapshot
• "Region-wide outage, cluster gone"                      → Fail over to DR site
• "Need to migrate cluster to different region"           → Move everything
• "Need to backup PV data"                                → Velero + CSI snapshots
• "Accidentally deleted Helm release"                     → Full restore
• Interview: "Explain K8s DR strategy"                    → RTO/RPO + 4-tier plan
```

---

## 🧠 Core Concepts

### Metaphor: Fire Safety for Your House

K8s backup/DR is like a **home safety system**:

* **etcd Backup** = Making copies of important documents (deed, insurance). If originals burn, retrieve from safe.
* **Velero** = Professional moving company. Packs furniture (Deployment), appliances (Service), decorations (ConfigMap), and moves to another house.
* **DR Strategy** = Fire evacuation plan. Decide "where to go if fire", "how fast to recover".
* **RTO** = Time after fire until you can return home (Recovery Time Objective)
* **RPO** = Data loss acceptable between fire and your last backup (Recovery Point Objective)

### Metaphor: Passport Backup

You make passport copies before traveling. etcd backup is exactly that:

* Original (etcd) gets lost → Get copy from safe
* Copies stored in **multiple places** safer (S3, different region, off-site)
* How **recent** the copy is matters (RPO)

### Relationship Between etcd and Cluster State

```mermaid
flowchart TD
    subgraph CLUSTER["K8s Cluster"]
        API["kube-apiserver"]
        ETCD["etcd<br/>🧠 Cluster's Brain"]

        D1["Deployment Info"]
        S1["Service Info"]
        CM["ConfigMap/Secret"]
        PV["PV/PVC Info"]
        RBAC["RBAC Policy"]
        NS["Namespace Info"]
    end

    API -->|"read/write"| ETCD
    ETCD --- D1
    ETCD --- S1
    ETCD --- CM
    ETCD --- PV
    ETCD --- RBAC
    ETCD --- NS

    ETCD -->|"snapshot save"| BACKUP["Backup<br/>etcd-snapshot.db"]
    BACKUP -->|"upload to S3"| S3["S3 Bucket<br/>(Off-site Storage)"]

    style ETCD fill:#e74c3c,color:#fff
    style BACKUP fill:#f39c12,color:#fff
    style S3 fill:#3498db,color:#fff
```

### Complete Backup/Restore Flow

```mermaid
flowchart LR
    subgraph BACKUP_METHODS["Backup Methods"]
        ETCD_SNAP["etcd Snapshot<br/>Full Cluster State"]
        VELERO_BK["Velero Backup<br/>Resources + PV Data"]
        GITOPS["GitOps Repo<br/>Declarative Manifests"]
    end

    subgraph STORAGE["Backup Storage"]
        S3["AWS S3"]
        GCS["GCP GCS"]
        MINIO["MinIO<br/>(On-Prem)"]
    end

    subgraph RESTORE["Recovery Scenarios"]
        R1["Single Resource Restore"]
        R2["Namespace Restore"]
        R3["Full Cluster Restore"]
        R4["Migrate to Different Cluster"]
    end

    ETCD_SNAP --> S3
    VELERO_BK --> S3
    VELERO_BK --> GCS
    VELERO_BK --> MINIO

    S3 --> R1
    S3 --> R2
    S3 --> R3
    S3 --> R4

    style ETCD_SNAP fill:#e74c3c,color:#fff
    style VELERO_BK fill:#2ecc71,color:#fff
    style GITOPS fill:#9b59b6,color:#fff
```

---

## 🔍 Detailed Explanation

### 1. etcd Backup and Recovery

[Architecture](./01-architecture) showed etcd stores all K8s state. Deployment, Service, [ConfigMap/Secret](./04-config-secret), [PV/PVC](./07-storage), RBAC policies — everything in etcd.

#### Check etcd Health

```bash
# === Check etcd cluster status ===
# All etcdctl commands need certificates (set as env vars for convenience)
export ETCDCTL_API=3
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
export ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.crt
export ETCDCTL_CERT=/etc/kubernetes/pki/etcd/server.crt
export ETCDCTL_KEY=/etc/kubernetes/pki/etcd/server.key

# List etcd members
etcdctl member list
# Example: 8e9e05c52164694d, started, master-1, https://10.0.1.10:2380, https://10.0.1.10:2379

# Health check endpoints
etcdctl endpoint health
# Example: https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 2.03ms

# Status table (DB size, leader status, etc.)
etcdctl endpoint status --write-out=table
# Example:
# +----------------------------+------------------+---------+---------+-----------+------------+
# |          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM  |
# +----------------------------+------------------+---------+---------+-----------+------------+
# | https://127.0.0.1:2379     | 8e9e05c52164694d |  3.5.9  |  5.6 MB |      true |          3 |
# +----------------------------+------------------+---------+---------+-----------+------------+
```

#### Create etcd Snapshot Manually

```bash
# === Create snapshot === (env vars set above)

# Save snapshot to local file
etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db
# Expected: Snapshot saved at /backup/etcd-snapshot-20260313-100000.db

# Validate snapshot (check integrity — mandatory after backup!)
etcdctl snapshot status /backup/etcd-snapshot-20260313-100000.db --write-out=table
# Expected:
# +---------+----------+------------+------------+
# |  HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
# +---------+----------+------------+------------+
# | 3c08912 |   412683 |       1256 |     5.6 MB |
# +---------+----------+------------+------------+
```

#### Restore from etcd Snapshot

```bash
# === Restore from snapshot ===
# ⚠️ Warning: Completely replaces current etcd data!

# Step 1: Stop kube-apiserver (Static Pod manifest moved)
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# Step 2: Backup current etcd (just in case)
sudo mv /var/lib/etcd /var/lib/etcd-backup-$(date +%Y%m%d)

# Step 3: Restore from snapshot
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot-20260313-100000.db \
  --data-dir=/var/lib/etcd \
  --name=master-1 \
  --initial-cluster=master-1=https://10.0.1.10:2380 \
  --initial-cluster-token=etcd-cluster-1 \
  --initial-advertise-peer-urls=https://10.0.1.10:2380

# Step 4: Fix permissions + restart apiserver
sudo chown -R etcd:etcd /var/lib/etcd
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Step 5: Verify restoration (wait ~30 seconds)
kubectl get nodes
kubectl get pods --all-namespaces
```

#### Automated etcd Backup with CronJob

```yaml
# etcd-backup-cronjob.yaml — Create snapshots every 6 hours + upload to S3
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 */6 * * *"           # Every 6 hours
  concurrencyPolicy: Forbid          # No concurrent runs
  successfulJobsHistoryLimit: 3
  jobTemplate:
    spec:
      activeDeadlineSeconds: 1800    # 30-minute timeout
      template:
        spec:
          nodeSelector:              # Run on control-plane only
            node-role.kubernetes.io/control-plane: ""
          tolerations:
            - key: node-role.kubernetes.io/control-plane
              effect: NoSchedule
          containers:
            - name: etcd-backup
              image: bitnami/etcd:3.5
              command: ["/bin/sh", "-c"]
              args:
                - |
                  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
                  FILE="/backup/etcd-snapshot-${TIMESTAMP}.db"
                  # Create snapshot
                  etcdctl snapshot save ${FILE} \
                    --endpoints=https://127.0.0.1:2379 \
                    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                    --cert=/etc/kubernetes/pki/etcd/server.crt \
                    --key=/etc/kubernetes/pki/etcd/server.key
                  # Validate + upload to S3
                  etcdctl snapshot status ${FILE} --write-out=json
                  aws s3 cp ${FILE} s3://my-etcd-backups/cluster-prod/${TIMESTAMP}/ --sse aws:kms
                  # Delete local files older than 7 days
                  find /backup -name "etcd-snapshot-*.db" -mtime +7 -delete
              env:
                - name: ETCDCTL_API
                  value: "3"
              volumeMounts:
                - name: etcd-certs
                  mountPath: /etc/kubernetes/pki/etcd
                  readOnly: true
                - name: backup-volume
                  mountPath: /backup
          restartPolicy: OnFailure
          volumes:
            - name: etcd-certs
              hostPath:
                path: /etc/kubernetes/pki/etcd
            - name: backup-volume
              hostPath:
                path: /backup/etcd
```

#### etcd in Managed K8s (EKS)

```
⚠️ Important difference:

Self-managed K8s (kubeadm, etc.):
  → Direct etcd access
  → Manual etcdctl snapshot save/restore
  → DIY backup automation

Managed K8s (EKS, GKE, AKS):
  → etcd managed by cloud provider
  → etcdctl not accessible
  → Cloud provider automatically backs up etcd
  → Instead, use Velero for workload backup!
```

---

### 2. Velero (Installation, Backup/Restore, Scheduling, Selective)

Velero backs up K8s resources and PV data. If etcd snapshot is "brain MRI", Velero is "professional moving company" — can select what to pack and move to another cluster.

#### Velero vs etcd Backup Comparison

```mermaid
flowchart TD
    subgraph ETCD_BACKUP["etcd Backup"]
        E1["Full Cluster State"]
        E2["Restore to Same Cluster Only"]
        E3["Can't Selectively Restore"]
        E4["Self-managed K8s Only"]
        E5["Very Fast"]
    end

    subgraph VELERO_BACKUP["Velero Backup"]
        V1["Resources + PV Data"]
        V2["Restore to Different Cluster"]
        V3["Selective by NS/label"]
        V4["All K8s Environments"]
        V5["Time Depends on Scope"]
    end

    DECISION{"Which Backup<br/>Needed?"}

    DECISION -->|"Full cluster recovery<br/>(Self-managed)"| ETCD_BACKUP
    DECISION -->|"Workload backup/migration<br/>(All environments)"| VELERO_BACKUP

    BEST["✅ Best Practice:<br/>Use Both!"]

    ETCD_BACKUP --> BEST
    VELERO_BACKUP --> BEST

    style DECISION fill:#f39c12,color:#fff
    style BEST fill:#27ae60,color:#fff
```

#### Install Velero (AWS S3 Backend)

```bash
# === Install Velero CLI ===
brew install velero                    # macOS
# Linux: curl -L https://github.com/vmware-tanzu/velero/releases/download/v1.13.0/velero-v1.13.0-linux-amd64.tar.gz | tar xz
velero version                         # Client: v1.13.0
```

```bash
# === Install Velero Server with AWS S3 Backend ===

# Create S3 bucket
aws s3 mb s3://my-velero-backups --region ap-northeast-2

# Create IAM credentials (production should use IRSA!)
cat > /tmp/velero-credentials <<EOF
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF

# Install Velero (AWS plugin + filesystem backup)
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups \
  --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 \
  --secret-file /tmp/velero-credentials \
  --use-node-agent \
  --default-volumes-to-fs-backup

# Verify installation
kubectl get pods -n velero
# NAME                      READY   STATUS    RESTARTS   AGE
# velero-7d8c9f8b5-x2k4p   1/1     Running   0          30s
# node-agent-abc12          1/1     Running   0          30s

# Delete credentials file (security!)
rm /tmp/velero-credentials
```

#### Create Velero Backup

```bash
# === Full cluster backup ===
velero backup create full-backup-$(date +%Y%m%d)

# Expected:
# Backup request "full-backup-20260313" submitted successfully.
# Run `velero backup describe full-backup-20260313` or `velero backup logs full-backup-20260313` for more details.

# === Specific namespaces only ===
velero backup create app-backup \
  --include-namespaces production,staging

# === Label-based selective backup ===
# Backup only resources with app=nginx label
velero backup create nginx-backup \
  --selector app=nginx

# === Specific resource types only ===
# Backup ConfigMap and Secret only
velero backup create config-backup \
  --include-resources configmaps,secrets \
  --include-namespaces production

# === Exclude namespaces ===
velero backup create cluster-backup \
  --exclude-namespaces kube-system,velero

# === Check backup status ===
velero backup describe full-backup-20260313    # Phase: Completed, Errors: 0

# List backups
velero backup get
# NAME                  STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES
# full-backup-20260313  Completed   0        0          2026-03-13 10:00:00 +0900 KST   29d
# app-backup            Completed   0        0          2026-03-13 10:05:00 +0900 KST   29d
```

#### Restore from Velero Backup

```bash
# === Full restore ===
velero restore create --from-backup full-backup-20260313

# === Restore specific namespace only ===
velero restore create --from-backup full-backup-20260313 \
  --include-namespaces production

# === Restore specific resources only ===
velero restore create --from-backup full-backup-20260313 \
  --include-resources deployments,services \
  --include-namespaces production

# === Check restore status ===
velero restore describe full-backup-20260313-20260313100500
# Phase: Completed, Items restored: 156

# Check errors
velero restore logs full-backup-20260313-20260313100500
```

#### Scheduled Backups

```bash
# === Daily backup at 2AM (keep 30 days) ===
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h \
  --include-namespaces production,staging

# Expected:
# Schedule "daily-backup" created successfully.

# === Every 6 hours, full backup ===
velero schedule create frequent-backup \
  --schedule="0 */6 * * *" \
  --ttl 168h

# === Weekly full Sunday backup (keep 90 days) ===
velero schedule create weekly-full \
  --schedule="0 0 * * 0" \
  --ttl 2160h

# Check/manage schedules
velero schedule get
velero schedule pause daily-backup
velero schedule unpause daily-backup
```

#### PV Snapshot (CSI)

```bash
# === Backup with CSI snapshots ===
# Velero CSI plugin must be installed

# Step 1: Check VolumeSnapshotClass
kubectl get volumesnapshotclass

# Expected:
# NAME                    DRIVER              DELETIONPOLICY   AGE
# ebs-snapshot-class      ebs.csi.aws.com     Delete           30d

# Step 2: Backup with CSI snapshots
velero backup create pv-backup \
  --include-namespaces production \
  --snapshot-volumes=true \
  --default-volumes-to-fs-backup=false

# Step 3: Restore including PVs
velero restore create --from-backup pv-backup \
  --restore-volumes=true
```

---

### 3. DR Strategy (4 Tiers)

DR (Disaster Recovery) answers "**How fast and with how little data loss can we recover from disaster?**" Measured by **RTO and RPO**.

```
RTO (Recovery Time Objective):  Time from disaster → Service running
RPO (Recovery Point Objective): Max acceptable data loss (in time)

Example:
  RTO = 4 hours  → "Service must be back in 4 hours"
  RPO = 1 hour   → "Can lose up to 1 hour of data"
```

#### 4-Tier DR Strategy

```mermaid
flowchart TD
    subgraph L1["Tier 1: Backup & Restore<br/>💰 Cost: Lowest | ⏱️ RTO: Hours"]
        L1A["Just keep backups"]
        L1B["Create new cluster on disaster"]
        L1C["Restore from backup"]
    end

    subgraph L2["Tier 2: Pilot Light<br/>💰💰 Cost: Low | ⏱️ RTO: 30min-1hr"]
        L2A["Minimal infrastructure"]
        L2B["(DB replicas, etc.)"]
        L2C["Start remaining resources on disaster"]
        L2D["Scale up + switch traffic"]
    end

    subgraph L3["Tier 3: Warm Standby<br/>💰💰💰 Cost: Medium | ⏱️ RTO: Minutes"]
        L3A["Scaled-down replica"]
        L3B["environment always running"]
        L3C["Scale up on disaster"]
        L3D["DNS switch for traffic"]
    end

    subgraph L4["Tier 4: Active-Active<br/>💰💰💰💰 Cost: Highest | ⏱️ RTO: ~0"]
        L4A["Both regions"]
        L4B["simultaneously serving"]
        L4C["Global LB distributes traffic"]
        L4D["Auto-failover on outage"]
    end

    L1 --> L2 --> L3 --> L4

    style L1 fill:#27ae60,color:#fff
    style L2 fill:#f39c12,color:#fff
    style L3 fill:#e67e22,color:#fff
    style L4 fill:#e74c3c,color:#fff
```

#### Detailed Comparison

```
┌──────────────────┬───────────────┬───────────────┬──────────────┬───────────────┐
│                  │ Backup&Restore│ Pilot Light   │ Warm Standby │ Active-Active │
├──────────────────┼───────────────┼───────────────┼──────────────┼───────────────┤
│ RTO              │ Hours         │ 30min-1hr     │ Minutes      │ ~0            │
│ RPO              │ Last backup   │ Minutes-hrs   │ Secs-mins    │ ~0            │
│ Monthly Cost     │ $100-500      │ $500-2,000    │ $2,000-5,000 │ $5,000+       │
│ Complexity       │ Low           │ Medium        │ High         │ Very High     │
│ Automation       │ Manual        │ Semi-auto     │ Semi-auto    │ Fully Auto    │
│ Best For         │ Tools         │ B2B Services  │ Normal Apps  │ Finance/Pgmt  │
└──────────────────┴───────────────┴───────────────┴──────────────┴───────────────┘
```

#### Test DR with Chaos Engineering

DR **only works if tested**. Fire drills aren't optional.

```bash
# === DR Testing Checklist (test quarterly+) ===

# 1. Full backup → restore → verify cycle
velero backup create dr-test-backup --include-namespaces staging
velero restore create --from-backup dr-test-backup --namespace-mappings staging:dr-test
kubectl get pods -n dr-test                                          # Verify restore
kubectl exec -n dr-test deploy/myapp -- curl -s localhost:8080/health # App works?
kubectl delete namespace dr-test                                      # Cleanup

# 2. DR switch simulation (Route53 weight change for traffic shift)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 --change-batch file://dr-test-dns.json
```

---

### 4. EKS-Specific Strategy

EKS = managed control plane → etcd inaccessible. DR approach differs from self-managed.

```
EKS DR Key Points:
1. etcd managed by AWS → No manual backup needed (AWS handles)
2. Workloads → Velero backup essential
3. Cluster itself → IaC (Terraform/eksctl) for quick rebuild
4. State data (DB) → Separate backups (RDS snapshot, S3 replication)
```

#### Recreate EKS Cluster (eksctl)

```yaml
# cluster-config.yaml — IaC makes recreation fast
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: prod-cluster
  region: ap-northeast-2
  version: "1.29"
vpc:
  id: vpc-0abc123def456
  subnets:
    private:
      ap-northeast-2a: { id: subnet-0abc123 }
      ap-northeast-2b: { id: subnet-0def456 }
      ap-northeast-2c: { id: subnet-0ghi789 }
managedNodeGroups:
  - name: app-nodes
    instanceType: m5.xlarge
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    volumeSize: 100
    volumeType: gp3
addons:
  - name: vpc-cni
  - name: coredns
  - name: kube-proxy
  - name: aws-ebs-csi-driver
```

```bash
# === EKS DR: Cluster recreation + Velero restore ===

# Step 1: Create new cluster (15-20 min)
eksctl create cluster -f cluster-config.yaml
# [✓]  EKS cluster "prod-cluster" in "ap-northeast-2" region is ready

# Step 2: Install Velero on new cluster (same S3 bucket!)
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 --secret-file /tmp/velero-credentials

# Step 3: Existing backups auto-detected from S3
velero backup get

# Step 4: Restore workloads
velero restore create --from-backup daily-backup-20260313020000

# Step 5: Switch DNS (Route53) to new cluster's ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 --change-batch file://dns-failover.json
```

#### Multi-Region DR with Terraform

```hcl
# main.tf — Multi-region EKS DR setup (key parts)

# Primary region (Seoul)
module "eks_primary" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "prod-primary"
  cluster_version = "1.29"
  vpc_id          = module.vpc_primary.vpc_id
  subnet_ids      = module.vpc_primary.private_subnets

  eks_managed_node_groups = {
    app = {
      instance_types = ["m5.xlarge"]
      min_size = 2; max_size = 10; desired_size = 3
    }
  }
  providers = { aws = aws.primary }  # ap-northeast-2
}

# DR region (Tokyo) — Warm Standby: minimal nodes
module "eks_dr" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "prod-dr"
  cluster_version = "1.29"
  vpc_id          = module.vpc_dr.vpc_id
  subnet_ids      = module.vpc_dr.private_subnets

  eks_managed_node_groups = {
    app = {
      instance_types = ["m5.xlarge"]
      min_size = 1; max_size = 10; desired_size = 1  # Scale up on disaster
    }
  }
  providers = { aws = aws.dr }  # ap-northeast-1
}

# Velero S3 — Cross-region replication for auto-sync to DR
resource "aws_s3_bucket_replication_configuration" "velero_repl" {
  provider = aws.primary
  bucket   = aws_s3_bucket.velero_primary.id
  role     = aws_iam_role.replication.arn
  rule {
    id     = "velero-cross-region"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.velero_dr.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

---

## 💻 Practice Examples

### Practice 1: Velero Backup & Restore a Namespace

Full cycle: deploy app → backup → delete namespace → restore.

```bash
# === Setup: Deploy test app ===

# Create namespace + app
kubectl create namespace backup-test

kubectl apply -n backup-test -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-app
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  DB_HOST: "rds.example.com"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=
  API_KEY: YWJjZGVmMTIzNDU2
EOF

# Verify
kubectl get all,configmap,secret -n backup-test
# → 3 Pods, Service, ConfigMap, Secret visible

# === Backup with Velero ===
velero backup create backup-test-snapshot --include-namespaces backup-test --wait
# Backup completed with status: Completed.

# === Simulate disaster: delete namespace ===
kubectl delete namespace backup-test
kubectl get namespace backup-test  # NotFound

# === Restore with Velero ===
velero restore create --from-backup backup-test-snapshot --wait
# Restore completed with status: Completed.

# === Verify restoration ===
kubectl get all,configmap,secret -n backup-test
# 3 Pods, Service, ConfigMap, Secret — all restored!
```

### Practice 2: etcd Snapshot on kubeadm Cluster

Manual etcd backup/restore (kubeadm-only).

```bash
# === Only works on kubeadm-installed clusters ===
# EKS/GKE/AKS users, focus on Practice 1!

# Step 1: Verify cluster
kubectl get nodes
kubectl get pods --all-namespaces | wc -l  # Count total Pods

# Step 2: Create snapshot
sudo ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-practice-backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Step 3: Check snapshot info
sudo ETCDCTL_API=3 etcdctl snapshot status /tmp/etcd-practice-backup.db \
  --write-out=table

# Step 4: Make intentional change (test resource)
kubectl create namespace etcd-test-ns
kubectl get namespace etcd-test-ns  # Verify it exists

# Step 5: Restore from snapshot
# (Caution: Production never does this lightly!)
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
sudo mv /etc/kubernetes/manifests/etcd.yaml /tmp/
sudo mv /var/lib/etcd /var/lib/etcd-old

sudo ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-practice-backup.db \
  --data-dir=/var/lib/etcd

sudo mv /tmp/etcd.yaml /etc/kubernetes/manifests/
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# Step 6: Verify (wait ~30 seconds)
sleep 30
kubectl get namespace etcd-test-ns
# etcd-test-ns doesn't exist! → Snapshot restored to time before creation
```

### Practice 3: Migrate Cluster with Velero

Cluster A → Cluster B migration.

```bash
# [Cluster A] Backup source
kubectl config use-context cluster-a
velero backup create migration-backup \
  --include-namespaces production,staging --snapshot-volumes=true --wait

# [Cluster B] Install Velero on target (same S3 bucket!)
kubectl config use-context cluster-b
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 --secret-file /tmp/velero-credentials

# Existing backup auto-detected
velero backup get                                          # migration-backup visible
velero restore create --from-backup migration-backup --wait  # Restore!

# Verify — Cluster A's workloads now running on Cluster B!
kubectl get pods --all-namespaces
kubectl get pvc --all-namespaces
```

---

## 🏢 In Practice

### Scenario 1: "Someone Deleted production Namespace!"

```bash
# 🚨 Situation: Junior dev accidentally `kubectl delete namespace production`!
# All Deployments, Services, ConfigMaps, Secrets gone

# 📋 Response:

# Step 1: Understand damage
kubectl get events --all-namespaces | grep -i "production"
velero backup get  # Check latest backup

# Step 2: Restore from latest backup
velero restore create emergency-restore \
  --from-backup daily-backup-20260313020000 \
  --include-namespaces production \
  --wait

# Step 3: Verify restoration
velero restore describe emergency-restore
kubectl get all -n production

# Step 4: App sanity check
kubectl exec -n production deploy/api-server -- curl -s localhost:8080/health

# Step 5: Prevention (after recovery)
# - RBAC to limit namespace delete permission (./11-rbac)
# - ResourceQuota and LimitRange settings
# - `kubectl delete namespace` with --dry-run habit

# 💡 Lesson: Daily backup schedule meant recovery in <30 minutes!
# RPO = max 24 hours (daily backup), RTO = 10-30 minutes
```

### Scenario 2: "Region-Wide Outage! Seoul EKS Down!"

```bash
# 🚨 Situation: ap-northeast-2 (Seoul) region fully down
# All EKS, EC2, RDS unreachable

# 📋 Response (Warm Standby strategy):

# Step 1: Confirm DR cluster ready (Tokyo region)
aws eks describe-cluster --name prod-dr --region ap-northeast-1

# Step 2: Scale up DR cluster nodes
aws eks update-nodegroup-config \
  --cluster-name prod-dr \
  --nodegroup-name app \
  --scaling-config desiredSize=3,minSize=2,maxSize=10 \
  --region ap-northeast-1

# Step 3: Restore latest workloads (from S3 cross-region replicated)
kubectl config use-context dr-cluster
velero restore create dr-restore \
  --from-backup daily-backup-20260313020000 \
  --wait

# Step 4: DNS failover (Route53 health check or manual)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch file://failover-to-dr.json

# Step 5: Monitoring + comms
# - Slack/PagerDuty alert
# - Monitor DR dashboard
# - Customer notification

# 💡 RTO ~15-30min (Warm Standby), RPO ~5-15min (S3 cross-region replication)
```

### Scenario 3: "EKS Version Upgrade — Safety Net"

```bash
# 🔄 Situation: Upgrade EKS 1.28 → 1.29
# Backup as safety net

# 📋 Upgrade procedure:

# Step 1: Full workload backup pre-upgrade
velero backup create pre-upgrade-$(date +%Y%m%d) \
  --snapshot-volumes=true \
  --wait

# Step 2: Validate backup (restore to test namespace)
velero restore create --from-backup pre-upgrade-20260313 \
  --namespace-mappings "production:upgrade-test" \
  --wait
kubectl get pods -n upgrade-test  # Verify
kubectl delete namespace upgrade-test  # Cleanup

# Step 3: GitOps/Helm manifest backup (Git itself is backup)
# → Helm values, Kustomize overlays already in Git (./12-helm-kustomize)

# Step 4: Run EKS upgrade
eksctl upgrade cluster --name prod-cluster --version 1.29 --approve

# Step 5: Recovery options if issues
# Option A: Velero restore (same cluster)
# Option B: Velero to new 1.28 cluster (full rollback)
# Option C: GitOps redeploy (Helm + ArgoCD)

# 💡 Lesson: Backup before upgrade = confidence to fix mistakes!
# IaC + Velero + GitOps = triplet safety
```

---

## ⚠️ Common Mistakes

### 1. Backup Without Testing Recovery

```
❌ "Backup runs daily, so we're good" → Recovery fails!
   (Corrupted backup, version mismatch, permission issue)

✅ Quarterly (minimum) DR drills
   - Actual restore from backup
   - Verify restored app works
   - Measure actual RTO
```

### 2. Only etcd Backup, No Velero (especially on EKS)

```
❌ "etcd backup is enough" → Can't access etcd on EKS!
   Self-managed: etcd alone means all-or-nothing restore

✅ etcd + Velero combo
   - etcd: Full cluster recovery (emergency last resort)
   - Velero: Granular, selective recovery (daily use)
```

### 3. Forget PV Data in Backup

```
❌ velero backup create my-backup
   → Default might skip PV data!
   → Manifests restored, but actual disk data lost

✅ Explicitly include PV snapshots
   velero backup create my-backup \
     --snapshot-volumes=true \
     --default-volumes-to-fs-backup=true

   Or per-Pod annotation:
   backup.velero.io/backup-volumes=data-volume
```

### 4. Don't Set Backup TTL (Retention)

```
❌ Backups pile up forever
   → S3 costs explode
   → Can't find useful backup among 1000s

✅ Set retention clearly
   - Daily: 30 days (--ttl 720h)
   - Weekly: 90 days (--ttl 2160h)
   - Monthly: 1 year (--ttl 8760h)
   - S3 Lifecycle for old backup cleanup
```

### 5. Manual Cluster Management Instead of IaC

```
❌ "Console created EKS cluster" → Disaster, how to rebuild?
   "What settings did I use?" → Hours/days lost

✅ Terraform/eksctl — cluster as code
   - Config in Git
   - Destroy → Recreate in 15 minutes
   - Velero for workloads → Complete recovery
```

---

## 📝 Summary

```
K8s Backup & DR Core:

1. etcd Backup
   - All K8s state in etcd
   - etcdctl snapshot save/restore
   - Unavailable on managed K8s (AWS handles)
   - Automate with CronJob, store off-site on S3

2. Velero
   - K8s resources + PV data backup/restore
   - Selective by namespace/label
   - Works on all K8s (managed + self-managed)
   - Scheduled backups, cross-cluster migration

3. DR 4 Tiers
   - Backup & Restore: Hours, lowest cost
   - Pilot Light: 30min-1hr, minimal standby
   - Warm Standby: Minutes, scaled-down replica
   - Active-Active: ~0, full replication

4. Core Principles
   - Backup = recovery test (untested = untrusted)
   - IaC + Velero + GitOps = complete DR
   - RTO/RPO per business requirements
   - Regular DR drills mandatory
```

```mermaid
flowchart LR
    subgraph DR_COMBO["Perfect DR: Three-Part System"]
        IAC["IaC<br/>(Terraform/eksctl)<br/>Cluster Recreation"]
        VELERO["Velero<br/>Workload Backup/Restore"]
        GITOPS["GitOps<br/>(ArgoCD/Flux)<br/>Auto-Deploy Apps"]
    end

    DISASTER["🔥 Disaster Happens"]

    DISASTER --> IAC
    IAC -->|"1. Create Cluster"| NEW["New Cluster"]
    VELERO -->|"2. Restore State"| NEW
    GITOPS -->|"3. Auto-Deploy"| NEW
    NEW --> RECOVERED["✅ Service Restored"]

    style DISASTER fill:#e74c3c,color:#fff
    style RECOVERED fill:#27ae60,color:#fff
    style IAC fill:#3498db,color:#fff
    style VELERO fill:#f39c12,color:#fff
    style GITOPS fill:#9b59b6,color:#fff
```

---

## 🔗 Next Lesson

> You've learned backing up and recovering from disasters. Next: **extending K8s itself** — Custom Resource Definitions (CRD) and Operator pattern. Build your own K8s resources and automate complex operations with Operators.

[17-operator-crd](./17-operator-crd)
