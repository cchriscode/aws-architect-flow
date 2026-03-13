# Authentication and Authorization

> "Verifying who a person is" and "Determining what they can do" are completely different problems. Using an employee ID to confirm someone's identity at the entrance of a building is **Authentication**, and determining which floors they can access based on their ID's access level is **Authorization**. We briefly covered this concept in [AWS IAM](../05-cloud-aws/01-iam), but this time we'll dive deeper into protocols like OAuth2, OIDC, SAML, and JWT.

---

## 🎯 Why do you need to understand authentication and authorization?

### Real-world analogy: Amusement Park Story

Imagine you're going to an amusement park.

- **Buying a ticket** = Authentication. It proves "You are a valid visitor."
- **VIP pass vs Basic pass** = Authorization. VIP pass gives access to all rides; basic pass only some.
- **Wristband** = Token. You don't need to go to the ticket booth each time; just show your wristband.
- **Height requirement: 130cm or taller** = Additional conditions (Policy). Even with permission, you must meet the condition.

```
Real-world scenarios where you need authentication/authorization:

• "I want users to log in with their Google account"           → OAuth2 + OIDC
• "I want SSO with company Active Directory"                  → SAML / OIDC
• "I need to authenticate API calls between microservices"    → JWT + OAuth2 Client Credentials
• "I want to validate tokens at the API Gateway"              → JWT validation
• "I want 2-factor authentication to prevent account theft"   → MFA (TOTP/FIDO2)
• "I don't want to build a user management system myself"     → IdP (Keycloak, Auth0, Cognito)
• "I need to design role-based access control"                → RBAC / ABAC
• "I want to implement Zero Trust architecture"               → Continuous authentication + Least privilege
```

### System without authentication vs. Properly implemented authentication

```mermaid
flowchart TD
    subgraph "System without authentication"
        A1["User Request"] -->|"Without any validation"| A2["API Server"]
        A2 --> A3["All data exposed from DB"]
        A3 --> A4["Personal data breach"]
        A4 --> A5["Fines + Loss of trust"]
    end

    subgraph "Properly implemented authentication system"
        B1["User Request"] -->|"1. Identity verification"| B2["Authentication Server<br/>(Authentication)"]
        B2 -->|"2. Token issuance"| B3["API Gateway"]
        B3 -->|"3. Permission check"| B4["Authorization Server<br/>(Authorization)"]
        B4 -->|"4. Only authorized data"| B5["API Server"]
        B5 --> B6["Secure response"]
    end

    style A4 fill:#e74c3c,color:#fff
    style A5 fill:#e74c3c,color:#fff
    style B6 fill:#27ae60,color:#fff
    style B2 fill:#3498db,color:#fff
    style B4 fill:#9b59b6,color:#fff
```

---

## 🧠 Core concepts

### 1. Authentication vs Authorization

These two always come together, but you must distinguish them clearly.

| Item | Authentication | Authorization |
|------|--------|-----|
| **Question** | "Who are you?" | "Can you do this?" |
| **Analogy** | Verifying ID with a passport | Checking travel permission with a visa |
| **When** | Always performed first | Performed after authentication |
| **On failure** | 401 Unauthorized | 403 Forbidden |
| **Method** | Password, biometric, token | Role, policy, ACL |
| **Data** | Credentials | Permissions |
| **Protocol** | OIDC, SAML, FIDO2 | OAuth2, XACML, OPA |

> The HTTP status codes are confusing, right? 401 means "not authenticated," and 403 means "authenticated but no permission." The name "Unauthorized" is misleading, but it actually means "Unauthenticated."

### 2. Key protocols at a glance

```mermaid
flowchart TB
    subgraph "Authentication Protocols"
        OIDC["OIDC<br/>(OpenID Connect)<br/>Modern authentication"]
        SAML["SAML 2.0<br/>Enterprise authentication"]
        FIDO["FIDO2/WebAuthn<br/>Passwordless"]
    end

    subgraph "Authorization Protocols"
        OAUTH["OAuth 2.0<br/>Delegated authorization"]
        OPA["OPA<br/>Policy-based authorization"]
    end

    subgraph "Token Formats"
        JWT["JWT<br/>(JSON Web Token)"]
        SAML_TOKEN["SAML Assertion<br/>(XML)"]
        OPAQUE["Opaque Token"]
    end

    subgraph "Access Control Models"
        RBAC["RBAC<br/>Role-based"]
        ABAC["ABAC<br/>Attribute-based"]
    end

    OIDC -->|"uses"| JWT
    OIDC -->|"based on"| OAUTH
    SAML -->|"uses"| SAML_TOKEN
    OAUTH -->|"issues"| JWT
    OAUTH -->|"issues"| OPAQUE

    style OIDC fill:#3498db,color:#fff
    style OAUTH fill:#e67e22,color:#fff
    style JWT fill:#2ecc71,color:#fff
    style SAML fill:#9b59b6,color:#fff
    style FIDO fill:#1abc9c,color:#fff
```

### 3. Key terminology

