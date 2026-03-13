# HTTP Ecosystem (HTTP/1.1 ~ HTTP/3 / QUIC / gRPC / WebSocket)

> Everything on the web runs on HTTP. REST APIs, websites, microservice communication, CDNs — all of it. When you truly understand HTTP, your ability to optimize performance, ensure security, and debug issues changes completely.

---

## 🎯 Why Do You Need to Know This?

```
Moments in practice when HTTP knowledge is essential:
• "API response is slow"                         → Understand Keep-Alive, HTTP/2 multiplexing
• "502 Bad Gateway is appearing"                 → Understand status codes + Nginx proxy structure
• "CORS error is happening"                      → Understand HTTP headers
• "Should we adopt gRPC?"                        → Understand HTTP/2-based protocol
• "Need to implement real-time notifications"    → Understand WebSocket vs SSE
• "Will HTTP/3 make things faster?"              → Understand QUIC
• "What does proxy_pass do in Nginx?"            → Understand HTTP proxying
```

From the [previous lecture](./01-osi-tcp-udp), we learned TCP/UDP. HTTP is an **L7 protocol** that runs on top of TCP (and HTTP/3 uses UDP).

---

## 🧠 Core Concepts

### Analogy: Restaurant Order System

Let me explain HTTP using a **restaurant ordering system analogy**.

* **HTTP Request** = Customer looking at menu and placing order
* **HTTP Response** = Restaurant serving the food
* **HTTP Methods** = Types of orders (order, cancel, modify, etc.)
* **Status Codes** = Restaurant's responses ("Here it is 200", "No such menu 404", "Kitchen broken 500")
* **Headers** = Information at top of order form (table number, allergies, VIP status)
* **Body** = Actual food (response) or order content (request)

---

## 🔍 Detailed Explanation — HTTP Basics

### HTTP Request/Response Structure

```mermaid
sequenceDiagram
    participant C as Client (Browser/curl)
    participant S as Server (Nginx)

    C->>S: HTTP Request<br/>GET /api/users HTTP/1.1<br/>Host: api.example.com<br/>Accept: application/json
    S->>C: HTTP Response<br/>HTTP/1.1 200 OK<br/>Content-Type: application/json<br/>{"users": [...]}
```

```bash
# Observe actual HTTP request/response with curl -v (⭐ Essential debugging tool)
curl -v http://httpbin.org/get 2>&1

# * Trying 34.199.75.4:80...
# * Connected to httpbin.org (34.199.75.4) port 80
#
# > GET /get HTTP/1.1              ← Request start line (method URL version)
# > Host: httpbin.org              ← Request headers
# > User-Agent: curl/7.81.0
# > Accept: */*
# >                                ← Empty line (end of headers)
#
# < HTTP/1.1 200 OK               ← Response start line (version status code status message)
# < Content-Type: application/json ← Response headers
# < Content-Length: 256
# < Connection: keep-alive
# <                                ← Empty line (end of headers)
# {                                ← Response body (JSON)
#   "args": {},
#   "headers": { ... },
#   "url": "http://httpbin.org/get"
# }
```

### HTTP Methods

| Method | Purpose | Request Body | Idempotency | Example |
|--------|---------|--------------|-------------|---------|
| `GET` | Retrieve data | No | ✅ | `GET /api/users` |
| `POST` | Create data | Yes | ❌ | `POST /api/users` |
| `PUT` | Modify entire resource | Yes | ✅ | `PUT /api/users/1` |
| `PATCH` | Partially modify resource | Yes | ❌ | `PATCH /api/users/1` |
| `DELETE` | Delete data | No/Yes | ✅ | `DELETE /api/users/1` |
| `HEAD` | Retrieve only headers (no body) | No | ✅ | `HEAD /api/users` |
| `OPTIONS` | Check allowed methods (CORS) | No | ✅ | `OPTIONS /api/users` |

**Idempotency:** An operation is idempotent if multiple identical requests have the same result. GET 10 times returns the same result, but POST 10 times creates 10 resources.

