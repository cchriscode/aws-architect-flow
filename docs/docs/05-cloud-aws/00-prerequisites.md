# AWS 클라우드 학습 환경 준비

> AWS를 본격적으로 배우기 전에, 계정을 만들고 보안 설정을 하고 CLI 도구를 설치해야 해요. 클라우드는 실습 없이는 절대 익힐 수 없으므로, 이 가이드를 따라 **직접 손으로** 세팅하세요. [네트워킹 기초](../02-networking/01-osi-tcp-udp)와 [리눅스 기본 명령어](../01-linux/00-linux-commands)를 먼저 학습하고 오는 것을 권장해요.

---

## 1단계: AWS 계정 생성

### 가입 절차

1. [https://aws.amazon.com](https://aws.amazon.com) 접속
2. 우측 상단 **"AWS 계정 생성"** 클릭
3. 이메일 주소 입력 (이 이메일이 Root 계정이 됨)
4. 계정 이름 입력 (예: `devops-study`)
5. 이메일로 전송된 인증 코드 입력
6. Root 사용자 비밀번호 설정
7. 연락처 정보 입력 (개인/비즈니스 선택)
8. **신용카드(또는 체크카드) 정보 입력**
9. 본인 인증 (전화번호 인증)
10. 지원 플랜 선택 → **Basic Support (무료)** 선택
11. 완료 후 AWS Management Console 접속

### 프리 티어란?

AWS는 신규 가입 후 **12개월간** 주요 서비스를 무료로 사용할 수 있는 프리 티어(Free Tier)를 제공해요.

| 서비스 | 프리 티어 범위 | 기간 |
|--------|---------------|------|
| EC2 | t2.micro 또는 t3.micro 750시간/월 | 12개월 |
| S3 | 5GB 저장, 20,000 GET, 2,000 PUT | 12개월 |
| RDS | db.t2.micro 또는 db.t3.micro 750시간/월 | 12개월 |
| Lambda | 100만 요청/월, 400,000 GB-초 | 항상 무료 |
| DynamoDB | 25GB 저장, 25 읽기/쓰기 용량 | 항상 무료 |
| CloudWatch | 기본 모니터링, 10 알림 | 항상 무료 |

### 주의

**신용카드는 반드시 필요해요.** 프리 티어 범위를 넘기면 실제로 과금돼요. 이 가이드 뒤쪽의 "비용 알림 설정" 단계를 반드시 따라하세요.

### 실무 팁

학습용 AWS 계정은 **개인 이메일로 별도 생성**하는 것을 추천해요. 실수로 리소스를 삭제하거나 비용이 발생해도 회사 계정에 영향이 없어요.

---

## 2단계: Root 계정 보안 설정 (MFA)

Root 계정은 AWS에서 **모든 권한을 가진 최상위 계정**이에요. 이 계정이 탈취되면 전체 인프라가 위험해지므로, 반드시 MFA(Multi-Factor Authentication)를 설정해야 해요.

### MFA 설정 절차

1. AWS 콘솔에 Root 계정으로 로그인
2. 우측 상단 계정 이름 클릭 → **"보안 자격 증명"** 선택
3. **"멀티 팩터 인증(MFA)"** 섹션에서 **"MFA 할당"** 클릭
4. 디바이스 이름 입력 (예: `my-phone`)
5. MFA 디바이스 유형 선택:
   - **인증 앱** (추천): Google Authenticator, Authy 등
   - 보안 키: YubiKey 등 하드웨어 키
6. 스마트폰에서 인증 앱을 열고 QR 코드 스캔
7. 연속으로 나타나는 MFA 코드 2개 입력
8. **"MFA 추가"** 클릭

### 확인 방법

로그아웃 후 다시 로그인하면, 비밀번호 입력 후 **MFA 코드를 추가로 요구**해요. 이 화면이 나오면 설정 완료예요.

### 주의

MFA 앱을 설치한 스마트폰을 분실하면 Root 계정에 접근할 수 없어요. 설정할 때 **백업 코드를 반드시 안전한 곳에 저장**하세요.

---

## 3단계: IAM 사용자 생성

Root 계정은 비상시에만 사용하고, **일상 작업은 IAM 사용자**로 진행해요. 이것이 AWS 보안의 기본이에요.

### IAM 사용자 생성 절차

1. AWS 콘솔 상단 검색창에 **"IAM"** 입력 → IAM 서비스 진입
2. 좌측 메뉴에서 **"사용자"** 클릭
3. **"사용자 생성"** 클릭
4. 사용자 이름 입력 (예: `devops-admin`)
5. **"AWS Management Console에 대한 사용자 액세스 권한 제공"** 체크
6. **"IAM 사용자를 생성하고 싶음"** 선택
7. 콘솔 비밀번호 설정 (사용자 지정 비밀번호)
8. "사용자는 다음 로그인 시 새 암호를 생성해야 합니다" 체크 해제 (학습용)
9. **"다음"** 클릭

### 권한 설정

1. **"직접 정책 연결"** 선택
2. 검색창에 `AdministratorAccess` 입력
3. **"AdministratorAccess"** 체크
4. **"다음"** → **"사용자 생성"** 클릭

### 프로그래밍 방식 액세스 키 생성

CLI에서 AWS를 사용하려면 Access Key가 필요해요.

1. 생성한 사용자 이름 클릭 → 사용자 상세 페이지 진입
2. **"보안 자격 증명"** 탭 클릭
3. **"액세스 키 만들기"** 클릭
4. 사용 사례에서 **"Command Line Interface(CLI)"** 선택
5. 확인 체크박스 체크 → **"다음"**
6. 설명 태그 입력 (예: `devops-study-cli`) → **"액세스 키 만들기"**
7. **Access Key ID**와 **Secret Access Key**가 화면에 표시됨

### 주의

**Secret Access Key는 이 화면에서만 확인 가능해요.** 페이지를 닫으면 다시 볼 수 없어요. 반드시 안전한 곳에 복사해두거나 `.csv 파일 다운로드`를 클릭하세요.

```text
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

위 값은 예시예요. 절대 실제 키를 다른 사람과 공유하거나 Git에 커밋하지 마세요.

### IAM 사용자로 로그인하기

1. IAM 대시보드에서 **"이 계정의 IAM 사용자를 위한 로그인 URL"** 복사
2. 형식: `https://123456789012.signin.aws.amazon.com/console`
3. 이 URL로 접속하여 IAM 사용자 이름과 비밀번호로 로그인

### 실무 팁

로그인 URL의 숫자(`123456789012`)가 AWS 계정 ID예요. 이 URL에 별칭(alias)을 설정할 수 있어요.

```
IAM → 대시보드 → "계정 별칭" → "생성" → 원하는 이름 입력 (예: devops-study)
→ 로그인 URL이 https://devops-study.signin.aws.amazon.com/console 로 변경
```

---

## 4단계: AWS CLI 설치

AWS CLI는 터미널에서 AWS 서비스를 조작하는 명령줄 도구예요. 콘솔(웹)에서 클릭으로 할 수 있는 거의 모든 작업을 CLI로도 할 수 있어요.

### Windows

1. [https://awscli.amazonaws.com/AWSCLIV2.msi](https://awscli.amazonaws.com/AWSCLIV2.msi) 다운로드
2. MSI 설치 프로그램 실행
3. 기본 설정으로 설치 완료

또는 Chocolatey 사용:

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

### 설치 확인

```bash
aws --version
```

### 예상 출력

```text
aws-cli/2.17.20 Python/3.12.5 Darwin/23.4.0 source/arm64
```

OS에 따라 세부 내용은 다르지만, 버전 정보가 출력되면 성공이에요.

---

## 5단계: AWS CLI 설정

설치한 CLI에 3단계에서 생성한 Access Key를 등록해요.

```bash
aws configure
```

아래 항목을 순서대로 입력해요.

```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

| 항목 | 설명 | 추천 값 |
|------|------|---------|
| Access Key ID | 3단계에서 생성한 키 ID | 본인의 키 |
| Secret Access Key | 3단계에서 생성한 비밀 키 | 본인의 키 |
| Default region name | 기본 리전 | `ap-northeast-2` (서울) |
| Default output format | 출력 형식 | `json` |

### 설정 확인

```bash
aws sts get-caller-identity
```

### 예상 출력

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-admin"
}
```

본인의 계정 ID와 IAM 사용자 이름이 출력되면 CLI 설정 완료예요.

### 추가 확인: S3 접근 테스트

```bash
aws s3 ls
```

### 예상 출력

아직 S3 버킷을 만들지 않았다면 아무것도 출력되지 않는 게 정상이에요. **에러가 나지 않는 것**이 중요해요.

```text
(빈 출력 - 정상)
```

만약 아래와 같은 에러가 나오면 키 설정을 다시 확인하세요.

```text
An error occurred (InvalidAccessKeyId) when calling the ListBuckets operation:
The AWS Access Key Id you provided does not exist in our records.
```

### 실무 팁

AWS CLI 설정 정보는 아래 파일에 저장돼요.

```bash
# 인증 정보
cat ~/.aws/credentials
```

```text
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```bash
# 리전, 출력 형식 설정
cat ~/.aws/config
```

```text
[default]
region = ap-northeast-2
output = json
```

### 주의

`~/.aws/credentials` 파일에는 비밀 키가 평문으로 저장돼요. 이 파일을 **절대 Git에 커밋하지 마세요.** `.gitignore`에 `.aws/`를 추가하는 것을 권장해요.

---

## 6단계: 비용 알림 설정

AWS를 학습하면서 가장 무서운 것은 **예상치 못한 요금**이에요. 반드시 비용 알림을 설정하세요.

### 예산(Budget) 알림 설정 절차

1. AWS 콘솔 상단 검색창에 **"Billing"** 또는 **"결제"** 입력
2. 좌측 메뉴에서 **"예산(Budgets)"** 클릭
3. **"예산 생성"** 클릭
4. **"사용자 지정(고급)"** 선택
5. 예산 유형: **"비용 예산"** 선택 → 다음
6. 예산 이름: `monthly-10-dollar-alert`
7. 기간: **월별**
8. 예산 금액: **$10.00** 입력
9. **"다음"** 클릭
10. 알림 임계값 설정:
    - **임계값 1**: 실제 비용 > 80% ($8) → 이메일 알림
    - **임계값 2**: 실제 비용 > 100% ($10) → 이메일 알림
    - **임계값 3**: 예측 비용 > 100% ($10) → 이메일 알림
11. 이메일 주소 입력 (알림 받을 이메일)
12. **"예산 생성"** 클릭

### 주의

비용 알림은 **즉시 차단이 아니에요.** 알림을 받아도 서비스가 자동으로 중지되지 않아요. 알림을 받으면 직접 콘솔에 들어가서 불필요한 리소스를 삭제해야 해요.

### 실무 팁

학습이 끝난 후 반드시 아래 사항을 확인하세요.

1. **EC2 인스턴스** → 실행 중인 것 모두 종료(Terminate)
2. **Elastic IP** → 연결되지 않은 것 해제 (안 쓰는 Elastic IP도 과금!)
3. **EBS 볼륨** → 연결되지 않은 것 삭제
4. **NAT Gateway** → 삭제 (시간당 과금, 프리 티어 아님!)
5. **RDS 인스턴스** → 삭제 또는 중지
6. **Load Balancer** → 삭제 (프리 티어 범위 제한적)

특히 **NAT Gateway**는 프리 티어에 포함되지 않고 시간당 약 $0.045가 과금돼요. VPC 실습 후 삭제를 잊으면 월 $30 이상 나올 수 있어요.

---

## 7단계: AWS 콘솔 주요 메뉴 소개

AWS 콘솔에 로그인하면 수백 개의 서비스가 보여서 처음에는 당황할 수 있어요. 이 강의에서 주로 사용하는 서비스를 먼저 알아두세요.

### 핵심 서비스 위치

| 서비스 | 콘솔 검색어 | 용도 | 강의 |
|--------|------------|------|------|
| IAM | `IAM` | 사용자, 권한 관리 | [01-iam](./01-iam) |
| VPC | `VPC` | 네트워크 구성 | [02-vpc](./02-vpc) |
| EC2 | `EC2` | 가상 서버 | [03-ec2-autoscaling](./03-ec2-autoscaling) |
| S3 | `S3` | 파일 저장소 | [04-storage](./04-storage) |
| RDS | `RDS` | 관계형 데이터베이스 | [05-database](./05-database) |
| ECS/EKS | `ECS` 또는 `EKS` | 컨테이너 서비스 | [09-container-services](./09-container-services) |
| CloudWatch | `CloudWatch` | 모니터링, 로그 | [13-management](./13-management) |
| Billing | `Billing` | 비용 확인 | 이 문서 6단계 |

### 실무 팁

자주 쓰는 서비스는 콘솔 상단의 **별표(즐겨찾기)**를 눌러 고정하세요. 검색창에서 매번 찾는 것보다 훨씬 빨라요.

또한 리전(Region)이 올바르게 설정되어 있는지 항상 확인하세요. 우측 상단에 표시된 리전이 **"아시아 태평양(서울) ap-northeast-2"**인지 확인하세요. 다른 리전에서 리소스를 만들면 서울 리전에서 보이지 않아요.

---

## 최종 확인

### 1. AWS CLI 인증 확인

```bash
aws sts get-caller-identity
```

예상 출력:

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-admin"
}
```

### 2. S3 접근 확인

```bash
aws s3 ls
```

에러 없이 실행되면 정상이에요 (빈 출력도 정상).

### 3. 리전 설정 확인

```bash
aws configure get region
```

예상 출력:

```text
ap-northeast-2
```

---

## 문제 해결

### aws configure 후에도 인증 실패하는 경우

**증상:** `Unable to locate credentials`

**확인:**

```bash
cat ~/.aws/credentials
```

파일이 비어있거나 존재하지 않으면 `aws configure`를 다시 실행하세요.

---

### IAM 사용자로 콘솔 로그인이 안 되는 경우

**확인 사항:**
1. 로그인 URL이 맞는지 확인 (`https://계정ID.signin.aws.amazon.com/console`)
2. "Root 사용자"가 아닌 **"IAM 사용자"**로 로그인하고 있는지 확인
3. 계정 ID(12자리 숫자)를 정확히 입력했는지 확인

---

### MFA 설정 후 코드가 맞지 않는 경우

**원인:** 스마트폰 시간이 서버 시간과 맞지 않으면 MFA 코드가 불일치해요.

**해결:** 스마트폰 설정에서 **"자동 날짜 및 시간"**을 활성화하세요.

---

## 다음 단계

환경 준비가 끝났으면 [IAM(Identity and Access Management)](./01-iam)으로 넘어가세요. AWS 보안의 핵심인 사용자, 역할, 정책에 대해 배울 거예요.