| Term | Explanation | Analogy |
|------|--------|--------|
| **IdP** (Identity Provider) | Server that manages and authenticates user identity | Government office (issues ID) |
| **SP** (Service Provider) | Application that provides services to users | Bank (provides service after checking ID) |
| **Token** | Digital certificate containing authentication/authorization info | Amusement park wristband |
| **Claim** | Individual piece of information in a token | Name, department, job title on ID |
| **Scope** | Defines the range of access | "Only access up to 3rd floor" |
| **Grant** | Method/procedure to obtain a token | ID issuance process (interview → hire → issue) |
| **SSO** (Single Sign-On) | Access multiple services with one login | Amusement park pass (one payment, all rides) |
| **MFA** (Multi-Factor Auth) | Two or more authentication methods | ATM: card + password |

---

## 🔍 Deep dive into each

### 1. OAuth 2.0 — Delegated authorization framework

#### What is OAuth2?

OAuth2 is a framework for **delegating access rights to your data to third parties**. The important thing is that OAuth2 is an authorization (Authorization) protocol, not an authentication (Authentication) protocol.

**Analogy: Power of Attorney**

Imagine a situation at work where you need to pick up documents on your behalf.

1. You (Resource Owner) write a power of attorney
2. The government office (Authorization Server) verifies your authorization
3. Your representative (Client) takes the authorization to collect documents (Resource)
4. The representative can only act within the scope written on the authorization

#### OAuth2's four roles

| Role | Explanation | Example |
|------|--------|--------|
| **Resource Owner** | Owner of data (usually user) | Me as a GitHub user |
| **Client** | Application trying to access data | CI/CD tool I use |
| **Authorization Server** | Server that issues tokens | GitHub OAuth server |
| **Resource Server** | Server with protected data | GitHub API |

#### OAuth2 Grant Types (authorization flow)

##### (1) Authorization Code Flow — Most secure standard flow

The most commonly used flow in web applications. Token exchange happens server-to-server, making it secure.

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant App as Client App<br/>(Backend Server)
    participant AuthServer as Authorization Server<br/>(e.g., Google)
    participant API as Resource Server<br/>(e.g., Google API)

    User->>App: 1. Click "Sign in with Google"
    App->>User: 2. Redirect to Google authorization page
    User->>AuthServer: 3. Log in to Google + authorize
    AuthServer->>User: 4. Redirect with Authorization Code
    User->>App: 5. Pass Authorization Code
    App->>AuthServer: 6. Request token with Code + Client Secret (server-to-server)
    AuthServer->>App: 7. Issue Access Token + Refresh Token
    App->>API: 8. Call API with Access Token
    API->>App: 9. Return protected resource
```

```
# Actual HTTP requests by step

# Step 2: Authorization request (browser redirect)
GET https://accounts.google.com/o/oauth2/v2/auth?
    response_type=code
    &client_id=YOUR_CLIENT_ID
    &redirect_uri=https://yourapp.com/callback
    &scope=openid%20email%20profile
    &state=abc123xyz            ← Random value to prevent CSRF

# Step 4: Callback (receive authorization code)
GET https://yourapp.com/callback?
    code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
    &state=abc123xyz            ← Verify it matches the one we sent!

# Step 6: Token exchange (server → server, secure channel)
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET    ← Secret key stored only on server
&redirect_uri=https://yourapp.com/callback

# Step 7: Token response
{
    "access_token": "ya29.a0AfH6SM...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "1//0g...",
    "scope": "openid email profile",
    "id_token": "eyJhbGciOiJSUzI1..."    ← Included if using OIDC
}
```

##### (2) Authorization Code Flow + PKCE — For SPA/mobile apps

Used in environments like Single Page Applications (SPA) or mobile apps where **Client Secret cannot be stored securely**. PKCE (Proof Key for Code Exchange, pronounced "pixie") prevents authorization codes from being exchanged for tokens even if intercepted.

```
# How PKCE works

1. App generates a random string (Code Verifier)
   code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

2. Hash Code Verifier with SHA256 to create Code Challenge
   code_challenge = BASE64URL(SHA256(code_verifier))
                  = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

3. Send Code Challenge in authorization request (safe to expose)
   GET /authorize?
       response_type=code
       &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
       &code_challenge_method=S256
       &client_id=...

4. Send Code Verifier in token exchange (only sent here)
   POST /token
       grant_type=authorization_code
       &code=AUTHORIZATION_CODE
       &code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
       &client_id=...

5. Authorization server hashes code_verifier with SHA256
   and verifies it matches the original code_challenge
   → If match: issue token! If not: deny!
```

**Why is PKCE needed?**

```
Even if an attacker intercepts the Authorization Code:
- code_verifier only exists in app memory
- code_verifier cannot be reverse-engineered from code_challenge (SHA256 one-way hash)
- Attacker cannot get token without code_verifier!

→ Current OAuth2 security best practices (RFC 9126) recommend
  PKCE for all clients (including servers).
```

##### (3) Client Credentials Flow — Service-to-service communication

Used when **a service calls another service's API without a user**. Commonly used for authentication between microservices.

```bash
# When service A needs to call service B's API
# No user involvement, so no redirect needed

POST https://auth.example.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=service-a
&client_secret=SERVICE_A_SECRET
&scope=orders:read inventory:write