```bash
# Use curl with each method
curl -X GET http://api.example.com/users
curl -X POST http://api.example.com/users -H "Content-Type: application/json" -d '{"name":"alice"}'
curl -X PUT http://api.example.com/users/1 -H "Content-Type: application/json" -d '{"name":"bob"}'
curl -X PATCH http://api.example.com/users/1 -H "Content-Type: application/json" -d '{"email":"new@email.com"}'
curl -X DELETE http://api.example.com/users/1
curl -I http://api.example.com/users    # HEAD (headers only)
```

---

### HTTP Status Codes (★ Must memorize!)

```mermaid
flowchart LR
    subgraph 1xx["1xx: Information"]
        C100["100 Continue<br/>101 Switching Protocols"]
    end

    subgraph 2xx["2xx: Success ✅"]
        C200["200 OK<br/>201 Created<br/>204 No Content"]
    end

    subgraph 3xx["3xx: Redirect ↗️"]
        C300["301 Moved Permanently<br/>302 Found (temporary)<br/>304 Not Modified"]
    end

    subgraph 4xx["4xx: Client Error ❌"]
        C400["400 Bad Request<br/>401 Unauthorized<br/>403 Forbidden<br/>404 Not Found<br/>405 Method Not Allowed<br/>429 Too Many Requests"]
    end

    subgraph 5xx["5xx: Server Error 🔥"]
        C500["500 Internal Server Error<br/>502 Bad Gateway<br/>503 Service Unavailable<br/>504 Gateway Timeout"]
    end

    style 2xx fill:#2ecc71,color:#fff
    style 4xx fill:#e67e22,color:#fff
    style 5xx fill:#e74c3c,color:#fff
```

#### Common Status Codes in Detail

```bash
# === 2xx Success ===

# 200 OK — Normal response (most common)
curl -s -o /dev/null -w "%{http_code}" http://api.example.com/health
# 200

# 201 Created — Resource created successfully (after POST)
curl -s -o /dev/null -w "%{http_code}" -X POST http://api.example.com/users -d '{}'
# 201

# 204 No Content — Success but no response body (after DELETE)
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://api.example.com/users/1
# 204

# === 3xx Redirect ===

# 301 Moved Permanently — Permanent move (SEO, URL change)
curl -I http://example.com
# HTTP/1.1 301 Moved Permanently
# Location: https://example.com/    ← Go here

# 302 Found — Temporary move
# 304 Not Modified — Cache available (no changes)

# Follow redirects with -L option
curl -L http://example.com    # Follow 301/302

# === 4xx Client Error ===

# 400 Bad Request — Invalid request (parameter error, JSON format error)
# 401 Unauthorized — Authentication needed (not logged in)
# 403 Forbidden — No permission (logged in but access denied)
# 404 Not Found — Resource not found (wrong URL)
# 405 Method Not Allowed — This method not allowed for this URL
# 429 Too Many Requests — Too many requests (Rate Limiting)

# === 5xx Server Error === (DevOps most sensitive to these!)

# 500 Internal Server Error — Server internal error (app bug, unhandled exception)
# 502 Bad Gateway — Backend server can't respond
# 503 Service Unavailable — Service temporarily unavailable (overload, maintenance)
# 504 Gateway Timeout — Backend server response timeout
```

**502 vs 503 vs 504 (Nginx perspective):**

```mermaid
flowchart LR
    CLIENT[Client] --> NGINX[Nginx<br/>Reverse Proxy]

    NGINX -->|"Backend dead"| E502["502 Bad Gateway<br/>Connection itself failed"]
    NGINX -->|"Backend busy, refusing"| E503["503 Service Unavailable<br/>Connected but can't process"]
    NGINX -->|"Backend response too slow"| E504["504 Gateway Timeout<br/>Timeout"]

    style E502 fill:#e74c3c,color:#fff
    style E503 fill:#e67e22,color:#fff
    style E504 fill:#f39c12,color:#fff
```

