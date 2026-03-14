# 보안 학습 환경 준비

> 이 문서는 보안(Security) 강의를 시작하기 **전에** 필요한 도구를 설치하고 실습 환경을 세팅하는 가이드예요. 암호화, 비밀 관리, 컨테이너 스캔, 네트워크 분석까지 다양한 도구를 준비해요. 모든 단계를 완료하면 [ID/인증 관리](./01-identity)부터 바로 시작할 수 있어요.

---

## 필요한 도구 목록

```
도구              용도                              필수 여부
─────────────────────────────────────────────────────────────
리눅스 환경       보안 도구 실행 기반                  필수
OpenSSL          인증서, 암호화 실습                  필수
AWS CLI          IAM, KMS 등 클라우드 보안 실습        필수
Docker           Vault, Trivy 등 컨테이너로 실행       필수
HashiCorp Vault  비밀(Secret) 관리 실습               필수
Trivy            컨테이너 이미지 취약점 스캔            권장
GPG              파일/커밋 서명                       권장
SSH              원격 접속 및 키 관리                  필수
nmap             네트워크 포트 스캔                    권장
tcpdump          네트워크 패킷 캡처                   선택
OWASP ZAP        웹 애플리케이션 취약점 스캔            선택
```

---

## 1. 리눅스 환경 준비

보안 도구 대부분은 리눅스 환경에서 가장 잘 동작해요. Windows 사용자도 WSL2나 Docker로 리눅스 환경을 사용할 수 있어요.

### 환경별 안내

| 환경 | 방법 |
|------|------|
| **Linux (Ubuntu/Debian)** | 그대로 사용하면 돼요 |
| **Mac** | 대부분의 도구가 Homebrew로 설치 가능해요 |
| **Windows** | WSL2 사용 권장. [01-linux](../01-linux/00-linux-commands)를 참고하세요 |

### Windows에서 WSL2 설정

```bash
# PowerShell (관리자 권한)에서 실행
wsl --install -d Ubuntu
```

설치 후 사용자 이름과 비밀번호를 설정하면, Ubuntu 터미널을 사용할 수 있어요.

### 실무 팁

- 보안 실습에서는 **root 권한**이 필요한 도구가 많아요 (`nmap`, `tcpdump` 등). `sudo`를 사용할 수 있는 환경인지 미리 확인하세요.
- 회사 네트워크에서 `nmap`이나 포트 스캔 도구를 사용하면 **보안 정책 위반**으로 감지될 수 있어요. 반드시 개인 환경이나 허가된 네트워크에서만 실습하세요.

---

## 2. OpenSSL 설치 확인

OpenSSL은 암호화, 인증서 생성, TLS 연결 테스트에 필수인 도구예요. 대부분의 OS에 기본 설치되어 있어요.

### 확인

```bash
openssl version
```

### 예상 출력

```text
OpenSSL 3.0.13 30 Jan 2024 (Library: OpenSSL 3.0.13 30 Jan 2024)
```

### 설치되어 있지 않다면

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openssl -y

# Mac (Homebrew)
brew install openssl

# CentOS/RHEL
sudo yum install openssl -y
```

### 간단한 기능 테스트

```bash
# 랜덤 비밀번호 생성
openssl rand -base64 32
```

### 예상 출력

```text
K7xQ2mP9vB3nL8wY5jR1cF6hD4tA0sU+gE7iM2oN3kX=
```

```bash
# SHA256 해시 생성
echo "hello world" | openssl dgst -sha256
```

### 예상 출력

```text
SHA2-256(stdin)= a948904f2f0f479b8f8564e9d7e91c9020a3516...
```

### 주의

- Mac에서는 시스템 기본 OpenSSL이 **LibreSSL**일 수 있어요. 기본적인 실습에는 문제없지만, 일부 고급 기능은 다르게 동작할 수 있어요.
- `openssl version`에서 `LibreSSL`이 나오면, Homebrew로 OpenSSL을 별도로 설치하고 PATH를 설정하세요.

---

## 3. AWS CLI 설치

AWS IAM, KMS, Secrets Manager 등 클라우드 보안 실습에 AWS CLI가 필요해요.

### 설치 확인

이미 [05-cloud-aws](../05-cloud-aws/01-iam) 과정에서 설치했다면, 확인만 하면 돼요.

```bash
aws --version
```

### 예상 출력

```text
aws-cli/2.15.17 Python/3.11.6 Linux/5.15.0-91-generic exe/x86_64.ubuntu.22
```

### 아직 설치하지 않았다면

```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Mac
brew install awscli