# Response
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "orders:read inventory:write"
}
# ⚠️ Refresh Token is NOT issued (service can authenticate anytime)
```

##### Grant Type selection guide

| Scenario | Grant Type | Reason |
|----------|-----------|------|
| Web app (server-side) | Authorization Code | Client Secret can be stored securely |
| SPA / Mobile app | Authorization Code + PKCE | Client Secret cannot be stored, protected by PKCE |
| Service-to-service | Client Credentials | M2M communication without user |
| IoT / Input-limited devices | Device Code | Keyboard-less devices (TV, printer) |
| ~~Direct password~~ | ~~Resource Owner Password~~ | ~~Deprecated! Never use~~ |
| ~~Browser only~~ | ~~Implicit~~ | ~~Deprecated! Use PKCE instead~~ |

---

### 2. OpenID Connect (OIDC) — Adds authentication layer on top of OAuth2

#### What is OIDC?

OAuth2 only handles "authorization." It doesn't tell you "who this user is." OIDC adds an **authentication layer on top of OAuth2** to provide user identity information.

```
Problem with OAuth2 alone:
  → You can call APIs with Access Token
  → But you don't know "who this person is"
  → Each service created its own /userinfo endpoint, causing confusion

What OIDC solves:
  → Standardized ID Token (JWT) for user information
  → Standard UserInfo endpoint is defined
  → Foundation for "Sign in with Google" style login
```

#### OIDC's core components

**1. ID Token (JWT format)**

```json
{
    "iss": "https://accounts.google.com",    // Token issuer
    "sub": "1234567890",                      // User unique identifier
    "aud": "your-client-id",                  // Client for this token
    "exp": 1710374400,                        // Expiration time
    "iat": 1710370800,                        // Issuance time
    "nonce": "n-0S6_WzA2Mj",                 // Prevents replay attacks
    "email": "user@gmail.com",
    "email_verified": true,
    "name": "Kim Developer",
    "picture": "https://lh3.googleusercontent.com/..."
}
```

**2. UserInfo endpoint**

```bash
# Request additional info if the ID Token info is insufficient
GET https://accounts.google.com/userinfo
Authorization: Bearer ya29.a0AfH6SM...

# Response
{
    "sub": "1234567890",
    "name": "Kim Developer",
    "given_name": "Developer",
    "family_name": "Kim",
    "email": "user@gmail.com",
    "email_verified": true,
    "picture": "https://lh3.googleusercontent.com/..."
}
```

**3. Discovery endpoint (.well-known)**

```bash
# All OIDC Providers must provide this endpoint
GET https://accounts.google.com/.well-known/openid-configuration

# Response (main fields)
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
# → Client can automatically read this info and configure itself!
```

#### OIDC Standard Scopes

| Scope | Provides |
|-------|----------|
| `openid` | (Required) Declares OIDC usage, includes `sub` claim |
| `profile` | name, family_name, given_name, picture, etc. |
| `email` | email, email_verified |
| `address` | Address information |
| `phone` | phone_number, phone_number_verified |

---

### 3. SAML 2.0 — Enterprise SSO standard

#### What is SAML?

SAML (Security Assertion Markup Language) is an **XML-based authentication/authorization protocol**. Although created in 2005, it's still widely used in large enterprises and government agencies.

```
SAML vs OIDC analogy:

SAML  = Official document (XML-based, formal, enterprise-grade)
OIDC  = Text message (JSON-based, lightweight, mobile/web-friendly)

Both prove "who this person is," but differ in format and environment.
```

#### SAML's core components

| Component | Explanation | Example |
|-----------|--------|--------|
| **IdP** (Identity Provider) | Server that authenticates users | Okta, Azure AD, ADFS |
| **SP** (Service Provider) | App that provides services | Jira, Confluence, AWS Console |
| **SAML Assertion** | XML document containing authentication info | XML version of ID Token |
| **SAML Request** | Authentication request SP sends to IdP | `<AuthnRequest>` |
| **SAML Response** | Authentication response IdP sends to SP | `<Response>` with `<Assertion>` |

#### SAML SP-Initiated Flow

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant SP as Service Provider<br/>(e.g., Jira)
    participant IdP as Identity Provider<br/>(e.g., Okta)

    User->>SP: 1. Try to access Jira
    SP->>User: 2. Create SAML Request, redirect to IdP
    User->>IdP: 3. Pass SAML Request (HTTP Redirect/POST)
    IdP->>User: 4. Show login page
    User->>IdP: 5. Enter ID/password (+ MFA)
    IdP->>IdP: 6. Authenticate user + create SAML Assertion
    IdP->>User: 7. SAML Response (signed Assertion included)
    User->>SP: 8. POST SAML Response to SP's ACS URL
    SP->>SP: 9. Verify Assertion signature + extract user info
    SP->>User: 10. Login success, use service
```

#### SAML Assertion structure (simplified)