```bash
# Real-world 5xx debugging

# 502 Bad Gateway → Check backend server
systemctl status myapp                    # Is service running?
ss -tlnp | grep 8080                     # Is port open?
curl http://localhost:8080/health         # Can connect directly?

# 503 Service Unavailable → Check overload/maintenance
journalctl -u myapp -p err --since "5 min ago"

# 504 Gateway Timeout → Check timeout settings
# Nginx config:
# proxy_connect_timeout 60s;
# proxy_read_timeout 60s;
# proxy_send_timeout 60s;
```

---

### HTTP Headers

Metadata to transmit additional information with request/response.

#### Commonly Used Request Headers

```bash
# Host — Target domain (for virtual host distinction)
Host: api.example.com

# Content-Type — Format of request body
Content-Type: application/json
Content-Type: application/x-www-form-urlencoded
Content-Type: multipart/form-data

# Authorization — Authentication information
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Basic dXNlcjpwYXNz

# Accept — Desired response format
Accept: application/json
Accept: text/html

# User-Agent — Client information
User-Agent: curl/7.81.0
User-Agent: Mozilla/5.0 (...)

# X-Forwarded-For — Original client IP (when via proxy/LB)
X-Forwarded-For: 203.0.113.50, 10.0.0.1

# X-Request-ID — Request tracking ID (important in microservices!)
X-Request-ID: abc123-def456-ghi789
```

#### Commonly Used Response Headers

```bash
# Content-Type — Format of response body
Content-Type: application/json; charset=utf-8

# Content-Length — Response size (bytes)
Content-Length: 1234

# Cache-Control — Caching policy
Cache-Control: public, max-age=3600        # Cache for 1 hour
Cache-Control: no-cache                     # Revalidate each time
Cache-Control: no-store                     # No caching

# Set-Cookie — Set cookie
Set-Cookie: session=abc123; Path=/; HttpOnly; Secure

# Access-Control-Allow-Origin — CORS permission
Access-Control-Allow-Origin: https://frontend.example.com
Access-Control-Allow-Origin: *              # Allow all (dev only)

# Location — Redirect destination
Location: https://example.com/new-url
```

```bash
# Commands to check headers

# View response headers only
curl -I https://example.com
# HTTP/2 200
# content-type: text/html; charset=UTF-8
# content-length: 1256
# cache-control: max-age=3600
# ...

# View request + response headers
curl -v https://example.com 2>&1 | grep -E "^[<>]"
# > GET / HTTP/2
# > Host: example.com
# > User-Agent: curl/7.81.0
# > Accept: */*
# < HTTP/2 200
# < content-type: text/html
# < cache-control: max-age=3600

# Extract specific header only
curl -sI https://example.com | grep -i "content-type"
# content-type: text/html; charset=UTF-8

# Send custom headers
curl -H "Authorization: Bearer mytoken123" \
     -H "X-Request-ID: test-001" \
     http://api.example.com/data
```

---

### Keep-Alive (Connection Reuse)

In HTTP/1.0, TCP connection was established and closed for each request. Since HTTP/1.1, **Keep-Alive** reuses connections.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    rect rgb(255, 200, 200)
        Note over C,S: HTTP/1.0 (No Keep-Alive)
        C->>S: TCP connection (3-way handshake)
        C->>S: GET /page.html
        S->>C: 200 OK + HTML
        C->>S: TCP close (4-way)
        C->>S: TCP connection (another 3-way!)
        C->>S: GET /style.css
        S->>C: 200 OK + CSS
        C->>S: TCP close (another 4-way!)
    end

    rect rgb(200, 255, 200)
        Note over C,S: HTTP/1.1 (Keep-Alive by default)
        C->>S: TCP connection (3-way handshake, only once)
        C->>S: GET /page.html
        S->>C: 200 OK + HTML
        C->>S: GET /style.css (same connection!)
        S->>C: 200 OK + CSS
        C->>S: GET /app.js (same connection!)
        S->>C: 200 OK + JS
        Note over C,S: Connection closed after idle timeout
    end
