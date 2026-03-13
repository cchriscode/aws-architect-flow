# TLS / 인증서 관리 / mTLS

> 브라우저 주소창의 자물쇠 🔒 아이콘, HTTPS의 S, "이 연결은 안전합니다" — 전부 TLS 덕분이에요. 인증서가 만료되면 사이트가 접속 불가가 되고, 인증서를 잘못 설정하면 보안 사고가 나요. DevOps가 반드시 다뤄야 하는 영역이에요.

---

## 🎯 이걸 왜 알아야 하나?

```
실무에서 TLS/인증서 관련 작업:
• HTTPS 설정 (Nginx, ALB)                → 인증서 발급 + 설치
• "인증서 만료됐어요!"                    → 갱신 자동화 (Let's Encrypt)
• "NET::ERR_CERT_AUTHORITY_INVALID"       → 인증서 체인 문제 진단
• AWS ACM으로 인증서 관리                 → ALB/CloudFront에 연결
• 마이크로서비스 간 암호화 통신            → mTLS (Istio 등)
• 와일드카드 인증서                       → *.example.com
• 인증서 정보 확인/디버깅                  → openssl 명령어
```

[이전 강의](./02-http)에서 HTTPS가 HTTP + TLS라고 배웠죠? 이번에는 TLS가 어떻게 동작하는지, 인증서를 어떻게 관리하는지 깊이 파볼게요.

---

## 🧠 핵심 개념

### 비유: 신분증 + 암호 편지

TLS를 **신분증 확인 + 암호 편지**로 비유해볼게요.

