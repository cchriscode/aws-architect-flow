# 인증과 인가

> "이 사람이 누구인지 확인하는 것"과 "이 사람이 무엇을 할 수 있는지 결정하는 것"은 완전히 다른 문제예요. 건물 출입구에서 사원증으로 신원을 확인하는 게 **인증(Authentication)**이고, 사원증에 적힌 등급에 따라 어떤 층에 들어갈 수 있는지 결정하는 게 **인가(Authorization)**예요. [AWS IAM](../05-cloud-aws/01-iam)에서 잠깐 다뤘던 이 개념을, 이번에는 OAuth2, OIDC, SAML, JWT까지 프로토콜 수준에서 깊이 있게 알아볼게요.

---

## 🎯 왜 인증과 인가를 알아야 하나요?

### 일상 비유: 놀이공원 이야기

놀이공원에 놀러 갔다고 상상해 보세요.

- **입장권 구매** = 인증(Authentication). "당신은 유효한 방문객입니다"를 증명해요.
- **자유이용권 vs 기본권** = 인가(Authorization). 자유이용권은 모든 놀이기구를 탈 수 있고, 기본권은 일부만 가능해요.
- **손목밴드** = 토큰(Token). 매번 매표소에 가지 않아도 손목밴드만 보여주면 돼요.
- **키 130cm 이상만** = 추가 조건(Policy). 권한이 있어도 조건을 만족해야 해요.

```
실무에서 인증/인가가 필요한 순간:

• "Google 계정으로 우리 서비스에 로그인하게 하고 싶어요"    → OAuth2 + OIDC
• "회사 Active Directory로 사내 도구에 SSO 하고 싶어요"    → SAML / OIDC
• "마이크로서비스 간 API 호출을 인증해야 해요"             → JWT + OAuth2 Client Credentials
• "API Gateway에서 토큰을 검증하고 싶어요"                → JWT 검증
• "계정 탈취 방지를 위해 2단계 인증을 넣고 싶어요"         → MFA (TOTP/FIDO2)
• "사용자 관리 시스템을 직접 만들기 싫어요"               → IdP (Keycloak, Auth0, Cognito)
• "역할 기반 접근 제어를 설계해야 해요"                    → RBAC / ABAC
• "Zero Trust 아키텍처를 도입하려고 해요"                 → 지속적 인증 + 최소 권한
```

### 인증 없는 시스템 vs 제대로 된 인증 시스템

```mermaid
flowchart TD
    subgraph "인증 없는 시스템"
        A1["사용자 요청"] -->|"아무런 검증 없이"| A2["API 서버"]
        A2 --> A3["DB에서 모든 데이터 노출"]
        A3 --> A4["개인정보 유출 사고"]
        A4 --> A5["과징금 + 신뢰 하락"]
    end

    subgraph "제대로 된 인증 시스템"
        B1["사용자 요청"] -->|"1. 신원 확인"| B2["인증 서버<br/>(Authentication)"]
        B2 -->|"2. 토큰 발급"| B3["API Gateway"]
        B3 -->|"3. 권한 확인"| B4["인가 서버<br/>(Authorization)"]
        B4 -->|"4. 허용된 데이터만"| B5["API 서버"]
        B5 --> B6["안전한 응답"]
    end

    style A4 fill:#e74c3c,color:#fff
    style A5 fill:#e74c3c,color:#fff
    style B6 fill:#27ae60,color:#fff
    style B2 fill:#3498db,color:#fff
    style B4 fill:#9b59b6,color:#fff
```

---

## 🧠 핵심 개념 잡기

### 1. Authentication(인증) vs Authorization(인가)

이 두 가지는 항상 함께 나오지만, 명확히 구분해야 해요.

| 항목 | Authentication (인증) | Authorization (인가) |
|------|----------------------|---------------------|
| **질문** | "너 누구야?" | "너 이거 해도 돼?" |
| **비유** | 여권으로 신원 확인 | 비자로 체류 허가 확인 |
| **시점** | 항상 먼저 수행 | 인증 이후에 수행 |
| **실패 시** | 401 Unauthorized | 403 Forbidden |
| **방법** | 비밀번호, 생체인식, 토큰 | 역할, 정책, ACL |
| **데이터** | 자격증명(Credentials) | 권한(Permissions) |
| **프로토콜** | OIDC, SAML, FIDO2 | OAuth2, XACML, OPA |

> HTTP 상태 코드가 좀 헷갈리죠? 401은 "인증 안 됨"이고, 403은 "인증은 됐지만 권한 없음"이에요. 이름이 "Unauthorized"라서 혼란스럽지만, 실제로는 "Unauthenticated"에 가까워요.

### 2. 주요 프로토콜 한눈에 보기

```mermaid
flowchart TB
    subgraph "인증 프로토콜"
        OIDC["OIDC<br/>(OpenID Connect)<br/>현대적 인증"]
        SAML["SAML 2.0<br/>엔터프라이즈 인증"]
        FIDO["FIDO2/WebAuthn<br/>패스워드리스"]
    end

    subgraph "인가 프로토콜"
        OAUTH["OAuth 2.0<br/>위임된 인가"]
        OPA["OPA<br/>정책 기반 인가"]
    end

    subgraph "토큰 형식"
        JWT["JWT<br/>(JSON Web Token)"]
        SAML_TOKEN["SAML Assertion<br/>(XML)"]
        OPAQUE["Opaque Token"]
    end

    subgraph "접근 제어 모델"
        RBAC["RBAC<br/>역할 기반"]
        ABAC["ABAC<br/>속성 기반"]
    end

    OIDC -->|"사용"| JWT
    OIDC -->|"기반"| OAUTH
    SAML -->|"사용"| SAML_TOKEN
    OAUTH -->|"발급"| JWT
    OAUTH -->|"발급"| OPAQUE

    style OIDC fill:#3498db,color:#fff
    style OAUTH fill:#e67e22,color:#fff
    style JWT fill:#2ecc71,color:#fff
    style SAML fill:#9b59b6,color:#fff
    style FIDO fill:#1abc9c,color:#fff
```

### 3. 핵심 용어 정리

| 용어 | 설명 | 비유 |
|------|------|------|
| **IdP** (Identity Provider) | 사용자 신원을 관리하고 인증하는 서버 | 동사무소 (신분증 발급) |
| **SP** (Service Provider) | 사용자에게 서비스를 제공하는 애플리케이션 | 은행 (신분증 확인 후 서비스 제공) |
| **Token** | 인증/인가 정보를 담은 디지털 증명서 | 놀이공원 손목밴드 |
| **Claim** | 토큰 안에 담긴 개별 정보 조각 | 사원증의 이름, 부서, 직급 |
| **Scope** | 접근할 수 있는 범위를 정의 | "3층까지만 출입 가능" |
| **Grant** | 토큰을 얻기 위한 방법/절차 | 사원증 발급 절차 (면접 → 채용 → 발급) |
| **SSO** (Single Sign-On) | 한 번 로그인으로 여러 서비스 접근 | 놀이공원 자유이용권 (한 번 결제, 모든 놀이기구) |
| **MFA** (Multi-Factor Auth) | 두 가지 이상의 인증 수단 | ATM에서 카드 + 비밀번호 |