```

```bash
# Nginx Keep-Alive configuration
# /etc/nginx/nginx.conf

http {
    # Client → Nginx
    keepalive_timeout 65;        # Keep connection for 65 seconds
    keepalive_requests 1000;     # Max 1000 requests per connection

    # Nginx → Upstream (backend server)
    upstream backend {
        server 10.0.1.60:8080;
        keepalive 32;            # Maintain 32 Keep-Alive connections to upstream
    }
}
```

---

## 🔍 Detailed Explanation — HTTP Versions

### HTTP/1.1

```
Characteristics:
• Text-based protocol (human readable)
• Keep-Alive by default (connection reuse)
• Pipelining (theoretically multiple requests simultaneously, rarely used in practice)
• ⚠️ HOL Blocking (Head-of-Line Blocking)
  → Slow request blocks subsequent requests
```

```bash
# Request with HTTP/1.1
curl --http1.1 -v https://example.com 2>&1 | head -5
# > GET / HTTP/1.1
# > Host: example.com
```

### HTTP/2

```
Characteristics:
• Binary protocol (not human readable but faster)
• Multiplexing — Multiple requests/responses simultaneously on single TCP connection!
• Header Compression (HPACK) — Compress repeated headers
• Server Push — Send before request (CSS, JS, etc.)
• Stream Priority — Send important resources first
• ✅ Solves HOL Blocking (at HTTP level)
• ⚠️ TCP-level HOL Blocking still exists
```

```mermaid
flowchart LR
    subgraph "HTTP/1.1 — Sequential Processing"
        A1["Request 1"] --> B1["Response 1"]
        B1 --> A2["Request 2"]
        A2 --> B2["Response 2"]
        B2 --> A3["Request 3"]
        A3 --> B3["Response 3"]
    end

    subgraph "HTTP/2 — Multiplexing"
        C1["Request 1 + Request 2 + Request 3"]
        C1 --> D1["Response 2 (fastest first)"]
        C1 --> D2["Response 1"]
        C1 --> D3["Response 3"]
    end

    style C1 fill:#2ecc71,color:#fff
```

```bash
# Request with HTTP/2
curl --http2 -v https://example.com 2>&1 | grep "HTTP/"
# * using HTTP/2
# < HTTP/2 200

# Check if HTTP/2 supported
curl -sI https://example.com | head -1
# HTTP/2 200

# Enable HTTP/2 in Nginx
# server {
#     listen 443 ssl http2;     ← Add http2
#     ssl_certificate ...;
#     ssl_certificate_key ...;
# }
```

### HTTP/3 (QUIC)

```
Characteristics:
• UDP-based! (Use QUIC protocol instead of TCP)
• ✅ Completely solves TCP-level HOL Blocking
• 0-RTT connection — Instantly connect to previously visited server (skip handshake)
• Connection Migration — Keep connection alive even when switching WiFi → LTE
• TLS 1.3 Built-in — No separate TLS handshake needed
```

```mermaid
flowchart TD
    subgraph "HTTP/1.1 & HTTP/2"
        TCP["TCP<br/>(3-way handshake)"]
        TLS["TLS<br/>(separate handshake)"]
        HTTP12["HTTP data"]
        TCP --> TLS --> HTTP12
    end

    subgraph "HTTP/3"
        QUIC["QUIC (UDP-based)<br/>Connection + TLS integrated<br/>0-RTT possible!"]
        HTTP3["HTTP data"]
        QUIC --> HTTP3
    end

    style QUIC fill:#2ecc71,color:#fff
```

```bash
# Request with HTTP/3 (curl 7.88+)
curl --http3 https://cloudflare.com -I
# HTTP/3 200

# Check HTTP/3 support (Alt-Svc header)
curl -sI https://cloudflare.com | grep -i "alt-svc"
# alt-svc: h3=":443"; ma=86400

