# etcd 백업 / Velero / DR 전략

> 지금까지 K8s 위에 앱을 배포하고, 스케일링하고, 모니터링하고, [트러블슈팅](./14-troubleshooting)까지 배웠어요. 그런데 — **클러스터 자체가 날아가면?** [아키텍처](./01-architecture)에서 etcd가 "클러스터의 뇌"라고 했죠? 그 뇌가 손상되면 모든 게 사라져요. 이번 강의에서는 K8s 클러스터를 **백업하고, 재해로부터 복구하는** 전략을 배워요.

---

## 🎯 이걸 왜 알아야 하나?

```
K8s 백업/DR이 필요한 순간:
• "누가 production namespace를 통째로 삭제했어요"     → 워크로드 복원
• "etcd 데이터가 깨졌어요"                          → etcd 스냅샷 복원
• "리전 장애로 클러스터가 통째로 안 돼요"             → DR 사이트로 전환
• "클러스터를 다른 리전으로 이전해야 해요"             → 마이그레이션
• "PV 데이터를 백업해야 해요"                        → Velero + CSI 스냅샷
• "실수로 Helm release를 삭제했어요"                 → 전체 복원
• 면접: "K8s DR 전략을 설명해주세요"                 → RTO/RPO + 4단계 전략
```

---

## 🧠 핵심 개념

### 비유: 화재 대피 훈련과 보험

K8s 백업/DR을 **집의 안전 시스템**에 비유해볼게요.

* **etcd 백업** = 집의 중요 서류(등기부등본, 보험증서)를 **금고에 복사**해 두는 것. 원본이 불타도 금고에서 꺼내면 돼요
* **Velero** = 이사 전문 업체. 가구(Deployment), 가전(Service), 소품(ConfigMap)을 **통째로 포장**해서 다른 집으로 옮겨주는 서비스
* **DR 전략** = 화재 대피 계획. "불나면 어디로 갈지, 얼마나 빨리 복구할지" 미리 정해놓는 것
* **RTO** = 불난 후 다시 집에 들어갈 수 있을 때까지 걸리는 시간 (Recovery Time Objective)
* **RPO** = 마지막으로 백업한 시점과 장애 시점 사이에 잃어버리는 데이터 양 (Recovery Point Objective)

### 비유: 여권 복사본

해외여행 갈 때 여권 복사본을 따로 챙기죠? etcd 백업이 바로 그거예요.

* 원본(etcd)을 잃어버려도 복사본(snapshot)이 있으면 신분 증명 가능
* 복사본을 **여러 곳**에 보관할수록 안전 (S3, 다른 리전, 오프사이트)
* 복사본이 **얼마나 최신인지**가 중요 (RPO)

### etcd와 클러스터 상태의 관계

```mermaid
flowchart TD
    subgraph CLUSTER["K8s 클러스터"]
        API["kube-apiserver"]
        ETCD["etcd<br/>🧠 클러스터의 뇌"]

        D1["Deployment 정보"]
        S1["Service 정보"]
        CM["ConfigMap/Secret"]
        PV["PV/PVC 정보"]
        RBAC["RBAC 정책"]
        NS["Namespace 정보"]
    end

    API -->|"읽기/쓰기"| ETCD
    ETCD --- D1
    ETCD --- S1
    ETCD --- CM
    ETCD --- PV
    ETCD --- RBAC
    ETCD --- NS

    ETCD -->|"snapshot save"| BACKUP["📦 etcd 스냅샷<br/>/backup/etcd-snapshot.db"]
    BACKUP -->|"S3 업로드"| S3["☁️ S3 버킷<br/>(오프사이트 보관)"]

    style ETCD fill:#e74c3c,color:#fff
    style BACKUP fill:#f39c12,color:#fff
    style S3 fill:#3498db,color:#fff
```

### 백업/복원 전체 흐름