---

## 🔍 하나씩 자세히 알아보기

### 1. OAuth 2.0 — 위임된 인가 프레임워크

#### OAuth2란?

OAuth2는 **"내 데이터에 대한 접근 권한을 제3자에게 위임"**하기 위한 프레임워크예요. 중요한 것은 OAuth2는 인가(Authorization) 프로토콜이지, 인증(Authentication) 프로토콜이 아니라는 점이에요.

**비유: 대리인 위임장**

회사에서 서류를 대신 수령해야 하는 상황을 생각해 보세요.

1. 본인(Resource Owner)이 위임장을 작성해요
2. 관공서(Authorization Server)에서 위임장을 확인해요
3. 대리인(Client)이 위임장을 가지고 서류(Resource)를 수령해요
4. 대리인은 위임장에 적힌 범위 내에서만 행동할 수 있어요

#### OAuth2의 4가지 역할

| 역할 | 설명 | 예시 |
|------|------|------|
| **Resource Owner** | 데이터의 주인 (보통 사용자) | GitHub 사용자인 나 |
| **Client** | 데이터에 접근하려는 앱 | 내가 쓰는 CI/CD 도구 |
| **Authorization Server** | 토큰을 발급하는 서버 | GitHub OAuth 서버 |
| **Resource Server** | 보호된 데이터를 가진 서버 | GitHub API |

#### OAuth2 Grant Types (인가 흐름)

##### (1) Authorization Code Flow — 가장 안전한 표준 흐름

웹 애플리케이션에서 가장 많이 사용하는 흐름이에요. 서버 사이드에서 토큰을 교환하므로 안전해요.

```mermaid
sequenceDiagram
    participant User as 사용자 (브라우저)
    participant App as 클라이언트 앱<br/>(백엔드 서버)
    participant AuthServer as 인가 서버<br/>(예: Google)
    participant API as 리소스 서버<br/>(예: Google API)

    User->>App: 1. "Google로 로그인" 클릭
    App->>User: 2. Google 인가 페이지로 리다이렉트
    User->>AuthServer: 3. Google에 로그인 + 권한 동의
    AuthServer->>User: 4. Authorization Code와 함께 앱으로 리다이렉트
    User->>App: 5. Authorization Code 전달
    App->>AuthServer: 6. Code + Client Secret으로 토큰 요청 (서버 간 통신)
    AuthServer->>App: 7. Access Token + Refresh Token 발급
    App->>API: 8. Access Token으로 API 호출
    API->>App: 9. 보호된 리소스 응답
```

```
# 단계별 실제 HTTP 요청

# 2단계: 인가 요청 (브라우저 리다이렉트)
GET https://accounts.google.com/o/oauth2/v2/auth?
    response_type=code
    &client_id=YOUR_CLIENT_ID
    &redirect_uri=https://yourapp.com/callback
    &scope=openid%20email%20profile
    &state=abc123xyz            ← CSRF 방지용 랜덤 값

# 4단계: 콜백 (인가 코드 수신)
GET https://yourapp.com/callback?
    code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
    &state=abc123xyz            ← 요청 시 보낸 state와 동일한지 확인!

# 6단계: 토큰 교환 (서버 → 서버, 안전한 채널)
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET    ← 서버에만 저장된 비밀 키
&redirect_uri=https://yourapp.com/callback

# 7단계: 토큰 응답
{
    "access_token": "ya29.a0AfH6SM...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "1//0g...",
    "scope": "openid email profile",
    "id_token": "eyJhbGciOiJSUzI1..."    ← OIDC를 사용하면 포함
}
```

##### (2) Authorization Code Flow + PKCE — SPA/모바일 앱용

SPA(Single Page Application)나 모바일 앱처럼 **Client Secret을 안전하게 보관할 수 없는 환경**에서 사용해요. PKCE(Proof Key for Code Exchange, 발음: "pixie")는 Authorization Code를 가로채도 토큰으로 교환할 수 없게 만들어요.

```
# PKCE 작동 원리

1. 앱이 랜덤 문자열(Code Verifier)을 생성해요
   code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

2. Code Verifier를 SHA256으로 해싱해서 Code Challenge를 만들어요
   code_challenge = BASE64URL(SHA256(code_verifier))
                  = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

3. 인가 요청 시 Code Challenge를 보내요 (공개해도 안전)
   GET /authorize?
       response_type=code
       &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
       &code_challenge_method=S256
       &client_id=...

4. 토큰 교환 시 Code Verifier를 보내요 (이때만 전송)
   POST /token
       grant_type=authorization_code
       &code=AUTHORIZATION_CODE
       &code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
       &client_id=...

5. 인가 서버가 code_verifier를 SHA256으로 해싱해서
   처음 받은 code_challenge와 일치하는지 확인해요
   → 일치하면 토큰 발급! 불일치하면 거부!
```

**왜 PKCE가 필요한가요?**

```
공격자가 Authorization Code를 가로챘다고 해도:
- code_verifier는 앱의 메모리에만 있어요
- code_challenge에서 code_verifier를 역산할 수 없어요 (SHA256 단방향 해시)
- 공격자는 code_verifier 없이는 토큰을 받을 수 없어요!

→ 현재 OAuth2 보안 모범 사례(RFC 9126)에서는
  모든 클라이언트(서버 포함)에 PKCE를 권장하고 있어요.
```

##### (3) Client Credentials Flow — 서비스 간 통신

사용자 없이 **서비스(Machine)가 다른 서비스의 API를 호출**할 때 사용해요. 마이크로서비스 아키텍처에서 서비스 간 인증에 많이 쓰여요.

```bash
# 서비스 A가 서비스 B의 API를 호출해야 할 때
# 사람(사용자)이 개입하지 않으므로 리다이렉트가 필요 없어요

POST https://auth.example.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=service-a
&client_secret=SERVICE_A_SECRET
&scope=orders:read inventory:write

# 응답
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "orders:read inventory:write"
}
# ⚠️ Refresh Token은 발급되지 않아요 (서비스는 언제든 다시 인증 가능)
```

##### Grant Type 선택 가이드

| 시나리오 | Grant Type | 이유 |
|----------|-----------|------|
| 웹 앱 (서버 사이드) | Authorization Code | Client Secret 안전하게 보관 가능 |
| SPA / 모바일 앱 | Authorization Code + PKCE | Client Secret 보관 불가, PKCE로 보호 |
| 서비스 간 통신 | Client Credentials | 사용자 개입 없는 M2M 통신 |
| IoT / 입력 제한 기기 | Device Code | 키보드 없는 기기 (TV, 프린터) |
| ~~비밀번호 직접 전달~~ | ~~Resource Owner Password~~ | ~~폐기 예정! 사용 금지~~ |
| ~~브라우저만~~ | ~~Implicit~~ | ~~폐기됨! PKCE로 대체~~ |

---

### 2. OpenID Connect (OIDC) — OAuth2 위에 인증 계층 추가

#### OIDC란?

OAuth2는 "인가"만 처리해요. "이 사용자가 누구인지"는 알려주지 않아요. OIDC는 OAuth2 위에 **인증(Authentication) 계층**을 추가해서, 사용자의 신원 정보까지 제공해요.

