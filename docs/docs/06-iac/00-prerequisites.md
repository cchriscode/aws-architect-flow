# IaC(Infrastructure as Code) 학습 환경 준비

> IaC를 배우려면 코드 에디터, Terraform, Ansible 그리고 AWS CLI가 모두 준비되어 있어야 해요. 이 가이드를 따라 하나씩 설치하면, 이후 강의에서 바로 `terraform apply`와 `ansible-playbook`을 실행할 수 있어요. [AWS 클라우드 환경 준비](../05-cloud-aws/00-prerequisites)를 먼저 완료하고 오세요.

---

## 선행 조건

IaC 강의를 시작하기 전에 아래 항목이 완료되어 있어야 해요.

| 항목 | 확인 방법 | 참조 |
|------|-----------|------|
| AWS 계정 생성 | AWS 콘솔 로그인 가능 | [05-cloud-aws 환경 준비](../05-cloud-aws/00-prerequisites) 1~3단계 |
| AWS CLI 설치 및 설정 | `aws sts get-caller-identity` 성공 | [05-cloud-aws 환경 준비](../05-cloud-aws/00-prerequisites) 4~5단계 |
| Python 3.9 이상 | `python3 --version` | Ansible 설치에 필요 |
| Git 설치 | `git --version` | 코드 버전 관리 |

### AWS CLI 빠른 확인

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

이 출력이 나오지 않으면 [05-cloud-aws 환경 준비](../05-cloud-aws/00-prerequisites)부터 진행하세요.

---

## 1단계: Terraform 설치

Terraform은 HashiCorp에서 만든 IaC 도구로, **HCL(HashiCorp Configuration Language)**이라는 선언형 언어로 인프라를 정의해요.

### Windows

**방법 1: Chocolatey 사용 (추천)**

```bash
choco install terraform
```

**방법 2: 수동 설치**