```mermaid
flowchart LR
    subgraph BACKUP_METHODS["백업 방법"]
        ETCD_SNAP["etcd Snapshot<br/>클러스터 상태 전체"]
        VELERO_BK["Velero Backup<br/>리소스 + PV 데이터"]
        GITOPS["GitOps 저장소<br/>선언적 매니페스트"]
    end

    subgraph STORAGE["백업 저장소"]
        S3["AWS S3"]
        GCS["GCP GCS"]
        MINIO["MinIO<br/>(온프레미스)"]
    end

    subgraph RESTORE["복원 시나리오"]
        R1["단일 리소스 복원"]
        R2["네임스페이스 복원"]
        R3["전체 클러스터 복원"]
        R4["다른 클러스터로 마이그레이션"]
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

## 🔍 상세 설명

### 1. etcd의 역할과 백업

[아키텍처 강의](./01-architecture)에서 etcd가 K8s의 모든 상태를 저장하는 분산 키-값 저장소라고 배웠어요. Deployment, Service, [ConfigMap/Secret](./04-config-secret), [PV/PVC](./07-storage), RBAC 정책 — 전부 etcd에 있어요.

#### etcd 상태 확인

```bash
# === etcd 클러스터 상태 확인 ===
# 모든 etcdctl 명령에는 인증서 옵션이 필요해요 (환경 변수로 설정하면 편해요)
export ETCDCTL_API=3
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
export ETCDCTL_CACERT=/etc/kubernetes/pki/etcd/ca.crt
export ETCDCTL_CERT=/etc/kubernetes/pki/etcd/server.crt
export ETCDCTL_KEY=/etc/kubernetes/pki/etcd/server.key

# etcd 멤버 목록 확인
etcdctl member list
# 예상 출력: 8e9e05c52164694d, started, master-1, https://10.0.1.10:2380, https://10.0.1.10:2379

# etcd 엔드포인트 건강 체크
etcdctl endpoint health
# 예상 출력: https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 2.03ms

# etcd 상태 테이블 (DB 크기, 리더 여부 등)
etcdctl endpoint status --write-out=table
# 예상 출력:
# +----------------------------+------------------+---------+---------+-----------+------------+
# |          ENDPOINT          |        ID        | VERSION | DB SIZE | IS LEADER | RAFT TERM  |
# +----------------------------+------------------+---------+---------+-----------+------------+
# | https://127.0.0.1:2379     | 8e9e05c52164694d |  3.5.9  |  5.6 MB |      true |          3 |
# +----------------------------+------------------+---------+---------+-----------+------------+
```

#### etcd 스냅샷 저장 (수동)

```bash
# === etcd 스냅샷 생성 === (환경 변수가 위에서 설정되어 있다고 가정)

# 스냅샷을 로컬 파일로 저장
etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db
# 예상 출력: Snapshot saved at /backup/etcd-snapshot-20260313-100000.db

# 스냅샷 검증 (무결성 확인 — 백업 후 반드시!)
etcdctl snapshot status /backup/etcd-snapshot-20260313-100000.db --write-out=table
# 예상 출력:
# +---------+----------+------------+------------+
# |  HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
# +---------+----------+------------+------------+
# | 3c08912 |   412683 |       1256 |     5.6 MB |
# +---------+----------+------------+------------+
```

#### etcd 스냅샷 복원

```bash
# === etcd 스냅샷 복원 ===
# ⚠️ 주의: 현재 etcd 데이터를 완전히 대체하는 작업이에요!

# 1단계: kube-apiserver 중지 (Static Pod 매니페스트 이동)
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/

# 2단계: 기존 etcd 데이터 백업 (혹시 모르니까)
sudo mv /var/lib/etcd /var/lib/etcd-backup-$(date +%Y%m%d)

# 3단계: 스냅샷에서 복원
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snapshot-20260313-100000.db \
  --data-dir=/var/lib/etcd \
  --name=master-1 \
  --initial-cluster=master-1=https://10.0.1.10:2380 \
  --initial-cluster-token=etcd-cluster-1 \
  --initial-advertise-peer-urls=https://10.0.1.10:2380

# 4단계: 소유권 복구 + apiserver 재시작
sudo chown -R etcd:etcd /var/lib/etcd
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# 5단계: 복원 확인 (30초 정도 기다린 후)
kubectl get nodes
kubectl get pods --all-namespaces
```

#### etcd 자동 백업 CronJob

```yaml
# etcd-backup-cronjob.yaml — 매 6시간마다 스냅샷 생성 + S3 업로드
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etcd-backup
  namespace: kube-system
spec:
  schedule: "0 */6 * * *"           # 매 6시간
  concurrencyPolicy: Forbid          # 동시 실행 방지
  successfulJobsHistoryLimit: 3
  jobTemplate:
    spec:
      activeDeadlineSeconds: 1800    # 30분 타임아웃
      template:
        spec:
          nodeSelector:              # 마스터 노드에서만 실행
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
                  # 스냅샷 생성
                  etcdctl snapshot save ${FILE} \
                    --endpoints=https://127.0.0.1:2379 \
                    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
                    --cert=/etc/kubernetes/pki/etcd/server.crt \
                    --key=/etc/kubernetes/pki/etcd/server.key
                  # 무결성 검증 + S3 업로드
                  etcdctl snapshot status ${FILE} --write-out=json
                  aws s3 cp ${FILE} s3://my-etcd-backups/cluster-prod/${TIMESTAMP}/ --sse aws:kms
                  # 7일 이상 된 로컬 파일 삭제
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