# Enable HTTP/3 in Nginx (1.25+)
# server {
#     listen 443 ssl;
#     listen 443 quic;          ← Add QUIC
#     http2 on;
#     http3 on;                  ← Enable HTTP/3
#     add_header Alt-Svc 'h3=":443"; ma=86400';
# }
```

### Version Comparison Summary

| Item | HTTP/1.1 | HTTP/2 | HTTP/3 |
|------|---------|--------|--------|
| Transport Protocol | TCP | TCP | **UDP (QUIC)** |
| Format | Text | Binary | Binary |
| Multiplexing | ❌ | ✅ | ✅ |
| Header Compression | ❌ | ✅ (HPACK) | ✅ (QPACK) |
| HOL Blocking | ⚠️ HTTP + TCP | ⚠️ TCP only | ✅ None |
| TLS | Separate | Separate (usually required) | **Built-in** (required) |
| Connection Setup Speed | Slow (TCP+TLS) | Normal | **Fast (0-RTT)** |
| Real-world adoption | Legacy | ⭐ Mainstream | Spreading |

---

## 🔍 Detailed Explanation — gRPC

### What is gRPC?

Google's **high-performance RPC (Remote Procedure Call) framework**. Runs on HTTP/2 and serializes data with Protocol Buffers (protobuf).

**Analogy:** If REST API is "sending JSON letter via HTTP", gRPC is "sending binary data via HTTP/2 highway".

```mermaid
flowchart LR
    subgraph "REST API"
        R1["JSON (text)"]
        R2["HTTP/1.1 or HTTP/2"]
        R1 --> R2
    end

    subgraph "gRPC"
        G1["Protobuf (binary)"]
        G2["HTTP/2 (required)"]
        G1 --> G2
    end

    style G1 fill:#3498db,color:#fff
    style G2 fill:#2ecc71,color:#fff
```

### REST vs gRPC Comparison

| Comparison | REST | gRPC |
|------------|------|------|
| Data Format | JSON (text) | Protobuf (binary) |
| Transport Protocol | HTTP/1.1 or HTTP/2 | HTTP/2 (required) |
| Speed | Normal | Fast (2~10x) |
| Type Safety | ❌ (runtime error) | ✅ (compile-time check) |
| Streaming | Difficult | ✅ (bidirectional) |
| Browser Support | ✅ Native | ⚠️ gRPC-Web needed |
| API Documentation | OpenAPI/Swagger | .proto file is documentation |
| Real-world Use Case | External API, web | Internal microservice communication |

```bash
# gRPC Communication Patterns

# 1. Unary (normal request-response)
# Client → 1 request → Server → 1 response

# 2. Server Streaming
# Client → 1 request → Server → multiple responses (stream)
# Example: Real-time stock price lookup

# 3. Client Streaming
# Client → multiple requests (stream) → Server → 1 response
# Example: File upload

# 4. Bidirectional Streaming
# Client ↔ Server (bidirectional stream)
# Example: Chat, real-time collaboration

# gRPC Debugging Tool
# grpcurl (curl for gRPC)
grpcurl -plaintext localhost:50051 list
# myapp.UserService
# myapp.OrderService
# grpc.health.v1.Health

grpcurl -plaintext localhost:50051 myapp.UserService/GetUser
# {
#   "id": 1,
#   "name": "alice"
# }

# gRPC Health Check
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
# {
#   "status": "SERVING"
# }
```

### gRPC in Real Practice

```
When to use gRPC?
✅ Internal communication between microservices (high performance needed)
✅ Real-time streaming (bidirectional communication)
✅ Polyglot environment (Go, Java, Python, etc. multiple languages)
✅ K8s service-to-service communication