```
OAuth2만 있을 때의 문제:
  → Access Token으로 API는 호출할 수 있지만
  → "이 사람이 누구인지"는 모르는 상태예요
  → 각 서비스가 제각각 /userinfo를 만들어서 혼란스러웠어요

OIDC가 해결:
  → 표준화된 ID Token(JWT)으로 사용자 정보를 전달해요
  → 표준 UserInfo 엔드포인트를 정의해요
  → "Google로 로그인" 같은 소셜 로그인의 기반이에요
```

#### OIDC의 핵심 구성 요소

**1. ID Token (JWT 형식)**

```json
{
    "iss": "https://accounts.google.com",    // 토큰 발급자
    "sub": "1234567890",                      // 사용자 고유 식별자
    "aud": "your-client-id",                  // 토큰을 사용할 클라이언트
    "exp": 1710374400,                        // 만료 시간
    "iat": 1710370800,                        // 발급 시간
    "nonce": "n-0S6_WzA2Mj",                 // 리플레이 공격 방지
    "email": "user@gmail.com",
    "email_verified": true,
    "name": "김개발",
    "picture": "https://lh3.googleusercontent.com/..."
}
```

**2. UserInfo 엔드포인트**

```bash
# ID Token에 정보가 부족할 때 추가 정보를 요청할 수 있어요
GET https://accounts.google.com/userinfo
Authorization: Bearer ya29.a0AfH6SM...

# 응답
{
    "sub": "1234567890",
    "name": "김개발",
    "given_name": "개발",
    "family_name": "김",
    "email": "user@gmail.com",
    "email_verified": true,
    "picture": "https://lh3.googleusercontent.com/..."
}
```

**3. Discovery 엔드포인트 (.well-known)**

```bash
# 모든 OIDC Provider는 이 엔드포인트를 제공해야 해요
GET https://accounts.google.com/.well-known/openid-configuration

# 응답 (주요 필드)
{
    "issuer": "https://accounts.google.com",
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "token_endpoint": "https://oauth2.googleapis.com/token",
    "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
    "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs",
    "scopes_supported": ["openid", "email", "profile"],
    "response_types_supported": ["code", "token", "id_token"],
    "id_token_signing_alg_values_supported": ["RS256"]
}
# → 클라이언트가 이 정보를 자동으로 읽어서 설정할 수 있어요!
```

#### OIDC 표준 Scope

| Scope | 제공 정보 |
|-------|----------|
| `openid` | (필수) OIDC 사용을 선언, `sub` claim 포함 |
| `profile` | name, family_name, given_name, picture 등 |
| `email` | email, email_verified |
| `address` | 주소 정보 |
| `phone` | phone_number, phone_number_verified |

---

### 3. SAML 2.0 — 엔터프라이즈 SSO의 표준

#### SAML이란?

SAML(Security Assertion Markup Language)은 **XML 기반의 인증/인가 프로토콜**이에요. 2005년에 만들어진 오래된 표준이지만, 대기업과 정부기관에서 여전히 많이 쓰이고 있어요.

```
SAML vs OIDC 비유:

SAML  = 공문서 (XML 기반, 격식 있고, 엔터프라이즈급)
OIDC  = 카카오톡 메시지 (JSON 기반, 가볍고, 모바일/웹 친화적)

둘 다 "이 사람이 누구인지"를 증명하지만, 형식과 사용 환경이 달라요.
```

#### SAML의 핵심 구성 요소

| 구성 요소 | 설명 | 예시 |
|-----------|------|------|
| **IdP** (Identity Provider) | 사용자를 인증하는 서버 | Okta, Azure AD, ADFS |
| **SP** (Service Provider) | 서비스를 제공하는 앱 | Jira, Confluence, AWS Console |
| **SAML Assertion** | 인증 정보를 담은 XML 문서 | ID Token의 XML 버전 |
| **SAML Request** | SP가 IdP에 보내는 인증 요청 | `<AuthnRequest>` |
| **SAML Response** | IdP가 SP에 보내는 인증 응답 | `<Response>` with `<Assertion>` |

#### SAML SP-Initiated Flow

```mermaid
sequenceDiagram
    participant User as 사용자 (브라우저)
    participant SP as 서비스 제공자<br/>(예: Jira)
    participant IdP as ID 제공자<br/>(예: Okta)

    User->>SP: 1. Jira 접속 시도
    SP->>User: 2. SAML Request 생성, IdP로 리다이렉트
    User->>IdP: 3. SAML Request 전달 (HTTP Redirect/POST)
    IdP->>User: 4. 로그인 페이지 표시
    User->>IdP: 5. ID/비밀번호 입력 (+ MFA)
    IdP->>IdP: 6. 사용자 인증 + SAML Assertion 생성
    IdP->>User: 7. SAML Response (서명된 Assertion 포함)
    User->>SP: 8. SAML Response를 SP의 ACS URL로 POST
    SP->>SP: 9. Assertion 서명 검증 + 사용자 정보 추출
    SP->>User: 10. 로그인 성공, 서비스 이용
```

#### SAML Assertion 구조 (간략화)

```xml
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_abc123" IssueInstant="2026-03-13T09:00:00Z" Version="2.0">

    <saml:Issuer>https://idp.example.com</saml:Issuer>

    <!-- 디지털 서명 (위변조 방지) -->
    <ds:Signature>...</ds:Signature>

    <!-- 인증 정보 -->
    <saml:Subject>
        <saml:NameID>user@example.com</saml:NameID>
    </saml:Subject>

    <!-- 유효 조건 -->
    <saml:Conditions NotBefore="2026-03-13T09:00:00Z"
                     NotOnOrAfter="2026-03-13T09:05:00Z">
        <saml:AudienceRestriction>
            <saml:Audience>https://jira.example.com</saml:Audience>
        </saml:AudienceRestriction>
    </saml:Conditions>

    <!-- 사용자 속성 (이름, 이메일, 역할 등) -->
    <saml:AttributeStatement>
        <saml:Attribute Name="email">
            <saml:AttributeValue>user@example.com</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="role">
            <saml:AttributeValue>developer</saml:AttributeValue>
        </saml:Attribute>
    </saml:AttributeStatement>
</saml:Assertion>
```

#### SAML vs OIDC 비교

| 항목 | SAML 2.0 | OIDC |
|------|----------|------|
| **데이터 형식** | XML | JSON (JWT) |
| **전송 크기** | 크다 (XML이라) | 작다 (JSON이라) |
| **모바일 지원** | 어렵다 | 쉽다 |
| **구현 복잡도** | 높다 | 낮다 |
| **주요 사용처** | 대기업 SSO, 정부기관 | 웹/모바일 앱, API |
| **표준 년도** | 2005년 | 2014년 |
| **신규 프로젝트** | 레거시 연동 시에만 | 권장 |

---

### 4. JWT (JSON Web Token) — 토큰의 표준 형식

#### JWT란?

JWT(발음: "jot")는 **JSON 형태의 정보를 안전하게 전달하기 위한 토큰 표준(RFC 7519)**이에요. OAuth2의 Access Token, OIDC의 ID Token 모두 JWT 형식을 사용할 수 있어요.