```xml
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_abc123" IssueInstant="2026-03-13T09:00:00Z" Version="2.0">

    <saml:Issuer>https://idp.example.com</saml:Issuer>

    <!-- Digital signature (prevent tampering) -->
    <ds:Signature>...</ds:Signature>

    <!-- Authentication information -->
    <saml:Subject>
        <saml:NameID>user@example.com</saml:NameID>
    </saml:Subject>

    <!-- Validity conditions -->
    <saml:Conditions NotBefore="2026-03-13T09:00:00Z"
                     NotOnOrAfter="2026-03-13T09:05:00Z">
        <saml:AudienceRestriction>
            <saml:Audience>https://jira.example.com</saml:Audience>
        </saml:AudienceRestriction>
    </saml:Conditions>

    <!-- User attributes (name, email, role, etc.) -->
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

#### SAML vs OIDC comparison

| Item | SAML 2.0 | OIDC |
|------|----------|------|
| **Data format** | XML | JSON (JWT) |
| **Transfer size** | Large (XML) | Small (JSON) |
| **Mobile support** | Difficult | Easy |
| **Implementation complexity** | High | Low |
| **Main use** | Enterprise SSO, government | Web/mobile apps, APIs |
| **Standard year** | 2005 | 2014 |
| **For new projects** | Only for legacy integration | Recommended |

---

### 4. JWT (JSON Web Token) — Standard token format

#### What is JWT?

JWT (pronounced "jot") is a **standard (RFC 7519) for safely transmitting JSON-format information as a token**. Both OAuth2 Access Tokens and OIDC ID Tokens can use JWT format.

#### JWT structure: Header.Payload.Signature

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

**1. Header — Metadata**

```json
{
    "alg": "RS256",    // Signing algorithm (RS256, ES256, HS256, etc.)
    "typ": "JWT",      // Token type
    "kid": "key-2026"  // Key ID for signature verification
}
```

**2. Payload — Claims (actual data)**

```json
{
    // Registered Claims (standard-defined)
    "iss": "https://auth.example.com",   // Issuer: token issuer
    "sub": "user-12345",                  // Subject: user identifier
    "aud": "my-app",                      // Audience: token target
    "exp": 1710374400,                    // Expiration: expiry time (Unix timestamp)
    "iat": 1710370800,                    // Issued At: issuance time
    "nbf": 1710370800,                    // Not Before: invalid before this time
    "jti": "unique-token-id-abc",         // JWT ID: token unique identifier

    // Public Claims (IANA-registered names)
    "email": "dev@example.com",
    "name": "Kim Developer",

    // Private Claims (names agreed between services)
    "role": "admin",
    "team": "platform",
    "permissions": ["read", "write", "deploy"]
}
```

**3. Signature — Tamper prevention**

```
# Symmetric key method (HS256) - sign/verify with same key
HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    secret_key    ← Issuer and verifier share the same key
)

# Asymmetric key method (RS256) - sign with private key, verify with public key (recommended!)
RSA-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    private_key   ← Only issuer has the private key
)
# → Verifier uses public key (from JWKS endpoint)
# → Cannot forge token without private key!
```

#### JWT verification order

```
Order for API server to verify JWT:

1. Format check      → Is it 3 parts: Header.Payload.Signature?
2. Signature verify  → Is Signature valid with public key?
3. exp check         → Is it not expired? (current time < exp)
4. nbf check         → Is it not before validity start? (current time ≥ nbf)
5. iss check         → Is issuer trusted?
6. aud check         → Is this token for our service?
7. Claims check      → Do we have required permissions (role, scope)?

→ Must pass all checks before processing request!
→ Can verify without DB lookup (Stateless!)
```

---

### 5. SSO (Single Sign-On) — One login for everything

#### What is SSO?

SSO allows **accessing multiple services with a single authentication**. It eliminates the inconvenience of logging in to each service separately.

**Analogy: All-inclusive resort**

Check in at the resort (log in) once, then show your wristband to access restaurants, pool, gym (multiple services). You don't need to show your ID each time.

```
Problem SSO solves:

❌ Without SSO:
  Jira access     → Login (enter ID/password)
  Confluence      → Login again (same ID/password)
  GitLab access   → Login again (same ID/password)
  Jenkins access  → Login again...
  → Users: 10+ logins daily, need to write down passwords
  → Security team: Separate accounts per service, nightmare for offboarding

✅ With SSO:
  Company SSO login → One time!
  Jira, Confluence, GitLab, Jenkins → Auto login
  → Users: Login once a day
  → Security team: Manage centrally, one-click offboarding
```

#### SSO implementation protocol comparison

| Protocol | Method | Use case |
|----------|------|--------|
| **SAML 2.0** | XML Assertion + browser redirect | Enterprise internal SSO (Okta, Azure AD) |
| **OIDC** | JWT + OAuth2 based | Web/mobile SSO (Google, Auth0) |
| **Kerberos** | Ticket-based (TGT/TGS) | Windows AD environment |
| **CAS** | Ticket-based | Legacy schools/institutions |

---

### 6. MFA (Multi-Factor Authentication) — Multiple authentication methods

#### What is MFA?

MFA **combines two or more authentication factors** to strengthen security. Even if a password is compromised, additional authentication factors protect the account.

**Three factors of authentication:**

| Factor | Explanation | Example |
|------|--------|--------|
| **Knowledge (Something you know)** | What you know | Password, PIN, security question |
| **Possession (Something you have)** | What you own | Smartphone, security key (YubiKey), OTP card |
| **Biometric (Something you are)** | You yourself | Fingerprint, face, iris |

```
MFA core: Combine "different factors"!

✅ Correct MFA:  Password(knowledge) + OTP(possession)     = 2FA
✅ Correct MFA:  Fingerprint(biometric) + Security key(possession) = 2FA
❌ Wrong MFA:    Password(knowledge) + PIN(knowledge)       = Two same factors, meaningless!
```

#### MFA methods comparison

##### (1) TOTP (Time-based One-Time Password)

```
How it works:
1. Server and app share the same secret key
2. Secret key + current time → HMAC-SHA1 → 6-digit number
3. New code generated every 30 seconds
4. Server calculates the same and verifies match

