# HTTP 에코시스템 (HTTP/1.1 ~ HTTP/3 / QUIC / gRPC / WebSocket)

> 웹의 모든 것은 HTTP 위에서 동작해요. REST API, 웹사이트, 마이크로서비스 간 통신, CDN — 전부 HTTP예요. HTTP를 제대로 이해하면 웹 서비스의 성능, 보안, 디버깅 능력이 완전히 달라져요.

---

## 🎯 이걸 왜 알아야 하나?

```
실무에서 HTTP 지식이 필요한 순간:
• "API 응답이 느려요"                   → Keep-Alive, HTTP/2 다중화 이해
• "502 Bad Gateway가 나와요"           → 상태 코드 + Nginx 프록시 구조 이해
• "CORS 에러가 나요"                    → HTTP 헤더 이해
• "gRPC를 도입하자는데 뭐가 좋은 거죠?" → HTTP/2 기반 프로토콜 이해
• "실시간 알림을 구현해야 해요"          → WebSocket vs SSE 이해
• "HTTP/3로 바꾸면 빨라지나요?"         → QUIC 이해
• "Nginx 설정에서 proxy_pass가 뭐예요?" → HTTP 프록시 이해
```

[이전 강의](./01-osi-tcp-udp)에서 TCP/UDP를 배웠죠? HTTP는 TCP(그리고 HTTP/3은 UDP) 위에서 동작하는 **L7 프로토콜**이에요.

---

## 🧠 핵심 개념

### 비유: 식당 주문 시스템

HTTP를 **식당 주문**에 비유해볼게요.

* **HTTP 요청(Request)** = 손님이 메뉴판을 보고 주문하는 것
* **HTTP 응답(Response)** = 식당이 음식을 내오는 것
* **HTTP 메서드** = 주문 종류 (주문, 취소, 변경 등)
* **상태 코드** = 식당의 응답 ("나왔습니다 200", "그 메뉴 없어요 404", "주방 고장 500")
* **헤더** = 주문서 상단 정보 (테이블 번호, 알레르기 정보, VIP 여부)
* **바디** = 실제 음식(응답) 또는 주문 내용(요청)

---

## 🔍 상세 설명 — HTTP 기본

### HTTP 요청/응답 구조

```mermaid
sequenceDiagram
    participant C as 클라이언트 (브라우저/curl)
    participant S as 서버 (Nginx)
    
    C->>S: HTTP Request<br/>GET /api/users HTTP/1.1<br/>Host: api.example.com<br/>Accept: application/json
    S->>C: HTTP Response<br/>HTTP/1.1 200 OK<br/>Content-Type: application/json<br/>{"users": [...]}
```

```bash
# curl -v 로 실제 HTTP 요청/응답 관찰 (⭐ 디버깅 필수 도구)
curl -v http://httpbin.org/get 2>&1

# * Trying 34.199.75.4:80...
# * Connected to httpbin.org (34.199.75.4) port 80
#
# > GET /get HTTP/1.1              ← 요청 시작줄 (메서드 URL 버전)
# > Host: httpbin.org              ← 요청 헤더
# > User-Agent: curl/7.81.0
# > Accept: */*
# >                                ← 빈 줄 (헤더 끝)
#
# < HTTP/1.1 200 OK               ← 응답 시작줄 (버전 상태코드 상태메시지)
# < Content-Type: application/json ← 응답 헤더
# < Content-Length: 256
# < Connection: keep-alive
# <                                ← 빈 줄 (헤더 끝)
# {                                ← 응답 바디 (JSON)
#   "args": {},
#   "headers": { ... },
#   "url": "http://httpbin.org/get"
# }
```

### HTTP 메서드

| 메서드 | 용도 | 요청 바디 | 멱등성 | 예시 |
|--------|------|----------|--------|------|
| `GET` | 데이터 조회 | 없음 | ✅ | `GET /api/users` |
| `POST` | 데이터 생성 | 있음 | ❌ | `POST /api/users` |
| `PUT` | 데이터 전체 수정 | 있음 | ✅ | `PUT /api/users/1` |
| `PATCH` | 데이터 일부 수정 | 있음 | ❌ | `PATCH /api/users/1` |
| `DELETE` | 데이터 삭제 | 없음/있음 | ✅ | `DELETE /api/users/1` |
| `HEAD` | 헤더만 조회 (바디 없음) | 없음 | ✅ | `HEAD /api/users` |
| `OPTIONS` | 허용 메서드 확인 (CORS) | 없음 | ✅ | `OPTIONS /api/users` |

**멱등성(Idempotency):** 같은 요청을 여러 번 보내도 결과가 같으면 멱등. GET으로 10번 조회해도 결과는 같지만, POST로 10번 생성하면 10개가 생겨요.