#### JWT 구조: Header.Payload.Signature

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkw
IiwibmFtZSI6Iuq5gOqwnOuwnCIsImlhdCI6MTcxMDM3MDgwMCwiZXhwIjoxN
zEwMzc0NDAwLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36P
Ok6yJV_adQssw5c

  ┌─────────────┐  ┌─────────────────────┐  ┌──────────────────┐
  │   Header     │  │      Payload         │  │    Signature     │
  │  (Base64URL) │. │    (Base64URL)       │. │   (Base64URL)    │
  └─────────────┘  └─────────────────────┘  └──────────────────┘
```

**1. Header — 메타데이터**

```json
{
    "alg": "RS256",    // 서명 알고리즘 (RS256, ES256, HS256 등)
    "typ": "JWT",      // 토큰 타입
    "kid": "key-2026"  // 서명 검증에 사용할 키 ID
}
```

**2. Payload — 클레임(Claims, 실제 데이터)**

```json
{
    // 등록된 클레임 (Registered Claims) - 표준 정의
    "iss": "https://auth.example.com",   // Issuer: 토큰 발급자
    "sub": "user-12345",                  // Subject: 사용자 식별자
    "aud": "my-app",                      // Audience: 토큰 대상
    "exp": 1710374400,                    // Expiration: 만료 시간 (Unix timestamp)
    "iat": 1710370800,                    // Issued At: 발급 시간
    "nbf": 1710370800,                    // Not Before: 이 시간 이전에는 무효
    "jti": "unique-token-id-abc",         // JWT ID: 토큰 고유 식별자

    // 공개 클레임 (Public Claims) - IANA에 등록된 이름
    "email": "dev@example.com",
    "name": "김개발",

    // 비공개 클레임 (Private Claims) - 서비스 간 합의한 이름
    "role": "admin",
    "team": "platform",
    "permissions": ["read", "write", "deploy"]
}
```

**3. Signature — 위변조 방지**

```
# 대칭키 방식 (HS256) - 같은 키로 서명/검증
HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    secret_key    ← 발급자와 검증자가 같은 키를 공유
)

# 비대칭키 방식 (RS256) - 개인키로 서명, 공개키로 검증 (권장!)
RSA-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    private_key   ← 발급자만 가진 개인키로 서명
)
# → 검증자는 공개키(JWKS 엔드포인트에서 제공)로 검증
# → 개인키 없이 토큰을 위조할 수 없어요!
```

#### JWT 검증 순서

```
API 서버가 JWT를 검증하는 순서:

1. 형식 확인     → Header.Payload.Signature 3부분인가?
2. 서명 검증     → 공개키로 Signature가 유효한지 확인
3. exp 확인      → 만료되지 않았는가? (현재 시간 < exp)
4. nbf 확인      → 아직 유효 시작 전이 아닌가? (현재 시간 ≥ nbf)
5. iss 확인      → 신뢰하는 발급자인가?
6. aud 확인      → 이 토큰이 우리 서비스를 위한 것인가?
7. 클레임 확인   → 필요한 권한(role, scope)이 있는가?

→ 모든 검증을 통과해야만 요청을 처리해요!
→ DB 조회 없이 토큰 자체만으로 검증 가능 (Stateless!)
```

---

### 5. SSO (Single Sign-On) — 한 번의 로그인

#### SSO란?

SSO는 **한 번의 인증으로 여러 서비스에 접근**할 수 있게 해주는 방식이에요. 매번 서비스마다 로그인하는 불편함을 없애줘요.

**비유: 리조트 올인클루시브**

리조트에 체크인(로그인)을 한 번 하면, 레스토랑/수영장/헬스장(여러 서비스)을 팔찌(토큰)만 보여주고 자유롭게 이용할 수 있어요. 매번 프론트에서 신분증을 보여줄 필요가 없죠.

```
SSO가 해결하는 문제:

❌ SSO 없이:
  Jira 접속     → 로그인 (ID/PW 입력)
  Confluence    → 또 로그인 (같은 ID/PW 입력)
  GitLab 접속   → 또 로그인 (같은 ID/PW 입력)
  Jenkins 접속  → 또 또 로그인...
  → 사용자: 하루에 10번 이상 로그인, 비밀번호 메모 필요
  → 보안팀: 사용자별 계정이 서비스마다 따로 존재, 퇴사자 처리 악몽

✅ SSO 있으면:
  회사 SSO 로그인 → 한 번!
  Jira, Confluence, GitLab, Jenkins → 자동 로그인
  → 사용자: 하루 1번만 로그인
  → 보안팀: 중앙에서 계정 관리, 퇴사 시 한 번에 차단
```

#### SSO 구현 프로토콜 비교

| 프로토콜 | 방식 | 사용처 |
|----------|------|--------|
| **SAML 2.0** | XML Assertion + 브라우저 리다이렉트 | 대기업 내부 SSO (Okta, Azure AD) |
| **OIDC** | JWT + OAuth2 기반 | 웹/모바일 SSO (Google, Auth0) |
| **Kerberos** | 티켓 기반 (TGT/TGS) | Windows AD 환경 |
| **CAS** | 티켓 기반 | 레거시 학교/기관 |

---

### 6. MFA (Multi-Factor Authentication) — 다중 인증

#### MFA란?

MFA는 **두 가지 이상의 인증 요소**를 결합해서 보안을 강화하는 방식이에요. 비밀번호가 유출되더라도 추가 인증 요소가 있어 계정을 보호할 수 있어요.

**인증의 3가지 요소:**

| 요소 | 설명 | 예시 |
|------|------|------|
| **지식 (Something you know)** | 내가 아는 것 | 비밀번호, PIN, 보안 질문 |
| **소유 (Something you have)** | 내가 가진 것 | 스마트폰, 보안키(YubiKey), OTP 카드 |
| **생체 (Something you are)** | 나 자체 | 지문, 얼굴, 홍채 |

```
MFA의 핵심: "서로 다른 요소"를 조합하는 거예요!

✅ 올바른 MFA:  비밀번호(지식) + OTP(소유)     = 2FA
✅ 올바른 MFA:  지문(생체) + 보안키(소유)       = 2FA
❌ 잘못된 MFA:  비밀번호(지식) + PIN(지식)       = 같은 요소 2개, 의미 없음!
```

#### MFA 방식 비교

##### (1) TOTP (Time-based One-Time Password)

```
작동 원리:
1. 서버와 앱이 같은 비밀키(Shared Secret)를 가져요
2. 비밀키 + 현재 시간 → HMAC-SHA1 → 6자리 숫자 생성
3. 30초마다 새로운 코드가 생성돼요
4. 서버도 같은 계산을 해서 일치하는지 확인해요

장점: 오프라인 동작, 앱만 있으면 됨 (Google Authenticator, Authy)
단점: 피싱에 취약 (사용자가 코드를 가짜 사이트에 입력할 수 있음)
```

##### (2) FIDO2 / WebAuthn — 피싱 방지 최강

```
작동 원리:
1. 등록: 보안키(또는 기기)가 공개키/개인키 쌍을 생성
2. 공개키를 서버에 등록, 개인키는 보안키에 안전하게 저장
3. 인증: 서버가 챌린지(랜덤 데이터)를 보냄
4. 보안키가 개인키로 챌린지에 서명
5. 서버가 공개키로 서명 검증