Advantages: Works offline, just need app (Google Authenticator, Authy)
Disadvantages: Vulnerable to phishing (user can enter code in fake site)
```

##### (2) FIDO2 / WebAuthn — Best phishing prevention

```
How it works:
1. Registration: Security key generates public/private key pair
2. Public key registered on server, private key stored securely on key
3. Authentication: Server sends challenge (random data)
4. Security key signs challenge with private key
5. Server verifies signature with public key

Phishing prevention principle:
- Security key verifies the domain (origin)
- Key registered on google.com won't work on goo9le.com!
- User won't fall for phishing; security key rejects it!

Supported methods:
- External security keys: YubiKey, Google Titan
- Platform authenticators: Touch ID, Windows Hello, Face ID
- Passkeys: Consumer-friendly evolution of FIDO2 (passwordless future!)
```

##### MFA methods comparison table

| Method | Phishing prevention | Ease of use | Cost | Recommendation |
|------|----------|------------|------|----------|
| SMS OTP | Low (SIM swapping possible) | High | Low | Last resort |
| TOTP (app) | Medium | Medium | Free | Good |
| Push notification | Medium (MFA fatigue attack) | High | Medium | Good |
| FIDO2/WebAuthn | High | High | Medium-High | Best |
| Passkeys | High | Highest | Free | Next-gen standard |

---

### 7. Identity Provider (IdP) — Central authentication system

#### Why is IdP needed?

Implementing authentication/authorization directly in each service causes these problems:

```
❌ Without IdP (each service implements auth directly):
  - Separate user DBs per service
  - Different password policies
  - Different MFA implementation levels
  - Must delete offboarded user accounts from each service
  - Security vulnerabilities differ per service

✅ Using IdP (central auth + services delegate to IdP):
  - Single user DB
  - Consistent password/MFA policies
  - One update applies to all services
  - Offboard in IdP → immediately blocked everywhere
```

#### Major IdP comparison

| IdP | Type | Features | Best for |
|-----|------|------|------------|
| **Keycloak** | Open-source (Self-hosted) | Free, customizable, requires management | On-premise, cost savings |
| **Auth0** | SaaS (Managed) | Fast setup, rich SDKs, paid | SaaS services, quick launch |
| **Okta** | SaaS (Enterprise) | Enterprise-scale, thousands of apps, expensive | Large enterprises, regulated industries |
| **AWS Cognito** | AWS Managed | AWS integrated, serverless-friendly | AWS-based services |
| **Azure AD** | Microsoft Managed | Microsoft 365 integrated, hybrid | Microsoft ecosystem companies |

---

### 8. RBAC vs ABAC — Access control models

#### RBAC (Role-Based Access Control)

```
Principle: Grant permissions to roles, assign roles to users.

User → Role → Permissions

Example:
  Kim Developer    → [Developer role]  → read:code, write:code, create:branch
  Park Operations  → [Operator role]   → read:code, deploy:staging, view:logs
  Lee Administrator → [Admin role]     → * (all permissions)
```

```yaml
# Keycloak RBAC configuration example
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
Principle: Evaluate dynamic policies based on user/resource/environment "attributes".

Policy example:
  IF   user.department == "engineering"
  AND  user.clearance_level >= 3
  AND  resource.classification == "internal"
  AND  environment.time BETWEEN 09:00 AND 18:00
  AND  environment.ip IN company_network
  THEN ALLOW

→ Much finer-grained control than RBAC, but more complex!
```

#### RBAC vs ABAC comparison

| Item | RBAC | ABAC |
|------|------|------|
| **Based on** | Role | Attribute |
| **Complexity** | Low | High |
| **Flexibility** | Limited | Very flexible |
| **Management** | Manage roles only | Manage policies + attributes |
| **Best for** | Clear organizational structure | Fine-grained access control |
| **Example** | "Admins can do everything" | "Access office hours on company network only" |
| **Tools** | Keycloak, AWS IAM Role | OPA, AWS IAM Condition |

---

### 9. Zero Trust and authentication

```
Traditional security: "Perimeter model"
  → Trust if inside company network (firewall)
  → Free access to internal resources if VPN connected
  → Problem: Once breached, attacker moves freely inside (Lateral Movement)

Zero Trust: "Never trust, always verify model"
  → Always verify regardless of network location
  → Authenticate + authorize every request
  → Apply least privilege principle
  → Continuous trust evaluation
```

**Zero Trust authentication principles:**

```
1. Never Trust, Always Verify
   → Verify every access request each time

2. Least Privilege Access
   → Grant only minimum required permissions

3. Assume Breach
   → Design assuming already compromised

4. Continuous Verification
   → Keep re-evaluating trust during session
   → Example: Sudden access from different country? → Re-authenticate!
```

```mermaid
flowchart TB
    subgraph "Traditional security (Perimeter model)"
        FW["Firewall"] --> INSIDE["Internal network"]
        INSIDE --> S1["Service A"]
        INSIDE --> S2["Service B"]
        INSIDE --> S3["DB"]
        S1 <-->|"Free communication"| S2
        S2 <-->|"Free communication"| S3
    end

    subgraph "Zero Trust"
        REQ["All requests"] --> VERIFY["Authentication + Authorization<br/>+ Device verification<br/>+ Context evaluation"]
        VERIFY -->|"Allow"| ZS1["Service A"]
        VERIFY -->|"Allow"| ZS2["Service B"]
        VERIFY -->|"Allow"| ZS3["DB"]
        ZS1 ---|"mTLS + JWT"| ZS2
        ZS2 ---|"mTLS + JWT"| ZS3
    end

    style FW fill:#e74c3c,color:#fff
    style VERIFY fill:#27ae60,color:#fff
    style INSIDE fill:#f39c12,color:#fff