```bash
# curl로 각 메서드 사용
curl -X GET http://api.example.com/users
curl -X POST http://api.example.com/users -H "Content-Type: application/json" -d '{"name":"alice"}'
curl -X PUT http://api.example.com/users/1 -H "Content-Type: application/json" -d '{"name":"bob"}'
curl -X PATCH http://api.example.com/users/1 -H "Content-Type: application/json" -d '{"email":"new@email.com"}'
curl -X DELETE http://api.example.com/users/1
curl -I http://api.example.com/users    # HEAD (헤더만)
```

---

### HTTP 상태 코드 (★ 반드시 외우기!)

```mermaid
flowchart LR
    subgraph 1xx["1xx: 정보"]
        C100["100 Continue<br/>101 Switching Protocols"]
    end
    
    subgraph 2xx["2xx: 성공 ✅"]
        C200["200 OK<br/>201 Created<br/>204 No Content"]
    end
    
    subgraph 3xx["3xx: 리다이렉트 ↗️"]
        C300["301 Moved Permanently<br/>302 Found (임시)<br/>304 Not Modified"]
    end
    
    subgraph 4xx["4xx: 클라이언트 에러 ❌"]
        C400["400 Bad Request<br/>401 Unauthorized<br/>403 Forbidden<br/>404 Not Found<br/>405 Method Not Allowed<br/>429 Too Many Requests"]
    end
    
    subgraph 5xx["5xx: 서버 에러 🔥"]
        C500["500 Internal Server Error<br/>502 Bad Gateway<br/>503 Service Unavailable<br/>504 Gateway Timeout"]
    end
    
    style 2xx fill:#2ecc71,color:#fff
    style 4xx fill:#e67e22,color:#fff
    style 5xx fill:#e74c3c,color:#fff
```

#### 자주 만나는 상태 코드 상세

```bash
# === 2xx 성공 ===

# 200 OK — 정상 응답 (가장 흔함)
curl -s -o /dev/null -w "%{http_code}" http://api.example.com/health
# 200

# 201 Created — 리소스 생성 성공 (POST 후)
curl -s -o /dev/null -w "%{http_code}" -X POST http://api.example.com/users -d '{}'
# 201

# 204 No Content — 성공했지만 응답 바디 없음 (DELETE 후)
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://api.example.com/users/1
# 204

# === 3xx 리다이렉트 ===

# 301 Moved Permanently — 영구 이동 (SEO, URL 변경)
curl -I http://example.com
# HTTP/1.1 301 Moved Permanently
# Location: https://example.com/    ← 여기로 가세요

# 302 Found — 임시 이동
# 304 Not Modified — 캐시 사용 가능 (변경 없음)

# 리다이렉트를 따라가려면 -L 옵션
curl -L http://example.com    # 301/302를 따라감

# === 4xx 클라이언트 에러 ===

# 400 Bad Request — 잘못된 요청 (파라미터 오류, JSON 형식 오류)
# 401 Unauthorized — 인증 필요 (로그인 안 함)
# 403 Forbidden — 권한 없음 (로그인은 했지만 접근 거부)
# 404 Not Found — 리소스 없음 (URL 틀림)
# 405 Method Not Allowed — 이 URL에서 이 메서드 안 됨
# 429 Too Many Requests — 요청 너무 많음 (Rate Limiting)

# === 5xx 서버 에러 === (DevOps가 가장 민감한 코드!)

# 500 Internal Server Error — 서버 내부 에러 (앱 버그, 예외 미처리)
# 502 Bad Gateway — 프록시 뒷단 서버가 응답 불가
# 503 Service Unavailable — 서비스 일시 불가 (과부하, 점검 중)
# 504 Gateway Timeout — 프록시 뒷단 서버가 응답 시간 초과
```

**502 vs 503 vs 504 (Nginx 기준):**

```mermaid
flowchart LR
    CLIENT[클라이언트] --> NGINX[Nginx<br/>리버스 프록시]
    
    NGINX -->|"앱서버가 죽어있음"| E502["502 Bad Gateway<br/>연결 자체가 안 됨"]
    NGINX -->|"앱서버가 바빠서 거부"| E503["503 Service Unavailable<br/>연결됐지만 처리 불가"]
    NGINX -->|"앱서버가 응답이 너무 느림"| E504["504 Gateway Timeout<br/>시간 초과"]
    
    style E502 fill:#e74c3c,color:#fff
    style E503 fill:#e67e22,color:#fff
    style E504 fill:#f39c12,color:#fff
```

