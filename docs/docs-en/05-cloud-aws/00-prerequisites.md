# Preparing the AWS Cloud Learning Environment

> Before diving into AWS, you need to create an account, configure security settings, and install CLI tools. Since cloud skills cannot be learned without hands-on practice, follow this guide and set everything up **by hand**. It is recommended that you complete [Networking Basics](../02-networking/01-osi-tcp-udp) and [Basic Linux Commands](../01-linux/00-linux-commands) before proceeding.

---

## Step 1: Create an AWS Account

### Sign-Up Process

1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Click **"Create an AWS Account"** in the upper right corner
3. Enter your email address (this email becomes the Root account)
4. Enter an account name (e.g., `devops-study`)
5. Enter the verification code sent to your email
6. Set a Root user password
7. Enter contact information (choose Personal or Business)
8. **Enter credit card (or debit card) information**
9. Verify your identity (phone number verification)
10. Select a support plan -> **Basic Support (Free)**
11. After completion, access the AWS Management Console

### What Is the Free Tier?

AWS provides a Free Tier that allows you to use key services for free for **12 months** after signing up.

| Service | Free Tier Scope | Duration |
|---------|----------------|----------|
| EC2 | t2.micro or t3.micro 750 hours/month | 12 months |
| S3 | 5GB storage, 20,000 GET, 2,000 PUT | 12 months |
| RDS | db.t2.micro or db.t3.micro 750 hours/month | 12 months |
| Lambda | 1 million requests/month, 400,000 GB-seconds | Always free |
| DynamoDB | 25GB storage, 25 read/write capacity units | Always free |
| CloudWatch | Basic monitoring, 10 alarms | Always free |

### Note

**A credit card is required.** If you exceed the Free Tier limits, you will be charged. Be sure to follow the "Set Up Billing Alerts" step later in this guide.

### Practical Tip

It is recommended to **create a separate learning AWS account with a personal email**. Even if you accidentally delete resources or incur charges, it will not affect your company account.

---

## Step 2: Secure the Root Account (MFA)

The Root account is the **top-level account with full permissions** in AWS. If this account is compromised, your entire infrastructure is at risk, so you must configure MFA (Multi-Factor Authentication).

### MFA Setup Process

1. Log in to the AWS Console with the Root account
2. Click your account name in the upper right corner -> select **"Security credentials"**
3. In the **"Multi-factor authentication (MFA)"** section, click **"Assign MFA"**
4. Enter a device name (e.g., `my-phone`)
5. Select the MFA device type:
   - **Authenticator app** (recommended): Google Authenticator, Authy, etc.
   - Security key: Hardware keys such as YubiKey
6. Open the authenticator app on your smartphone and scan the QR code
7. Enter the two consecutive MFA codes that appear
8. Click **"Add MFA"**

### Verification

After logging out and logging back in, you will be asked for an **MFA code after entering your password**. If you see this screen, the setup is complete.

### Note

If you lose the smartphone with the MFA app, you will not be able to access the Root account. When setting up MFA, **make sure to save the backup codes in a safe place**.

---

## Step 3: Create an IAM User

The Root account should only be used in emergencies. **Day-to-day work should be done with an IAM user.** This is the foundation of AWS security.

### IAM User Creation Process

1. Type **"IAM"** in the search bar at the top of the AWS Console -> enter the IAM service
2. Click **"Users"** in the left menu
3. Click **"Create user"**
4. Enter a user name (e.g., `devops-admin`)
5. Check **"Provide user access to the AWS Management Console"**
6. Select **"I want to create an IAM user"**
7. Set a console password (custom password)
8. Uncheck "User must create a new password at next sign-in" (for learning purposes)
9. Click **"Next"**

### Set Permissions

1. Select **"Attach policies directly"**
2. Type `AdministratorAccess` in the search box
3. Check **"AdministratorAccess"**
4. Click **"Next"** -> **"Create user"**

### Create Programmatic Access Key

An Access Key is required to use AWS from the CLI.