#### Managed K8s (EKS)에서의 etcd

```
⚠️ 중요한 차이점:

Self-managed K8s (kubeadm 등):
  → etcd에 직접 접근 가능
  → etcdctl snapshot save/restore 직접 수행
  → 백업 자동화를 직접 구성해야 함

Managed K8s (EKS, GKE, AKS):
  → etcd는 클라우드 제공자가 관리
  → etcdctl 직접 접근 불가
  → 클라우드 제공자가 자동으로 etcd 백업
  → 대신 Velero로 워크로드 레벨 백업 필요!
```

---

### 2. Velero (설치, 백업/복원, 스케줄, 선택적 백업)

Velero는 K8s 리소스와 PV 데이터를 백업/복원하는 오픈소스 도구예요. etcd 백업이 "뇌의 MRI 사진"이라면, Velero 백업은 "이삿짐 포장 서비스"예요 — 원하는 것만 골라서 포장하고, 다른 집(클러스터)으로 옮길 수 있어요.

#### Velero vs etcd 백업 비교

```mermaid
flowchart TD
    subgraph ETCD_BACKUP["etcd 백업"]
        E1["전체 클러스터 상태"]
        E2["같은 클러스터에만 복원"]
        E3["선택적 복원 불가"]
        E4["Self-managed K8s만"]
        E5["매우 빠름"]
    end

    subgraph VELERO_BACKUP["Velero 백업"]
        V1["리소스 + PV 데이터"]
        V2["다른 클러스터로도 복원"]
        V3["NS/라벨 기반 선택적 복원"]
        V4["모든 K8s 환경"]
        V5["대상에 따라 시간 소요"]
    end

    DECISION{"어떤 백업이<br/>필요한가요?"}

    DECISION -->|"클러스터 전체 복구<br/>(Self-managed)"| ETCD_BACKUP
    DECISION -->|"워크로드 백업/마이그레이션<br/>(모든 환경)"| VELERO_BACKUP

    BEST["✅ 베스트 프랙티스:<br/>둘 다 사용!"]

    ETCD_BACKUP --> BEST
    VELERO_BACKUP --> BEST

    style DECISION fill:#f39c12,color:#fff
    style BEST fill:#27ae60,color:#fff
```

#### Velero 설치 (AWS S3 백엔드)

```bash
# === Velero CLI 설치 ===
brew install velero                    # macOS
# Linux: curl -L https://github.com/vmware-tanzu/velero/releases/download/v1.13.0/velero-v1.13.0-linux-amd64.tar.gz | tar xz
velero version                         # Client: v1.13.0
```

```bash
# === AWS S3 백엔드로 Velero 서버 설치 ===

# S3 버킷 생성
aws s3 mb s3://my-velero-backups --region ap-northeast-2

# IAM 자격 증명 파일 생성 (프로덕션에서는 IRSA 권장!)
cat > /tmp/velero-credentials <<EOF
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF

# Velero 설치 (AWS 플러그인 + 파일시스템 백업 포함)
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups \
  --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 \
  --secret-file /tmp/velero-credentials \
  --use-node-agent \
  --default-volumes-to-fs-backup

# 설치 확인
kubectl get pods -n velero
# NAME                      READY   STATUS    RESTARTS   AGE
# velero-7d8c9f8b5-x2k4p   1/1     Running   0          30s
# node-agent-abc12          1/1     Running   0          30s

# 자격 증명 파일 삭제 (보안!)
rm /tmp/velero-credentials
```

#### Velero 백업 생성

```bash
# === 전체 클러스터 백업 ===
velero backup create full-backup-$(date +%Y%m%d)

# 예상 출력:
# Backup request "full-backup-20260313" submitted successfully.
# Run `velero backup describe full-backup-20260313` or `velero backup logs full-backup-20260313` for more details.

# === 특정 네임스페이스만 백업 ===
velero backup create app-backup \
  --include-namespaces production,staging

# === 라벨 기반 선택적 백업 ===
# app=nginx 라벨이 있는 리소스만 백업
velero backup create nginx-backup \
  --selector app=nginx

# === 특정 리소스 타입만 백업 ===
# ConfigMap과 Secret만 백업
velero backup create config-backup \
  --include-resources configmaps,secrets \
  --include-namespaces production

# === 특정 네임스페이스 제외 ===
velero backup create cluster-backup \
  --exclude-namespaces kube-system,velero

# === 백업 상태 확인 ===
velero backup describe full-backup-20260313    # Phase: Completed, Errors: 0

# 백업 목록
velero backup get
# NAME                  STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES
# full-backup-20260313  Completed   0        0          2026-03-13 10:00:00 +0900 KST   29d
# app-backup            Completed   0        0          2026-03-13 10:05:00 +0900 KST   29d
```