```bash
# 실무에서 5xx 디버깅

# 502 Bad Gateway → 백엔드 서버 확인
systemctl status myapp                    # 서비스 살아있나?
ss -tlnp | grep 8080                     # 포트 열려있나?
curl http://localhost:8080/health         # 직접 접속 되나?

# 503 Service Unavailable → 과부하/점검 확인
journalctl -u myapp -p err --since "5 min ago"

# 504 Gateway Timeout → 타임아웃 설정 확인
# Nginx 설정:
# proxy_connect_timeout 60s;
# proxy_read_timeout 60s;
# proxy_send_timeout 60s;
```

---

### HTTP 헤더

요청/응답에 부가 정보를 전달하는 메타데이터예요.

#### 자주 쓰는 요청 헤더

```bash
# Host — 요청 대상 도메인 (가상 호스트 구분)
Host: api.example.com

# Content-Type — 요청 바디의 형식
Content-Type: application/json
Content-Type: application/x-www-form-urlencoded
Content-Type: multipart/form-data

# Authorization — 인증 정보
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Basic dXNlcjpwYXNz

# Accept — 원하는 응답 형식
Accept: application/json
Accept: text/html

# User-Agent — 클라이언트 정보
User-Agent: curl/7.81.0
User-Agent: Mozilla/5.0 (...)

# X-Forwarded-For — 원래 클라이언트 IP (프록시/LB 경유 시)
X-Forwarded-For: 203.0.113.50, 10.0.0.1

# X-Request-ID — 요청 추적용 ID (마이크로서비스에서 중요!)
X-Request-ID: abc123-def456-ghi789
```

#### 자주 쓰는 응답 헤더

```bash
# Content-Type — 응답 바디의 형식
Content-Type: application/json; charset=utf-8

# Content-Length — 응답 크기 (바이트)
Content-Length: 1234

# Cache-Control — 캐시 정책
Cache-Control: public, max-age=3600        # 1시간 캐시
Cache-Control: no-cache                     # 매번 재검증
Cache-Control: no-store                     # 캐시 금지

# Set-Cookie — 쿠키 설정
Set-Cookie: session=abc123; Path=/; HttpOnly; Secure

# Access-Control-Allow-Origin — CORS 허용
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Origin: *              # 모든 도메인 허용 (개발용)

# Location — 리다이렉트 목적지
Location: https://example.com/new-url
```

```bash
# 헤더 확인하는 curl 명령어

# 응답 헤더만 보기
curl -I https://example.com
# HTTP/2 200
# content-type: text/html; charset=UTF-8
# content-length: 1256
# cache-control: max-age=3600
# ...

# 요청 + 응답 헤더 전부 보기
curl -v https://example.com 2>&1 | grep -E "^[<>]"
# > GET / HTTP/2
# > Host: example.com
# > User-Agent: curl/7.81.0
# > Accept: */*
# < HTTP/2 200
# < content-type: text/html
# < cache-control: max-age=3600

# 특정 헤더만 추출
curl -sI https://example.com | grep -i "content-type"
# content-type: text/html; charset=UTF-8

# 커스텀 헤더 보내기
curl -H "Authorization: Bearer mytoken123" \
     -H "X-Request-ID: test-001" \
     http://api.example.com/data
```

---

### Keep-Alive (연결 재사용)

HTTP/1.0에서는 요청마다 TCP 연결을 맺고 끊었어요. HTTP/1.1부터 **Keep-Alive**로 연결을 재사용해요.

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant S as 서버
    
    rect rgb(255, 200, 200)
        Note over C,S: HTTP/1.0 (Keep-Alive 없음)
        C->>S: TCP 연결 (3-way handshake)
        C->>S: GET /page.html
        S->>C: 200 OK + HTML
        C->>S: TCP 종료 (4-way)
        C->>S: TCP 연결 (또 3-way!)
        C->>S: GET /style.css
        S->>C: 200 OK + CSS
        C->>S: TCP 종료 (또 4-way!)
    end
    
    rect rgb(200, 255, 200)
        Note over C,S: HTTP/1.1 (Keep-Alive 기본)
        C->>S: TCP 연결 (3-way handshake, 1번만)
        C->>S: GET /page.html
        S->>C: 200 OK + HTML
        C->>S: GET /style.css (같은 연결!)
        S->>C: 200 OK + CSS
        C->>S: GET /app.js (같은 연결!)
        S->>C: 200 OK + JS
        Note over C,S: 일정 시간 후 연결 종료
    end
```

```bash
# Nginx Keep-Alive 설정
# /etc/nginx/nginx.conf