1. Click on the created user name -> enter the user details page
2. Click the **"Security credentials"** tab
3. Click **"Create access key"**
4. For the use case, select **"Command Line Interface (CLI)"**
5. Check the confirmation checkbox -> **"Next"**
6. Enter a description tag (e.g., `devops-study-cli`) -> **"Create access key"**
7. The **Access Key ID** and **Secret Access Key** are displayed on screen

### Note

**The Secret Access Key can only be viewed on this screen.** Once you close the page, you cannot see it again. Make sure to copy it to a safe place or click **"Download .csv file"**.

```text
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

The values above are examples. Never share your actual keys with anyone or commit them to Git.

### Log In as an IAM User

1. Copy the **"Sign-in URL for IAM users in this account"** from the IAM Dashboard
2. Format: `https://123456789012.signin.aws.amazon.com/console`
3. Go to this URL and log in with the IAM user name and password

### Practical Tip

The number in the login URL (`123456789012`) is your AWS Account ID. You can set an alias for this URL.

```
IAM -> Dashboard -> "Account Alias" -> "Create" -> Enter a desired name (e.g., devops-study)
-> The login URL changes to https://devops-study.signin.aws.amazon.com/console
```

---

## Step 4: Install AWS CLI

AWS CLI is a command-line tool for operating AWS services from the terminal. Almost everything you can do by clicking in the console (web) can also be done via the CLI.

### Windows

1. Download [https://awscli.amazonaws.com/AWSCLIV2.msi](https://awscli.amazonaws.com/AWSCLIV2.msi)
2. Run the MSI installer
3. Complete the installation with default settings

Or use Chocolatey:

```bash
choco install awscli
```

### macOS

```bash
brew install awscli
```

### Linux (Ubuntu/Debian)

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/
```

### Verify Installation

```bash
aws --version
```

### Expected Output

```text
aws-cli/2.17.20 Python/3.12.5 Darwin/23.4.0 source/arm64
```

The details may differ depending on your OS, but if version information is displayed, the installation was successful.

---

## Step 5: Configure AWS CLI

Register the Access Key created in Step 3 with the installed CLI.

```bash
aws configure
```

Enter the following items in order.

```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

| Item | Description | Recommended Value |
|------|-------------|-------------------|
| Access Key ID | The key ID created in Step 3 | Your own key |
| Secret Access Key | The secret key created in Step 3 | Your own key |
| Default region name | Default region | `ap-northeast-2` (Seoul) |
| Default output format | Output format | `json` |

### Verify Configuration

```bash
aws sts get-caller-identity
```

### Expected Output

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-admin"
}
```

If your account ID and IAM user name are displayed, the CLI configuration is complete.

### Additional Verification: S3 Access Test

```bash
aws s3 ls
```

### Expected Output

If you have not created any S3 buckets yet, it is normal for nothing to be displayed. What matters is that **no error occurs**.

```text
(empty output - normal)
```

If you see an error like the one below, re-check your key configuration.

```text
An error occurred (InvalidAccessKeyId) when calling the ListBuckets operation:
The AWS Access Key Id you provided does not exist in our records.
```

### Practical Tip

AWS CLI configuration information is stored in the following files.

```bash
# Credentials
cat ~/.aws/credentials
```

```text
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```bash
# Region and output format settings
cat ~/.aws/config
```

```text
[default]
region = ap-northeast-2
output = json
```

### Note

The `~/.aws/credentials` file stores secret keys in plaintext. **Never commit this file to Git.** It is recommended to add `.aws/` to your `.gitignore`.

---

## Step 6: Set Up Billing Alerts

The scariest thing about learning AWS is **unexpected charges**. Be sure to set up billing alerts.

### Budget Alert Setup Process