* **인증서 (Certificate)** = 신분증. "이 서버가 정말 google.com이 맞아요"를 증명
* **CA (Certificate Authority)** = 정부기관. 신분증을 발급하는 신뢰할 수 있는 기관 (Let's Encrypt, DigiCert 등)
* **개인키 (Private Key)** = 도장/인감. 이걸로 암호화된 통신을 복호화. 절대 유출 금지!
* **TLS Handshake** = 신분증 확인 후 암호 통신 방식을 합의하는 과정
* **mTLS** = 양쪽 다 신분증 확인. 서버도, 클라이언트도 서로 인증

```mermaid
flowchart TD
    subgraph "일반 TLS (HTTPS)"
        C1["클라이언트<br/>(브라우저)"] -->|"서버 인증서 확인<br/>'진짜 google.com?'"| S1["서버<br/>(google.com)"]
        S1 -->|"인증서 제출<br/>'네, CA가 보증해요'"| C1
    end
    
    subgraph "mTLS (양방향)"
        C2["클라이언트<br/>(서비스 A)"] -->|"서버 인증서 확인"| S2["서버<br/>(서비스 B)"]
        S2 -->|"서버 인증서 제출"| C2
        S2 -->|"클라이언트 인증서 요청"| C2
        C2 -->|"클라이언트 인증서 제출"| S2
    end
    
    style C1 fill:#3498db,color:#fff
    style S2 fill:#2ecc71,color:#fff
```

---

## 🔍 상세 설명 — TLS 동작 원리

### TLS Handshake (연결 수립)

[TCP 3-way handshake](./01-osi-tcp-udp) 후에 TLS handshake가 추가로 진행돼요.

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant S as 서버
    
    Note over C,S: TCP 3-way Handshake 완료 후
    
    C->>S: ClientHello<br/>지원하는 TLS 버전, 암호화 방식 목록
    S->>C: ServerHello<br/>선택된 TLS 버전, 암호화 방식
    S->>C: Certificate<br/>서버 인증서 (공개키 포함)
    S->>C: ServerHelloDone
    
    Note over C: 인증서 검증<br/>1. CA 서명 확인<br/>2. 도메인 일치 확인<br/>3. 만료일 확인
    
    C->>S: ClientKeyExchange<br/>암호화 키 교환
    C->>S: ChangeCipherSpec<br/>"이제부터 암호화해요"
    C->>S: Finished (암호화됨)
    
    S->>C: ChangeCipherSpec
    S->>C: Finished (암호화됨)
    
    Note over C,S: 🔒 암호화 통신 시작!
```

**TLS 1.2 vs TLS 1.3:**

| 항목 | TLS 1.2 | TLS 1.3 |
|------|---------|---------|
| Handshake 왕복 | 2-RTT | **1-RTT** (더 빠름!) |
| 0-RTT | ❌ | ✅ (이전 연결 재개 시) |
| 보안 | 좋음 | **더 강함** (약한 암호 제거) |
| 지원 | 거의 모든 서버 | 현대 서버 (추천) |

```bash
# 서버의 TLS 버전 확인
curl -v https://example.com 2>&1 | grep "SSL connection"
# * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384

# openssl로 상세 확인
openssl s_client -connect example.com:443 -tls1_3 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.3

# TLS 1.2로 강제 연결
openssl s_client -connect example.com:443 -tls1_2 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.2
```

---

### 인증서 구조

```bash
# 인증서 내용 보기
openssl x509 -in cert.pem -text -noout

# 출력 예시 (핵심 부분만):
# Certificate:
#     Data:
#         Version: 3 (0x2)
#         Serial Number: 04:00:00:00:00:01:15:4b:5a:c3:94
#         Issuer: C=US, O=Let's Encrypt, CN=R3             ← 발급자 (CA)
#         Validity
#             Not Before: Mar  1 00:00:00 2025 GMT         ← 시작일
#             Not After : May 30 23:59:59 2025 GMT         ← 만료일 ⭐
#         Subject: CN=example.com                           ← 대상 도메인
#         Subject Public Key Info:
#             Public Key Algorithm: id-ecPublicKey
#             Public-Key: (256 bit)                         ← 공개키
#         X509v3 extensions:
#             X509v3 Subject Alternative Name:              ← SAN (여러 도메인)
#                 DNS:example.com, DNS:www.example.com
```

### 인증서 체인 (Chain of Trust)

브라우저가 인증서를 신뢰하려면 **Root CA까지의 체인**이 완성되어야 해요.

```mermaid
flowchart TD
    ROOT["Root CA 인증서<br/>(브라우저에 내장)<br/>예: ISRG Root X1"]
    INTER["Intermediate CA 인증서<br/>(중간 인증서)<br/>예: Let's Encrypt R3"]
    LEAF["서버 인증서<br/>(Leaf/End-entity)<br/>예: example.com"]
    
    ROOT -->|"서명"| INTER
    INTER -->|"서명"| LEAF
    
    BROWSER["브라우저 검증:<br/>1. 서버 인증서 → 중간 CA가 서명? ✅<br/>2. 중간 CA → Root CA가 서명? ✅<br/>3. Root CA가 내 신뢰 목록에? ✅<br/>→ 인증서 신뢰!"]
    
    style ROOT fill:#e74c3c,color:#fff
    style INTER fill:#f39c12,color:#fff
    style LEAF fill:#2ecc71,color:#fff
```

```bash
# 인증서 체인 확인
openssl s_client -connect example.com:443 -showcerts < /dev/null 2>/dev/null
# Certificate chain
#  0 s:CN = example.com                      ← 서버 인증서
#    i:C = US, O = Let's Encrypt, CN = R3
#  1 s:C = US, O = Let's Encrypt, CN = R3    ← 중간 인증서
#    i:O = Internet Security Research Group, CN = ISRG Root X1

# 체인이 불완전하면:
# "NET::ERR_CERT_AUTHORITY_INVALID" 에러!
# → 중간 인증서(Intermediate)를 서버에 같이 설치해야 함

# 온라인 도구로 체인 검증:
# https://www.ssllabs.com/ssltest/
# → 도메인 입력하면 인증서 체인, TLS 버전, 보안 등급 확인
```

### 인증서 파일 형식

| 확장자 | 형식 | 설명 |
|--------|------|------|
| `.pem` | Base64 텍스트 | 가장 흔함. `-----BEGIN CERTIFICATE-----` |
| `.crt` | PEM 또는 DER | 인증서 파일 (보통 PEM) |
| `.key` | PEM | 개인키 파일 |
| `.csr` | PEM | 인증서 서명 요청 |
| `.der` | 바이너리 | DER 인코딩 |
| `.pfx` / `.p12` | 바이너리 | 인증서 + 개인키 묶음 (Windows) |
| `.ca-bundle` | PEM | 중간 인증서 체인 |

```bash
# PEM 파일 내용 예시
cat cert.pem
# -----BEGIN CERTIFICATE-----
# MIIFjTCCA3WgAwIBAgIRANOxciY0IzLc9AUoUSrsnGowDQYJKoZIhvcNAQEL...
# ...
# -----END CERTIFICATE-----

# 개인키 파일
cat privkey.pem
# -----BEGIN PRIVATE KEY-----
# MIIEvgIBADANBgkqhkiG9w0BAQEFAASC...
# ...
# -----END PRIVATE KEY-----

# ⚠️ 개인키는 절대 외부에 노출하면 안 돼요!
# 권한: chmod 600 privkey.pem
```

---

## 🔍 상세 설명 — 인증서 발급과 관리

### Let's Encrypt — 무료 인증서 (★ 가장 많이 씀)

```bash
# certbot 설치
sudo apt install certbot python3-certbot-nginx    # Ubuntu + Nginx

# === 방법 1: Nginx 자동 설정 (가장 쉬움) ===
sudo certbot --nginx -d example.com -d www.example.com
# → 자동으로:
# 1. 도메인 소유 확인 (HTTP 검증)
# 2. 인증서 발급
# 3. Nginx 설정에 SSL 추가
# 4. HTTP → HTTPS 리다이렉트 설정

# 결과:
# 인증서: /etc/letsencrypt/live/example.com/fullchain.pem
# 개인키: /etc/letsencrypt/live/example.com/privkey.pem

# === 방법 2: standalone (웹서버 없이) ===
sudo certbot certonly --standalone -d example.com
# → certbot이 임시 웹서버를 띄워서 검증
# → 80 포트가 비어있어야 함

# === 방법 3: DNS 검증 (와일드카드 인증서) ===
sudo certbot certonly --manual --preferred-challenges dns \
    -d "*.example.com" -d "example.com"
# → TXT 레코드를 수동으로 추가해야 함
# → 자동화: --dns-route53, --dns-cloudflare 플러그인 사용

# Route53 자동화:
sudo certbot certonly --dns-route53 \
    -d "*.example.com" -d "example.com"
# → Route53 API로 자동으로 TXT 레코드 추가/삭제!
```

```bash
# 인증서 파일 위치
ls -la /etc/letsencrypt/live/example.com/
# cert.pem       → 서버 인증서
# chain.pem      → 중간 인증서 체인
# fullchain.pem  → 서버 + 중간 인증서 (⭐ Nginx에서 사용)
# privkey.pem    → 개인키 (⭐ 절대 유출 금지!)

# 인증서 정보 확인
sudo certbot certificates
# Found the following certs:
#   Certificate Name: example.com
#     Serial Number: 04abc123def456
#     Key Type: ECDSA
#     Domains: example.com www.example.com
#     Expiry Date: 2025-05-30 23:59:59+00:00 (VALID: 79 days)
#     Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
#     Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
```

### 인증서 자동 갱신 (★ 실무 필수!)

Let's Encrypt 인증서는 90일만 유효해요. 자동 갱신을 설정해야 해요.

```bash
# certbot은 설치 시 자동으로 타이머/크론을 등록

# systemd timer 확인 (Ubuntu 20+)
systemctl list-timers | grep certbot
# Wed 2025-03-12 12:00:00 ... certbot.timer  certbot.service

# 또는 cron 확인
cat /etc/cron.d/certbot
# 0 */12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew

# 수동 갱신 테스트 (실제 갱신 안 함, 시뮬레이션만)
sudo certbot renew --dry-run
# Congratulations, all simulated renewals succeeded:
#   /etc/letsencrypt/live/example.com/fullchain.pem (success)

# 수동 갱신 (실제)
sudo certbot renew

# 갱신 후 Nginx 리로드가 필요 → 훅(hook) 설정
sudo certbot renew --deploy-hook "systemctl reload nginx"

# 또는 갱신 훅을 영구 설정
cat /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/bash
systemctl reload nginx

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### 자동 갱신 모니터링

```bash
# 인증서 만료일 체크 스크립트 ([cron 강의](../01-linux/06-cron) 참고)
cat << 'SCRIPT' > /opt/scripts/check-cert.sh
#!/bin/bash
DOMAIN="${1:-example.com}"
PORT="${2:-443}"
DAYS_WARN=14

EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:$PORT" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -z "$EXPIRY" ]; then
    echo "❌ $DOMAIN: 인증서 조회 실패"
    exit 1
fi

EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

if [ "$DAYS_LEFT" -lt 0 ]; then
    echo "🔴 $DOMAIN: 인증서 만료됨! ($EXPIRY)"
elif [ "$DAYS_LEFT" -lt "$DAYS_WARN" ]; then
    echo "🟡 $DOMAIN: ${DAYS_LEFT}일 후 만료! ($EXPIRY)"
else
    echo "🟢 $DOMAIN: ${DAYS_LEFT}일 남음 ($EXPIRY)"
fi
SCRIPT
chmod +x /opt/scripts/check-cert.sh

# 실행
/opt/scripts/check-cert.sh example.com
# 🟢 example.com: 79일 남음 (May 30 23:59:59 2025 GMT)

# 여러 도메인 체크
for domain in example.com api.example.com admin.example.com; do
    /opt/scripts/check-cert.sh "$domain"
done

# cron으로 매일 체크 + 알림
# 0 9 * * *  /opt/scripts/check-cert.sh example.com | grep -E "🔴|🟡" && <알림 명령>
```

---

### AWS ACM (Certificate Manager)

AWS 서비스(ALB, CloudFront, API Gateway)에서 쓸 인증서는 ACM으로 관리하는 게 가장 편해요. **무료이고 자동 갱신**이에요.

```bash
# ACM 인증서 특징:
# ✅ 무료
# ✅ 자동 갱신 (만료 걱정 없음!)
# ✅ AWS 서비스(ALB, CloudFront)에 바로 연결
# ❌ EC2에 직접 설치 불가 (ALB/CloudFront 뒤에서 사용)
# ❌ 다운로드 불가 (AWS 안에서만 사용)

# ACM 인증서 발급 (AWS CLI)
aws acm request-certificate \
    --domain-name "example.com" \
    --subject-alternative-names "*.example.com" \
    --validation-method DNS

# DNS 검증 레코드를 Route53에 추가 (자동 또는 수동)
# → CNAME 레코드 추가 후 검증 완료 → 인증서 발급!

# 인증서 목록 확인
aws acm list-certificates --region ap-northeast-2
# {
#     "CertificateSummaryList": [
#         {
#             "CertificateArn": "arn:aws:acm:ap-northeast-2:123456:certificate/abc-123",
#             "DomainName": "example.com",
#             "Status": "ISSUED"
#         }
#     ]
# }

# ALB에 인증서 연결:
# ALB Listener → HTTPS:443 → ACM 인증서 선택
# → 끝! 자동 갱신되므로 신경 쓸 일 없음
```

**Let's Encrypt vs ACM:**

| 항목 | Let's Encrypt | AWS ACM |
|------|--------------|---------|
| 비용 | 무료 | 무료 |
| 자동 갱신 | certbot 설정 필요 | ✅ 완전 자동 |
| 유효 기간 | 90일 | 13개월 (자동 갱신) |
| EC2에 직접 설치 | ✅ 가능 | ❌ 불가 |
| ALB/CloudFront | ❌ (별도 업로드 필요) | ✅ 바로 연결 |
| 와일드카드 | ✅ (DNS 검증) | ✅ (DNS 검증) |
| 추천 상황 | EC2에 직접 Nginx | ALB/CloudFront 사용 시 |

---

### Nginx SSL 설정

```bash
# /etc/nginx/sites-available/example.com

server {
    listen 80;
    server_name example.com www.example.com;
    
    # HTTP → HTTPS 리다이렉트
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # 인증서 파일
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # TLS 버전 (1.2와 1.3만 허용)
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # 암호화 방식 (강력한 것만)
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # OCSP Stapling (인증서 유효성 확인 속도 향상)
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    
    # HSTS (브라우저에게 "항상 HTTPS로 접속해"라고 알림)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # SSL 세션 캐시 (재연결 속도 향상)
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # 나머지 설정...
    location / {
        proxy_pass http://backend;
    }
}
```

```bash
# 설정 문법 검사
sudo nginx -t
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 적용
sudo systemctl reload nginx

# SSL 설정 점검 (온라인)
# https://www.ssllabs.com/ssltest/analyze.html?d=example.com
# → A+ 등급이 목표!
```

---

## 🔍 상세 설명 — mTLS

### mTLS (Mutual TLS)란?

일반 TLS는 **서버만 인증**해요. mTLS는 **서버와 클라이언트 양쪽 모두 인증**해요.

```mermaid
flowchart LR
    subgraph "일반 TLS"
        C1["클라이언트"] -->|"서버를 확인"| S1["서버"]
        S1 -->|"인증서 제출"| C1
        C1 -.->|"'나는 누구?' 안 물어봄"| S1
    end
    
    subgraph "mTLS"
        C2["클라이언트<br/>(인증서 보유)"] -->|"서버를 확인"| S2["서버<br/>(인증서 보유)"]
        S2 -->|"서버 인증서 제출"| C2
        S2 -->|"'너 인증서 보여줘'"| C2
        C2 -->|"클라이언트 인증서 제출"| S2
    end
    
    style C2 fill:#3498db,color:#fff
    style S2 fill:#2ecc71,color:#fff
```

**언제 mTLS를 쓰나요?**

```
✅ 마이크로서비스 간 통신 (서비스 A ↔ 서비스 B)
   → Istio, Linkerd가 자동으로 mTLS 설정
✅ API 클라이언트 인증 (ID/PW 대신 인증서로)
✅ Zero Trust 네트워크 (네트워크 위치가 아닌 ID로 인증)
✅ 내부 서비스 간 보안 (VPN 대신)

❌ 일반 웹사이트 (사용자가 인증서를 설치할 수 없으니)
❌ 공개 API (불특정 다수 접근)
```

### Istio에서의 mTLS

Kubernetes에서 Istio를 사용하면 **자동으로 모든 서비스 간 mTLS**가 적용돼요.

```yaml
# Istio PeerAuthentication — mTLS 정책
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT    # 모든 서비스 간 mTLS 강제
    # PERMISSIVE    # mTLS와 평문 둘 다 허용 (마이그레이션 중)
    # DISABLE       # mTLS 비활성화
```

```bash
# Istio mTLS 상태 확인
istioctl x authz check deploy/myapp
# LISTENER[FilterChain]  MTLS(STRICT)

# 서비스 간 통신이 암호화되는지 확인
# → 사이드카 프록시(Envoy)가 자동으로 TLS를 처리
# → 앱 코드는 수정 불필요!
# → 인증서도 Istio가 자동 발급/갱신
```

---

## 🔍 상세 설명 — openssl 디버깅

### 원격 서버 인증서 확인

```bash
# 기본 인증서 정보
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -text | head -20

# 만료일만 확인 (⭐ 가장 많이 씀!)
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=May 30 23:59:59 2025 GMT

# 발급자 확인
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -issuer
# issuer=C = US, O = Let's Encrypt, CN = R3

# SAN (Subject Alternative Name) — 어떤 도메인에 유효한지
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -ext subjectAltName
# X509v3 Subject Alternative Name:
#     DNS:example.com, DNS:www.example.com

# 인증서 체인 전체 보기
openssl s_client -connect example.com:443 -showcerts < /dev/null 2>/dev/null
```

### 로컬 인증서 파일 확인

```bash
# 인증서 파일 정보
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -noout -text | head -30

# 만료일
openssl x509 -in cert.pem -noout -enddate
# notAfter=May 30 23:59:59 2025 GMT

# 도메인
openssl x509 -in cert.pem -noout -subject
# subject=CN = example.com

# 인증서와 개인키가 매칭하는지 확인 (⭐ 설정 오류 방지!)
# 둘의 modulus가 같아야 함
openssl x509 -noout -modulus -in cert.pem | md5sum
# abc123def456...
openssl rsa -noout -modulus -in privkey.pem | md5sum
# abc123def456...  ← 같으면 매칭! ✅

# 다르면 → 인증서와 키가 쌍이 안 맞음! ❌
# → 잘못된 키 파일을 사용하고 있거나, 다른 인증서의 키
```

### CSR (Certificate Signing Request) 생성

```bash
# 새 개인키 + CSR 생성
openssl req -new -newkey rsa:2048 -nodes \
    -keyout example.com.key \
    -out example.com.csr \
    -subj "/C=KR/ST=Seoul/L=Gangnam/O=MyCompany/CN=example.com"

# CSR 내용 확인
openssl req -in example.com.csr -noout -text

# 자체 서명 인증서 (Self-signed, 테스트용)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout self-signed.key \
    -out self-signed.crt \
    -subj "/CN=localhost"

# ⚠️ 자체 서명 인증서는 브라우저에서 경고가 나요!
# → 프로덕션에서는 CA 발급 인증서 사용
# → 개발/테스트에서만 자체 서명 사용
```

---

## 💻 실습 예제

### 실습 1: 인증서 정보 확인

```bash
# 여러 사이트의 인증서 정보 확인
for site in google.com github.com amazon.com; do
    echo "=== $site ==="
    echo | openssl s_client -servername $site -connect $site:443 2>/dev/null \
        | openssl x509 -noout -subject -issuer -enddate
    echo ""
done
# === google.com ===
# subject=CN = *.google.com
# issuer=C = US, O = Google Trust Services, CN = GTS CA 1C3
# notAfter=Jun  2 08:24:43 2025 GMT
# 
# === github.com ===
# subject=CN = github.com
# issuer=C = US, O = DigiCert Inc, CN = DigiCert ...
# notAfter=Mar 15 23:59:59 2026 GMT
```

### 실습 2: TLS 버전/암호화 확인

```bash
# TLS 1.3 지원 여부
openssl s_client -connect google.com:443 -tls1_3 < /dev/null 2>/dev/null | grep "Protocol"
# Protocol  : TLSv1.3    ← 지원!

# 사용된 암호화 방식
openssl s_client -connect google.com:443 < /dev/null 2>/dev/null | grep "Cipher"
# Cipher    : TLS_AES_256_GCM_SHA384

# curl로 TLS 정보 확인
curl -vI https://google.com 2>&1 | grep -E "SSL|TLS|subject|expire|issuer"
```

### 실습 3: 자체 서명 인증서 만들기

```bash
# 1. 개인키 + 자체 서명 인증서 생성
openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
    -keyout /tmp/test.key \
    -out /tmp/test.crt \
    -subj "/CN=localhost"

# 2. 인증서 확인
openssl x509 -in /tmp/test.crt -noout -text | head -15

# 3. 간단한 HTTPS 서버로 테스트 (Python)
cd /tmp
python3 << 'EOF' &
import ssl, http.server
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('test.crt', 'test.key')
server = http.server.HTTPServer(('0.0.0.0', 4443), http.server.SimpleHTTPRequestHandler)
server.socket = context.wrap_socket(server.socket, server_side=True)
print("HTTPS server on :4443")
server.serve_forever()
EOF

# 4. 접속 테스트 (-k: 자체 서명 인증서 허용)
curl -k https://localhost:4443/
# → 파일 목록이 나옴

# 인증서 없이 접속하면:
curl https://localhost:4443/
# curl: (60) SSL certificate problem: self-signed certificate
# → 자체 서명이라 신뢰 안 함!

# 5. 정리
kill %1
rm /tmp/test.key /tmp/test.crt
```

### 실습 4: 인증서 만료일 모니터링

```bash
# 여러 도메인의 만료일을 한번에 체크
cat << 'SCRIPT' > /tmp/cert-check.sh
#!/bin/bash
DOMAINS="google.com github.com example.com amazon.com"

printf "%-30s %-15s %s\n" "DOMAIN" "DAYS LEFT" "EXPIRY DATE"
echo "────────────────────────────────────────────────────────────────"

for domain in $DOMAINS; do
    expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$expiry" ]; then
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        now_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - now_epoch) / 86400 ))
        
        if [ "$days_left" -lt 14 ]; then
            status="⚠️"
        else
            status="✅"
        fi
        printf "%-30s %-15s %s %s\n" "$domain" "${days_left}일" "$expiry" "$status"
    else
        printf "%-30s %-15s %s\n" "$domain" "확인 실패" "❌"
    fi
done
SCRIPT
chmod +x /tmp/cert-check.sh
/tmp/cert-check.sh

# DOMAIN                         DAYS LEFT       EXPIRY DATE
# ────────────────────────────────────────────────────────────────
# google.com                     82일            Jun  2 08:24:43 2025 GMT ✅
# github.com                     368일           Mar 15 23:59:59 2026 GMT ✅
# example.com                    79일            May 30 23:59:59 2025 GMT ✅
# amazon.com                     120일           Jul 10 23:59:59 2025 GMT ✅
```

---

## 🏢 실무에서는?

### 시나리오 1: "인증서 만료!" 긴급 대응

```bash
# 사용자들이 "사이트에 접속하면 보안 경고가 나요!" 라고 신고

# 1. 만료 확인
echo | openssl s_client -connect mysite.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=Mar 10 23:59:59 2025 GMT    ← 이미 만료!

# 2. certbot으로 즉시 갱신
sudo certbot renew --force-renewal
# Congratulations, all renewals succeeded

# 3. Nginx 리로드
sudo nginx -t && sudo systemctl reload nginx

# 4. 갱신 확인
echo | openssl s_client -connect mysite.com:443 2>/dev/null \
    | openssl x509 -noout -enddate
# notAfter=Jun 10 23:59:59 2025 GMT    ← 갱신됨! ✅

# 5. 재발 방지
# certbot 자동 갱신 타이머가 동작하는지 확인
systemctl status certbot.timer
# → Active: active (waiting) 확인

# 만료 알림 스크립트를 cron에 등록 (위의 cert-check.sh)
```

### 시나리오 2: "NET::ERR_CERT_AUTHORITY_INVALID" 에러

```bash
# 원인: 인증서 체인이 불완전함 (중간 인증서 누락)

# 1. 체인 확인
openssl s_client -connect mysite.com:443 -showcerts < /dev/null 2>/dev/null | grep -E "^Certificate chain| s:| i:"
# Certificate chain
#  0 s:CN = mysite.com
#    i:C = US, O = Let's Encrypt, CN = R3
# → 중간 인증서(R3)가 서버에서 제공되지 않음!

# 2. 해결: fullchain.pem 사용 (cert.pem이 아니라!)
# Nginx 설정:
# ❌ ssl_certificate /etc/letsencrypt/live/mysite.com/cert.pem;
# ✅ ssl_certificate /etc/letsencrypt/live/mysite.com/fullchain.pem;

sudo nginx -t && sudo systemctl reload nginx

# 3. 확인
openssl s_client -connect mysite.com:443 -showcerts < /dev/null 2>/dev/null | grep -E "^Certificate chain| s:| i:"
# Certificate chain
#  0 s:CN = mysite.com
#    i:C = US, O = Let's Encrypt, CN = R3
#  1 s:C = US, O = Let's Encrypt, CN = R3
#    i:O = Internet Security Research Group, CN = ISRG Root X1
# → 체인 완성! ✅
```

### 시나리오 3: ALB에 ACM 인증서 적용

```bash
# 1. ACM에서 인증서 발급 (AWS 콘솔 또는 CLI)
aws acm request-certificate \
    --domain-name "myapp.example.com" \
    --validation-method DNS \
    --region ap-northeast-2

# 2. DNS 검증 (Route53에 CNAME 추가)
# → ACM이 제공하는 CNAME 레코드를 Route53에 추가
# → 자동 검증 → 인증서 발급!

# 3. ALB Listener에 인증서 연결
# ALB → Listeners → HTTPS:443 → Default SSL certificate → ACM 인증서 선택

# 4. 확인
curl -vI https://myapp.example.com 2>&1 | grep -E "subject|issuer"
# subject: CN=myapp.example.com
# issuer: C=US, O=Amazon, CN=Amazon RSA 2048 M01

# ACM 인증서는 자동 갱신! 인증서 만료 걱정 없음! ✅
```

### 시나리오 4: 인증서와 개인키 불일치 진단

```bash
# Nginx가 시작 안 됨:
# nginx: [emerg] SSL_CTX_use_PrivateKey_file("privkey.pem") failed
# (SSL: error:0B080074:x509 certificate routines:X509_check_private_key:key values mismatch)

# 원인: 인증서와 개인키가 쌍이 안 맞음!

# 매칭 확인
CERT_MD5=$(openssl x509 -noout -modulus -in cert.pem 2>/dev/null | md5sum | awk '{print $1}')
KEY_MD5=$(openssl rsa -noout -modulus -in privkey.pem 2>/dev/null | md5sum | awk '{print $1}')

echo "인증서: $CERT_MD5"
echo "개인키: $KEY_MD5"

if [ "$CERT_MD5" = "$KEY_MD5" ]; then
    echo "✅ 매칭!"
else
    echo "❌ 불일치! 다른 인증서의 키를 사용하고 있어요"
fi

# 해결: 올바른 키 파일로 교체
# Let's Encrypt라면: /etc/letsencrypt/live/도메인/ 디렉토리 확인
```

---

## ⚠️ 자주 하는 실수

### 1. 인증서 자동 갱신을 설정 안 하기

```bash
# ❌ Let's Encrypt 인증서를 수동으로만 발급하고 갱신을 잊음
# → 90일 후 만료 → 사이트 접속 불가!

# ✅ certbot 타이머/크론 확인
systemctl status certbot.timer    # 또는
crontab -l | grep certbot

# ✅ 만료 모니터링 스크립트 + 알림
```

### 2. cert.pem 대신 fullchain.pem 사용 안 하기

```bash
# ❌ 서버 인증서만 설치 (중간 인증서 누락)
ssl_certificate /etc/letsencrypt/live/example.com/cert.pem;

# → 일부 브라우저/클라이언트에서 "인증서 신뢰 안 함" 에러!

# ✅ fullchain.pem (서버 + 중간 인증서)
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
```

### 3. 개인키를 Git에 커밋하기

```bash
# ❌ 개인키가 Git 저장소에 들어감
git add privkey.pem
# → 누구나 볼 수 있음! 인증서를 가장할 수 있음!

# ✅ .gitignore에 추가
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
echo "privkey*" >> .gitignore

# 이미 커밋했다면? → 키 폐기 + 인증서 재발급!
# Git 이력에서 제거: git filter-branch 또는 BFG Repo-Cleaner
```

### 4. TLS 1.0/1.1을 허용하기

```bash
# ❌ 오래된 TLS 버전 허용 (보안 취약!)
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

# ✅ TLS 1.2 이상만 허용
ssl_protocols TLSv1.2 TLSv1.3;

# PCI DSS 등 보안 규정에서 TLS 1.0/1.1 사용 금지!
```

### 5. HTTP → HTTPS 리다이렉트를 안 하기

```bash
# ❌ HTTP(80)로도 접속 가능 → 암호화 안 된 통신!

# ✅ Nginx에서 HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

# ✅ HSTS 헤더로 브라우저가 항상 HTTPS 사용하게
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📝 정리

### TLS/인증서 디버깅 치트시트

```bash
# === 원격 서버 ===
# 만료일 확인
echo | openssl s_client -connect HOST:443 2>/dev/null | openssl x509 -noout -enddate

# 발급자/도메인 확인
echo | openssl s_client -connect HOST:443 2>/dev/null | openssl x509 -noout -subject -issuer

# 체인 확인
openssl s_client -connect HOST:443 -showcerts < /dev/null

# TLS 버전 확인
curl -v https://HOST 2>&1 | grep "SSL connection"

# === 로컬 파일 ===
# 인증서 정보
openssl x509 -in cert.pem -noout -text

# 인증서-키 매칭 확인
openssl x509 -noout -modulus -in cert.pem | md5sum
openssl rsa -noout -modulus -in key.pem | md5sum

# === Let's Encrypt ===
sudo certbot certificates              # 인증서 목록
sudo certbot renew --dry-run            # 갱신 테스트
sudo certbot renew                      # 실제 갱신
sudo certbot renew --force-renewal      # 강제 갱신
```

### 인증서 관리 체크리스트

```
✅ 인증서 자동 갱신 설정 (certbot timer 또는 cron)
✅ fullchain.pem 사용 (cert.pem 아님!)
✅ 개인키 권한 600, Git에 포함 금지
✅ TLS 1.2 이상만 허용
✅ HTTP → HTTPS 리다이렉트 + HSTS
✅ 만료 모니터링 + 알림 설정
✅ AWS 서비스는 ACM 사용 (자동 갱신)
✅ SSL Labs에서 A+ 등급 확인
```

---

## 🔗 다음 강의

다음은 **[06-load-balancing](./06-load-balancing)** — 로드 밸런싱 (L4 vs L7 / reverse proxy / sticky sessions / health check) 이에요.

트래픽이 몰리면 서버 하나로는 못 버텨요. 여러 서버에 트래픽을 분산하는 로드 밸런서의 원리, L4와 L7의 차이, Nginx와 HAProxy 실무 설정까지 배워볼게요.