http {
    # 클라이언트 → Nginx
    keepalive_timeout 65;        # 65초간 연결 유지
    keepalive_requests 1000;     # 한 연결에서 최대 1000개 요청

    # Nginx → 업스트림 (백엔드 서버)
    upstream backend {
        server 10.0.1.60:8080;
        keepalive 32;            # 업스트림에도 Keep-Alive 연결 32개 유지
    }
}
```

---

## 🔍 상세 설명 — HTTP 버전별 차이

### HTTP/1.1

```
특징:
• 텍스트 기반 프로토콜 (사람이 읽을 수 있음)
• Keep-Alive 기본 (연결 재사용)
• 파이프라이닝 (이론상 여러 요청 동시 전송, 실제로는 잘 안 씀)
• ⚠️ HOL Blocking (Head-of-Line Blocking)
  → 앞 요청이 느리면 뒤 요청도 기다려야 함
```

```bash
# HTTP/1.1로 요청
curl --http1.1 -v https://example.com 2>&1 | head -5
# > GET / HTTP/1.1
# > Host: example.com
```

### HTTP/2

```
특징:
• 바이너리 프로토콜 (사람이 읽을 수 없지만 빠름)
• 멀티플렉싱 — 하나의 TCP 연결에서 여러 요청/응답 동시 전송!
• 헤더 압축 (HPACK) — 반복되는 헤더를 압축
• 서버 푸시 — 요청 전에 서버가 먼저 보내기 (CSS, JS 등)
• 스트림 우선순위 — 중요한 리소스 먼저 전송
• ✅ HOL Blocking 해결 (HTTP 레벨에서)
• ⚠️ TCP 레벨 HOL Blocking은 여전히 존재
```

```mermaid
flowchart LR
    subgraph "HTTP/1.1 — 순차 처리"
        A1["요청 1"] --> B1["응답 1"]
        B1 --> A2["요청 2"]
        A2 --> B2["응답 2"]
        B2 --> A3["요청 3"]
        A3 --> B3["응답 3"]
    end
    
    subgraph "HTTP/2 — 멀티플렉싱"
        C1["요청 1 + 요청 2 + 요청 3"]
        C1 --> D1["응답 2 (빠른 것 먼저)"]
        C1 --> D2["응답 1"]
        C1 --> D3["응답 3"]
    end
    
    style C1 fill:#2ecc71,color:#fff
```

```bash
# HTTP/2로 요청
curl --http2 -v https://example.com 2>&1 | grep "HTTP/"
# * using HTTP/2
# < HTTP/2 200

# HTTP/2가 지원되는지 확인
curl -sI https://example.com | head -1
# HTTP/2 200

# Nginx에서 HTTP/2 활성화
# server {
#     listen 443 ssl http2;     ← http2 추가
#     ssl_certificate ...;
#     ssl_certificate_key ...;
# }
```

### HTTP/3 (QUIC)

```
특징:
• UDP 기반! (TCP 대신 QUIC 프로토콜 사용)
• ✅ TCP 레벨 HOL Blocking 완전 해결
• 0-RTT 연결 — 이전에 접속한 서버에 즉시 연결 (핸드셰이크 생략)
• 연결 마이그레이션 — WiFi → LTE로 바뀌어도 연결 유지
• TLS 1.3 내장 — 별도 TLS 핸드셰이크 불필요
```

```mermaid
flowchart TD
    subgraph "HTTP/1.1 & HTTP/2"
        TCP["TCP<br/>(3-way handshake)"]
        TLS["TLS<br/>(별도 handshake)"]
        HTTP12["HTTP 데이터"]
        TCP --> TLS --> HTTP12
    end
    
    subgraph "HTTP/3"
        QUIC["QUIC (UDP 기반)<br/>연결 + TLS 통합<br/>0-RTT 가능!"]
        HTTP3["HTTP 데이터"]
        QUIC --> HTTP3
    end
    
    style QUIC fill:#2ecc71,color:#fff
```

```bash
# HTTP/3로 요청 (curl 7.88+)
curl --http3 https://cloudflare.com -I
# HTTP/3 200

# HTTP/3 지원 확인 (Alt-Svc 헤더)
curl -sI https://cloudflare.com | grep -i "alt-svc"
# alt-svc: h3=":443"; ma=86400