# Windows
# https://awscli.amazonaws.com/AWSCLIV2.msi 다운로드 후 설치
```

### 자격 증명 설정

```bash
aws configure
```

```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
```

### 확인

```bash
aws sts get-caller-identity
```

### 예상 출력

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/gildong"
}
```

### 주의

- **절대로** Access Key를 코드에 하드코딩하거나 Git에 커밋하지 마세요. 이것이 보안 강의의 첫 번째 원칙이에요.
- 실습용 IAM 사용자를 만들고 **최소 권한**만 부여하세요. 관리자 권한을 가진 키가 유출되면 큰 사고로 이어져요.
- `~/.aws/credentials` 파일은 `.gitignore`에 반드시 포함시키세요.

---

## 4. HashiCorp Vault 설치 (Docker로)

Vault는 비밀(Secret) 관리 도구의 표준이에요. API 키, 데이터베이스 비밀번호, 인증서 등을 안전하게 저장하고 관리해요.

### Docker로 Vault 실행

```bash
docker run -d \
  --name vault \
  --cap-add=IPC_LOCK \
  -p 8200:8200 \
  -e 'VAULT_DEV_ROOT_TOKEN_ID=myroot' \
  -e 'VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200' \
  hashicorp/vault:latest
```

각 옵션 설명:

| 옵션 | 설명 |
|------|------|
| `--cap-add=IPC_LOCK` | 메모리 잠금 권한 (비밀이 스왑에 기록되는 것을 방지) |
| `-p 8200:8200` | 웹 UI 및 API 포트 |
| `VAULT_DEV_ROOT_TOKEN_ID` | 개발 모드 루트 토큰 (실습용) |
| `VAULT_DEV_LISTEN_ADDRESS` | 모든 인터페이스에서 접속 허용 |

### 접속 확인

