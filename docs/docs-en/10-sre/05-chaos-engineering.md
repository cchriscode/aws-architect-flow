# Chaos Engineering — Making Failures Intentionally to Build Strong Systems

> In [Incident Management](./03-incident-management), you learned how to **respond when failures happen**. But responding after failure is already too late. **Chaos Engineering** is about intentionally injecting failures to discover system weaknesses before they cause real problems. If you've touched AWS FIS in [DR Strategies](../05-cloud-aws/17-disaster-recovery), now we'll deep-dive into **principles, tools, and real-world applications** of chaos engineering.

---

## 🎯 Why Learn Chaos Engineering?

### Daily Analogy: Earthquake Drills

Think of **earthquake drills in schools**.

- The alarm sounds without a real earthquake (**failure injection**)
- We observe if students take shelter correctly (**system response observation**)
- We find weak points like "the emergency exit was locked" (**identify vulnerabilities**)
- Before the next drill, we fix the exit lock and replace speakers (**improvement**)
- Next drill verifies improvements (**repeat validation**)

Without these drills, students wouldn't know where to go during a real earthquake, and locked exits could trap them.

**Chaos Engineering is exactly this drill. The difference is the target is your **production system** instead of a school.**

```
Real-world situations needing chaos engineering:

• "Will the service auto-recover if one server dies?"           → Pod kill test
• "Do timeouts work properly if network slows?"               → Network delay test
• "Does auto-scaling activate at 100% CPU?"                  → CPU stress test
• "What happens if the disk fills up?"                         → Disk fill test
• "Does the service continue if an entire AZ fails?"          → AZ failure test
• "Do alerts actually fire when failures occur?"              → Alert validation
• "Does DR actually work?"                                    → GameDay test
• Interview: "Chaos engineering experience?"                  → Chaos Maturity Model
```

---

## 🧠 Core Concepts

### Netflix's Chaos Monkey Story

In 2010, Netflix migrated from its own datacenter to AWS. In cloud environments, servers can die anytime, networks can be unreliable. Netflix engineers thought:

> "Failures **will definitely happen**. Let's intentionally cause failures to verify our system handles them properly."

**Chaos Monkey** was born from this philosophy, becoming a complete engineering discipline.

### Five Principles of Chaos Engineering

Netflix's [Principles of Chaos Engineering](https://principlesofchaos.org/) outlines five core principles:

```
1️⃣ Establish Steady State Hypothesis
   Define "normal state" numerically and verify it's maintained after the test

2️⃣ Experiment in Real Environment
   Closer to production = More trustworthy results

3️⃣ Automate Continuous Execution
   Not manual tests, but CI/CD-like repeated automation

4️⃣ Minimize Blast Radius
   Start small and gradually expand

5️⃣ Reflect Real Events
   Test scenarios that can actually happen
```

### Key Terminology

| Term | Definition | Analogy |
|------|-----------|---------|
| **Steady State** | System's measurable normal condition | A healthy person's temperature: 36.5°C |
| **Hypothesis** | Expected outcome after fault injection | "Even if one pod dies, p99 < 300ms" |
| **Blast Radius** | Impact scope of the test | Drill affects only building 3, not the whole school |
| **Abort Condition** | Immediate stop trigger | If a student actually gets hurt, stop immediately |
| **GameDay** | Large-scale disaster simulation involving entire team | Company-wide fire drill |
| **Chaos Maturity** | Organization's chaos engineering adoption level | Beginner → Advanced levels |

---

## 🔍 Deep Dive

### 1. Steady State Hypothesis

The most important concept in chaos engineering. **Define "normal state" numerically before running experiments.**

**Bad vs Good Hypotheses:**

```
❌ Bad: "The system will handle server failures well"
   → "Well" is not measurable

✅ Good: "If we kill 1 of 3 pods:
   - p99 response time stays < 300ms
   - Error rate stays < 0.5%
   - Throughput stays > 800 rps"
   → Concrete numbers for verification
```