피싱 방지 원리:
- 보안키가 도메인(origin)을 확인해요
- google.com에서 등록한 키는 goo9le.com에서 작동하지 않아요!
- 사용자가 피싱 사이트에 속아도, 보안키가 거부해요

지원 방식:
- 외장 보안키: YubiKey, Google Titan
- 플랫폼 인증자: Touch ID, Windows Hello, Face ID
- Passkeys: FIDO2의 소비자 친화적 진화 (비밀번호 없는 미래!)
```

##### MFA 방식 비교표

| 방식 | 피싱 방지 | 사용 편의성 | 비용 | 추천 등급 |
|------|----------|------------|------|----------|
| SMS OTP | 낮음 (SIM 스와핑 가능) | 높음 | 낮음 | 최후의 수단 |
| TOTP (앱) | 중간 | 중간 | 무료 | 좋음 |
| Push 알림 | 중간 (MFA 피로 공격) | 높음 | 중간 | 좋음 |
| FIDO2/WebAuthn | 높음 | 높음 | 중~높음 | 최고 |
| Passkeys | 높음 | 최고 | 무료 | 차세대 표준 |

---

### 7. Identity Provider (IdP) — 중앙 인증 시스템

#### 왜 IdP가 필요한가요?

인증/인가를 각 서비스마다 직접 구현하면 이런 문제가 생겨요:

```
❌ IdP 없이 (각 서비스가 직접 인증 구현):
  - 서비스마다 사용자 DB가 따로 존재
  - 비밀번호 정책이 제각각
  - MFA 구현 수준이 다름
  - 퇴사자 계정 삭제를 서비스마다 해야 함
  - 보안 취약점이 서비스마다 다르게 존재

✅ IdP 사용 (중앙 인증 + 각 서비스는 IdP에 위임):
  - 사용자 DB 한 곳에서 관리
  - 일관된 비밀번호/MFA 정책
  - 한 곳만 업데이트하면 모든 서비스에 적용
  - 퇴사 시 IdP에서 비활성화 → 모든 서비스 즉시 차단
```

#### 주요 IdP 비교

| IdP | 유형 | 특징 | 적합한 경우 |
|-----|------|------|------------|
| **Keycloak** | 오픈소스 (Self-hosted) | 무료, 커스터마이징 자유, 직접 운영 필요 | 온프레미스, 비용 절감 |
| **Auth0** | SaaS (Managed) | 빠른 구축, 풍부한 SDK, 유료 | SaaS 서비스, 빠른 출시 |
| **Okta** | SaaS (Enterprise) | 대기업용, 수천 개 앱 연동, 고가 | 대기업, 규제 산업 |
| **AWS Cognito** | AWS Managed | AWS 통합, 서버리스 친화적 | AWS 기반 서비스 |
| **Azure AD** | Microsoft Managed | Microsoft 365 통합, 하이브리드 | MS 생태계 기업 |

---

### 8. RBAC vs ABAC — 접근 제어 모델

#### RBAC (Role-Based Access Control)

```
원리: "역할"에 권한을 부여하고, 사용자에게 역할을 할당해요.

사용자 → 역할 → 권한

예시:
  김개발 → [Developer 역할] → read:code, write:code, create:branch
  박운영 → [Operator 역할]  → read:code, deploy:staging, view:logs
  이관리 → [Admin 역할]     → * (모든 권한)
```

```yaml
# Keycloak RBAC 설정 예시
roles:
  - name: developer
    permissions:
      - "repo:read"
      - "repo:write"
      - "ci:trigger"
  - name: operator
    permissions:
      - "repo:read"
      - "deploy:staging"
      - "logs:read"
      - "metrics:read"
  - name: admin
    permissions:
      - "*"

users:
  - username: kim-dev
    roles: [developer]
  - username: park-ops
    roles: [operator]
  - username: lee-admin
    roles: [admin, developer, operator]
```

#### ABAC (Attribute-Based Access Control)

```
원리: 사용자/리소스/환경의 "속성"을 기반으로 동적 정책을 평가해요.

정책 예시:
  IF   user.department == "engineering"
  AND  user.clearance_level >= 3
  AND  resource.classification == "internal"
  AND  environment.time BETWEEN 09:00 AND 18:00
  AND  environment.ip IN company_network
  THEN ALLOW

→ RBAC보다 훨씬 세밀한 제어가 가능하지만, 복잡해요!
```

#### RBAC vs ABAC 비교

| 항목 | RBAC | ABAC |
|------|------|------|
| **기반** | 역할 (Role) | 속성 (Attribute) |
| **복잡도** | 낮음 | 높음 |
| **유연성** | 제한적 | 매우 유연 |
| **관리** | 역할만 관리하면 됨 | 정책 + 속성 관리 필요 |
| **적합한 경우** | 조직 구조가 명확할 때 | 세밀한 접근 제어 필요 시 |
| **예시** | "관리자는 모든 것을 할 수 있다" | "근무 시간에 사내 네트워크에서만 접근 가능" |
| **도구** | Keycloak, AWS IAM Role | OPA, AWS IAM Condition |

---

### 9. Zero Trust와 인증

```
전통적 보안: "성벽 모델"
  → 회사 네트워크(방화벽) 안에 있으면 신뢰
  → VPN만 연결하면 내부 리소스에 자유롭게 접근
  → 문제: 한 번 침투하면 내부에서 자유롭게 이동 가능 (Lateral Movement)

Zero Trust: "아무도 신뢰하지 않는 모델"
  → 네트워크 위치에 관계없이 항상 검증
  → 모든 요청마다 인증 + 인가
  → 최소 권한 원칙 적용
  → 지속적인 신뢰 평가
```

**Zero Trust 인증 원칙:**

```
1. Never Trust, Always Verify
   → 모든 접근 요청을 매번 검증해요

2. Least Privilege Access
   → 필요한 최소한의 권한만 부여해요

3. Assume Breach
   → 이미 침해당했다고 가정하고 설계해요

4. Continuous Verification
   → 세션 중에도 지속적으로 신뢰를 재평가해요
   → 예: 갑자기 다른 나라에서 접속? → 재인증 요구!
```

```mermaid
flowchart TB
    subgraph "전통적 보안 (성벽 모델)"
        FW["방화벽"] --> INSIDE["내부 네트워크"]
        INSIDE --> S1["서비스 A"]
        INSIDE --> S2["서비스 B"]
        INSIDE --> S3["DB"]
        S1 <-->|"자유 통신"| S2
        S2 <-->|"자유 통신"| S3
    end

    subgraph "Zero Trust"
        REQ["모든 요청"] --> VERIFY["인증 + 인가<br/>+ 디바이스 검증<br/>+ 컨텍스트 평가"]
        VERIFY -->|"허용"| ZS1["서비스 A"]
        VERIFY -->|"허용"| ZS2["서비스 B"]
        VERIFY -->|"허용"| ZS3["DB"]
        ZS1 ---|"mTLS + JWT"| ZS2
        ZS2 ---|"mTLS + JWT"| ZS3
    end

    style FW fill:#e74c3c,color:#fff
    style VERIFY fill:#27ae60,color:#fff
    style INSIDE fill:#f39c12,color:#fff