1. Type **"Billing"** in the search bar at the top of the AWS Console
2. Click **"Budgets"** in the left menu
3. Click **"Create budget"**
4. Select **"Customize (advanced)"**
5. Budget type: select **"Cost budget"** -> Next
6. Budget name: `monthly-10-dollar-alert`
7. Period: **Monthly**
8. Budget amount: enter **$10.00**
9. Click **"Next"**
10. Set alert thresholds:
    - **Threshold 1**: Actual cost > 80% ($8) -> Email alert
    - **Threshold 2**: Actual cost > 100% ($10) -> Email alert
    - **Threshold 3**: Forecasted cost > 100% ($10) -> Email alert
11. Enter your email address (the email to receive alerts)
12. Click **"Create budget"**

### Note

Billing alerts **do not automatically stop services.** Even if you receive an alert, services will not be shut down automatically. When you receive an alert, you must go into the console yourself and delete unnecessary resources.

### Practical Tip

After you finish studying, make sure to check the following.

1. **EC2 instances** -> Terminate all running instances
2. **Elastic IPs** -> Release any unassociated ones (unused Elastic IPs are also charged!)
3. **EBS volumes** -> Delete any unattached ones
4. **NAT Gateway** -> Delete (charged hourly, not included in Free Tier!)
5. **RDS instances** -> Delete or stop
6. **Load Balancer** -> Delete (Free Tier coverage is limited)

In particular, **NAT Gateway** is not included in the Free Tier and costs approximately $0.045 per hour. If you forget to delete it after a VPC lab, you could see charges of $30 or more per month.

---

## Step 7: Overview of Key AWS Console Menus

When you log in to the AWS Console, you may feel overwhelmed by the hundreds of services displayed. Get familiar with the services primarily used in this course.

### Key Service Locations

| Service | Console Search Term | Purpose | Lesson |
|---------|-------------------|---------|--------|
| IAM | `IAM` | User and permission management | [01-iam](./01-iam) |
| VPC | `VPC` | Network configuration | [02-vpc](./02-vpc) |
| EC2 | `EC2` | Virtual servers | [03-ec2-autoscaling](./03-ec2-autoscaling) |
| S3 | `S3` | File storage | [04-storage](./04-storage) |
| RDS | `RDS` | Relational database | [05-database](./05-database) |
| ECS/EKS | `ECS` or `EKS` | Container services | [09-container-services](./09-container-services) |
| CloudWatch | `CloudWatch` | Monitoring and logs | [13-management](./13-management) |
| Billing | `Billing` | Cost management | Step 6 of this document |

### Practical Tip

Pin frequently used services by clicking the **star (favorites)** icon at the top of the console. This is much faster than searching for them each time.

Also, always verify that the region is set correctly. Check that the region displayed in the upper right corner is **"Asia Pacific (Seoul) ap-northeast-2"**. If you create resources in a different region, they will not be visible in the Seoul region.

---

## Final Verification

### 1. Verify AWS CLI Authentication

```bash
aws sts get-caller-identity
```

Expected output:

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-admin"
}
```

### 2. Verify S3 Access

```bash
aws s3 ls
```

If it runs without errors, everything is normal (empty output is also normal).

### 3. Verify Region Setting

```bash
aws configure get region
```

Expected output:

```text
ap-northeast-2
```

---

## Troubleshooting

### Authentication Fails After aws configure

**Symptom:** `Unable to locate credentials`

**Verify:**

```bash
cat ~/.aws/credentials
```

If the file is empty or does not exist, run `aws configure` again.

---

### Cannot Log In to Console as IAM User

**Things to check:**
1. Verify that the login URL is correct (`https://AccountID.signin.aws.amazon.com/console`)
2. Confirm you are logging in as an **"IAM user"**, not a "Root user"
3. Confirm the Account ID (12-digit number) is entered correctly

---

### MFA Code Does Not Match After Setup

**Cause:** If the time on your smartphone does not match the server time, the MFA code will be incorrect.

**Solution:** Enable **"Automatic date and time"** in your smartphone settings.

---

## Next Step

Once the environment preparation is complete, proceed to [IAM (Identity and Access Management)](./01-iam). You will learn about users, roles, and policies, which are the core of AWS security.