```

---

## 💻 Hands-on

### Practice 1: JWT decoding and verification understanding

```bash
# Decode JWT directly (base64url → JSON)

# Example JWT
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiLquYDqsJzrsJwiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAzNzA4MDAsImV4cCI6MTcxMDM3NDQwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

# Decode Header
echo $TOKEN | cut -d'.' -f1 | base64 -d 2>/dev/null
# → {"alg":"HS256","typ":"JWT"}

# Decode Payload
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null
# → {"sub":"user-123","name":"Kim Developer","role":"admin","iat":1710370800,"exp":1710374400}

# ⚠️ Important: Anyone can read Payload with just base64 decoding!
# JWT is not "encryption," it's "signature."
# → Never put sensitive data (passwords, etc.) in Payload!
```

### Practice 2: Configure OIDC with Keycloak

```yaml
# docker-compose.yml - Run Keycloak locally
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
# Run Keycloak
docker compose up -d

# 1. Access http://localhost:8080 in browser
# 2. Login with admin / admin
# 3. Create Realm: "my-company"
# 4. Create Client: "my-web-app"
```

```bash
# Keycloak configuration (can also use CLI)
# Create Realm
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

# Verify OIDC Discovery
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

### Practice 3: OAuth2 Client Credentials for service-to-service auth

```bash
# Create Client in Keycloak (Service Account)

# 1. Create Client (enable Client Credentials Grant)
# Keycloak Admin Console → Clients → Create
# - Client ID: backend-service
# - Client Authentication: ON
# - Service accounts roles: ON

# 2. Test token issuance
curl -s -X POST http://localhost:8080/realms/my-company/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=backend-service" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  | jq .

# Response:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6IC...",
#   "expires_in": 300,
#   "token_type": "Bearer",
#   "not-before-policy": 0,
#   "scope": "profile email"
# }

# 3. Verify issued token content
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

### Practice 4: JWT validation at Nginx

```nginx
# nginx.conf - Protect API with JWT validation
# (requires nginx-plus or njs module)

upstream api_backend {
    server app:3000;
}

# JWKS caching
proxy_cache_path /tmp/jwks_cache levels=1:2
    keys_zone=jwks:1m max_size=10m;

map $http_authorization $jwt_token {
    "~*^Bearer\s+(?<token>.+)$" $token;
    default "";
}

server {
    listen 80;
    server_name api.example.com;

    # Public endpoint (no auth required)
    location /health {
        proxy_pass http://api_backend;
    }

    location /auth/login {
        proxy_pass http://api_backend;
    }

    # Protected endpoint (JWT required)
    location /api/ {
        # Return 401 if no JWT
        if ($jwt_token = "") {
            return 401 '{"error": "Missing Authorization header"}';
        }

        # Verify JWT via app server or auth server
        # Use OIDC introspection endpoint
        auth_request /validate_token;
        auth_request_set $jwt_sub $upstream_http_x_jwt_sub;
        auth_request_set $jwt_role $upstream_http_x_jwt_role;

        # Pass verified user info to backend
        proxy_set_header X-User-ID $jwt_sub;
        proxy_set_header X-User-Role $jwt_role;
        proxy_pass http://api_backend;
    }

    # Internal token validation endpoint
    location = /validate_token {
        internal;
        proxy_pass http://keycloak:8080/realms/my-company/protocol/openid-connect/userinfo;
        proxy_set_header Authorization "Bearer $jwt_token";
        proxy_set_header Content-Length "";
        proxy_pass_request_body off;
    }
}
```

### Practice 5: Configure authentication with AWS Cognito

```bash
# Create AWS Cognito User Pool
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

# Create App Client
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

# Verify Cognito OIDC Discovery
curl -s https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_XXXXXXXXX/.well-known/openid-configuration | jq .

# Create user (admin mode)
aws cognito-idp admin-create-user \
    --user-pool-id ap-northeast-2_XXXXXXXXX \
    --username "developer@example.com" \
    --user-attributes Name=email,Value=developer@example.com Name=name,Value=Kim Developer \
    --temporary-password "TempPass123!"
```

---

## 🏢 In production

### Production authentication architecture patterns

#### Pattern 1: API Gateway + IdP central authentication

```mermaid
flowchart TB
    subgraph "Clients"
        WEB["Web App"]
        MOBILE["Mobile App"]
        SERVICE["External Service"]
    end

    subgraph "Authentication Layer"
        IDP["Identity Provider<br/>(Keycloak / Cognito)"]
        GW["API Gateway<br/>(Kong / AWS API GW)"]
    end

    subgraph "Microservices"
        SVC_A["Service A<br/>(Orders)"]
        SVC_B["Service B<br/>(Payments)"]
        SVC_C["Service C<br/>(Inventory)"]
    end

    WEB -->|"1. Login"| IDP
    MOBILE -->|"1. Login"| IDP
    IDP -->|"2. Issue JWT"| WEB
    IDP -->|"2. Issue JWT"| MOBILE

    WEB -->|"3. API request + JWT"| GW
    MOBILE -->|"3. API request + JWT"| GW
    SERVICE -->|"3. Client Credentials"| GW

    GW -->|"4. Verify JWT, route"| SVC_A
    GW -->|"4. Verify JWT, route"| SVC_B
    GW -->|"4. Verify JWT, route"| SVC_C

    SVC_A <-->|"Service-to-service: mTLS + JWT"| SVC_B
    SVC_B <-->|"Service-to-service: mTLS + JWT"| SVC_C

    style IDP fill:#3498db,color:#fff
    style GW fill:#e67e22,color:#fff