```

---

## 💻 직접 해보기

### 실습 1: JWT 디코딩과 검증 이해하기

```bash
# JWT를 직접 디코딩해 봐요 (base64url → JSON)

# 예시 JWT
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiLquYDqsJzrsJwiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAzNzA4MDAsImV4cCI6MTcxMDM3NDQwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

# Header 디코딩
echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null
# → {"alg":"HS256","typ":"JWT"}

# Payload 디코딩
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null
# → {"sub":"user-123","name":"김개발","role":"admin","iat":1710370800,"exp":1710374400}

# ⚠️ 중요: base64 디코딩만으로는 누구나 Payload를 읽을 수 있어요!
# JWT는 "암호화"가 아니라 "서명"이에요.
# → 민감한 데이터(비밀번호 등)는 절대 Payload에 넣지 마세요!
```

### 실습 2: Keycloak으로 OIDC 구성하기

```yaml
# docker-compose.yml - Keycloak 로컬 실행
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Keycloak 실행
docker compose up -d

# 1. 브라우저에서 http://localhost:8080 접속
# 2. admin / admin 으로 로그인
# 3. Realm 생성: "my-company"
# 4. Client 생성: "my-web-app"
```

```bash
# Keycloak Realm 설정 (CLI로도 가능)
# Realm 생성
curl -s -X POST http://localhost:8080/admin/realms \
  -H "Authorization: Bearer $(curl -s -X POST \
    http://localhost:8080/realms/master/protocol/openid-connect/token \
    -d 'grant_type=client_credentials&client_id=admin-cli' \
    -d 'username=admin&password=admin&grant_type=password' \
    | jq -r '.access_token')" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "my-company",
    "enabled": true,
    "registrationAllowed": true
  }'

# OIDC Discovery 확인
curl -s http://localhost:8080/realms/my-company/.well-known/openid-configuration | jq .
# {
#   "issuer": "http://localhost:8080/realms/my-company",
#   "authorization_endpoint": "http://localhost:8080/realms/my-company/protocol/openid-connect/auth",
#   "token_endpoint": "http://localhost:8080/realms/my-company/protocol/openid-connect/token",
#   "userinfo_endpoint": "http://localhost:8080/realms/my-company/protocol/openid-connect/userinfo",
#   "jwks_uri": "http://localhost:8080/realms/my-company/protocol/openid-connect/certs",
#   ...
# }
```

### 실습 3: OAuth2 Client Credentials로 서비스 간 인증

```bash
# Keycloak에서 Client 생성 (Service Account 용)

# 1. Client 생성 (Client Credentials Grant 활성화)
# Keycloak Admin Console → Clients → Create
# - Client ID: backend-service
# - Client Authentication: ON
# - Service accounts roles: ON

# 2. 토큰 발급 테스트
curl -s -X POST http://localhost:8080/realms/my-company/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=backend-service" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  | jq .

# 응답:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6IC...",
#   "expires_in": 300,
#   "token_type": "Bearer",
#   "not-before-policy": 0,
#   "scope": "profile email"
# }

# 3. 발급받은 토큰의 내용 확인
echo "eyJhbGciOiJSUzI1NiIs..." | cut -d'.' -f2 | base64 -d | jq .
# {
#   "iss": "http://localhost:8080/realms/my-company",
#   "sub": "service-account-backend-service",
#   "typ": "Bearer",
#   "azp": "backend-service",
#   "realm_access": { "roles": ["default-roles-my-company"] },
#   ...
# }
```

### 실습 4: Nginx에서 JWT 검증하기

```nginx
# nginx.conf - JWT 검증을 통한 API 보호
# (nginx-plus 또는 njs 모듈 필요)

upstream api_backend {
    server app:3000;
}

# JWKS 캐시 설정
proxy_cache_path /tmp/jwks_cache levels=1:2
    keys_zone=jwks:1m max_size=10m;

map $http_authorization $jwt_token {
    "~*^Bearer\s+(?<token>.+)$" $token;
    default "";
}

server {
    listen 80;
    server_name api.example.com;

    # 공개 엔드포인트 (인증 불필요)
    location /health {
        proxy_pass http://api_backend;
    }

    location /auth/login {
        proxy_pass http://api_backend;
    }

    # 보호된 엔드포인트 (JWT 필수)
    location /api/ {
        # JWT가 없으면 401 반환
        if ($jwt_token = "") {
            return 401 '{"error": "Missing Authorization header"}';
        }

        # JWT 검증은 앱 서버 또는 인가 서버에서 수행
        # OIDC introspection 엔드포인트 활용
        auth_request /validate_token;
        auth_request_set $jwt_sub $upstream_http_x_jwt_sub;
        auth_request_set $jwt_role $upstream_http_x_jwt_role;

        # 검증된 사용자 정보를 백엔드로 전달
        proxy_set_header X-User-ID $jwt_sub;
        proxy_set_header X-User-Role $jwt_role;
        proxy_pass http://api_backend;
    }

    # 토큰 검증 내부 엔드포인트
    location = /validate_token {
        internal;
        proxy_pass http://keycloak:8080/realms/my-company/protocol/openid-connect/userinfo;
        proxy_set_header Authorization "Bearer $jwt_token";
        proxy_set_header Content-Length "";
        proxy_pass_request_body off;
    }
}
```

### 실습 5: AWS Cognito로 인증 구성하기

```bash
# AWS Cognito User Pool 생성
aws cognito-idp create-user-pool \
    --pool-name "my-app-users" \
    --auto-verified-attributes email \
    --mfa-configuration "OPTIONAL" \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 12,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": true,
            "TemporaryPasswordValidityDays": 1
        }
    }' \
    --schema '[
        {"Name": "email", "Required": true, "Mutable": true},
        {"Name": "name", "Required": true, "Mutable": true}
    ]'
# → UserPoolId: ap-northeast-2_XXXXXXXXX

# App Client 생성
aws cognito-idp create-user-pool-client \
    --user-pool-id ap-northeast-2_XXXXXXXXX \
    --client-name "my-web-app" \
    --explicit-auth-flows \
        ALLOW_REFRESH_TOKEN_AUTH \
        ALLOW_USER_SRP_AUTH \
    --supported-identity-providers "COGNITO" \
    --callback-urls '["https://myapp.com/callback"]' \
    --allowed-o-auth-flows "code" \
    --allowed-o-auth-scopes "openid" "email" "profile" \
    --allowed-o-auth-flows-user-pool-client
# → ClientId: XXXXXXXXXXXXXXXXXXXXXXX

# Cognito OIDC Discovery 확인
curl -s https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_XXXXXXXXX/.well-known/openid-configuration | jq .

# 사용자 생성 (관리자 모드)
aws cognito-idp admin-create-user \
    --user-pool-id ap-northeast-2_XXXXXXXXX \
    --username "developer@example.com" \
    --user-attributes Name=email,Value=developer@example.com Name=name,Value=김개발 \
    --temporary-password "TempPass123!"