# Nginx에서 HTTP/3 활성화 (1.25+)
# server {
#     listen 443 ssl;
#     listen 443 quic;          ← QUIC 추가
#     http2 on;
#     http3 on;                  ← HTTP/3 활성화
#     add_header Alt-Svc 'h3=":443"; ma=86400';
# }
```

### 버전 비교 요약

| 항목 | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|---------|--------|--------|
| 전송 프로토콜 | TCP | TCP | **UDP (QUIC)** |
| 형식 | 텍스트 | 바이너리 | 바이너리 |
| 멀티플렉싱 | ❌ | ✅ | ✅ |
| 헤더 압축 | ❌ | ✅ (HPACK) | ✅ (QPACK) |
| HOL Blocking | ⚠️ HTTP + TCP | ⚠️ TCP만 | ✅ 없음 |
| TLS | 별도 | 별도 (보통 필수) | **내장** (필수) |
| 연결 수립 속도 | 느림 (TCP+TLS) | 보통 | **빠름 (0-RTT)** |
| 실무 보급률 | 레거시 | ⭐ 주류 | 확산 중 |

---

## 🔍 상세 설명 — gRPC

### gRPC란?

Google이 만든 **고성능 RPC(Remote Procedure Call) 프레임워크**. HTTP/2 위에서 동작하고, Protocol Buffers(protobuf)로 데이터를 직렬화해요.

**비유:** REST API가 "JSON 편지를 HTTP로 보내는 것"이라면, gRPC는 "바이너리 데이터를 HTTP/2 고속도로로 보내는 것"이에요.

```mermaid
flowchart LR
    subgraph "REST API"
        R1["JSON (텍스트)"]
        R2["HTTP/1.1 or HTTP/2"]
        R1 --> R2
    end
    
    subgraph "gRPC"
        G1["Protobuf (바이너리)"]
        G2["HTTP/2 (필수)"]
        G1 --> G2
    end
    
    style G1 fill:#3498db,color:#fff
    style G2 fill:#2ecc71,color:#fff
```

### REST vs gRPC 비교

| 비교 | REST | gRPC |
|------|------|------|
| 데이터 형식 | JSON (텍스트) | Protobuf (바이너리) |
| 전송 프로토콜 | HTTP/1.1 or HTTP/2 | HTTP/2 (필수) |
| 속도 | 보통 | 빠름 (2~10배) |
| 타입 안전성 | ❌ (런타임 에러) | ✅ (컴파일 타임 체크) |
| 스트리밍 | 어려움 | ✅ (양방향 스트리밍) |
| 브라우저 지원 | ✅ 네이티브 | ⚠️ gRPC-Web 필요 |
| API 문서 | OpenAPI/Swagger | .proto 파일 자체가 문서 |
| 실무 용도 | 외부 API, 웹 | 내부 마이크로서비스 간 통신 |

```bash
# gRPC 통신 패턴

# 1. Unary (일반 요청-응답)
# 클라이언트 → 요청 1개 → 서버 → 응답 1개

# 2. Server Streaming
# 클라이언트 → 요청 1개 → 서버 → 응답 여러 개 (스트림)
# 예: 주식 가격 실시간 조회

# 3. Client Streaming
# 클라이언트 → 요청 여러 개 (스트림) → 서버 → 응답 1개
# 예: 파일 업로드

# 4. Bidirectional Streaming
# 클라이언트 ↔ 서버 (양방향 스트림)
# 예: 채팅, 실시간 협업

# gRPC 디버깅 도구
# grpcurl (curl의 gRPC 버전)
grpcurl -plaintext localhost:50051 list
# myapp.UserService
# myapp.OrderService
# grpc.health.v1.Health

grpcurl -plaintext localhost:50051 myapp.UserService/GetUser
# {
#   "id": 1,
#   "name": "alice"
# }

# gRPC 헬스체크
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
# {
#   "status": "SERVING"
# }
```

### 실무에서 gRPC

```
언제 gRPC를 쓰나요?
✅ 마이크로서비스 간 내부 통신 (높은 성능 필요)
✅ 실시간 스트리밍 (양방향 통신)
✅ Polyglot 환경 (Go, Java, Python 등 여러 언어)
✅ K8s 서비스 간 통신

언제 REST를 쓰나요?
✅ 외부 공개 API (브라우저 호환)
✅ 간단한 CRUD
✅ 디버깅이 쉬워야 할 때 (curl로 테스트)
✅ 팀이 REST에 익숙할 때
```

---

## 🔍 상세 설명 — WebSocket

### WebSocket이란?

HTTP는 기본적으로 **클라이언트가 요청해야 서버가 응답**하는 구조예요. WebSocket은 한 번 연결하면 **서버가 먼저 데이터를 보낼 수 있어요** (양방향 통신).

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant S as 서버
    
    rect rgb(255, 220, 220)
        Note over C,S: HTTP (단방향)
        C->>S: 요청
        S->>C: 응답
        C->>S: 새 데이터 있나요? (폴링)
        S->>C: 없어요
        C->>S: 새 데이터 있나요? (또 폴링)
        S->>C: 있어요! 여기
    end
    
    rect rgb(220, 255, 220)
        Note over C,S: WebSocket (양방향)
        C->>S: HTTP Upgrade 요청
        S->>C: 101 Switching Protocols
        Note over C,S: WebSocket 연결 수립
        S->>C: 새 데이터가 왔어요! (서버가 먼저 푸시)
        C->>S: 메시지 보낼게요
        S->>C: 또 새 데이터!
        Note over C,S: 연결 유지 (끊을 때까지)
    end
```