```

#### Pattern 2: Token management strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Lifetime Management                 │
├──────────────────┬──────────────────────────────────────────┤
│ Access Token     │ Lifetime: 5~15 minutes (short!)          │
│                  │ Storage: Memory (don't use localStorage!)  │
│                  │ Usage: Authorization header for API calls  │
├──────────────────┼──────────────────────────────────────────┤
│ Refresh Token    │ Lifetime: 7~30 days                       │
│                  │ Storage: HttpOnly + Secure + SameSite     │
│                  │ Usage: Reissue Access Token               │
│                  │ Rotation: Issue new Refresh Token on use  │
├──────────────────┼──────────────────────────────────────────┤
│ ID Token         │ Lifetime: Same as Access Token            │
│                  │ Usage: Display user info (frontend)       │
│                  │ Warning: Don't use for API calls!         │
└──────────────────┴──────────────────────────────────────────┘
```

#### Pattern 3: IdP selection guide by service

```
Decision tree:

Running on AWS?
├─ Yes → AWS-exclusive service?
│        ├─ Yes → AWS Cognito (native AWS integration)
│        └─ No  → Multi-cloud?
│                 ├─ Yes → Keycloak (vendor lock-in free)
│                 └─ No  → Auth0 (quick setup, managed)
└─ No  → On-premise?
         ├─ Yes → Keycloak (open-source, free)
         └─ No  → Enterprise scale?
                  ├─ Yes → Okta (large-scale, compliance)
                  └─ No  → Auth0 (SaaS, quick start)
```

#### Production tip: Link with alerting and monitoring

Connect with [Alerting systems](../08-observability/11-alerting) to monitor authentication anomalies.

```yaml
# Prometheus alert rules - Authentication monitoring
groups:
  - name: auth_alerts
    rules:
      # Login failure spike (Brute Force possibility)
      - alert: HighAuthFailureRate
        expr: |
          rate(auth_login_failures_total[5m]) > 50
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Login failure rate spike"
          description: "50+ login failures in 5min. Possible brute force attack."

      # Abnormal token issuance
      - alert: AbnormalTokenIssuance
        expr: |
          rate(oauth_tokens_issued_total[10m]) > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Abnormal token issuance detected"

      # MFA bypass attempt detection
      - alert: MFABypassAttempt
        expr: |
          rate(auth_mfa_bypass_attempts_total[5m]) > 0
        labels:
          severity: critical
        annotations:
          summary: "MFA bypass attempt detected!"
```

---

## ⚠️ Common mistakes

### Mistake 1: Storing JWT in localStorage

```
❌ Wrong approach:
  localStorage.setItem('access_token', token);
  → Token can be stolen by XSS attack!
  → JavaScript can freely access localStorage.

✅ Correct approach:
  - Access Token: Store in JavaScript variable (memory)
  - Refresh Token: Store in HttpOnly + Secure + SameSite=Strict cookie
  → XSS cannot access via JavaScript!
```

### Mistake 2: Storing sensitive data in JWT Payload

```
❌ Wrong approach:
{
    "sub": "user-123",
    "password": "mySecret123!",      ← Never!
    "ssn": "900101-1234567",         ← Personal info exposed!
    "credit_card": "4111-1111-..."    ← Card info exposed!
}
→ JWT Payload is Base64URL encoded, not encrypted!
→ Anyone can decode and read the content!

✅ Correct approach:
{
    "sub": "user-123",
    "role": "admin",
    "permissions": ["read", "write"]
}
→ Include only identifiers and permission info minimally.
→ Fetch sensitive data via separate API calls.
```

### Mistake 3: Setting Access Token lifetime too long

```
❌ Wrong approach:
  Access Token expiry: 24 hours or 7 days
  → If token is stolen, attacker can abuse it for long
  → JWT is stateless, hard to forcibly invalidate on server

✅ Correct approach:
  Access Token expiry: 5~15 minutes
  Refresh Token expiry: 7~30 days (with rotation)
  → Short Access Token + Refresh Token combo balances
  → Both security and user experience.
```

### Mistake 4: Omitting OAuth2 state parameter

```
❌ Wrong approach:
  GET /authorize?
      response_type=code
      &client_id=MY_APP
      &redirect_uri=https://myapp.com/callback
      → state parameter missing!
      → Vulnerable to CSRF attack!

✅ Correct approach:
  GET /authorize?
      response_type=code
      &client_id=MY_APP
      &redirect_uri=https://myapp.com/callback
      &state=RANDOM_UNGUESSABLE_STRING    ← Must include!
  → Verify state value matches in callback.
```

### Mistake 5: Allowing "none" algorithm

```
❌ Wrong approach:
  JWT library allows "alg": "none"
  → Attacker can create JWT without signature!

  Forged JWT Header:
  {"alg": "none", "typ": "JWT"}
  → Considers valid even with empty Signature!

✅ Correct approach:
  - Explicitly specify allowed algorithms in JWT library
  - Never allow "none" algorithm
  - Example: jwt.verify(token, key, { algorithms: ['RS256'] })
```