When to use REST?
✅ External public APIs (browser compatible)
✅ Simple CRUD
✅ When debugging must be easy (test with curl)
✅ Team familiar with REST
```

---

## 🔍 Detailed Explanation — WebSocket

### What is WebSocket?

HTTP fundamentally has a **client requests, server responds** structure. WebSocket allows **server to send data first** after connection (bidirectional communication).

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    rect rgb(255, 220, 220)
        Note over C,S: HTTP (unidirectional)
        C->>S: Request
        S->>C: Response
        C->>S: Any new data? (polling)
        S->>C: No
        C->>S: Any new data? (polling again)
        S->>C: Yes! Here
    end

    rect rgb(220, 255, 220)
        Note over C,S: WebSocket (bidirectional)
        C->>S: HTTP Upgrade request
        S->>C: 101 Switching Protocols
        Note over C,S: WebSocket connection established
        S->>C: New data arrived! (server pushes first)
        C->>S: Sending message
        S->>C: More new data!
        Note over C,S: Connection maintained (until closed)
    end
```

### WebSocket Connection Process

```bash
# WebSocket starts with HTTP Upgrade
#
# Client request:
# GET /ws HTTP/1.1
# Host: example.com
# Upgrade: websocket           ← Request WebSocket upgrade
# Connection: Upgrade
# Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
# Sec-WebSocket-Version: 13
#
# Server response:
# HTTP/1.1 101 Switching Protocols    ← Protocol switch!
# Upgrade: websocket
# Connection: Upgrade
# Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
#
# → After this, communication is WebSocket protocol, not HTTP

# WebSocket testing (websocat tool)
# Install: cargo install websocat or snap install websocat
websocat ws://echo.websocket.org
# Echoes messages you send (echo server)

# Check WebSocket upgrade with curl
curl -v -H "Upgrade: websocket" \
     -H "Connection: Upgrade" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://example.com/ws
```

### WebSocket Real-World Use

```
When to use WebSocket?
✅ Real-time chat
✅ Real-time notifications (order status, delivery location)
✅ Real-time dashboard (monitoring, stocks)
✅ Online games
✅ Collaborative editing (Google Docs)

When not to use?
❌ General APIs (REST sufficient)
❌ File upload/download
❌ One-time data lookup
```

### Nginx WebSocket Proxy

```bash
# For Nginx to proxy WebSocket, must forward Upgrade headers

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
        proxy_set_header Upgrade $http_upgrade;          # ← Required!
        proxy_set_header Connection $connection_upgrade;  # ← Required!
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        proxy_read_timeout 86400s;    # 24 hours (maintain long connection)
        proxy_send_timeout 86400s;
    }
}
```

### HTTP vs WebSocket vs gRPC vs SSE Comparison

| Item | HTTP (REST) | WebSocket | gRPC | SSE |
|------|------------|-----------|------|-----|
| Direction | Request-Response | Bidirectional | Bidirectional (streaming) | Server→Client |
| Protocol | HTTP | WS (HTTP upgrade) | HTTP/2 | HTTP |
| Data Format | JSON/XML | Free | Protobuf | Text |
| Connection | Per request/Keep-Alive | Persistent | Persistent | Persistent |
| Browser | ✅ | ✅ | ⚠️ | ✅ |
| Use Case | General API | Real-time bidirectional | Internal service | Real-time unidirectional |

---

## 💻 Practice Examples

### Practice 1: Complete HTTP Analysis with curl

```bash
# 1. Observe complete communication
curl -v https://httpbin.org/get 2>&1

# 2. Extract status code only
curl -s -o /dev/null -w "%{http_code}\n" https://httpbin.org/get
# 200

# 3. Measure response time breakdown
curl -s -o /dev/null -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nFirst byte: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://httpbin.org/get
# DNS: 0.015s
# Connect: 0.050s
# TLS: 0.120s
# First byte: 0.250s       ← Server processing time (TTFB)
# Total: 0.300s

# 4. POST request + JSON
curl -X POST https://httpbin.org/post \
    -H "Content-Type: application/json" \
    -d '{"name": "alice", "role": "devops"}'

# 5. Trace redirects
curl -vL http://github.com 2>&1 | grep -E "< HTTP|< Location"
# < HTTP/1.1 301 Moved Permanently
# < Location: https://github.com/
# < HTTP/2 200

# 6. Force HTTP/2
curl --http2 -I https://example.com
```