#### Velero 복원

```bash
# === 전체 복원 ===
velero restore create --from-backup full-backup-20260313

# === 특정 네임스페이스만 복원 ===
velero restore create --from-backup full-backup-20260313 \
  --include-namespaces production

# === 특정 리소스만 복원 ===
velero restore create --from-backup full-backup-20260313 \
  --include-resources deployments,services \
  --include-namespaces production

# === 복원 상태 확인 ===
velero restore describe full-backup-20260313-20260313100500
# Phase: Completed, Items restored: 156

# 에러 발생 시 로그 확인
velero restore logs full-backup-20260313-20260313100500
```

#### 스케줄 백업

```bash
# === 매일 새벽 2시 백업 (30일 보관) ===
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h \
  --include-namespaces production,staging

# 예상 출력:
# Schedule "daily-backup" created successfully.

# === 매 6시간마다 전체 백업 ===
velero schedule create frequent-backup \
  --schedule="0 */6 * * *" \
  --ttl 168h

# === 매주 일요일 전체 백업 (90일 보관) ===
velero schedule create weekly-full \
  --schedule="0 0 * * 0" \
  --ttl 2160h

# 스케줄 확인 / 일시 중지 / 재개
velero schedule get
velero schedule pause daily-backup
velero schedule unpause daily-backup
```

#### PV 스냅샷 (CSI)

```bash
# === CSI 스냅샷을 포함한 백업 ===
# Velero CSI 플러그인이 설치되어 있어야 함

# 1단계: VolumeSnapshotClass 확인
kubectl get volumesnapshotclass

# 예상 출력:
# NAME                    DRIVER              DELETIONPOLICY   AGE
# ebs-snapshot-class      ebs.csi.aws.com     Delete           30d

# 2단계: CSI 스냅샷을 포함하여 백업
velero backup create pv-backup \
  --include-namespaces production \
  --snapshot-volumes=true \
  --default-volumes-to-fs-backup=false

# 3단계: PV 포함 복원
velero restore create --from-backup pv-backup \
  --restore-volumes=true
```

---

### 3. DR 전략 (4단계)

DR(Disaster Recovery)은 "재해가 발생했을 때 얼마나 빨리, 얼마나 적은 데이터 손실로 복구할 수 있는가"를 다루는 전략이에요. 핵심은 **RTO와 RPO** 두 가지 지표예요.

```
RTO (Recovery Time Objective):  장애 발생 → 서비스 복구까지 걸리는 시간
RPO (Recovery Point Objective): 장애 시 허용 가능한 데이터 손실 범위 (시간)

예시:
  RTO = 4시간  → "장애 후 4시간 이내에 서비스가 돌아와야 해요"
  RPO = 1시간  → "최대 1시간치 데이터까지는 잃어도 괜찮아요"
```

#### DR 4단계 전략

```mermaid
flowchart TD
    subgraph L1["1단계: Backup & Restore<br/>💰 비용: 최저 | ⏱️ RTO: 수 시간"]
        L1A["백업만 보관"]
        L1B["장애 시 새 클러스터 생성"]
        L1C["백업에서 복원"]
    end

    subgraph L2["2단계: Pilot Light<br/>💰💰 비용: 낮음 | ⏱️ RTO: 30분~1시간"]
        L2A["최소 인프라만 가동<br/>(DB 복제본 등)"]
        L2B["장애 시 나머지 리소스 시작"]
        L2C["스케일업 후 트래픽 전환"]
    end

    subgraph L3["3단계: Warm Standby<br/>💰💰💰 비용: 중간 | ⏱️ RTO: 수 분"]
        L3A["축소된 복제 환경 상시 운영"]
        L3B["장애 시 스케일업"]
        L3C["DNS 전환으로 트래픽 이동"]
    end

    subgraph L4["4단계: Active-Active<br/>💰💰💰💰 비용: 최고 | ⏱️ RTO: 거의 0"]
        L4A["두 리전에서 동시 서비스"]
        L4B["글로벌 로드밸런서로 분산"]
        L4C["한 쪽 장애 시 자동 페일오버"]
    end

    L1 --> L2 --> L3 --> L4

    style L1 fill:#27ae60,color:#fff
    style L2 fill:#f39c12,color:#fff
    style L3 fill:#e67e22,color:#fff
    style L4 fill:#e74c3c,color:#fff
```