### WebSocket 연결 과정

```bash
# WebSocket은 HTTP Upgrade로 시작
# 
# 클라이언트 요청:
# GET /ws HTTP/1.1
# Host: example.com
# Upgrade: websocket           ← WebSocket으로 업그레이드 요청
# Connection: Upgrade
# Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
# Sec-WebSocket-Version: 13
#
# 서버 응답:
# HTTP/1.1 101 Switching Protocols    ← 프로토콜 전환!
# Upgrade: websocket
# Connection: Upgrade
# Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
#
# → 이후부터 HTTP가 아닌 WebSocket 프로토콜로 통신

# WebSocket 테스트 (websocat 도구)
# 설치: cargo install websocat 또는 snap install websocat
websocat ws://echo.websocket.org
# 입력한 메시지가 그대로 돌아옴 (echo 서버)

# curl로 WebSocket 업그레이드 확인
curl -v -H "Upgrade: websocket" \
     -H "Connection: Upgrade" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://example.com/ws
```

### WebSocket 실무 활용

```
언제 WebSocket을 쓰나요?
✅ 실시간 채팅
✅ 실시간 알림 (주문 상태, 배달 위치)
✅ 실시간 대시보드 (모니터링, 주식)
✅ 온라인 게임
✅ 협업 편집 (Google Docs)

언제 안 쓰나요?
❌ 일반 API (REST로 충분)
❌ 파일 업로드/다운로드
❌ 한 번만 조회하는 데이터
```

### Nginx에서 WebSocket 프록시

```bash
# Nginx가 WebSocket을 프록시하려면 Upgrade 헤더를 전달해야 해요

# /etc/nginx/conf.d/websocket.conf
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name ws.example.com;
    
    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;          # ← 필수!
        proxy_set_header Connection $connection_upgrade;  # ← 필수!
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        proxy_read_timeout 86400s;    # 24시간 (긴 연결 유지)
        proxy_send_timeout 86400s;
    }
}
```

### HTTP vs WebSocket vs gRPC vs SSE 비교

| 항목 | HTTP (REST) | WebSocket | gRPC | SSE |
|------|------------|-----------|------|-----|
| 방향 | 요청-응답 | 양방향 | 양방향 (스트리밍) | 서버→클라이언트 |
| 프로토콜 | HTTP | WS (HTTP 업그레이드) | HTTP/2 | HTTP |
| 데이터 형식 | JSON/XML | 자유 | Protobuf | 텍스트 |
| 연결 | 요청마다/Keep-Alive | 지속 연결 | 지속 연결 | 지속 연결 |
| 브라우저 | ✅ | ✅ | ⚠️ | ✅ |
| 용도 | 일반 API | 실시간 양방향 | 내부 서비스 | 실시간 단방향 |

---

## 💻 실습 예제

### 실습 1: curl로 HTTP 완전 분석

```bash
# 1. 전체 통신 과정 관찰
curl -v https://httpbin.org/get 2>&1

# 2. 상태 코드만 추출
curl -s -o /dev/null -w "%{http_code}\n" https://httpbin.org/get
# 200

# 3. 응답 시간 측정
curl -s -o /dev/null -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nFirst byte: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://httpbin.org/get
# DNS: 0.015s
# Connect: 0.050s
# TLS: 0.120s
# First byte: 0.250s       ← 서버 처리 시간 (TTFB)
# Total: 0.300s

# 4. POST 요청 + JSON
curl -X POST https://httpbin.org/post \
    -H "Content-Type: application/json" \
    -d '{"name": "alice", "role": "devops"}'

# 5. 리다이렉트 추적
curl -vL http://github.com 2>&1 | grep -E "< HTTP|< Location"
# < HTTP/1.1 301 Moved Permanently
# < Location: https://github.com/
# < HTTP/2 200

# 6. HTTP/2 강제
curl --http2 -I https://example.com
```

### 실습 2: 상태 코드 체험