### Practice 2: Experience Status Codes

```bash
# httpbin.org lets you get desired status codes

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

# 301 Redirect
curl -I https://httpbin.org/status/301
# HTTP/1.1 301 MOVED PERMANENTLY
# Location: /redirect/1
```

### Practice 3: Header Manipulation

```bash
# Send custom headers
curl -H "X-Custom-Header: myvalue" \
     -H "Authorization: Bearer test-token" \
     https://httpbin.org/headers

# Custom headers reflected in response
# {
#   "headers": {
#     "Authorization": "Bearer test-token",
#     "X-Custom-Header": "myvalue",
#     ...
#   }
# }

# Check Cache-Control
curl -I https://example.com | grep -i cache
# cache-control: max-age=3600

# Check CORS headers
curl -I -H "Origin: http://localhost:3000" https://api.example.com/data
# Access-Control-Allow-Origin: *
```

### Practice 4: HTTP Version Comparison

```bash
# HTTP/1.1 connection
curl --http1.1 -sI https://www.cloudflare.com | head -1
# HTTP/1.1 200 OK

# HTTP/2 connection
curl --http2 -sI https://www.cloudflare.com | head -1
# HTTP/2 200

# Check supported protocols (ALPN)
curl -v https://www.cloudflare.com 2>&1 | grep "ALPN"
# * ALPN: server accepted h2    ← HTTP/2 supported

# Check HTTP/3 support (Alt-Svc)
curl -sI https://www.cloudflare.com | grep -i alt-svc
# alt-svc: h3=":443"; ma=86400  ← HTTP/3 supported!
```

---

## 🏢 In Real Practice

### Scenario 1: Emergency "502 Bad Gateway" Response

```bash
# 1. Symptom: Users see 502 error
curl -s -o /dev/null -w "%{http_code}" https://myapp.example.com
# 502

# 2. Check Nginx error log
tail -20 /var/log/nginx/error.log
# connect() failed (111: Connection refused) while connecting to upstream
# → Can't connect to backend (app server)!

# 3. Check backend service
systemctl status myapp
# Active: failed (Result: exit-code) ← Dead!

# 4. Check why it died
journalctl -u myapp -n 30
# OutOfMemoryError: Java heap space ← OOM!

# 5. Immediate action: Restart
sudo systemctl start myapp

# 6. Verify
curl -s -o /dev/null -w "%{http_code}" https://myapp.example.com
# 200 ← Recovered!

# 7. Root cause fix: Adjust memory + add monitoring alert
```

### Scenario 2: API Response Time Analysis

```bash
# API is slow, find root cause

# 1. Measure time breakdown
curl -s -o /dev/null -w "\
DNS:        %{time_namelookup}s\n\
TCP:        %{time_connect}s\n\
TLS:        %{time_appconnect}s\n\
First Byte: %{time_starttransfer}s\n\
Total:      %{time_total}s\n\
Size:       %{size_download} bytes\n" https://api.example.com/slow-endpoint

# DNS:        0.012s     ← DNS normal
# TCP:        0.025s     ← TCP normal
# TLS:        0.080s     ← TLS normal
# First Byte: 3.500s     ← ⚠️ TTFB is 3.5s! Server processing is slow!
# Total:      3.520s
# Size:       1234 bytes

# → Server-side problem (slow DB query or heavy app logic)
# → Check app logs for that endpoint's processing time

# 2. Measure multiple times to get average
for i in $(seq 1 5); do
    time=$(curl -s -o /dev/null -w "%{time_total}" https://api.example.com/endpoint)
    echo "Attempt $i: ${time}s"
done
# Attempt 1: 0.250s
# Attempt 2: 0.180s
# Attempt 3: 3.500s   ← Intermittently slow!
# Attempt 4: 0.200s
# Attempt 5: 0.190s
# → Intermittent slowness = Connection pool exhaustion, GC pause, disk I/O suspected
```