**Steady State Metrics Examples:**

| Layer | Metric | Normal Range | Source |
|-------|--------|--------------|--------|
| User Experience | p99 response time | < 200ms | APM |
| User Experience | Error rate | < 0.1% | Load Balancer |
| Application | Requests/second | > 1000 RPS | Prometheus |
| Infrastructure | CPU usage | < 70% | CloudWatch |
| Infrastructure | Memory usage | < 80% | Node Exporter |
| Data | DB query time | < 50ms | Slow Query Log |
| Business | Order success rate | > 99.5% | Business metrics |

**💡 Tip**: If you've already defined SLOs, use those SLI/SLO metrics as Steady State metrics. This makes experiments directly validate SLO compliance.

### 2. Controlling Blast Radius

The scariest outcome in chaos engineering is **experiments becoming real failures**. Controlling blast radius is critical.

**Blast Radius Expansion Strategy:**

```
📍 Level 1 — Dev Environment
   Target: dev/staging
   Risk: ⭐☆☆☆☆
   → No customer impact possible

📍 Level 2 — Single Production Instance
   Target: One server in production
   Time: Max 5 min
   Risk: ⭐⭐☆☆☆
   → Load balancer auto-distributes traffic

📍 Level 3 — Single Service
   Target: Entire microservice
   Time: Max 10 min
   Risk: ⭐⭐⭐☆☆
   → Validates Circuit Breaker, Retry logic

📍 Level 4 — Infrastructure
   Target: One AZ or region portion
   Time: Max 30 min
   Risk: ⭐⭐⭐⭐☆
   → Real DR validation

📍 Level 5 — Full Region
   Target: Multi-region failover
   Time: 1+ hours
   Risk: ⭐⭐⭐⭐⭐
   → Complete DR scenario
```

**Abort Conditions:**

```yaml
abort_conditions:
  - metric: error_rate
    threshold: "> 5%"
    duration: "30s"
    action: "immediate_rollback"

  - metric: p99_latency
    threshold: "> 2000ms"
    duration: "1m"
    action: "immediate_rollback"

  - metric: revenue_impact
    threshold: "> $1000/min loss"
    action: "immediate_rollback + page oncall"
```

### 3. Common Chaos Experiments

| Type | Description | Validates | Difficulty |
|------|-------------|-----------|-----------|
| **Pod Kill** | Force-terminate container | Auto-recovery, restart policy | Beginner |
| **Network Delay** | Inject network latency (100-500ms) | Timeouts, Circuit Breaker | Beginner |
| **Network Loss** | Inject packet loss (10-50%) | Retry logic, idempotency | Intermediate |
| **Network Partition** | Block service-to-service communication | Fallback, graceful degradation | Intermediate |
| **CPU Stress** | Force CPU to 100% | Auto-scaling, resource limits | Beginner |
| **Memory Stress** | Force memory usage up | OOM handling, memory limits | Intermediate |
| **Disk Fill** | Fill disk space | Log rotation, disk alerts | Beginner |
| **DNS Failure** | DNS resolution fails | DNS caching, IP fallback | Intermediate |
| **AZ Failure** | Entire availability zone down | Multi-AZ deployment, DR | Advanced |
| **Time Travel** | Change system time | Certificate expiry, cache TTL | Advanced |

---

### 4. Chaos Mesh (K8s Native)

Chaos Mesh is a CNCF incubating project for Kubernetes-native chaos engineering.

**Installation:**

```bash
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm repo update

kubectl create ns chaos-mesh

helm install chaos-mesh chaos-mesh/chaos-mesh \
  -n chaos-mesh \
  --set chaosDaemon.runtime=containerd \
  --version 2.7.0
```