```

---

## 🏢 실무에서는?

### 실무 인증 아키텍처 패턴

#### 패턴 1: API Gateway + IdP 중앙 인증

```mermaid
flowchart TB
    subgraph "클라이언트"
        WEB["웹 앱"]
        MOBILE["모바일 앱"]
        SERVICE["외부 서비스"]
    end

    subgraph "인증 계층"
        IDP["Identity Provider<br/>(Keycloak / Cognito)"]
        GW["API Gateway<br/>(Kong / AWS API GW)"]
    end

    subgraph "마이크로서비스"
        SVC_A["서비스 A<br/>(주문)"]
        SVC_B["서비스 B<br/>(결제)"]
        SVC_C["서비스 C<br/>(재고)"]
    end

    WEB -->|"1. 로그인"| IDP
    MOBILE -->|"1. 로그인"| IDP
    IDP -->|"2. JWT 발급"| WEB
    IDP -->|"2. JWT 발급"| MOBILE

    WEB -->|"3. API 요청 + JWT"| GW
    MOBILE -->|"3. API 요청 + JWT"| GW
    SERVICE -->|"3. Client Credentials"| GW

    GW -->|"4. JWT 검증 후 라우팅"| SVC_A
    GW -->|"4. JWT 검증 후 라우팅"| SVC_B
    GW -->|"4. JWT 검증 후 라우팅"| SVC_C

    SVC_A <-->|"서비스 간: mTLS + JWT"| SVC_B
    SVC_B <-->|"서비스 간: mTLS + JWT"| SVC_C

    style IDP fill:#3498db,color:#fff
    style GW fill:#e67e22,color:#fff
```

#### 패턴 2: 토큰 관리 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    토큰 수명 관리 전략                        │
├──────────────────┬──────────────────────────────────────────┤
│ Access Token     │ 수명: 5~15분 (짧게!)                     │
│                  │ 저장: 메모리 (localStorage 사용 금지!)     │
│                  │ 용도: API 호출 시 Authorization 헤더       │
├──────────────────┼──────────────────────────────────────────┤
│ Refresh Token    │ 수명: 7~30일                              │
│                  │ 저장: HttpOnly + Secure + SameSite 쿠키   │
│                  │ 용도: Access Token 재발급                  │
│                  │ 회전: 사용 시 새로운 Refresh Token 발급     │
├──────────────────┼──────────────────────────────────────────┤
│ ID Token         │ 수명: Access Token과 동일                 │
│                  │ 용도: 사용자 정보 표시 (프론트엔드)         │
│                  │ 주의: API 호출에 사용하면 안 됨!            │
└──────────────────┴──────────────────────────────────────────┘
```

#### 패턴 3: 서비스별 IdP 선택 가이드

```
의사 결정 트리:

AWS에서 서비스를 운영하나요?
├─ Yes → AWS 전용 서비스인가요?
│        ├─ Yes → AWS Cognito (AWS 네이티브 통합)
│        └─ No  → 멀티클라우드인가요?
│                 ├─ Yes → Keycloak (벤더 종속 없음)
│                 └─ No  → Auth0 (빠른 구축, 관리 비용 절감)
└─ No  → 온프레미스인가요?
         ├─ Yes → Keycloak (오픈소스, 무료)
         └─ No  → 엔터프라이즈 규모인가요?
                  ├─ Yes → Okta (대규모, 컴플라이언스)
                  └─ No  → Auth0 (SaaS, 빠른 시작)
```

#### 실무 Tip: 알람과 모니터링 연계

[Alerting 시스템](../08-observability/11-alerting)과 연계해서 인증 관련 이상 징후를 모니터링해야 해요.

```yaml
# Prometheus alert rules - 인증 관련 모니터링
groups:
  - name: auth_alerts
    rules:
      # 로그인 실패 급증 (Brute Force 가능성)
      - alert: HighAuthFailureRate
        expr: |
          rate(auth_login_failures_total[5m]) > 50
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "로그인 실패율 급증"
          description: "5분간 로그인 실패 50회 이상. Brute Force 공격 가능성."

      # 비정상적인 토큰 발급량
      - alert: AbnormalTokenIssuance
        expr: |
          rate(oauth_tokens_issued_total[10m]) > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "비정상적 토큰 발급량 감지"

      # MFA 우회 시도 감지
      - alert: MFABypassAttempt
        expr: |
          rate(auth_mfa_bypass_attempts_total[5m]) > 0
        labels:
          severity: critical
        annotations:
          summary: "MFA 우회 시도 감지!"
```

---

## ⚠️ 자주 하는 실수

### 실수 1: JWT를 localStorage에 저장

```
❌ 잘못된 방법:
  localStorage.setItem('access_token', token);
  → XSS 공격으로 토큰 탈취 가능!
  → JavaScript로 localStorage에 자유롭게 접근할 수 있어요.

✅ 올바른 방법:
  - Access Token: JavaScript 변수(메모리)에 저장
  - Refresh Token: HttpOnly + Secure + SameSite=Strict 쿠키에 저장
  → XSS로 JavaScript가 접근할 수 없어요!
```

### 실수 2: JWT Payload에 민감 정보 저장

```
❌ 잘못된 방법:
{
    "sub": "user-123",
    "password": "mySecret123!",      ← 절대 안 됨!
    "ssn": "900101-1234567",         ← 개인정보 노출!
    "credit_card": "4111-1111-..."    ← 카드 정보 노출!
}
→ JWT의 Payload는 Base64URL 인코딩일 뿐, 암호화가 아니에요!
→ 누구나 디코딩해서 내용을 읽을 수 있어요!

✅ 올바른 방법:
{
    "sub": "user-123",
    "role": "admin",
    "permissions": ["read", "write"]
}
→ 식별자와 권한 정보만 최소한으로 포함하세요.
→ 민감 정보는 API를 통해 별도로 조회하세요.
```

### 실수 3: Access Token 수명을 너무 길게 설정

```
❌ 잘못된 방법:
  Access Token 만료: 24시간 또는 7일
  → 토큰이 탈취되면 오랜 시간 동안 악용 가능
  → JWT는 서버에서 강제로 무효화하기 어려워요 (Stateless이므로)

✅ 올바른 방법:
  Access Token 만료: 5~15분
  Refresh Token 만료: 7~30일 (회전 적용)
  → 짧은 Access Token + Refresh Token 조합으로
  → 보안과 사용자 경험을 동시에 잡아요.
```

### 실수 4: OAuth2 state 파라미터 누락

```
❌ 잘못된 방법:
  GET /authorize?
      response_type=code
      &client_id=MY_APP
      &redirect_uri=https://myapp.com/callback
      → state 파라미터 없음!
      → CSRF 공격에 취약해요!

✅ 올바른 방법:
  GET /authorize?
      response_type=code
      &client_id=MY_APP
      &redirect_uri=https://myapp.com/callback
      &state=RANDOM_UNGUESSABLE_STRING    ← 반드시 포함!
  → 콜백에서 state 값이 일치하는지 검증해야 해요.
```

