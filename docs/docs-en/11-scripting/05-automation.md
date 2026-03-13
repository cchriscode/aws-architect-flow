# Automation Strategy

> "I keep checking server status every morning, cleaning logs, deploying... when do I stop doing this manually?" — Automation is the core of DevOps. It eliminates repetitive tasks, reduces human errors, and lets your team focus on valuable work. Now that you've learned [Bash scripts](./01-bash) and [Python scripts](./02-python), let's strategically approach **when, how, and what to automate**.

---

## 🎯 Why Do You Need Automation Strategy?

### Daily Analogy: Restaurant Kitchen Automation

Imagine running a small restaurant.

- **Early stage**: Owner handles orders, cooking, serving, dishwashing themselves
- **Growth stage**: Hire staff, divide roles (front-of-house, kitchen, dishwasher)
- **Expansion stage**: Install kiosk (order automation), dishwasher machine (cleaning automation), POS system (sales auto-calculation)

As a restaurant grows, **machines replace human repetitive work**. DevOps is the same.

### When Automation is Needed

```
Daily repetitive tasks:
• Server status check               → Monitoring automation
• Log cleanup/backup                → Cron jobs
• Deployment execution              → CI/CD pipeline

Tasks prone to human error:
• Server configuration changes      → IaC (Terraform/Ansible)
• Security patch application        → Auto-update
• Certificate renewal               → certbot + timer

Time-consuming tasks:
• Environment setup (dev/staging/prod) → Docker + IaC
• Pre-deployment code review check     → Lint/Test automation
• Incident initial response            → Runbook automation
```

### What Happens Without Automation

Manual work repetition → Accumulated fatigue → More mistakes → Incidents/security issues → Firefighting mode → No time for improvement → Back to manual work

This vicious cycle can only be broken with **automation**.

---

## 🧠 Grasping Core Concepts

### 1. Toil (Repetitive Labor) — Core SRE Concept

> **Analogy**: Peeling 100 potatoes the same way every day in a restaurant

**Toil** in [SRE Principles](../10-sre/01-principles) refers to work with these characteristics:

| Characteristic | Explanation | Example |
|---|---|---|
| **Manual** | Requires human execution | SSH access and manually check logs |
| **Repetitive** | Same task repeats over time | Check server status every morning |
| **Automatable** | Machine can do it | Script can do it completely |
| **Tactical** | No long-term value | Temporary disk cleanup |
| **O(n) Growth** | Grows with service scale | 10 servers → 100 servers |

**Google SRE Goal**: Don't let Toil exceed 50% of engineer's time.

### 2. Automation ROI (Return on Investment)

> **Analogy**: Deciding whether to buy a dishwasher

```
Automation ROI Formula:

ROI = (Time saved × Frequency × Duration) - (Dev time + Maintenance time)

Example 1: Log rotation automation
  - Manual time: 15 min/instance × 365 days/year = 91 hours/year
  - Development: 4 hours
  - Maintenance: 2 hours/year
  - ROI = 91 - (4 + 2) = 85 hours/year saved  → AUTOMATE!

Example 2: Annual migration script
  - Manual time: 2 hours/year × 1 = 2 hours/year
  - Development: 16 hours
  - Maintenance: 4 hours/year
  - ROI = 2 - (16 + 4) = -18 hours  → DOCUMENT instead!
```

### 3. Automation vs Documentation Decision Matrix

```
Frequency × Complexity Matrix:

High frequency + Simple logic:
  → AUTOMATE (cron job, script)
  Examples: Daily backup, log rotation, health check

High frequency + Complex logic:
  → AUTOMATE (Python, Go)
  Examples: Complex deployment, multi-step migration

Low frequency + Simple logic:
  → DOCUMENT (runbook + manual execution)
  Examples: Once-a-year migration, rare procedure

Low frequency + Complex logic:
  → AUTOMATE + DOCUMENT (infrastructure)
  Examples: Disaster recovery, environment setup
```

---

## 🔍 Key Automation Patterns

### Pattern 1: Time-based Automation (Cron)

```bash
# Run daily backups
0 2 * * * /opt/scripts/db-backup.sh >> /var/log/backup.log 2>&1

# Weekly log cleanup
0 3 * * 0 /opt/scripts/log-rotate.sh

# Check expiring certificates
0 6 * * * /opt/scripts/cert-check.sh

# Every 5 minutes: health check
*/5 * * * * /opt/scripts/health-check.sh
```

**Advantages:**
- Simple, no external dependencies
- Easy to monitor and debug
- Works on any Unix system

**Disadvantages:**
- No cross-server coordination
- Hard to restart on failure
- Limited precision (minute-level only)

### Pattern 2: Event-driven Automation

Cloud services emit events when things happen. React automatically.

**AWS CloudWatch → Lambda → Auto-action:**
```
1. Server CPU > 80% → CloudWatch alarm triggers
2. Lambda runs cost-optimization script
3. Auto-stops dev instances
4. Slack notification
```

**GitHub → Webhooks → CI/CD:**
```
1. Code pushed to main branch
2. GitHub webhook triggers
3. Tests run automatically
4. Deploy if tests pass
5. Post status to Slack
```

### Pattern 3: Infrastructure as Code (IaC)

Instead of manual clicks → declare desired state in code.

```hcl
# Terraform: Declare infrastructure state
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  count         = 3  # Creates 3 instances
  tags = {
    Name = "web-${count.index}"
  }
}
```