#### 각 단계 상세 비교

```
┌──────────────────┬───────────────┬───────────────┬──────────────┬───────────────┐
│                  │ Backup&Restore│ Pilot Light   │ Warm Standby │ Active-Active │
├──────────────────┼───────────────┼───────────────┼──────────────┼───────────────┤
│ RTO              │ 수 시간       │ 30분~1시간    │ 수 분        │ 거의 0        │
│ RPO              │ 마지막 백업   │ 수 분~수 시간 │ 수 초~수 분  │ 거의 0        │
│ 월 비용 (예시)   │ $100~500     │ $500~2,000    │ $2,000~5,000 │ $5,000+       │
│ 복잡도           │ 낮음          │ 중간          │ 높음         │ 매우 높음     │
│ 자동화 수준      │ 수동          │ 반자동        │ 반자동~자동  │ 완전 자동     │
│ 적합한 서비스    │ 내부 도구     │ B2B 서비스    │ 일반 서비스  │ 금융/결제     │
└──────────────────┴───────────────┴───────────────┴──────────────┴───────────────┘
```

#### Chaos Engineering으로 DR 검증

DR 전략은 **테스트하지 않으면 작동하지 않는다**고 가정해야 해요. 화재 대피 훈련을 안 하면 실제 화재 때 혼란스러운 것과 같아요.

```bash
# === DR 검증 체크리스트 (분기 1회 이상 실시!) ===

# 1. 백업 → 복원 → 검증 → 정리 (전체 사이클 테스트)
velero backup create dr-test-backup --include-namespaces staging
velero restore create --from-backup dr-test-backup --namespace-mappings staging:dr-test
kubectl get pods -n dr-test                                          # 복원 확인
kubectl exec -n dr-test deploy/myapp -- curl -s localhost:8080/health # 앱 동작 확인
kubectl delete namespace dr-test                                      # 정리

# 2. DR 전환 시뮬레이션 (Route53 가중치 변경으로 트래픽 이동)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 --change-batch file://dr-test-dns.json
```

---

### 4. EKS 특화 전략

EKS는 managed control plane이라 etcd에 직접 접근할 수 없어요. 그래서 DR 전략이 Self-managed K8s와 다르게 접근해야 해요.

```
EKS DR 전략의 핵심:
1. etcd는 AWS가 관리 → 직접 백업 불필요 (AWS가 알아서 해요)
2. 워크로드는 Velero로 백업 → S3에 저장
3. 클러스터 자체는 IaC(Terraform/eksctl)로 재생성 → 코드로 관리
4. 상태 데이터(DB 등)는 별도 백업 → RDS 스냅샷, S3 복제 등
```

#### EKS 클러스터 재생성 (eksctl)

```yaml
# cluster-config.yaml — eksctl로 코드 관리하면 언제든 재생성 가능
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
# === EKS DR 시나리오: 클러스터 재생성 + Velero 복원 ===

# 1단계: 새 클러스터 생성 (15~20분 소요)
eksctl create cluster -f cluster-config.yaml
# [✓]  EKS cluster "prod-cluster" in "ap-northeast-2" region is ready

# 2단계: 새 클러스터에 Velero 설치 (같은 S3 버킷 지정!)
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 --secret-file /tmp/velero-credentials

# 3단계: S3에 저장된 기존 백업이 자동으로 보여요!
velero backup get

# 4단계: 워크로드 복원
velero restore create --from-backup daily-backup-20260313020000

# 5단계: DNS 전환 (Route53에서 새 클러스터의 ALB로 변경)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 --change-batch file://dns-failover.json
```

#### Terraform으로 멀티 리전 DR

```hcl
# main.tf — 멀티 리전 EKS DR 구성 (핵심 부분만)

# Primary 리전 (서울)
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

# DR 리전 (도쿄) — Warm Standby: 최소로 유지
module "eks_dr" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "prod-dr"
  cluster_version = "1.29"
  vpc_id          = module.vpc_dr.vpc_id
  subnet_ids      = module.vpc_dr.private_subnets

  eks_managed_node_groups = {
    app = {
      instance_types = ["m5.xlarge"]
      min_size = 1; max_size = 10; desired_size = 1  # 장애 시 스케일업
    }
  }
  providers = { aws = aws.dr }  # ap-northeast-1
}

# Velero S3 — 크로스 리전 복제로 DR 리전에도 백업 자동 복제
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

## 💻 실습 예제

### 실습 1: Velero로 네임스페이스 백업 & 복원

이 실습에서는 앱을 배포하고, Velero로 백업한 뒤, 네임스페이스를 삭제하고 복원하는 전체 과정을 경험해요.

```bash
# === 사전 준비: 테스트 앱 배포 ===