```bash
# httpbin.org를 사용하면 원하는 상태 코드를 받아볼 수 있어요

# 200 OK
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/200
# 200

# 404 Not Found
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/404
# 404

# 500 Internal Server Error
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/500
# 500

# 502 Bad Gateway
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/502
# 502

# 429 Too Many Requests
curl -s -o /dev/null -w "%{http_code}" https://httpbin.org/status/429
# 429

# 301 리다이렉트
curl -I https://httpbin.org/status/301
# HTTP/1.1 301 MOVED PERMANENTLY
# Location: /redirect/1
```

### 실습 3: 헤더 조작

```bash
# 커스텀 헤더 보내기
curl -H "X-Custom-Header: myvalue" \
     -H "Authorization: Bearer test-token" \
     https://httpbin.org/headers

# 응답에서 커스텀 헤더가 반영됐는지 확인
# {
#   "headers": {
#     "Authorization": "Bearer test-token",
#     "X-Custom-Header": "myvalue",
#     ...
#   }
# }

# Cache-Control 확인
curl -I https://example.com | grep -i cache
# cache-control: max-age=3600

# CORS 헤더 확인
curl -I -H "Origin: http://localhost:3000" https://api.example.com/data
# Access-Control-Allow-Origin: *
```

### 실습 4: HTTP 버전별 비교

```bash
# HTTP/1.1로 접속
curl --http1.1 -sI https://www.cloudflare.com | head -1
# HTTP/1.1 200 OK

# HTTP/2로 접속
curl --http2 -sI https://www.cloudflare.com | head -1
# HTTP/2 200

# 지원 프로토콜 확인 (ALPN)
curl -v https://www.cloudflare.com 2>&1 | grep "ALPN"
# * ALPN: server accepted h2    ← HTTP/2 지원

# Alt-Svc로 HTTP/3 지원 확인
curl -sI https://www.cloudflare.com | grep -i alt-svc
# alt-svc: h3=":443"; ma=86400  ← HTTP/3 지원!
```

---

## 🏢 실무에서는?

### 시나리오 1: "502 Bad Gateway" 긴급 대응

```bash
# 1. 증상: 사용자가 502 에러를 봄
curl -s -o /dev/null -w "%{http_code}" https://myapp.example.com
# 502

# 2. Nginx 에러 로그 확인
tail -20 /var/log/nginx/error.log
# connect() failed (111: Connection refused) while connecting to upstream
# → 백엔드(앱서버)에 연결이 안 됨!

# 3. 백엔드 서비스 상태 확인
systemctl status myapp
# Active: failed (Result: exit-code) ← 죽어있음!

# 4. 왜 죽었는지 확인
journalctl -u myapp -n 30
# OutOfMemoryError: Java heap space ← OOM!

# 5. 즉시 조치: 재시작
sudo systemctl start myapp

# 6. 확인
curl -s -o /dev/null -w "%{http_code}" https://myapp.example.com
# 200 ← 복구!

# 7. 근본 해결: 메모리 설정 조정 + 모니터링 알림 추가
```

### 시나리오 2: API 응답 시간 분석

```bash
# API가 느린 원인 찾기

# 1. 구간별 시간 측정
curl -s -o /dev/null -w "\
DNS:        %{time_namelookup}s\n\
TCP:        %{time_connect}s\n\
TLS:        %{time_appconnect}s\n\
First Byte: %{time_starttransfer}s\n\
Total:      %{time_total}s\n\
Size:       %{size_download} bytes\n" https://api.example.com/slow-endpoint

# DNS:        0.012s     ← DNS 정상
# TCP:        0.025s     ← TCP 연결 정상
# TLS:        0.080s     ← TLS 정상
# First Byte: 3.500s     ← ⚠️ TTFB가 3.5초! 서버 처리가 느림!
# Total:      3.520s
# Size:       1234 bytes

# → 서버 측 문제 (DB 쿼리가 느리거나, 앱 로직이 무거움)
# → 앱 로그에서 해당 엔드포인트의 처리 시간 확인

# 2. 여러 번 측정해서 평균 구하기
for i in $(seq 1 5); do
    time=$(curl -s -o /dev/null -w "%{time_total}" https://api.example.com/endpoint)
    echo "시도 $i: ${time}s"
done
# 시도 1: 0.250s
# 시도 2: 0.180s
# 시도 3: 3.500s   ← 간헐적으로 느림!
# 시도 4: 0.200s
# 시도 5: 0.190s
# → 간헐적 느림 = 커넥션 풀 고갈, GC pause, 디스크 I/O 등 의심
```

### 시나리오 3: CORS 문제 디버깅