When you run `terraform apply`:
- Terraform compares desired state (code) with actual state (AWS)
- Creates/modifies/destroys only what's needed
- Fully auditable, reversible, repeatable

### Pattern 4: API-driven Automation

Many services expose APIs. Automate by making API calls.

```python
# Python: AWS cost reporting
import boto3

ce = boto3.client("ce")
costs = ce.get_cost_and_usage(...)

# Send to Slack
requests.post(slack_webhook, json={...})
```

---

## 💻 Practice

### Exercise 1: Create Cron-based Automation

```bash
#!/bin/bash
# daily-health-check.sh — Run daily server health check

set -euo pipefail

SERVERS=("web01.example.com" "web02.example.com" "db01.example.com")
LOG_FILE="/var/log/health-checks.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "===== Daily health check starting ====="

for server in "${SERVERS[@]}"; do
    if ping -c 1 "$server" > /dev/null 2>&1; then
        log "[$server] HEALTHY"
    else
        log "[$server] CRITICAL - unreachable"
        # Send alert
        curl -X POST "$SLACK_WEBHOOK" -d "Server $server is down!"
    fi
done

log "===== Health check complete ====="
```

Setup cron:
```bash
0 9 * * * /opt/scripts/daily-health-check.sh
```

### Exercise 2: AWS Lambda Event-driven Automation

```python
# Lambda function: Auto-stop dev instances when work hours end

import boto3
import json

ec2 = boto3.client("ec2")

def lambda_handler(event, context):
    """Stop dev instances after work hours (6 PM)"""

    # Find dev instances
    response = ec2.describe_instances(
        Filters=[
            {"Name": "tag:Environment", "Values": ["dev"]},
            {"Name": "instance-state-name", "Values": ["running"]},
        ]
    )

    instances_to_stop = []
    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            instances_to_stop.append(instance["InstanceId"])

    # Stop them
    if instances_to_stop:
        ec2.stop_instances(InstanceIds=instances_to_stop)
        return {
            "statusCode": 200,
            "body": json.dumps(f"Stopped {len(instances_to_stop)} instances")
        }

    return {
        "statusCode": 200,
        "body": json.dumps("No instances to stop")
    }
```

Setup: CloudWatch Event every day at 6 PM → triggers Lambda

### Exercise 3: IaC with Terraform

```hcl
# main.tf — Declare infrastructure

terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
}

# Create 3 web servers
resource "aws_instance" "web" {
  count = 3

  ami           = "ami-0c55b159cbfafe1f0"  # Ubuntu 22.04
  instance_type = "t3.micro"

  tags = {
    Name = "web-${count.index + 1}"
    Environment = "production"
  }
}

# Output instance IPs
output "instance_ips" {
  value = [for instance in aws_instance.web : instance.private_ip]
}
```

Run:
```bash
terraform init       # Download plugins
terraform plan       # Preview changes
terraform apply      # Create infrastructure
terraform destroy    # Clean up
```

---

## 📊 Real-world Automation Maturity Model

```
Level 0: Manual
  - All tasks done by hand
  - High toil, high error rate
  - Not scalable

Level 1: Scripts
  - Basic automation scripts (Bash, Python)
  - Reduces manual work
  - Still requires human execution

Level 2: Scheduled (Cron)
  - Tasks run on schedule
  - No human execution needed
  - Limited coordination

Level 3: Event-driven (CloudWatch, webhooks)
  - Automation triggers based on events
  - Real-time response
  - Some cross-system coordination

Level 4: Infrastructure as Code (Terraform)
  - Full environment declared in code
  - Fully reproducible
  - Easy version control and audit

Level 5: GitOps (Kubernetes, ArgoCD)
  - Desired state in Git
  - Auto-sync with actual state
  - Full audit trail
```

---

## ⚠️ Automation Pitfalls

### Pitfall 1: Automating Without Testing

```bash
# ❌ Dangerous
0 2 * * * /opt/scripts/cleanup.sh >> /dev/null 2>&1

# ✅ Safe
0 2 * * * /opt/scripts/cleanup.sh 2>&1 | mail -s "Cleanup Report" admin@company.com
```

Always check if automation ran successfully.

### Pitfall 2: Over-automation

```
❌ Wrong: Automate a 5-minute task that happens once a year
   Dev time: 8 hours
   ROI: negative

✅ Right: Document the procedure and execute manually
   Time: 5 minutes × 1/year = 5 minutes/year
```

### Pitfall 3: Automation Without Monitoring

```bash
# ❌ Just runs, no visibility
0 2 * * * /opt/scripts/backup.sh

# ✅ Monitored and alerted
0 2 * * * /opt/scripts/backup.sh || alert_slack "Backup failed!"
```

---

## 📝 Automation Decision Flowchart

```
Do I need this task done?

Is it manual?
  Yes → Can it be automated?
    Yes → How often?
      Daily/Weekly → Automate with script + cron
      On-event → Event-driven (Lambda, webhook)
      Infrastructure setup → IaC (Terraform)
    No → Document as runbook
  No → Done!

Does it work reliably?
  Yes → Monitor
  No → Fix, then monitor
```

---

## 🔗 Next Steps

Start with simple cron-based automation. Progress to event-driven patterns. Master IaC (Terraform/Ansible). Finally, implement GitOps for maximum reliability and auditability.

The more you automate, the less time you'll spend on Toil, the more time you'll have for improving systems and learning new skills.

> **Golden Rule of Automation**: "Check first, then execute." Always test automation in non-production environments before running in production.