# 1단계: 테스트 네임스페이스와 앱 생성
kubectl create namespace backup-test

# 간단한 앱 배포
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

# 2단계: 리소스 확인
kubectl get all,configmap,secret -n backup-test
# → Pod 3개, Service, ConfigMap, Secret 확인

# === 3단계: Velero로 백업 ===
velero backup create backup-test-snapshot --include-namespaces backup-test --wait
# Backup completed with status: Completed.

# === 4단계: 네임스페이스 삭제 (재해 시뮬레이션!) ===
kubectl delete namespace backup-test
kubectl get namespace backup-test  # NotFound 확인

# === 5단계: Velero로 복원 ===
velero restore create --from-backup backup-test-snapshot --wait
# Restore completed with status: Completed.

# === 6단계: 복원 확인 ===
kubectl get all,configmap,secret -n backup-test
# Pod 3개, Service, ConfigMap, Secret — 전부 복원됨!
```

### 실습 2: etcd 스냅샷 백업 & 복원 (kubeadm 클러스터)

```bash
# === 이 실습은 kubeadm으로 설치한 클러스터에서만 가능해요 ===
# EKS/GKE/AKS 사용자는 실습 1에 집중하세요!

# 1단계: 현재 클러스터 상태 확인
kubectl get nodes
kubectl get pods --all-namespaces | wc -l  # 총 Pod 수 확인

# 2단계: etcd 스냅샷 생성
sudo ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-practice-backup.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# 3단계: 스냅샷 정보 확인
sudo ETCDCTL_API=3 etcdctl snapshot status /tmp/etcd-practice-backup.db \
  --write-out=table

# 4단계: 의도적으로 변경 (테스트용 네임스페이스 생성)
kubectl create namespace etcd-test-ns
kubectl get namespace etcd-test-ns  # 존재 확인

# 5단계: 스냅샷에서 복원
# (주의: 프로덕션에서는 절대 가볍게 하면 안 돼요!)
sudo mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/
sudo mv /etc/kubernetes/manifests/etcd.yaml /tmp/
sudo mv /var/lib/etcd /var/lib/etcd-old

sudo ETCDCTL_API=3 etcdctl snapshot restore /tmp/etcd-practice-backup.db \
  --data-dir=/var/lib/etcd

sudo mv /tmp/etcd.yaml /etc/kubernetes/manifests/
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/

# 6단계: 복원 후 확인 (30초 정도 기다려야 해요)
sleep 30
kubectl get namespace etcd-test-ns
# etcd-test-ns가 없어요! → 스냅샷 시점으로 돌아갔기 때문
```

### 실습 3: 클러스터 마이그레이션 (Velero)

```bash
# === 클러스터 A → 클러스터 B 마이그레이션 ===

# [클러스터 A] 소스 클러스터 백업
kubectl config use-context cluster-a
velero backup create migration-backup \
  --include-namespaces production,staging --snapshot-volumes=true --wait

# [클러스터 B] 대상 클러스터에 Velero 설치 (같은 S3 버킷 지정이 핵심!)
kubectl config use-context cluster-b
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.9.0 \
  --bucket my-velero-backups --backup-location-config region=ap-northeast-2 \
  --snapshot-location-config region=ap-northeast-2 --secret-file /tmp/velero-credentials

# S3에서 기존 백업이 자동으로 감지됨
velero backup get                                          # migration-backup 확인
velero restore create --from-backup migration-backup --wait  # 복원!

# 복원 확인 — 클러스터 A의 워크로드가 B에서 돌아가고 있어요!
kubectl get pods --all-namespaces
kubectl get pvc --all-namespaces
```

---

## 🏢 실무에서는?

### 시나리오 1: "누가 production 네임스페이스를 삭제했어요!"

```bash
# 🚨 상황: 신입 개발자가 실수로 kubectl delete namespace production 실행!
# 모든 Deployment, Service, ConfigMap, Secret이 사라짐

# 📋 대응 절차:

# 1단계: 피해 범위 파악
kubectl get events --all-namespaces | grep -i "production"
velero backup get  # 가장 최근 백업 확인