1. [https://developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install) 접속
2. Windows AMD64 zip 다운로드
3. 압축 해제 후 `terraform.exe`를 PATH에 포함된 디렉토리에 이동

### macOS

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

### Linux (Ubuntu/Debian)

```bash
# HashiCorp GPG 키 추가
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# 저장소 추가
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

# 설치
sudo apt-get update
sudo apt-get install terraform
```

### 설치 확인

```bash
terraform version
```

### 예상 출력

```text
Terraform v1.9.2
on linux_amd64
```

버전 번호가 출력되면 설치 완료예요.

### 실무 팁

Terraform은 버전마다 문법이 조금씩 달라요. 팀 프로젝트에서는 `.terraform-version` 파일로 버전을 고정하는 것이 일반적이에요. 이 부분은 뒤쪽의 **tfenv 설치** 섹션에서 다뤄요.

---

## 2단계: Terraform 기본 디렉토리 구조 이해

Terraform 프로젝트를 시작하기 전에, 파일이 어떻게 구성되는지 알아두면 좋아요.

### 기본 구조

```text
my-infra/
├── main.tf           # 핵심 리소스 정의
├── variables.tf      # 변수 선언
├── outputs.tf        # 출력값 정의
├── terraform.tfvars  # 변수 값 지정 (Git에 올리지 않음)
├── providers.tf      # 프로바이더 설정 (AWS, GCP 등)
├── versions.tf       # Terraform 및 프로바이더 버전 고정
└── .terraform/       # terraform init 시 자동 생성 (Git에 올리지 않음)
```

| 파일 | 역할 | Git에 포함 |
|------|------|-----------|
| `main.tf` | 실제 인프라 리소스 정의 | O |
| `variables.tf` | 입력 변수 타입과 설명 | O |
| `outputs.tf` | 실행 후 확인할 출력값 | O |
| `terraform.tfvars` | 변수에 넣을 실제 값 (비밀 포함 가능) | X |
| `providers.tf` | AWS 등 프로바이더 설정 | O |
| `.terraform/` | 다운로드된 프로바이더 플러그인 | X |
| `terraform.tfstate` | 현재 인프라 상태 (매우 중요) | X (원격 저장 권장) |

### 주의

`terraform.tfstate` 파일은 **현재 인프라의 실제 상태**를 담고 있어요. 이 파일을 잃어버리면 Terraform이 기존 인프라를 인식하지 못해서, 이미 존재하는 리소스를 다시 만들려고 시도해요. 프로덕션에서는 반드시 S3 같은 원격 백엔드에 저장해요.

### `.gitignore` 설정

Terraform 프로젝트에서는 아래 내용을 `.gitignore`에 추가하세요.

```text
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
crash.log
```

---

## 3단계: Terraform 동작 확인

설치가 잘 됐는지 간단한 테스트를 해볼게요. AWS 리소스를 실제로 만들지 않고, Terraform이 정상적으로 초기화되는지만 확인해요.

### 테스트용 디렉토리 생성

```bash
mkdir -p ~/terraform-test && cd ~/terraform-test
```

### 테스트 파일 작성

`main.tf` 파일을 생성하세요.

```hcl
# main.tf
terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
}
```

### 초기화

```bash
terraform init
```

### 예상 출력

```text
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.60.0...
- Installed hashicorp/aws v5.60.0 (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!
```

`Terraform has been successfully initialized!`가 나오면 성공이에요.

### 테스트 디렉토리 정리

```bash
rm -rf ~/terraform-test
```

---

## 4단계: Ansible 설치

Ansible은 **Python 기반**의 구성 관리(Configuration Management) 도구예요. SSH를 통해 원격 서버에 접속하여 소프트웨어를 설치하고 설정을 적용해요.

### 주의 (Windows 사용자)

Ansible은 **Linux/macOS에서만 네이티브로 실행**돼요. Windows에서는 **WSL(Windows Subsystem for Linux)**을 사용해야 해요.

#### Windows: WSL 설치 후 Ansible 설치

```bash
# WSL이 아직 없다면 설치 (PowerShell 관리자 모드에서)
wsl --install

# WSL 재시작 후 Ubuntu 터미널에서
sudo apt update
sudo apt install -y python3 python3-pip
pip3 install ansible
```

### macOS

```bash
pip3 install ansible
```

또는 Homebrew 사용:

```bash
brew install ansible
```

### Linux (Ubuntu/Debian)

**방법 1: pip 사용 (추천, 최신 버전)**

```bash
pip3 install ansible
```

**방법 2: apt 사용**

```bash
sudo apt update
sudo apt install -y ansible
```

### 설치 확인

```bash
ansible --version
```

### 예상 출력

```text
ansible [core 2.17.1]
  config file = None
  configured module search path = ['/home/user/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /home/user/.local/lib/python3.12/site-packages/ansible
  ansible collection location = /home/user/.ansible/collections:/usr/share/ansible/collections
  executable location = /home/user/.local/bin/ansible
  python version = 3.12.3 (main, ...) [GCC 13.2.0]
  jinja version = 3.1.4
  libyaml = True
```

`ansible [core x.x.x]` 버전 정보가 출력되면 성공이에요.

### 실무 팁

Ansible을 `pip`로 설치할 때 시스템 Python과 충돌할 수 있어요. 가상환경(venv)을 사용하면 깔끔해요.

```bash
python3 -m venv ~/ansible-env
source ~/ansible-env/bin/activate
pip install ansible
```

다만 학습 단계에서는 시스템에 직접 설치해도 괜찮아요.

---

## 5단계: VS Code 확장 프로그램 설치

코드 에디터에 적절한 확장 프로그램을 설치하면, 문법 오류를 미리 잡아주고 자동 완성도 지원해요.

### HashiCorp Terraform 확장

Terraform `.tf` 파일의 문법 하이라이팅, 자동 완성, 포맷팅을 지원해요.

1. VS Code 실행
2. 좌측 사이드바에서 **확장(Extensions)** 아이콘 클릭 (또는 `Ctrl+Shift+X`)
3. 검색창에 **"HashiCorp Terraform"** 입력
4. **HashiCorp** 게시자의 확장 프로그램 설치

설치 후 `.tf` 파일을 열면 아래 기능이 활성화돼요.

- HCL 문법 하이라이팅 (색상 구분)
- 리소스/변수 자동 완성
- 저장 시 자동 포맷팅 (`terraform fmt`)
- 정의로 이동 (Go to Definition)

### Ansible 확장 (Red Hat)

Ansible YAML 파일의 문법 검증, 자동 완성을 지원해요.

1. VS Code 확장 검색창에 **"Ansible"** 입력
2. **Red Hat** 게시자의 **"Ansible"** 확장 프로그램 설치

설치 후 `.yml`/`.yaml` 파일 중 Ansible Playbook 형식의 파일에서 아래 기능이 활성화돼요.

- 모듈 이름 자동 완성
- Playbook 문법 검증
- Jinja2 템플릿 하이라이팅

### 실무 팁

VS Code에서 Terraform 파일을 저장할 때 자동으로 포맷팅하려면, 설정에 아래를 추가하세요.

```json
{
  "[terraform]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "hashicorp.terraform"
  }
}
```

VS Code 설정 열기: `Ctrl+Shift+P` → "Preferences: Open Settings (JSON)"

---

## 6단계: tfenv 설치 (선택사항)

tfenv는 **Terraform 버전 관리 도구**예요. 여러 프로젝트에서 서로 다른 Terraform 버전을 사용해야 할 때 유용해요.

### 왜 필요한가

프로젝트 A는 Terraform 1.5를 사용하고, 프로젝트 B는 Terraform 1.9를 사용할 때, tfenv로 프로젝트별 버전을 쉽게 전환해요.

### macOS / Linux

```bash
git clone https://github.com/tfutils/tfenv.git ~/.tfenv

# PATH에 추가 (~/.bashrc 또는 ~/.zshrc)
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Windows

Windows에서는 [tfenv-windows](https://github.com/nicholasgasior/tfenv-windows)를 사용하거나, Chocolatey로 Terraform을 관리하는 것을 추천해요. Windows에서 tfenv 설정은 복잡할 수 있으므로, 학습 단계에서는 건너뛰어도 괜찮아요.

### 사용법

```bash
# 설치 가능한 버전 목록
tfenv list-remote

# 특정 버전 설치
tfenv install 1.9.2

# 특정 버전 사용
tfenv use 1.9.2

# 현재 사용 중인 버전 확인
terraform version
```

### 예상 출력

```text
$ tfenv install 1.9.2
Installing Terraform v1.9.2
Downloading release tarball from https://releases.hashicorp.com/terraform/1.9.2/...
...
Installation of terraform v1.9.2 successful.

$ tfenv use 1.9.2
Switching default version to v1.9.2
Default version is now: 1.9.2

$ terraform version
Terraform v1.9.2
on linux_amd64
```

### 프로젝트별 버전 고정

프로젝트 루트에 `.terraform-version` 파일을 만들면, 해당 디렉토리에서 자동으로 지정된 버전이 사용돼요.

```bash
echo "1.9.2" > .terraform-version
```

---

## 7단계: AWS Provider 인증 방식 이해

Terraform이 AWS에 리소스를 생성하려면, AWS 인증 정보가 필요해요. 여러 가지 방식이 있는데, 각각의 특징을 알아두세요.

### 방식 1: 환경 변수 (학습 추천)

`aws configure`로 설정한 정보를 Terraform이 자동으로 읽어요. **추가 설정이 필요 없어서** 학습할 때 가장 편해요.

```hcl
# providers.tf - 리전만 지정하면 됨
provider "aws" {
  region = "ap-northeast-2"
}
```

Terraform은 아래 순서로 인증 정보를 찾아요.

1. 환경 변수 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. `~/.aws/credentials` 파일의 `[default]` 프로파일
3. IAM Role (EC2 인스턴스에서 실행할 때)

`aws configure`를 이미 했다면 2번에 해당하므로, provider 블록에 키를 넣지 않아도 돼요.

### 방식 2: 프로파일 지정

여러 AWS 계정을 사용할 때, 프로파일 이름으로 구분해요.

```bash
# 프로파일 추가
aws configure --profile dev-account
```

```hcl
# providers.tf
provider "aws" {
  region  = "ap-northeast-2"
  profile = "dev-account"
}
```

### 방식 3: 코드에 직접 입력 (절대 금지)

```hcl
# 절대 이렇게 하지 마세요!
provider "aws" {
  region     = "ap-northeast-2"
  access_key = "AKIAIOSFODNN7EXAMPLE"        # 절대 금지
  secret_key = "wJalrXUtnFEMI/K7MDENG/..."   # 절대 금지
}
```

### 주의

인증 키를 `.tf` 파일에 직접 넣으면, Git에 커밋되는 순간 전 세계에 공개될 수 있어요. AWS 키가 GitHub에 노출되면 **수 분 내에 봇이 감지하고 해킹에 악용**해요. 실제로 수백만 원의 요금이 청구된 사례가 있어요.

---

## 최종 확인

모든 설치가 끝났으면 아래 명령어들을 실행해서 확인하세요.

### 1. Terraform 확인

```bash
terraform version
```

예상 출력:

```text
Terraform v1.9.2
on linux_amd64
```

### 2. Ansible 확인

```bash
ansible --version
```

예상 출력:

```text
ansible [core 2.17.1]
  config file = None
  ...
```

### 3. AWS CLI 인증 확인

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

### 4. 전체 요약

```bash
echo "=== Terraform ===" && terraform version && echo "" && echo "=== Ansible ===" && ansible --version | head -1 && echo "" && echo "=== AWS CLI ===" && aws --version
```

예상 출력:

```text
=== Terraform ===
Terraform v1.9.2
on linux_amd64

=== Ansible ===
ansible [core 2.17.1]

=== AWS CLI ===
aws-cli/2.17.20 Python/3.12.5 Linux/6.5.0 source/x86_64
```

세 가지 모두 버전 정보가 출력되면 IaC 학습 환경 준비 완료예요.

---

## 문제 해결

### terraform 명령어를 찾을 수 없는 경우

**증상:** `terraform: command not found`

**원인:** terraform 바이너리가 PATH에 포함되지 않았어요.

**해결:**

```bash
# terraform 위치 확인
which terraform    # Linux/Mac
where terraform    # Windows

# PATH 확인
echo $PATH
```

Chocolatey나 Homebrew로 설치했다면 터미널을 닫고 다시 열어보세요.

---

### ansible 설치 시 permission 에러

**증상:** `ERROR: Could not install packages due to an EnvironmentError: [Errno 13] Permission denied`

**해결:**

```bash
# 방법 1: --user 플래그 사용
pip3 install --user ansible

# 방법 2: 가상환경 사용
python3 -m venv ~/ansible-env
source ~/ansible-env/bin/activate
pip install ansible
```

`sudo pip install`은 시스템 Python을 오염시킬 수 있으므로 피하세요.

---

### terraform init에서 프로바이더 다운로드 실패

**증상:** `Error: Failed to query available provider packages`

**원인:** 네트워크 문제이거나, 회사/학교 방화벽이 HashiCorp 레지스트리를 차단하고 있어요.

**해결:**

```bash
# DNS 확인
nslookup registry.terraform.io

# 직접 접속 테스트
curl -I https://registry.terraform.io
```

방화벽 문제라면 네트워크 관리자에게 `registry.terraform.io`에 대한 HTTPS 접근을 요청하세요.

---

## 다음 단계

환경 준비가 끝났으면 [IaC 왜 필요한가](./01-concept)로 넘어가세요. 수동 인프라 관리의 문제점과 IaC가 이를 어떻게 해결하는지 배울 거예요.