**Network Delay Experiment:**

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-delay-payment
  namespace: default
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - default
    labelSelectors:
      app: payment-service
  delay:
    latency: "200ms"       # 200ms additional latency
    jitter: "50ms"         # ±50ms variation
  direction: to            # Apply to outbound traffic
  target:
    selector:
      namespaces:
        - default
      labelSelectors:
        app: order-service  # Only to order-service
  duration: "5m"           # Run for 5 minutes
  scheduler:
    cron: "@every 24h"     # Auto-run daily
```

**Pod Kill Experiment:**

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-nginx
  namespace: default
spec:
  action: pod-kill
  mode: one                # Kill only 1 pod
  selector:
    namespaces:
      - default
    labelSelectors:
      app: nginx
  gracePeriod: 0           # Force kill immediately
  duration: "1m"           # Repeat every 1 minute
```

**CPU Stress Experiment:**

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-stress-api
  namespace: default
spec:
  mode: one
  selector:
    namespaces:
      - default
    labelSelectors:
      app: api-server
  stressors:
    cpu:
      workers: 2          # 2 CPU cores at 100%
      load: 80            # 80% load
  duration: "3m"           # Run 3 minutes
```

---

### 5. AWS Fault Injection Simulator (FIS)

AWS FIS is a managed chaos engineering service for AWS resources.

**Supported Actions:**

```
EC2: Stop, Terminate, Reboot instances
ECS: Drain containers, stop tasks
RDS: Reboot instances, cluster failover
Network: Disrupt connectivity
S3: Pause replication
SSM: Run CPU/Memory stress
```

**FIS Template Example (Terraform):**

```hcl
resource "aws_fis_experiment_template" "az_failure" {
  description = "AZ failure simulation"
  role_arn    = aws_iam_role.fis_role.arn

  # Abort condition
  stop_condition {
    source = "aws:cloudwatch:alarm"
    value  = aws_cloudwatch_metric_alarm.high_error_rate.arn
  }

  # Action: Stop EC2 instances
  action {
    name      = "stop-ec2-in-az-a"
    action_id = "aws:ec2:stop-instances"

    target {
      key   = "Instances"
      value = "ec2-in-az-a"
    }
  }

  # Target: AZ-a production instances
  target {
    name           = "ec2-in-az-a"
    resource_type  = "aws:ec2:instance"
    selection_mode = "ALL"

    resource_tag {
      key   = "Environment"
      value = "production"
    }

    filter {
      path   = "Placement.AvailabilityZone"
      values = ["ap-northeast-2a"]
    }
  }
}
```

---

### 6. Chaos Maturity Model

Assesses an organization's chaos engineering adoption level.

```
Level 0 — None
  Chaos engineering not adopted
  Failures = Surprises

Level 1 — Starting
  Manual experiments in dev environment
  1-2 people doing it

Level 2 — Growing
  Regular experiments in staging
  Hypothesis + metrics based

Level 3 — Mature
  Production experiments
  Automated CI/CD pipeline
  Regular GameDay exercises

Level 4 — Advanced
  Continuous chaos
  CI/CD integrated
  Organization-wide culture
```

---

## 💻 Try It Yourself

### Practice 1: Run a Simple Pod Kill Test

```bash
# Install Chaos Mesh
helm install chaos-mesh chaos-mesh/chaos-mesh -n chaos-mesh

# Create a test deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-test
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx-test
  template:
    metadata:
      labels:
        app: nginx-test
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
EOF

# Run Pod Kill chaos
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: kill-one-pod
  namespace: default
spec:
  action: pod-kill
  mode: one
  selector:
    labelSelectors:
      app: nginx-test
  duration: "1m"
EOF

# Observe with
kubectl get pods -l app=nginx-test -w
```

### Practice 2: Network Latency Test

```bash
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: high-latency
spec:
  action: delay
  mode: all
  selector:
    labelSelectors:
      app: nginx-test
  delay:
    latency: "500ms"
  duration: "2m"
EOF
```

---

This comprehensive guide covers chaos engineering from principles through practical tools and real-world applications. Start with Level 1 (dev environment), gradually progress to Level 4 (organization-wide culture).