# 2단계: 최신 백업에서 복원
velero restore create emergency-restore \
  --from-backup daily-backup-20260313020000 \
  --include-namespaces production \
  --wait

# 3단계: 복원 결과 확인
velero restore describe emergency-restore
kubectl get all -n production

# 4단계: 앱 정상 동작 확인
kubectl exec -n production deploy/api-server -- curl -s localhost:8080/health

# 5단계: 재발 방지
# - RBAC으로 namespace 삭제 권한 제한 (01-rbac 강의 참조)
# - ResourceQuota와 LimitRange 설정
# - kubectl delete namespace에 --dry-run 습관화

# 💡 교훈: 일일 백업 스케줄이 있었기에 2시간 이내 복구 가능!
# RPO = 최대 24시간 (일일 백업이니까), RTO = 약 10~30분
```

### 시나리오 2: "리전 장애! 서울 리전 EKS가 안 돼요"

```bash
# 🚨 상황: ap-northeast-2 (서울) 리전 전체 장애
# 모든 EKS 클러스터, EC2, RDS가 접근 불가

# 📋 대응 절차 (Warm Standby 전략):

# 1단계: DR 리전(도쿄)의 대기 클러스터 확인
aws eks describe-cluster --name prod-dr --region ap-northeast-1

# 2단계: DR 클러스터 노드 스케일업
aws eks update-nodegroup-config \
  --cluster-name prod-dr \
  --nodegroup-name app \
  --scaling-config desiredSize=3,minSize=2,maxSize=10 \
  --region ap-northeast-1

# 3단계: Velero로 최신 워크로드 복원 (CR 리전 S3에서)
kubectl config use-context dr-cluster
velero restore create dr-restore \
  --from-backup daily-backup-20260313020000 \
  --wait

# 4단계: DNS 전환 (Route53 Health Check 기반 자동 or 수동)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch file://failover-to-dr.json

# 5단계: 모니터링 및 알림
# - Slack/PagerDuty로 DR 전환 알림
# - DR 환경 모니터링 대시보드 확인
# - 고객 공지 발송

# 💡 Warm Standby 전략이라 RTO는 약 15~30분
# S3 크로스 리전 복제로 RPO는 약 5~15분
```

### 시나리오 3: "EKS 버전 업그레이드 전 안전장치"

```bash
# 🔄 상황: EKS 1.28 → 1.29 업그레이드 예정
# 업그레이드 실패 시 롤백할 수 있도록 사전 백업

# 📋 업그레이드 전 백업 절차:

# 1단계: 전체 워크로드 백업
velero backup create pre-upgrade-$(date +%Y%m%d) \
  --snapshot-volumes=true \
  --wait

# 2단계: 백업 검증 (테스트 환경에 복원해서 확인)
velero restore create --from-backup pre-upgrade-20260313 \
  --namespace-mappings "production:upgrade-test" \
  --wait
kubectl get pods -n upgrade-test  # 정상 동작 확인
kubectl delete namespace upgrade-test  # 테스트 정리

# 3단계: GitOps 매니페스트 백업 (Helm values, Kustomize 등)
# → Git 리포지토리 자체가 백업 역할 (12-helm-kustomize 강의 참조)

# 4단계: EKS 업그레이드 실행
eksctl upgrade cluster --name prod-cluster --version 1.29 --approve

# 5단계: 문제 발생 시 복구 옵션
# Option A: Velero로 워크로드 복원 (같은 클러스터)
# Option B: 새 1.28 클러스터 생성 후 Velero 복원 (완전 롤백)
# Option C: GitOps로 재배포 (Helm + ArgoCD)

# 💡 교훈: 업그레이드 전에 반드시 Velero 백업!
# IaC + Velero + GitOps = 완벽한 안전장치
```

---

## ⚠️ 자주 하는 실수

### 1. 백업만 하고 복원 테스트를 안 함

```
❌ "매일 백업하고 있으니까 괜찮아" → 복원 시도하면 실패!
   (백업 파일 손상, 버전 불일치, 권한 문제 등)

✅ 최소 분기 1회 DR 훈련 실시
   - 백업에서 실제 복원해보기
   - 복원된 앱이 정상 동작하는지 확인
   - 복원에 걸리는 시간 측정 (실제 RTO 파악)
```

### 2. etcd 백업만 의존하고 Velero를 안 쓰는 경우

```
❌ "etcd 백업이 있으니 충분해" → EKS에서는 etcd 접근 불가!
   Self-managed에서도 etcd 복원은 전체 클러스터 롤백이라 선택적 복구 불가