### 실수 5: 알고리즘을 none으로 허용

```
❌ 잘못된 방법:
  JWT 라이브러리가 "alg": "none"을 허용하는 경우
  → 공격자가 서명 없는 JWT를 만들어서 보낼 수 있어요!

  변조된 JWT Header:
  {"alg": "none", "typ": "JWT"}
  → Signature 부분이 비어있어도 유효하다고 판단!

✅ 올바른 방법:
  - JWT 라이브러리에서 허용할 알고리즘을 명시적으로 지정
  - "none" 알고리즘을 절대 허용하지 않음
  - 예: jwt.verify(token, key, { algorithms: ['RS256'] })
```

### 실수 6: SAML Assertion 서명 검증 건너뛰기

```
❌ 잘못된 방법:
  → "개발 환경이니까 서명 검증 안 해도 되겠지..."
  → 공격자가 SAML Assertion을 위조해서 관리자로 로그인!

✅ 올바른 방법:
  → 개발 환경에서도 반드시 서명 검증을 수행하세요.
  → IdP의 인증서를 SP에 등록하고, 모든 Assertion의 서명을 확인하세요.
  → 인증서 만료 시 자동 갱신 프로세스를 구축하세요.
```

### 실수 7: SMS OTP를 유일한 MFA로 사용

```
❌ 잘못된 방법:
  MFA = SMS OTP만 사용
  → SIM 스와핑 공격으로 우회 가능
  → NIST SP 800-63B에서도 SMS OTP를 "제한적"으로 분류

✅ 올바른 방법:
  1순위: FIDO2/WebAuthn (피싱 완전 방지)
  2순위: TOTP 앱 (Google Authenticator, Authy)
  3순위: Push 알림 (Number Matching 기능 포함)
  최후의 수단: SMS OTP (다른 방법을 쓸 수 없을 때만)
```

### 실수 정리 체크리스트

```
배포 전 인증/인가 보안 체크리스트:

□ JWT를 localStorage에 저장하지 않았는가?
□ JWT Payload에 민감 정보가 없는가?
□ Access Token 만료 시간이 15분 이하인가?
□ Refresh Token 회전(Rotation)을 적용했는가?
□ OAuth2 요청에 state 파라미터를 포함했는가?
□ PKCE를 적용했는가? (SPA/모바일은 필수)
□ JWT 검증 시 알고리즘을 명시적으로 지정했는가?
□ SAML Assertion 서명 검증을 수행하는가?
□ MFA를 활성화했는가? (FIDO2 > TOTP > SMS)
□ 토큰 탈취 모니터링을 설정했는가?
□ 퇴사자 계정 즉시 비활성화 프로세스가 있는가?
□ CORS 설정이 올바른가? (와일드카드 * 사용 금지)
```

---

## 📝 마무리

### 핵심 요약

```
1. 인증(Authentication) vs 인가(Authorization)
   → 인증은 "누구인지", 인가는 "무엇을 할 수 있는지"
   → 인증이 먼저, 인가가 나중

2. OAuth2는 인가 프레임워크
   → Authorization Code + PKCE가 현재 표준
   → Client Credentials는 서비스 간 통신용
   → Implicit, Password Grant는 폐기!

3. OIDC는 OAuth2 + 인증
   → ID Token(JWT)으로 사용자 정보 전달
   → Discovery 엔드포인트로 자동 설정
   → 소셜 로그인의 기반

4. SAML은 엔터프라이즈 SSO 표준
   → XML 기반, 레거시지만 현역
   → 신규 프로젝트는 OIDC 권장

5. JWT는 토큰 형식
   → Header.Payload.Signature 구조
   → 서명이지 암호화가 아님! (민감 정보 넣지 마세요)
   → Stateless 검증 가능 (DB 조회 불필요)

6. SSO는 한 번의 로그인으로 여러 서비스 접근
   → SAML 또는 OIDC 기반으로 구현
   → 중앙 관리로 보안 + 편의성

7. MFA는 보안의 기본
   → FIDO2/WebAuthn > TOTP > Push > SMS
   → "서로 다른 요소"를 조합해야 진짜 MFA

8. IdP는 인증을 중앙 관리하는 서버
   → 직접 구현하지 마세요! IdP를 쓰세요.
   → Keycloak(오픈소스), Auth0(SaaS), Cognito(AWS)

9. RBAC vs ABAC
   → RBAC: 역할 기반, 간단하고 직관적
   → ABAC: 속성 기반, 세밀하지만 복잡

10. Zero Trust는 "항상 검증"
    → 네트워크 위치와 무관하게 모든 요청을 검증
    → 최소 권한 + 지속적 검증이 핵심
```

### 기술 선택 빠른 가이드

```
┌──────────────────────────┬─────────────────────────────┐
│ 상황                      │ 추천 기술                    │
├──────────────────────────┼─────────────────────────────┤
│ 웹 앱 소셜 로그인          │ OIDC + Authorization Code   │
│ SPA / 모바일 앱           │ OIDC + PKCE                  │
│ 서비스 간 통신             │ OAuth2 Client Credentials   │
│ 대기업 내부 SSO           │ SAML 2.0 또는 OIDC           │
│ API 인증                  │ JWT (RS256 서명)             │
│ 피싱 방지 MFA             │ FIDO2 / WebAuthn             │
│ 오픈소스 IdP              │ Keycloak                     │
│ AWS 네이티브 인증          │ AWS Cognito                  │
│ 세밀한 접근 제어           │ ABAC (OPA)                  │
│ 간단한 역할 관리           │ RBAC                        │
│ Zero Trust 구현           │ mTLS + JWT + ABAC            │
└──────────────────────────┴─────────────────────────────┘
```

---

## 🔗 다음 단계

### 이어서 학습하면 좋은 주제

| 순서 | 주제 | 설명 |
|------|------|------|
| **다음 강의** | [시크릿 관리](./02-secrets) | Vault, AWS Secrets Manager로 비밀 정보 안전하게 관리하기 |
| **관련 강의** | [AWS IAM](../05-cloud-aws/01-iam) | AWS에서의 인증/인가 실전 (IAM Role, Policy, Identity Center) |
| **관련 강의** | [Alerting](../08-observability/11-alerting) | 인증 이상 징후 모니터링 및 알람 설정 |
| **심화** | Kubernetes RBAC | K8s에서의 역할 기반 접근 제어 |
| **심화** | Service Mesh 보안 | Istio mTLS로 서비스 간 인증 |

### 추천 학습 자료

```
공식 문서:
  - OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
  - OIDC Core: https://openid.net/specs/openid-connect-core-1_0.html
  - JWT RFC 7519: https://tools.ietf.org/html/rfc7519
  - FIDO2/WebAuthn: https://webauthn.guide

실습:
  - JWT 디버거: https://jwt.io
  - OAuth 2.0 Playground: https://oauth.com/playground
  - Keycloak 공식 문서: https://www.keycloak.org/documentation

보안 가이드:
  - OWASP Authentication Cheat Sheet
  - NIST SP 800-63B (Digital Identity Guidelines)
  - OAuth 2.0 Security Best Current Practice (RFC 9700)
```