### Scenario 3: CORS Problem Debugging

```bash
# Frontend shows "CORS error"

# 1. Check OPTIONS preflight request
curl -v -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    https://api.example.com/data 2>&1

# Headers to check in response:
# Access-Control-Allow-Origin: http://localhost:3000  (or *)
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE
# Access-Control-Allow-Headers: Content-Type, Authorization
# Access-Control-Max-Age: 86400

# If missing → Add CORS headers in server (Nginx/app)

# Nginx CORS configuration
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

## ⚠️ Common Mistakes

### 1. Not Using Proper HTTP Status Codes

```bash
# ❌ Return 200 OK + error message
# HTTP/1.1 200 OK
# {"error": "User not found"}    ← 200 but error?!

# ✅ Use appropriate status code
# HTTP/1.1 404 Not Found
# {"error": "User not found"}

# Monitoring tracks 5xx error rate
# If you return 200 with error, monitoring won't catch it!
```

### 2. Not Leveraging Keep-Alive

```bash
# ❌ Connection: close on every request
curl -H "Connection: close" http://api.example.com/data
# → New TCP 3-way handshake every time → Slow

# ✅ Use Keep-Alive (HTTP/1.1 default)
# App should use HTTP client connection pool
# Nginx upstream should have keepalive configured
```

### 3. Confusing 502 and 504

```bash
# 502: Can't even connect to backend (service down, port not open)
# 504: Connected but response too slow (timeout)

# 502 → Check systemctl status, ss -tlnp
# 504 → Check proxy_read_timeout + app performance
```

### 4. Domain Sharding with HTTP/2

```bash
# HTTP/1.1: Browser limits 6 connections per domain → Distribute across subdomains
# img1.example.com, img2.example.com, img3.example.com

# HTTP/2: Multiplexing allows hundreds of requests on single connection
# → Domain sharding makes it worse (splits connection)

# ✅ With HTTP/2 use single domain
```

### 5. Forgetting Upgrade Header in WebSocket Proxy

```bash
# ❌ Nginx doesn't proxy WebSocket properly
# → Forgot to forward Upgrade, Connection headers

# ✅ Must forward headers
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection $connection_upgrade;
```

---

## 📝 Summary

### HTTP Status Code Quick Reference

```
2xx Success:    200 OK, 201 Created, 204 No Content
3xx Redirect:   301 Permanent, 302 Temporary, 304 Cache
4xx Client:     400 Bad Request, 401 Auth, 403 Permission, 404 Not Found, 429 Limit
5xx Server:     500 Internal Error, 502 Backend Down, 503 Overload, 504 Timeout
```

### HTTP Version Selection Guide

```
HTTP/1.1: Legacy compatibility, simple APIs
HTTP/2:   Current standard, most websites/APIs ⭐
HTTP/3:   Best performance, CDN/mobile (spreading)
```

### Protocol Selection Guide

```
External API, web             → REST (HTTP)
Internal microservices        → gRPC (performance) or REST (simple)
Real-time bidirectional       → WebSocket
Real-time server→client       → SSE (Server-Sent Events)
```

### Essential curl Options for Debugging

```bash
curl -v URL                    # Complete communication
curl -I URL                    # Headers only
curl -s -o /dev/null -w "%{http_code}" URL  # Status code only
curl -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" URL  # Timing
curl -L URL                    # Follow redirects
curl --http2 / --http3 URL     # Specify version
```

---

## 🔗 Next Lecture

Next is **[03-dns](./03-dns)** — Complete DNS (recursive resolver / authoritative / record types / caching).

When you type `google.com` in a browser, how does it find the IP? DNS is the internet's phone book. Without DNS, the internet doesn't work. Without fast DNS, everything is slow. Let's learn complete DNS structure and debugging methods.