✅ etcd 백업 + Velero 백업 병행
   - etcd: 클러스터 전체 복구 (최후의 수단)
   - Velero: 세밀한 리소스 복구 (일상적 복구)
```

### 3. PV 데이터 백업을 빠뜨림

```
❌ velero backup create my-backup → 기본 설정으로는 PV 데이터가 안 들어갈 수 있음!
   K8s 리소스(매니페스트)만 백업되고 실제 디스크 데이터는 빠짐

✅ PV 스냅샷을 명시적으로 포함
   velero backup create my-backup \
     --snapshot-volumes=true \
     --default-volumes-to-fs-backup=true

   또는 Pod 어노테이션으로 개별 볼륨 지정:
   backup.velero.io/backup-volumes=data-volume
```

### 4. 백업 보관 주기(TTL)를 설정하지 않음

```
❌ 백업을 무한정 쌓아두기 → S3 비용 폭발, 어떤 백업이 유효한지 모름

✅ TTL을 명확하게 설정
   - 일일 백업: 30일 보관 (--ttl 720h)
   - 주간 백업: 90일 보관 (--ttl 2160h)
   - 월간 백업: 1년 보관 (--ttl 8760h)
   - S3 Lifecycle 정책으로 오래된 백업 자동 삭제/Glacier 이동
```

### 5. IaC 없이 수동으로 클러스터를 관리

```
❌ 콘솔에서 EKS 클러스터를 수동 생성 → 장애 시 동일한 클러스터 재생성 불가!
   "그때 설정을 어떻게 했더라..." → 수 시간~수 일 소요

✅ Terraform/eksctl로 클러스터를 코드로 관리
   - 클러스터 설정이 Git에 저장됨
   - 장애 시 terraform apply 또는 eksctl create로 즉시 재생성
   - Velero로 워크로드 복원하면 완전 복구
   - IaC + Velero + GitOps = DR의 삼위일체
```

---

## 📝 정리

```
K8s 백업 & DR 핵심 정리:

1. etcd 백업
   - K8s의 모든 상태가 etcd에 저장됨
   - etcdctl snapshot save/restore로 백업/복원
   - EKS 등 Managed K8s에서는 etcd 직접 접근 불가
   - CronJob으로 자동화, S3에 오프사이트 보관

2. Velero
   - K8s 리소스 + PV 데이터를 백업/복원
   - namespace/label 기반 선택적 백업 가능
   - 스케줄 백업으로 자동화
   - 클러스터 간 마이그레이션에도 활용
   - EKS 환경에서는 사실상 필수 도구

3. DR 전략 4단계
   - Backup & Restore: 최저 비용, RTO 수 시간
   - Pilot Light: 최소 인프라 가동, RTO 30분~1시간
   - Warm Standby: 축소 복제 환경, RTO 수 분
   - Active-Active: 완전 이중화, RTO 거의 0

4. 핵심 원칙
   - 백업은 복원 테스트를 해야 의미가 있음
   - IaC + Velero + GitOps = 완벽한 DR 조합
   - RTO/RPO는 비즈니스 요구사항에 맞게 결정
   - 정기적인 DR 훈련은 선택이 아닌 필수
```

```mermaid
flowchart LR
    subgraph DR_COMBO["완벽한 DR 조합"]
        IAC["IaC<br/>(Terraform/eksctl)<br/>클러스터 재생성"]
        VELERO["Velero<br/>워크로드 백업/복원"]
        GITOPS["GitOps<br/>(ArgoCD/Flux)<br/>앱 배포 선언"]
    end

    DISASTER["🔥 재해 발생"]

    DISASTER --> IAC
    IAC -->|"1. 클러스터 생성"| NEW["새 클러스터"]
    VELERO -->|"2. 상태 데이터 복원"| NEW
    GITOPS -->|"3. 앱 자동 배포"| NEW
    NEW --> RECOVERED["✅ 서비스 복구"]

    style DISASTER fill:#e74c3c,color:#fff
    style RECOVERED fill:#27ae60,color:#fff
    style IAC fill:#3498db,color:#fff
    style VELERO fill:#f39c12,color:#fff
    style GITOPS fill:#9b59b6,color:#fff
```

---

## 🔗 다음 강의

> 클러스터를 백업하고 복구하는 방법을 배웠어요. 다음 강의에서는 K8s를 **확장하는 방법** — Custom Resource Definition(CRD)과 Operator 패턴을 배워요. K8s API를 확장해서 나만의 리소스를 만들고, 복잡한 운영을 자동화하는 Operator를 이해해봐요.

[17-operator-crd](./17-operator-crd)