브라우저에서 [http://localhost:8200](http://localhost:8200)에 접속하고, Token에 `myroot`를 입력해요.

### CLI로 확인

```bash
# Vault 주소 설정
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='myroot'

# 상태 확인
docker exec vault vault status
```

### 예상 출력

```text
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    1
Threshold       1
Version         1.15.4
Storage Type    inmem
Cluster Name    vault-cluster-abcdef12
Cluster ID      a1b2c3d4-e5f6-7890-abcd-ef1234567890
HA Enabled      false
```

`Sealed: false`가 중요해요. 개발 모드에서는 자동으로 Unseal 상태가 돼요.

### 간단한 비밀 저장 테스트

```bash
# 비밀 저장
docker exec -e VAULT_TOKEN=myroot vault vault kv put secret/myapp db_password="super-secret-123"
```

### 예상 출력

```text
===== Secret Path =====
secret/data/myapp

======= Metadata =======
Key                Value
---                -----
created_time       2026-03-14T09:00:00.000000Z
custom_metadata    <nil>
deletion_time      n/a
destroyed          false
version            1
```

```bash
# 비밀 조회
docker exec -e VAULT_TOKEN=myroot vault vault kv get secret/myapp
```

### 예상 출력

```text
===== Secret Path =====
secret/data/myapp

======= Metadata =======
Key                Value
---                -----
created_time       2026-03-14T09:00:00.000000Z
version            1

====== Data ======
Key             Value
---             -----
db_password     super-secret-123
```

### 주의

- 위 설정은 **개발 모드(dev mode)**예요. 데이터가 메모리에만 저장되기 때문에, 컨테이너를 재시작하면 모든 비밀이 사라져요.
- 프로덕션에서는 절대로 dev 모드를 사용하지 마세요. 파일/Consul 스토리지 백엔드를 설정하고, Unseal 키를 안전하게 관리해야 해요.

---

## 5. Trivy 설치 (컨테이너 이미지 스캔)

Trivy는 컨테이너 이미지의 **알려진 취약점(CVE)**을 스캔하는 도구예요. CI/CD 파이프라인에 통합하면, 취약한 이미지가 배포되는 것을 막을 수 있어요.

### 설치

```bash
# Mac
brew install aquasecurity/trivy/trivy

# Ubuntu/Debian
sudo apt install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install trivy -y

# CentOS/RHEL
sudo rpm -ivh https://github.com/aquasecurity/trivy/releases/download/v0.49.0/trivy_0.49.0_Linux-64bit.rpm
```

### Docker로 실행 (설치 없이)

설치가 번거로우면 Docker로 바로 실행할 수도 있어요.

```bash
docker run --rm aquasec/trivy image python:3.9-slim
```

### 확인

```bash
trivy --version
```

### 예상 출력

```text
Version: 0.49.0
```

### 이미지 스캔 테스트

```bash
trivy image nginx:latest
```

### 예상 출력 (일부)

```text
nginx:latest (debian 12.4)
============================
Total: 85 (UNKNOWN: 0, LOW: 62, MEDIUM: 15, HIGH: 7, CRITICAL: 1)

┌──────────────────┬────────────────┬──────────┬─────────────────┬──────────────────┐
│     Library      │ Vulnerability  │ Severity │ Installed Ver   │   Fixed Version  │
├──────────────────┼────────────────┼──────────┼─────────────────┼──────────────────┤
│ libssl3          │ CVE-2024-XXXXX │ CRITICAL │ 3.0.13-1~deb12u │ 3.0.13-1~deb12u2 │
│ curl             │ CVE-2024-YYYYY │ HIGH     │ 7.88.1-10+deb12 │ 7.88.1-10+deb12u │
│ ...              │ ...            │ ...      │ ...             │ ...              │
└──────────────────┴────────────────┴──────────┴─────────────────┴──────────────────┘
```

`CRITICAL`이나 `HIGH` 취약점이 있는 이미지는 프로덕션에 배포하면 안 돼요.

### 실무 팁

- `trivy image --severity HIGH,CRITICAL nginx:latest`로 심각한 취약점만 필터링할 수 있어요.
- CI/CD 파이프라인에서 `--exit-code 1`을 사용하면, 취약점이 발견되면 빌드를 자동으로 실패시킬 수 있어요.
- 처음 실행할 때 취약점 DB를 다운로드하느라 시간이 좀 걸려요 (1~3분).

---

## 6. OWASP ZAP 설치 (선택, 웹 취약점 스캔)

OWASP ZAP은 웹 애플리케이션의 보안 취약점을 자동으로 스캔하는 도구예요. SQL Injection, XSS 등 주요 웹 취약점을 찾아줘요.

### Docker로 실행

```bash
docker run -d \
  --name zap \
  -p 8080:8080 \
  -p 8090:8090 \
  zaproxy/zap-stable zap-webswing.sh
```

### 접속

브라우저에서 [http://localhost:8080/zap/](http://localhost:8080/zap/)에 접속하면 웹 기반 인터페이스를 사용할 수 있어요.

### 빠른 스캔 테스트 (CLI)

```bash
docker run --rm zaproxy/zap-stable zap-baseline.py -t https://example.com
```

### 주의

- OWASP ZAP으로 **허가되지 않은 사이트를 스캔하면 법적 문제**가 될 수 있어요. 반드시 본인이 관리하는 사이트나 테스트 환경에서만 사용하세요.
- Jenkins와 함께 포트 8080을 사용하면 충돌이 생겨요. ZAP의 포트를 `8081:8080`으로 변경하세요.

---

## 7. GPG 키 설치 확인

GPG(GNU Privacy Guard)는 파일 암호화, 서명, Git 커밋 서명에 사용해요.

### 확인

```bash
gpg --version
```

### 예상 출력

```text
gpg (GnuPG) 2.4.4
libgcrypt 1.10.3
```

### 설치되어 있지 않다면

```bash
# Ubuntu/Debian
sudo apt install gnupg -y

# Mac
brew install gnupg

# CentOS/RHEL
sudo yum install gnupg2 -y
```

### GPG 키 생성

```bash
gpg --full-generate-key
```

대화형으로 진행돼요.

```text
Please select what kind of key you want:
   (1) RSA and RSA
   (4) RSA (sign only)
Your selection? 1

What keysize do you want? (3072) 4096
Key is valid for? (0) 1y
Is this correct? (y/N) y

Real name: Hong Gildong
Email address: gildong@example.com
Comment:
```

### 생성된 키 확인

```bash
gpg --list-keys --keyid-format long
```

### 예상 출력

```text
pub   rsa4096/ABCDEF1234567890 2026-03-14 [SC] [expires: 2027-03-14]
      1234567890ABCDEF1234567890ABCDEF12345678
uid                 [ultimate] Hong Gildong <gildong@example.com>
sub   rsa4096/1234567890ABCDEF 2026-03-14 [E] [expires: 2027-03-14]
```

### Git 커밋 서명 설정

```bash
# GPG 키 ID를 Git에 등록
git config --global user.signingkey ABCDEF1234567890

# 모든 커밋에 자동 서명
git config --global commit.gpgsign true
```

---

## 8. SSH 키 관리 기본

SSH 키는 서버 접속뿐 아니라 **보안의 기본**이에요. 키 생성, 관리, 권한 설정을 올바르게 해야 해요.

### 기존 키 확인

```bash
ls -la ~/.ssh/
```

### 예상 출력

```text
total 16
drwx------  2 user user 4096 Mar 14 09:00 .
drwxr-xr-x 20 user user 4096 Mar 14 09:00 ..
-rw-------  1 user user  411 Mar 14 09:00 id_ed25519
-rw-r--r--  1 user user   97 Mar 14 09:00 id_ed25519.pub
-rw-r--r--  1 user user  444 Mar 14 09:00 known_hosts
```

### 키가 없다면 생성

```bash
ssh-keygen -t ed25519 -C "gildong@example.com"
```

### 파일 권한 확인

SSH 키 파일의 권한이 올바르지 않으면 SSH가 동작하지 않아요.

```bash
# 올바른 권한 설정
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/known_hosts
```

| 파일 | 올바른 권한 | 설명 |
|------|-------------|------|
| `~/.ssh/` | `700 (drwx------)` | 본인만 접근 가능 |
| `id_ed25519` (개인 키) | `600 (-rw-------)` | 본인만 읽기/쓰기 |
| `id_ed25519.pub` (공개 키) | `644 (-rw-r--r--)` | 다른 사람도 읽기 가능 |
| `known_hosts` | `644 (-rw-r--r--)` | 다른 사람도 읽기 가능 |

### 주의

- 개인 키(`id_ed25519`)의 권한이 `644`나 `777`이면, SSH가 **"Permissions are too open"** 에러를 내며 거부해요.
- 개인 키는 절대로 다른 사람에게 공유하거나, 이메일/메신저로 전송하면 안 돼요.
- 서버마다 다른 키를 사용하려면 `~/.ssh/config` 파일을 활용하세요.

---

## 9. 네트워크 보안 도구: nmap, tcpdump

### 9.1 nmap (네트워크 포트 스캔)

nmap은 네트워크에서 열려 있는 포트와 서비스를 탐지하는 도구예요.

### 설치

```bash
# Ubuntu/Debian
sudo apt install nmap -y

# Mac
brew install nmap

# CentOS/RHEL
sudo yum install nmap -y
```

### 확인

```bash
nmap --version
```

### 예상 출력

```text
Nmap version 7.94 ( https://nmap.org )
```

### 기본 사용법

```bash
# 본인 PC의 열린 포트 확인
nmap localhost
```

### 예상 출력

```text
Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00010s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE
3000/tcp open  ppp
8080/tcp open  http-proxy
8200/tcp open  trivnet1
9090/tcp open  zeus-admin

Nmap done: 1 IP address (1 host up) scanned in 0.05 seconds
```

위에서 설치한 Grafana(3000), Jenkins(8080), Vault(8200), Prometheus(9090)가 보이면 정상이에요.

### 9.2 tcpdump (패킷 캡처)

tcpdump는 네트워크 패킷을 실시간으로 캡처하고 분석하는 도구예요.

### 설치

```bash
# Ubuntu/Debian
sudo apt install tcpdump -y

# Mac (기본 설치되어 있음)
tcpdump --version

# CentOS/RHEL
sudo yum install tcpdump -y
```

### 기본 사용법

```bash
# HTTP 트래픽 캡처 (port 80)
sudo tcpdump -i any port 80 -c 5
```

`-c 5`는 5개 패킷만 캡처한 후 종료한다는 뜻이에요.

### 예상 출력

```text
tcpdump: data link type LINUX_SLL2
tcpdump: listening on any, link-type LINUX_SLL2, snapshot length 262144 bytes
09:15:23.123456 eth0 Out IP 192.168.1.10.54321 > 93.184.216.34.80: Flags [S], seq 12345
09:15:23.234567 eth0 In  IP 93.184.216.34.80 > 192.168.1.10.54321: Flags [S.], seq 67890
```

### 주의

- `tcpdump`는 **root 권한(sudo)**이 필요해요.
- 다른 사람의 네트워크 트래픽을 무단으로 캡처하면 **법적 문제**가 될 수 있어요. 반드시 본인 환경에서만 사용하세요.
- 캡처 데이터에 비밀번호 등 민감 정보가 포함될 수 있어요. 캡처 파일을 안전하게 관리하세요.

---

## 10. 전체 환경 확인

모든 설치가 끝났으면 아래 명령어로 한 번에 확인해요.

```bash
echo "=== OpenSSL ==="
openssl version

echo ""
echo "=== AWS CLI ==="
aws --version 2>/dev/null || echo "설치되지 않음"

echo ""
echo "=== Docker ==="
docker --version

echo ""
echo "=== Vault ==="
docker ps --filter name=vault --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "설치되지 않음"

echo ""
echo "=== Trivy ==="
trivy --version 2>/dev/null || echo "설치되지 않음 (Docker로 실행 가능)"

echo ""
echo "=== GPG ==="
gpg --version 2>/dev/null | head -1

echo ""
echo "=== SSH ==="
ssh -V 2>&1

echo ""
echo "=== nmap ==="
nmap --version 2>/dev/null | head -1 || echo "설치되지 않음"
```

### 예상 출력

```text
=== OpenSSL ===
OpenSSL 3.0.13 30 Jan 2024

=== AWS CLI ===
aws-cli/2.15.17 Python/3.11.6 Linux/5.15.0

=== Docker ===
Docker version 24.0.7, build afdd53b

=== Vault ===
vault: Up 10 minutes

=== Trivy ===
Version: 0.49.0

=== GPG ===
gpg (GnuPG) 2.4.4

=== SSH ===
OpenSSH_9.6p1 Ubuntu-3ubuntu13, OpenSSL 3.0.13

=== nmap ===
Nmap version 7.94 ( https://nmap.org )
```

### 최소 필수 체크리스트

```
[  ] openssl version              → OpenSSL 설치 확인
[  ] aws --version                → AWS CLI 설치 확인
[  ] docker --version             → Docker 설치 확인
[  ] localhost:8200 접속           → Vault 웹 UI 표시
[  ] ssh -V                       → OpenSSH 설치 확인
```

### 선택 도구 체크리스트

```
[  ] trivy --version              → Trivy 설치 확인
[  ] gpg --version                → GPG 설치 확인
[  ] nmap --version               → nmap 설치 확인
[  ] tcpdump --version            → tcpdump 설치 확인
```

### 실습 환경 관리

```bash
# Vault 중지
docker stop vault

# Vault 다시 시작 (dev 모드는 재시작 시 데이터 초기화됨)
docker start vault

# Vault 삭제
docker rm -f vault
```

### 주의

- 보안 도구를 테스트할 때는 **항상 본인이 관리하는 시스템**에서만 실행하세요. 다른 사람의 시스템을 스캔하거나 침투 테스트하는 것은 허가 없이 하면 **불법**이에요.
- Vault dev 모드는 실습 전용이에요. 컨테이너가 재시작되면 모든 비밀이 사라져요. 프로덕션에서는 반드시 영속 스토리지를 설정하세요.
- AWS 자격 증명(Access Key)을 Git에 커밋하지 않도록 `.gitignore`를 꼭 확인하세요.

---

## 다음 단계

환경 준비가 끝났으면, [ID/인증 관리](./01-identity)부터 시작하세요. IAM, RBAC, OAuth/OIDC 등 인증과 인가의 기본 개념을 먼저 이해하고 나면, Vault나 AWS 보안 서비스를 왜 사용하는지 자연스럽게 이해돼요.