### Mistake 6: Skipping SAML Assertion signature verification

```
❌ Wrong approach:
  → "It's dev environment, skip signature verification..."
  → Attacker can forge SAML Assertion and login as admin!

✅ Correct approach:
  → Always verify signatures even in dev.
  → Register IdP certificate on SP and verify all Assertions.
  → Set up auto-renewal process for certificate expiry.
```

### Mistake 7: Using SMS OTP as only MFA

```
❌ Wrong approach:
  MFA = SMS OTP only
  → Vulnerable to SIM swapping attacks
  → NIST SP 800-63B classifies SMS OTP as "restricted"

✅ Correct approach:
  1st priority: FIDO2/WebAuthn (complete phishing prevention)
  2nd priority: TOTP app (Google Authenticator, Authy)
  3rd priority: Push notification (with Number Matching)
  Last resort: SMS OTP (only if nothing else available)
```

### Mistake checklist

```
Authentication/authorization security checklist before deployment:

□ JWT not stored in localStorage?
□ No sensitive data in JWT Payload?
□ Access Token expiry ≤15 minutes?
□ Refresh Token rotation applied?
□ OAuth2 requests include state parameter?
□ PKCE applied? (mandatory for SPA/mobile)
□ JWT verification specifies algorithm explicitly?
□ SAML Assertion signature verified?
□ MFA enabled? (FIDO2 > TOTP > SMS)
□ Token theft monitoring set up?
□ Offboarded user account immediate disabling process?
□ CORS configuration correct? (no wildcard * usage)
```

---

## 📝 Summary

### Key takeaways

```
1. Authentication vs Authorization
   → Authentication: "Who are you?", Authorization: "What can you do?"
   → Authentication first, authorization after

2. OAuth2 is authorization framework
   → Authorization Code + PKCE is current standard
   → Client Credentials for service-to-service communication
   → Implicit, Password Grant are deprecated!

3. OIDC is OAuth2 + authentication
   → ID Token (JWT) carries user information
   → Discovery endpoint enables auto-configuration
   → Foundation for social login

4. SAML is enterprise SSO standard
   → XML-based, legacy but active
   → For new projects, OIDC is recommended

5. JWT is token format
   → Header.Payload.Signature structure
   → Signature, not encryption! (don't put sensitive data)
   → Stateless verification (no DB lookup)

6. SSO is one login for multiple services
   → Implemented with SAML or OIDC
   → Central management for security + convenience

7. MFA is authentication security baseline
   → FIDO2/WebAuthn > TOTP > Push > SMS
   → Combine "different factors"

8. IdP is server managing authentication centrally
   → Don't implement yourself! Use IdP.
   → Keycloak (open-source), Auth0 (SaaS), Cognito (AWS)

9. RBAC vs ABAC
   → RBAC: Role-based, simple and intuitive
   → ABAC: Attribute-based, fine-grained but complex

10. Zero Trust is "always verify"
    → Verify all requests regardless of network location
    → Least privilege + continuous verification core
```

### Quick technology selection guide

```
┌──────────────────────────┬─────────────────────────────┐
│ Situation                │ Recommended technology      │
├──────────────────────────┼─────────────────────────────┤
│ Web app social login     │ OIDC + Authorization Code   │
│ SPA / Mobile app         │ OIDC + PKCE                 │
│ Service-to-service comms │ OAuth2 Client Credentials   │
│ Enterprise internal SSO  │ SAML 2.0 or OIDC            │
│ API authentication       │ JWT (RS256 signature)       │
│ Phishing-prevention MFA  │ FIDO2 / WebAuthn            │
│ Open-source IdP          │ Keycloak                    │
│ AWS-native auth          │ AWS Cognito                 │
│ Fine-grained access      │ ABAC (OPA)                  │
│ Simple role management   │ RBAC                        │
│ Zero Trust implementation│ mTLS + JWT + ABAC           │
└──────────────────────────┴─────────────────────────────┘
```

---

## 🔗 Next steps

### Topics worth learning next

| Order | Topic | Description |
|------|------|------|
| **Next lecture** | [Secrets Management](./02-secrets) | Safely manage secrets with Vault, AWS Secrets Manager |
| **Related lecture** | [AWS IAM](../05-cloud-aws/01-iam) | Hands-on AWS authentication/authorization (IAM Role, Policy, Identity Center) |
| **Related lecture** | [Alerting](../08-observability/11-alerting) | Monitor and alert on authentication anomalies |
| **Advanced** | Kubernetes RBAC | Role-based access control in K8s |
| **Advanced** | Service Mesh Security | Service-to-service authentication with Istio mTLS |

### Recommended learning resources

```
Official documentation:
  - OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
  - OIDC Core: https://openid.net/specs/openid-connect-core-1_0.html
  - JWT RFC 7519: https://tools.ietf.org/html/rfc7519
  - FIDO2/WebAuthn: https://webauthn.guide

Hands-on practice:
  - JWT debugger: https://jwt.io
  - OAuth 2.0 Playground: https://oauth.com/playground
  - Keycloak official docs: https://www.keycloak.org/documentation

Security guides:
  - OWASP Authentication Cheat Sheet
  - NIST SP 800-63B (Digital Identity Guidelines)
  - OAuth 2.0 Security Best Current Practice (RFC 9700)
```
