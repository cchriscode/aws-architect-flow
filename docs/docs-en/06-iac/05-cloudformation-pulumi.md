# CloudFormation / CDK / Pulumi

> [In the previous lecture](./04-ansible), we learned Ansible for server configuration. Now we'll explore **AWS-native IaC tools: CloudFormation, CDK, and Pulumi**. Each tool offers different approaches to managing cloud infrastructure. While [Terraform](./02-terraform-basics) is the industry standard, these tools provide specialized capabilities.

---

## 🎯 Why Learn These Tools?

```
Situations where these tools excel:

• "Our company uses AWS only, do we need Terraform?"                → CloudFormation / CDK
• "I don't want to write 500 lines of YAML"                        → CDK / Pulumi
• "We need multi-cloud support (AWS + GCP)"                         → Pulumi / Terraform
• "New AWS service launched, when will Terraform support it?"       → CloudFormation (usually day 1)
• "I want to write infrastructure tests"                            → CDK / Pulumi
• "We're a large enterprise needing cross-account management"       → CloudFormation StackSet
```

---

## Daily Analogy: Building Construction Tools

| Tool | Analogy | Description |
|------|---------|-------------|
| **CloudFormation** | AWS-specific blueprint form | JSON/YAML, AWS native, quick AWS feature support |
| **CDK** | Programming language-based design | TypeScript/Python generates CloudFormation |
| **Pulumi** | Multi-contractor universal design | TypeScript/Python manages all clouds |
| **Terraform** | Universal design language | HCL works with all cloud providers |

---

## CloudFormation — AWS Native

AWS's built-in IaC service using JSON/YAML templates.

**Advantages:**
- Immediate support for new AWS features
- Native AWS integration
- Free to use
- State managed by AWS

**Template Structure:**

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "VPC + EC2 infrastructure"

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      ImageId: ami-0c55b159cbfafe1f0

Outputs:
  VPCId:
    Value: !Ref MyVPC
    Description: "VPC ID"
    Export:
      Name: !Sub "${AWS::StackName}-vpc-id"
```

**Key Functions:**
- `!Ref` — Reference parameter or resource
- `!Sub` — String substitution
- `!GetAtt` — Get resource attribute
- `!If` — Conditional value
- `!ImportValue` — Reference other stack outputs

**Stack Management:**

```bash
# Create stack
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yaml

# Update with Change Set (preview changes first)
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name update-1 \
  --template-body file://template.yaml

# Review changes
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name update-1

# Apply changes
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name update-1
```

---

## CDK — Code-Based CloudFormation

AWS CDK lets you define infrastructure in programming languages (TypeScript, Python, Java, Go).

**How it works:**
1. Write infrastructure code in your language
2. CDK synthesizes to CloudFormation JSON
3. Deploy using CloudFormation

**Advantages:**
- Full programming language power
- Unit testing support
- Better for developers

**Setup:**

```bash
npm install -g aws-cdk
cdk init app --language typescript
cdk bootstrap aws://ACCOUNT/REGION  # One-time setup per region
```

**TypeScript Example:**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    // S3 bucket
    const bucket = new s3.Bucket(this, 'MyBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function
    new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
  }
}

const app = new cdk.App();
new MyStack(app, 'MyStack');
```

**Python Example:**

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as lambda_,
)
from constructs import Construct

class MyStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # S3 bucket
        bucket = s3.Bucket(
            self, "MyBucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Lambda function
        lambda_.Function(
            self, "MyFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_asset("lambda"),
            environment={
                "BUCKET_NAME": bucket.bucket_name,
            },
        )
```

**Commands:**

```bash
cdk synth                    # Generate CloudFormation
cdk diff                     # Show changes
cdk deploy                   # Deploy
cdk destroy                  # Delete
```

---

## Pulumi — Multi-Cloud Programming

Pulumi enables infrastructure as code using general programming languages across all clouds.

**Advantages:**
- Multi-cloud support (AWS, GCP, Azure, Kubernetes)
- Full programming language features
- No CloudFormation dependency
- Pulumi Cloud for state management

**Installation:**

```bash
brew install pulumi
pulumi new aws-typescript    # Create project
```

**TypeScript Example:**

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
});

// S3 bucket
const bucket = new aws.s3.Bucket("my-bucket", {
    versioning: {
        enabled: true,
    },
    tags: {
        Environment: "dev",
    },
});

// Export outputs
export const vpcId = vpc.id;
export const bucketName = bucket.id;
```

**Python Example:**

```python
import pulumi
import pulumi_aws as aws

# VPC
vpc = aws.ec2.Vpc("my-vpc",
    cidr_block="10.0.0.0/16",
)

# S3 bucket
bucket = aws.s3.BucketV2("my-bucket",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    tags={
        "Environment": "dev",
    },
)

# Export outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("bucket_name", bucket.id)
```

**Commands:**

```bash
pulumi preview              # Show changes
pulumi up                   # Deploy
pulumi destroy              # Delete
pulumi config               # Manage configuration
```

---

## Comparison Matrix

| Feature | CloudFormation | CDK | Terraform | Pulumi |
|---------|---|---|---|---|
| **Language** | JSON/YAML | TS, Python, Java, Go | HCL | TS, Python, Go |
| **Multi-cloud** | AWS only | AWS only | All clouds | All clouds |
| **State** | AWS managed | AWS managed | File/S3/Cloud | Pulumi Cloud |
| **New service support** | Immediate | ~1 week | ~1-4 weeks | ~1-2 weeks |
| **Programming features** | Limited | Full | Partial | Full |
| **Testing** | TaskCat | Unit tests | Terratest | Unit tests |
| **Learning curve** | Medium | Low | Medium | Low |
| **Community** | Good | Growing | Very large | Growing |
| **Cost** | Free | Free | Free/Enterprise | Free/Team |

---

## CloudFormation StackSet (Multi-Account)

Deploy infrastructure to multiple accounts and regions:

```bash
aws cloudformation create-stack-set \
  --stack-set-name security-baseline \
  --template-body file://template.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true

# Deploy to organization
aws cloudformation create-stack-instances \
  --stack-set-name security-baseline \
  --deployment-targets OrganizationalUnitIds=ou-abc123 \
  --regions ap-northeast-2 us-east-1 eu-west-1
```

---

## Decision Tree

```
AWS only?
├─ Yes → Team knows programming?
│        ├─ Yes → CDK (best for developers)
│        └─ No  → CloudFormation (simpler)
└─ No  → Pulumi / Terraform
         (Pulumi if programming, Terraform for HCL)
```

---

## Common Mistakes

1. **Changing resource names in CloudFormation** — Causes deletion and recreation
   - Solution: Use `DeletionPolicy: Retain`

2. **Forgetting `cdk bootstrap`** — CDK needs to set up S3 and IAM
   - Solution: `cdk bootstrap aws://ACCOUNT/REGION`

3. **Mixing tools on same resources** — State corruption
   - Solution: One tool per resource

4. **Circular dependencies** — Template fails to deploy
   - Solution: Use separate resources for dependencies

5. **Ignoring Change Sets** — Surprise deletions
   - Solution: Always review Change Sets before execution

---

## Summary Table

| Aspect | CloudFormation | CDK | Pulumi | Terraform |
|--------|---|---|---|---|
| **Best for** | AWS-only governance | AWS + dev teams | Multi-cloud + dev | Universal IaC |
| **Learning** | Medium (YAML) | Low (code) | Low (code) | Medium (HCL) |
| **Enterprise** | Excellent (StackSet) | Good | Growing | Market leader |
| **Adoption** | High (AWS native) | Growing | Growing | Highest |

---

## Next Steps

Next lecture: **[IaC Testing and Policy](./06-testing-policy)** — Validating your infrastructure code

**Related Lectures:**
- [IaC Concept](./01-concept) — IaC fundamentals
- [Terraform Basics](./02-terraform-basics) — HCL and Terraform
- [AWS IAM](../05-cloud-aws/01-iam) — Understanding AWS permissions
- [AWS VPC](../05-cloud-aws/02-vpc) — Network infrastructure