```bash
# 프론트엔드에서 "CORS error" 가 나올 때

# 1. OPTIONS 프리플라이트 요청 확인
curl -v -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    https://api.example.com/data 2>&1

# 응답에서 확인해야 할 헤더:
# Access-Control-Allow-Origin: http://localhost:3000  (또는 *)
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE
# Access-Control-Allow-Headers: Content-Type, Authorization
# Access-Control-Max-Age: 86400

# 위 헤더가 없으면 → 서버(Nginx/앱)에서 CORS 헤더 추가 필요

# Nginx에서 CORS 설정
# location /api {
#     if ($request_method = 'OPTIONS') {
#         add_header 'Access-Control-Allow-Origin' '*';
#         add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
#         add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
#         add_header 'Access-Control-Max-Age' 86400;
#         return 204;
#     }
#     add_header 'Access-Control-Allow-Origin' '*';
#     proxy_pass http://backend;
# }
```

---

## ⚠️ 자주 하는 실수

### 1. HTTP 상태 코드를 제대로 안 쓰기

```bash
# ❌ 모든 응답에 200 OK + 에러 메시지
# HTTP/1.1 200 OK
# {"error": "User not found"}    ← 200인데 에러?!

# ✅ 적절한 상태 코드 사용
# HTTP/1.1 404 Not Found
# {"error": "User not found"}

# 모니터링에서 5xx 에러율을 추적하는데,
# 200으로 에러를 보내면 모니터링이 안 잡혀요!
```

### 2. Keep-Alive를 활용하지 않기

```bash
# ❌ 매 요청마다 Connection: close
curl -H "Connection: close" http://api.example.com/data
# → 매번 TCP 3-way handshake → 느림

# ✅ Keep-Alive 활용 (HTTP/1.1 기본)
# 앱에서 HTTP 클라이언트의 커넥션 풀 사용
# Nginx 업스트림에 keepalive 설정
```

### 3. 502와 504의 차이를 모르기

```bash
# 502: 백엔드에 연결 자체가 안 됨 (서비스 다운, 포트 안 열림)
# 504: 백엔드에 연결은 됐는데 응답이 너무 느림 (타임아웃)

# 502 → systemctl status, ss -tlnp 확인
# 504 → proxy_read_timeout 설정 + 앱 성능 확인
```

### 4. HTTP/2인데 도메인 샤딩하기

```bash
# HTTP/1.1에서는 브라우저가 도메인당 6개 연결 제한 → 여러 도메인으로 분산
# img1.example.com, img2.example.com, img3.example.com

# HTTP/2에서는 멀티플렉싱으로 하나의 연결에서 수백 개 동시 요청
# → 도메인 샤딩이 오히려 해로움 (연결이 분산돼서 비효율)

# ✅ HTTP/2에서는 하나의 도메인 사용
```

### 5. WebSocket 프록시에서 Upgrade 헤더 누락

```bash
# ❌ Nginx에서 WebSocket이 안 됨
# → Upgrade, Connection 헤더를 전달하지 않아서

# ✅ 반드시 헤더 전달
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection $connection_upgrade;
```

---

## 📝 정리

### HTTP 상태 코드 빠른 참조

```
2xx 성공:  200 OK, 201 Created, 204 No Content
3xx 리다이렉트: 301 영구, 302 임시, 304 캐시
4xx 클라이언트: 400 잘못된 요청, 401 인증, 403 권한, 404 없음, 429 제한
5xx 서버:  500 내부에러, 502 백엔드다운, 503 과부하, 504 타임아웃
```

### HTTP 버전 선택 가이드

```
HTTP/1.1: 레거시 호환, 간단한 API
HTTP/2:   현재 표준, 대부분의 웹사이트/API ⭐
HTTP/3:   최고 성능, CDN/모바일 (확산 중)
```

### 프로토콜 선택 가이드

```
외부 API, 웹            → REST (HTTP)
내부 마이크로서비스      → gRPC (성능) 또는 REST (단순)
실시간 양방향 통신       → WebSocket
실시간 서버→클라이언트   → SSE (Server-Sent Events)
```

### 디버깅 필수 curl 옵션

```bash
curl -v URL                    # 상세 통신 과정
curl -I URL                    # 헤더만
curl -s -o /dev/null -w "%{http_code}" URL  # 상태 코드만
curl -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" URL  # 시간 측정
curl -L URL                    # 리다이렉트 따라가기
curl --http2 / --http3 URL     # 버전 지정
```

---

## 🔗 다음 강의

다음은 **[03-dns](./03-dns)** — DNS 전체 (recursive resolver / authoritative / record types / caching) 이에요.

브라우저에 `google.com`을 치면 어떻게 IP 주소를 찾을까요? DNS는 인터넷의 전화번호부예요. DNS가 안 되면 인터넷 자체가 안 돼요. DNS의 전체 구조와 디버깅 방법을 배워볼게요.
