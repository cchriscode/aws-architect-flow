# 테스트 자동화 전체 가이드

> 코드를 작성하고 "잘 돌아가겠지?"라고 기도하던 시대는 끝났어요. 테스트 자동화는 소프트웨어가 의도대로 동작하는지 **기계가 자동으로 검증**하는 체계예요. 단위 테스트부터 E2E 테스트까지, TDD부터 성능/보안 테스트까지 — 테스트 전략의 모든 것을 다뤄볼게요. [CI 파이프라인](./03-ci-pipeline)에서 "자동화된 검증"이 중요하다고 배웠죠? 이번에는 그 검증의 **내용물**을 깊이 파헤쳐봐요.

---

## 🎯 왜 테스트 자동화를 알아야 하나요?

### 일상 비유: 건물의 안전 점검 체계

아파트 건설 현장을 떠올려보세요.

- **벽돌 하나하나** → 강도 테스트 (단위 테스트)
- **벽 전체가 서 있는지** → 구조 테스트 (통합 테스트)
- **사람이 실제로 살아보기** → 입주 테스트 (E2E 테스트)
- **지진이 나도 버티는지** → 내진 설계 테스트 (성능/부하 테스트)
- **도둑이 못 들어오는지** → 보안 점검 (보안 테스트)

벽돌 하나가 부서지는 건 바로 교체하면 돼요. 그런데 건물이 다 올라간 뒤에 기초가 약한 걸 발견하면? **전부 허물고 다시 지어야 해요.** 테스트도 마찬가지예요. **빨리, 자주, 자동으로** 검증할수록 비용이 줄어요.

```
실무에서 테스트 자동화가 필요한 순간:

• "수정했는데 다른 기능이 깨졌어요"               → 회귀(regression) 테스트 부재
• 배포할 때마다 QA팀이 3일 동안 수동 테스트        → 자동화 안 된 검증
• "이 함수가 뭘 하는지 모르겠어요"                → 테스트가 곧 문서
• 새 개발자가 코드를 고칠 때 무서워서 못 건드림      → 안전망 부재
• 프로덕션에서 성능 이슈가 터짐                    → 성능 테스트 미실시
• 보안 취약점이 뒤늦게 발견됨                     → 보안 테스트 미적용
• CI 파이프라인에서 테스트가 30분 걸림              → 테스트 최적화 필요
```

### 테스트 없는 팀 vs 테스트 있는 팀

```mermaid
flowchart TD
    subgraph "❌ 테스트 없는 팀"
        CODE_A["기능 개발 완료"] -->|"수동 확인"| MANUAL["개발자가 직접<br/>브라우저 클릭"]
        MANUAL -->|"이상 없는 듯?"| DEPLOY_BAD["프로덕션 배포"]
        DEPLOY_BAD --> BUG["💥 버그 발견!<br/>고객 신고"]
        BUG -->|"원인 추적<br/>반나절 소요"| HOTFIX["긴급 핫픽스"]
        HOTFIX -->|"또 수동 확인"| MANUAL
    end

    subgraph "✅ 테스트 있는 팀"
        CODE_B["기능 개발 완료"] -->|"git push"| AUTO["자동 테스트<br/>5분 실행"]
        AUTO -->|"✅ 전부 통과"| DEPLOY_GOOD["안전한 배포"]
        AUTO -->|"❌ 실패"| FIX["즉시 수정<br/>정확한 위치 알려줌"]
        FIX -->|"다시 push"| AUTO
    end

    style BUG fill:#e74c3c,color:#fff
    style DEPLOY_GOOD fill:#27ae60,color:#fff
    style AUTO fill:#3498db,color:#fff
    style HOTFIX fill:#f39c12,color:#fff
```

### 테스트 자동화의 ROI

```
테스트 자동화 투자 대비 효과:

초기 투자    ████████████████        테스트 코드 작성 시간
1개월 후     ████████████            수동 테스트 시간 절약 시작
3개월 후     ████████                버그 수정 비용 감소
6개월 후     ████                    개발 속도 향상 (자신감 있는 리팩토링)
1년 후       ██                      팀 전체 생산성 향상

→ 처음엔 느려 보이지만, 장기적으로 확실한 투자예요
```

---

## 🧠 핵심 개념 잡기

### 1. 테스트 피라미드 (Test Pyramid)

> **비유**: 건물의 구조 — 넓은 기초(단위), 중간 구조(통합), 꼭대기 장식(E2E)

Martin Fowler가 소개한 개념으로, 테스트의 종류별 **비율**을 피라미드 형태로 표현한 거예요. 아래쪽일수록 많이, 위쪽일수록 적게 작성해요.

### 2. 단위 테스트 (Unit Test)

> **비유**: 레고 블록 하나하나가 규격에 맞는지 확인하기

함수나 클래스 같은 **가장 작은 단위**를 독립적으로 테스트해요. 외부 의존성 없이, 빠르게, 수백 개를 돌릴 수 있어요.

### 3. 통합 테스트 (Integration Test)

> **비유**: 레고 블록 여러 개를 끼워서 잘 맞물리는지 확인하기

여러 모듈이 **함께 동작**할 때 문제가 없는지 확인해요. DB 연결, API 호출, 메시지 큐 등 실제 외부 시스템과의 상호작용을 검증해요.

### 4. E2E 테스트 (End-to-End Test)

> **비유**: 완성된 레고 세트로 실제 놀아보기

실제 사용자의 관점에서 **전체 시스템**을 처음부터 끝까지 테스트해요. 브라우저를 열고 클릭하고 입력하고 결과를 확인하는 전체 흐름이에요.

### 5. TDD (Test-Driven Development)

> **비유**: 정답지를 먼저 만들고 시험 문제를 푸는 것

테스트를 **먼저** 작성하고, 그 테스트를 통과하는 코드를 **나중에** 작성하는 개발 방법론이에요.

### 6. 코드 커버리지 (Code Coverage)

> **비유**: 시험 범위 중 몇 %를 공부했는지 측정하기

전체 코드 중 테스트가 **실행한 비율**을 수치로 나타낸 거예요. 100%가 만능은 아니지만, 낮으면 위험 신호예요.

### 7. 테스트 더블 (Test Double)

> **비유**: 영화에서 위험한 장면을 대신하는 스턴트 배우

실제 의존성(DB, API, 외부 서비스) 대신 **가짜 객체**를 사용해서 테스트를 빠르고 안정적으로 만드는 기법이에요.

### 8. Flaky Test

> **비유**: 날씨에 따라 결과가 달라지는 불안정한 시험

같은 코드인데 **실행할 때마다 결과가 달라지는** 불안정한 테스트예요. CI의 신뢰도를 떨어뜨리는 주범이에요.

---

## 🔍 하나씩 자세히 알아보기

### 1. 테스트 피라미드 깊이 파기

테스트 피라미드는 테스트 전략의 **뼈대**예요. 각 레벨의 특성을 이해하면 어떤 테스트를 얼마나 작성해야 하는지 판단할 수 있어요.

```mermaid
graph TB
    subgraph pyramid["테스트 피라미드"]
        E2E["🔺 E2E 테스트<br/>5~10%<br/>느림 | 비쌈 | 불안정"]
        INT["🔶 통합 테스트<br/>20~30%<br/>보통 | 보통 | 보통"]
        UNIT["🟩 단위 테스트<br/>60~70%<br/>빠름 | 저렴 | 안정"]
    end

    E2E --- INT
    INT --- UNIT

    SPEED["⚡ 실행 속도"] -.->|"빨라짐"| UNIT
    COST["💰 유지 비용"] -.->|"저렴해짐"| UNIT
    CONFIDENCE["🛡️ 사용자 신뢰도"] -.->|"높아짐"| E2E

    style E2E fill:#e74c3c,color:#fff
    style INT fill:#f39c12,color:#fff
    style UNIT fill:#27ae60,color:#fff
```

각 레벨 비교:

```
┌──────────────┬───────────┬──────────┬────────────┬──────────────┐
│ 구분          │ 단위 테스트 │ 통합 테스트 │ E2E 테스트  │ 수동 테스트    │
├──────────────┼───────────┼──────────┼────────────┼──────────────┤
│ 실행 속도     │ ms 단위    │ 초 단위   │ 분 단위     │ 시간 ~ 일     │
│ 실행 비용     │ 거의 없음   │ 낮음     │ 높음        │ 매우 높음      │
│ 안정성        │ 매우 안정   │ 안정     │ 불안정      │ 가변적        │
│ 유지보수 비용  │ 낮음      │ 보통      │ 높음        │ 매우 높음      │
│ 피드백 속도    │ 즉시      │ 빠름      │ 느림        │ 매우 느림      │
│ 실제 환경 반영 │ 낮음      │ 보통      │ 높음        │ 가장 높음      │
│ 권장 비율     │ 60-70%   │ 20-30%   │ 5-10%      │ 최소화        │
└──────────────┴───────────┴──────────┴────────────┴──────────────┘
```

#### 피라미드의 반대 — 아이스크림 콘 안티패턴

```
❌ 아이스크림 콘 안티패턴 (피해야 할 형태)
─────────────────────────────────────────
       ████████████████████████  수동 테스트 (대부분)
          ████████████████       E2E 테스트 (많음)
             ████████            통합 테스트 (적음)
               ████              단위 테스트 (거의 없음)

→ 느리고, 비싸고, 불안정한 테스트에 의존
→ 피드백이 느려서 개발 속도 저하
→ 결국 "테스트는 시간 낭비"라는 잘못된 결론에 도달

✅ 올바른 테스트 피라미드
─────────────────────────────────────────
               ████              E2E 테스트 (적음)
            ████████             통합 테스트 (보통)
       ████████████████████      단위 테스트 (많음)

→ 빠르고, 저렴하고, 안정적인 테스트가 기반
→ 빠른 피드백으로 개발 속도 향상
```

### 2. 단위 테스트 상세

단위 테스트는 **함수 하나, 메서드 하나**를 고립시켜서 테스트해요. 외부 의존성은 모두 테스트 더블로 대체해요.

#### 좋은 단위 테스트의 FIRST 원칙

```
F — Fast (빠름)        : 수천 개가 몇 초 안에 끝나야 해요
I — Independent (독립)  : 테스트 간 순서나 상태에 의존하면 안 돼요
R — Repeatable (반복)   : 어디서든 같은 결과가 나와야 해요
S — Self-validating     : 통과/실패가 자동으로 판정돼야 해요
T — Timely (적시)       : 프로덕션 코드와 함께 작성해야 해요
```

#### AAA 패턴 (Arrange-Act-Assert)

```
모든 단위 테스트는 3단계로 구성해요:

1. Arrange (준비)  — 테스트에 필요한 데이터와 환경 설정
2. Act (실행)      — 테스트 대상 코드 실행
3. Assert (검증)   — 결과가 기대와 일치하는지 확인
```

#### Jest (JavaScript/TypeScript)

```javascript
// calculator.js
export function add(a, b) {
  return a + b;
}

export function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}

export function calculateDiscount(price, discountPercent) {
  if (price < 0) throw new Error('Price cannot be negative');
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  return price * (1 - discountPercent / 100);
}
```

```javascript
// calculator.test.js
import { add, divide, calculateDiscount } from './calculator';

describe('Calculator', () => {
  // --- add 함수 테스트 ---
  describe('add', () => {
    test('두 양수를 더하면 합을 반환해요', () => {
      // Arrange
      const a = 2, b = 3;
      // Act
      const result = add(a, b);
      // Assert
      expect(result).toBe(5);
    });

    test('음수와 양수를 더할 수 있어요', () => {
      expect(add(-1, 1)).toBe(0);
    });

    test('소수점 계산도 정확해요', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  // --- divide 함수 테스트 ---
  describe('divide', () => {
    test('정상적인 나눗셈을 수행해요', () => {
      expect(divide(10, 2)).toBe(5);
    });

    test('0으로 나누면 에러가 발생해요', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });
  });

  // --- calculateDiscount 함수 테스트 ---
  describe('calculateDiscount', () => {
    test('10% 할인을 정확히 계산해요', () => {
      expect(calculateDiscount(10000, 10)).toBe(9000);
    });

    test('0% 할인이면 원래 가격 그대로예요', () => {
      expect(calculateDiscount(10000, 0)).toBe(10000);
    });

    test('100% 할인이면 0원이에요', () => {
      expect(calculateDiscount(10000, 100)).toBe(0);
    });

    test('음수 가격이면 에러가 발생해요', () => {
      expect(() => calculateDiscount(-100, 10)).toThrow('Price cannot be negative');
    });

    test('할인율이 범위를 벗어나면 에러가 발생해요', () => {
      expect(() => calculateDiscount(10000, 150)).toThrow(
        'Discount must be between 0 and 100'
      );
    });
  });
});
```

#### pytest (Python)

```python
# order_service.py
from dataclasses import dataclass
from typing import List

@dataclass
class OrderItem:
    name: str
    price: float
    quantity: int

class OrderService:
    def calculate_total(self, items: List[OrderItem]) -> float:
        """주문 총액 계산"""
        if not items:
            raise ValueError("주문 항목이 비어있습니다")
        total = sum(item.price * item.quantity for item in items)
        return round(total, 2)

    def apply_discount(self, total: float, discount_code: str) -> float:
        """할인 코드 적용"""
        discounts = {
            "WELCOME10": 0.10,
            "VIP20": 0.20,
            "SPECIAL30": 0.30,
        }
        if discount_code not in discounts:
            raise ValueError(f"유효하지 않은 할인 코드: {discount_code}")
        discount_rate = discounts[discount_code]
        return round(total * (1 - discount_rate), 2)
```

```python
# test_order_service.py
import pytest
from order_service import OrderService, OrderItem

class TestOrderService:
    """OrderService 단위 테스트"""

    def setup_method(self):
        """각 테스트 전에 실행 (Arrange 공통부분)"""
        self.service = OrderService()

    # --- calculate_total 테스트 ---
    def test_단일_항목_총액_계산(self):
        items = [OrderItem("커피", 4500, 2)]
        assert self.service.calculate_total(items) == 9000

    def test_다중_항목_총액_계산(self):
        items = [
            OrderItem("커피", 4500, 2),
            OrderItem("케이크", 6000, 1),
        ]
        assert self.service.calculate_total(items) == 15000

    def test_빈_주문은_에러_발생(self):
        with pytest.raises(ValueError, match="주문 항목이 비어있습니다"):
            self.service.calculate_total([])

    # --- apply_discount 테스트 ---
    def test_10퍼센트_할인_적용(self):
        assert self.service.apply_discount(10000, "WELCOME10") == 9000

    def test_유효하지_않은_할인_코드(self):
        with pytest.raises(ValueError, match="유효하지 않은 할인 코드"):
            self.service.apply_discount(10000, "INVALID")

    # 파라미터화 테스트 — 여러 케이스를 한 번에
    @pytest.mark.parametrize("code,rate,expected", [
        ("WELCOME10", 0.10, 9000),
        ("VIP20", 0.20, 8000),
        ("SPECIAL30", 0.30, 7000),
    ])
    def test_각_할인_코드별_정확한_할인(self, code, rate, expected):
        assert self.service.apply_discount(10000, code) == expected
```

#### JUnit 5 (Java)

```java
// UserValidatorTest.java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class UserValidatorTest {

    private UserValidator validator;

    @BeforeEach
    void setUp() {
        validator = new UserValidator();
    }

    @Test
    @DisplayName("유효한 이메일은 통과해야 한다")
    void validEmail_shouldPass() {
        assertTrue(validator.isValidEmail("user@example.com"));
    }

    @ParameterizedTest
    @DisplayName("유효하지 않은 이메일은 거부해야 한다")
    @ValueSource(strings = {"", "invalid", "user@", "@domain.com", "user @domain.com"})
    void invalidEmail_shouldFail(String email) {
        assertFalse(validator.isValidEmail(email));
    }

    @Test
    @DisplayName("비밀번호가 8자 미만이면 예외 발생")
    void shortPassword_shouldThrowException() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validator.validatePassword("1234567")
        );
        assertEquals("비밀번호는 8자 이상이어야 합니다", exception.getMessage());
    }
}
```

### 3. 테스트 더블 (Test Double) 상세

실제 의존성을 대체하는 가짜 객체들이에요. 종류별로 용도가 달라요.

```mermaid
graph LR
    TD["테스트 더블<br/>(Test Double)"]

    TD --> DUMMY["Dummy<br/>전달만 되고<br/>사용 안 됨"]
    TD --> STUB["Stub<br/>미리 정해진<br/>값을 반환"]
    TD --> SPY["Spy<br/>호출 기록을<br/>저장"]
    TD --> MOCK["Mock<br/>호출 여부를<br/>검증"]
    TD --> FAKE["Fake<br/>간단한 구현<br/>(인메모리 DB 등)"]

    DUMMY ~~~ DETAIL_D["인자 채우기용<br/>null 객체 등"]
    STUB ~~~ DETAIL_S["'항상 true 반환'<br/>'항상 5000원 반환'"]
    SPY ~~~ DETAIL_SP["'sendEmail이<br/>3번 호출됐는지'"]
    MOCK ~~~ DETAIL_M["'save가 올바른<br/>인자로 호출됐는지'"]
    FAKE ~~~ DETAIL_F["HashMap으로<br/>만든 가짜 DB"]

    style TD fill:#3498db,color:#fff
    style DUMMY fill:#ecf0f1,color:#333
    style STUB fill:#ecf0f1,color:#333
    style SPY fill:#ecf0f1,color:#333
    style MOCK fill:#ecf0f1,color:#333
    style FAKE fill:#ecf0f1,color:#333
```

#### 테스트 더블 사용 예시 (Jest)

```javascript
// userService.js
export class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async registerUser(name, email) {
    // 1. 이메일 중복 확인
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('이미 존재하는 이메일입니다');
    }

    // 2. 사용자 저장
    const user = await this.userRepository.save({ name, email });

    // 3. 환영 이메일 발송
    await this.emailService.sendWelcomeEmail(email, name);

    return user;
  }
}
```

```javascript
// userService.test.js
import { UserService } from './userService';

describe('UserService', () => {
  let userService;
  let mockUserRepository;  // Mock — 호출 검증
  let mockEmailService;    // Spy — 호출 기록 확인

  beforeEach(() => {
    // Stub + Mock: 미리 정해진 동작을 하면서 호출도 검증
    mockUserRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),  // Stub: null 반환
      save: jest.fn().mockImplementation((user) =>     // Stub: 저장된 것처럼
        Promise.resolve({ id: 1, ...user })
      ),
    };

    // Spy: 호출 여부 기록
    mockEmailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    };

    userService = new UserService(mockUserRepository, mockEmailService);
  });

  test('새 사용자를 등록하면 저장하고 이메일을 보내요', async () => {
    // Act
    const user = await userService.registerUser('홍길동', 'hong@example.com');

    // Assert — 반환값 확인
    expect(user).toEqual({ id: 1, name: '홍길동', email: 'hong@example.com' });

    // Assert — Mock 검증: 올바른 인자로 호출됐는지
    expect(mockUserRepository.save).toHaveBeenCalledWith({
      name: '홍길동',
      email: 'hong@example.com',
    });

    // Assert — Spy 검증: 이메일이 발송됐는지
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      'hong@example.com',
      '홍길동'
    );
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });

  test('중복 이메일이면 에러가 발생하고 저장/이메일 안 해요', async () => {
    // Arrange — 이미 존재하는 사용자가 있도록 Stub 변경
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 99, name: '기존사용자', email: 'hong@example.com'
    });

    // Act & Assert
    await expect(
      userService.registerUser('홍길동', 'hong@example.com')
    ).rejects.toThrow('이미 존재하는 이메일입니다');

    // Mock 검증: save와 sendEmail이 호출되지 않았는지
    expect(mockUserRepository.save).not.toHaveBeenCalled();
    expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
```

#### 테스트 더블 사용 예시 (pytest)

```python
# test_user_service.py
from unittest.mock import Mock, AsyncMock, patch
import pytest

class TestUserService:
    def setup_method(self):
        self.mock_repo = Mock()
        self.mock_email = Mock()
        self.service = UserService(self.mock_repo, self.mock_email)

    def test_새_사용자_등록_성공(self):
        # Arrange — Stub 설정
        self.mock_repo.find_by_email.return_value = None
        self.mock_repo.save.return_value = {"id": 1, "name": "홍길동"}

        # Act
        result = self.service.register_user("홍길동", "hong@example.com")

        # Assert — 반환값
        assert result["name"] == "홍길동"

        # Assert — Mock 호출 검증
        self.mock_repo.save.assert_called_once()
        self.mock_email.send_welcome_email.assert_called_once_with(
            "hong@example.com", "홍길동"
        )

    def test_중복_이메일_등록_실패(self):
        # Arrange — 기존 사용자 존재
        self.mock_repo.find_by_email.return_value = {"id": 99}

        # Act & Assert
        with pytest.raises(ValueError, match="이미 존재"):
            self.service.register_user("홍길동", "hong@example.com")

        # save가 호출되지 않았는지 검증
        self.mock_repo.save.assert_not_called()
```

### 4. TDD (Test-Driven Development)

TDD는 **Red-Green-Refactor** 3단계 사이클로 진행해요.

```mermaid
graph LR
    RED["🔴 Red<br/>실패하는 테스트<br/>먼저 작성"]
    GREEN["🟢 Green<br/>테스트를 통과하는<br/>최소한의 코드 작성"]
    REFACTOR["🔵 Refactor<br/>코드 개선<br/>(테스트는 통과 유지)"]

    RED -->|"테스트 실행 → 실패"| GREEN
    GREEN -->|"테스트 실행 → 성공"| REFACTOR
    REFACTOR -->|"다음 기능"| RED

    style RED fill:#e74c3c,color:#fff
    style GREEN fill:#27ae60,color:#fff
    style REFACTOR fill:#3498db,color:#fff
```

#### TDD 실전 예시: 비밀번호 검증기 만들기

**Step 1 — Red: 실패하는 테스트 작성**

```python
# test_password_validator.py
from password_validator import PasswordValidator

def test_8자_미만은_거부():
    validator = PasswordValidator()
    assert validator.validate("1234567") == False

def test_8자_이상은_통과():
    validator = PasswordValidator()
    assert validator.validate("12345678") == True
```

```bash
# 실행하면 당연히 실패해요 (파일이 없으니까!)
$ pytest test_password_validator.py
# ModuleNotFoundError: No module named 'password_validator'
```

**Step 2 — Green: 최소한의 코드로 통과시키기**

```python
# password_validator.py
class PasswordValidator:
    def validate(self, password: str) -> bool:
        return len(password) >= 8
```

```bash
$ pytest test_password_validator.py
# 2 passed ✅
```

**Step 3 — Refactor: 더 많은 규칙 추가 (새 Red-Green-Refactor 사이클)**

```python
# test_password_validator.py — 새 규칙 추가
def test_대문자_없으면_거부():
    validator = PasswordValidator()
    assert validator.validate("abcdefgh") == False  # 🔴 Red!

def test_대문자_포함하면_통과():
    validator = PasswordValidator()
    assert validator.validate("Abcdefgh") == True
```

```python
# password_validator.py — Green 만들기
class PasswordValidator:
    def validate(self, password: str) -> bool:
        if len(password) < 8:
            return False
        if not any(c.isupper() for c in password):
            return False
        return True
```

```python
# password_validator.py — Refactor: 규칙을 확장 가능한 구조로
class PasswordValidator:
    def __init__(self):
        self.rules = [
            (lambda p: len(p) >= 8, "8자 이상이어야 합니다"),
            (lambda p: any(c.isupper() for c in p), "대문자가 포함되어야 합니다"),
            (lambda p: any(c.isdigit() for c in p), "숫자가 포함되어야 합니다"),
            (lambda p: any(c in "!@#$%^&*" for c in p), "특수문자가 포함되어야 합니다"),
        ]

    def validate(self, password: str) -> bool:
        return all(rule(password) for rule, _ in self.rules)

    def get_errors(self, password: str) -> list:
        return [msg for rule, msg in self.rules if not rule(password)]
```

### 5. BDD (Behavior-Driven Development)

BDD는 TDD를 확장한 개념으로, **비즈니스 관점**에서 기대 동작을 기술해요. "Given-When-Then" 형식으로 시나리오를 작성해요.

```
Feature: 사용자 로그인

  Scenario: 올바른 자격증명으로 로그인
    Given 등록된 사용자가 있을 때
      | email              | password   |
      | user@example.com   | Pass1234!  |
    When 올바른 이메일과 비밀번호로 로그인하면
    Then 로그인에 성공하고
    And 대시보드 페이지로 이동해요

  Scenario: 잘못된 비밀번호로 로그인 시도
    Given 등록된 사용자가 있을 때
    When 잘못된 비밀번호로 로그인하면
    Then "비밀번호가 올바르지 않습니다" 에러 메시지가 표시돼요
    And 로그인 시도 횟수가 1 증가해요
```

### 6. 통합 테스트 상세

통합 테스트는 여러 모듈이 **실제로 함께 동작**하는지 확인해요. Testcontainers를 사용하면 Docker 컨테이너로 실제 DB, Redis, Kafka 등을 띄워서 테스트할 수 있어요.

#### Testcontainers (Python)

```python
# test_user_repository_integration.py
import pytest
from testcontainers.postgres import PostgresContainer
import psycopg2

@pytest.fixture(scope="module")
def postgres():
    """테스트용 PostgreSQL 컨테이너를 띄워요"""
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres

@pytest.fixture
def db_connection(postgres):
    """DB 연결을 설정하고 스키마를 생성해요"""
    conn = psycopg2.connect(postgres.get_connection_url())
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL
        )
    """)
    conn.commit()
    yield conn
    conn.rollback()  # 테스트 후 정리
    conn.close()

class TestUserRepositoryIntegration:
    """실제 PostgreSQL과의 통합 테스트"""

    def test_사용자_저장_및_조회(self, db_connection):
        cursor = db_connection.cursor()

        # 저장
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id",
            ("홍길동", "hong@example.com")
        )
        user_id = cursor.fetchone()[0]
        db_connection.commit()

        # 조회
        cursor.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()

        assert result[0] == "홍길동"
        assert result[1] == "hong@example.com"

    def test_중복_이메일은_에러(self, db_connection):
        cursor = db_connection.cursor()
        cursor.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s)",
            ("사용자1", "dup@example.com")
        )
        db_connection.commit()

        with pytest.raises(psycopg2.errors.UniqueViolation):
            cursor.execute(
                "INSERT INTO users (name, email) VALUES (%s, %s)",
                ("사용자2", "dup@example.com")
            )
```

#### Testcontainers (Java/Spring Boot)

```java
// UserRepositoryIntegrationTest.java
@SpringBootTest
@Testcontainers
class UserRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("사용자를 저장하고 이메일로 조회할 수 있다")
    void saveAndFindByEmail() {
        // Arrange
        User user = new User("홍길동", "hong@example.com");

        // Act
        userRepository.save(user);
        Optional<User> found = userRepository.findByEmail("hong@example.com");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("홍길동");
    }
}
```

### 7. E2E 테스트 상세

E2E 테스트는 실제 사용자의 행동을 시뮬레이션해요. 브라우저를 자동으로 조작하면서 전체 흐름을 검증해요.

#### E2E 도구 비교: Playwright vs Cypress vs Selenium

```
┌────────────┬──────────────┬──────────────┬──────────────┐
│ 항목        │ Playwright   │ Cypress      │ Selenium     │
├────────────┼──────────────┼──────────────┼──────────────┤
│ 언어 지원   │ JS/TS/Python │ JS/TS        │ Java/Python  │
│            │ /Java/C#     │              │ /JS/C#/Ruby  │
│ 브라우저    │ Chromium,    │ Chrome,      │ 거의 모든    │
│            │ Firefox,     │ Firefox,     │ 브라우저     │
│            │ WebKit       │ Edge         │              │
│ 속도       │ 빠름          │ 빠름         │ 보통~느림     │
│ 안정성     │ 높음          │ 높음          │ 보통         │
│ API 인터셉트│ 내장         │ 내장          │ 별도 필요    │
│ 병렬 실행   │ 내장         │ 유료(Cloud)   │ Selenium Grid│
│ 추천 용도   │ 범용 E2E     │ 프론트엔드    │ 레거시/크로스 │
│            │ (1순위 추천)  │ 중심 테스트   │ 브라우저 필수 │
└────────────┴──────────────┴──────────────┴──────────────┘
```

#### Playwright (권장 — 현대적, 안정적)

```javascript
// login.spec.js (Playwright)
import { test, expect } from '@playwright/test';

test.describe('로그인 기능', () => {
  test('올바른 자격증명으로 로그인', async ({ page }) => {
    // 1. 로그인 페이지로 이동
    await page.goto('/login');

    // 2. 이메일과 비밀번호 입력
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');

    // 3. 로그인 버튼 클릭
    await page.click('[data-testid="login-button"]');

    // 4. 대시보드로 이동했는지 확인
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]'))
      .toHaveText('안녕하세요, user님');
  });

  test('잘못된 비밀번호로 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpass');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="error-message"]'))
      .toHaveText('비밀번호가 올바르지 않습니다');
    await expect(page).toHaveURL('/login');  // 페이지 안 바뀜
  });

  test('네트워크 오류 시 안내 메시지 표시', async ({ page }) => {
    // API 응답을 가로채서 네트워크 오류 시뮬레이션
    await page.route('**/api/auth/login', (route) =>
      route.abort('connectionrefused')
    );

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]'))
      .toHaveText('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  });
});
```

#### Cypress

```javascript
// login.cy.js (Cypress)
describe('로그인 기능', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('올바른 자격증명으로 로그인 성공', () => {
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('SecurePass123!');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]')
      .should('contain', '안녕하세요');
  });

  it('API 응답을 Stub하여 테스트 속도 향상', () => {
    // API 응답을 가짜로 대체 (Stub)
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: { name: 'user' } },
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="password-input"]').type('SecurePass123!');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });
});
```

### 8. 성능 테스트

성능 테스트는 시스템이 **부하 상황**에서도 정상 동작하는지 확인해요.

#### k6 (현대적, 개발자 친화적)

```javascript
// load-test.js (k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // 부하 시나리오 정의
  stages: [
    { duration: '1m', target: 50 },    // 1분간 50명까지 증가 (Ramp-up)
    { duration: '3m', target: 50 },    // 3분간 50명 유지 (Steady)
    { duration: '1m', target: 200 },   // 1분간 200명까지 증가 (Spike)
    { duration: '2m', target: 200 },   // 2분간 200명 유지
    { duration: '1m', target: 0 },     // 1분간 0명으로 감소 (Ramp-down)
  ],
  // 성능 기준 (SLO)
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% 요청이 500ms 이내
    http_req_failed: ['rate<0.01'],     // 실패율 1% 미만
    http_reqs: ['rate>100'],            // 초당 100건 이상 처리
  },
};

export default function () {
  // 시나리오 1: API 목록 조회
  const listRes = http.get('https://api.example.com/products');
  check(listRes, {
    '상태코드 200': (r) => r.status === 200,
    '응답 시간 500ms 이내': (r) => r.timings.duration < 500,
    '상품 목록이 비어있지 않음': (r) => JSON.parse(r.body).length > 0,
  });

  sleep(1);  // 사용자 생각 시간 (Think time)

  // 시나리오 2: 상세 조회
  const detailRes = http.get('https://api.example.com/products/1');
  check(detailRes, {
    '상태코드 200': (r) => r.status === 200,
    '응답 시간 300ms 이내': (r) => r.timings.duration < 300,
  });

  sleep(0.5);
}
```

#### Locust (Python 기반)

```python
# locustfile.py
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)  # 요청 간 1~3초 대기

    @task(3)  # 가중치 3 — 더 자주 실행
    def view_products(self):
        self.client.get("/api/products")

    @task(1)  # 가중치 1
    def view_product_detail(self):
        self.client.get("/api/products/1")

    def on_start(self):
        """테스트 시작 시 로그인"""
        self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "testpass"
        })
```

### 9. 보안 테스트

보안 테스트는 크게 세 가지 유형으로 나눠요.

```
┌─────────────────────────────────────────────────────────────────┐
│                        보안 테스트 유형                          │
├──────────┬──────────────────┬───────────────────────────────────┤
│ 유형      │ 설명              │ 대표 도구                        │
├──────────┼──────────────────┼───────────────────────────────────┤
│ SAST     │ 소스 코드 정적 분석  │ SonarQube, Semgrep, CodeQL     │
│          │ (코드를 읽어서 분석) │ Checkmarx, Snyk Code           │
├──────────┼──────────────────┼───────────────────────────────────┤
│ DAST     │ 실행 중인 앱 동적   │ OWASP ZAP, Burp Suite         │
│          │ 분석 (공격 시뮬레이션)│ Nuclei, Nikto                 │
├──────────┼──────────────────┼───────────────────────────────────┤
│ SCA      │ 의존성 취약점 분석   │ Snyk, Dependabot, Trivy       │
│          │ (라이브러리 검사)    │ npm audit, safety(Python)     │
└──────────┴──────────────────┴───────────────────────────────────┘
```

#### GitHub Actions에서 보안 테스트 통합

```yaml
# .github/workflows/security.yml
name: Security Tests

on: [push, pull_request]

jobs:
  sast:
    name: SAST - 정적 코드 분석
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Semgrep SAST 스캔
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/secrets

  sca:
    name: SCA - 의존성 취약점 분석
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Snyk 의존성 스캔
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  dast:
    name: DAST - 동적 보안 테스트
    runs-on: ubuntu-latest
    needs: [sast, sca]  # 정적 분석 통과 후 실행
    steps:
      - uses: actions/checkout@v4

      - name: 앱 실행
        run: |
          docker compose up -d
          sleep 10

      - name: OWASP ZAP 스캔
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
```

### 10. 코드 커버리지

코드 커버리지는 테스트가 전체 코드 중 **얼마나 실행했는지** 측정하는 지표예요.

```
커버리지 유형:

Line Coverage (라인 커버리지)
  → 전체 코드 줄 중 실행된 줄의 비율
  → 가장 기본적이고 흔한 지표

Branch Coverage (분기 커버리지)
  → if/else, switch 등의 모든 분기를 실행했는지
  → Line보다 더 엄격한 지표

Function Coverage (함수 커버리지)
  → 전체 함수 중 한 번이라도 호출된 함수의 비율

Statement Coverage (구문 커버리지)
  → 전체 실행 가능한 구문 중 실행된 비율
```

#### 커버리지 도구별 설정

**Istanbul/NYC (JavaScript)**

```json
// package.json
{
  "scripts": {
    "test": "jest --coverage",
    "test:ci": "jest --coverage --coverageReporters=lcov --coverageReporters=text"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,ts}",
      "!src/**/*.d.ts",
      "!src/**/index.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**coverage.py (Python)**

```ini
# .coveragerc 또는 pyproject.toml
[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/migrations/*",
    "*/__init__.py",
]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if __name__ == .__main__.",
    "raise NotImplementedError",
]
```

```bash
# 실행
pytest --cov=src --cov-report=html --cov-report=term-missing
```

**JaCoCo (Java)**

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <execution>
            <id>check</id>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

#### 커버리지에 대한 올바른 인식

```
커버리지 100%가 완벽한 테스트를 의미하지 않아요!

예시:
  function divide(a, b) {
    return a / b;   // ← 100% 커버리지 달성 가능
  }

  test: divide(10, 2) === 5  ✅ 통과 (100% 커버리지!)

하지만... divide(10, 0)은? → Infinity 반환 (버그인데 커버리지엔 안 잡힘)

올바른 커버리지 목표:
  • 80% 이상: 대부분의 프로젝트에서 합리적인 목표
  • 90% 이상: 핵심 비즈니스 로직에 적용
  • 100%: 현실적이지 않고, 추구하면 오히려 무의미한 테스트가 늘어남

커버리지는 "최소 기준"이지, "품질 보증"이 아니에요.
중요한 건 "어떤 코드를 테스트하느냐"예요.
```

### 11. Flaky Test 관리

Flaky test는 같은 코드에서 **성공했다 실패했다** 하는 불안정한 테스트예요. CI의 신뢰도를 망치는 주범이에요.

```
Flaky Test의 주요 원인:

1. 타이밍 의존성
   → setTimeout, sleep, 네트워크 지연에 의존
   → 해결: waitFor, polling, retry 패턴 사용

2. 테스트 간 상태 공유
   → 전역 변수, DB 상태, 파일 시스템 공유
   → 해결: 각 테스트 전후 초기화/정리 (setup/teardown)

3. 순서 의존성
   → 테스트 A가 먼저 실행돼야 B가 통과
   → 해결: 각 테스트가 독립적으로 동작하도록 설계

4. 외부 서비스 의존
   → 외부 API가 느리거나 응답이 달라짐
   → 해결: Mock/Stub으로 외부 의존성 제거

5. 리소스 경쟁 (Race Condition)
   → 병렬 실행 시 같은 포트, 파일에 접근
   → 해결: 고유 리소스 할당, 격리된 환경 사용
```

#### Flaky Test 관리 전략

```yaml
# Jest — 재시도 설정
# jest.config.js
module.exports = {
  // CI에서만 재시도
  ...(process.env.CI && {
    retryTimes: 2,  // 최대 2번 재시도
  }),
};
```

```python
# pytest — 재시도 설정 (pytest-rerunfailures)
# pytest.ini
[pytest]
reruns = 2
reruns_delay = 1
```

```yaml
# GitHub Actions — Flaky test 격리
- name: Run stable tests
  run: pytest -m "not flaky" --strict-markers

- name: Run flaky tests (실패 허용)
  run: pytest -m "flaky" --reruns 3
  continue-on-error: true  # 실패해도 파이프라인은 통과
```

### 12. CI에서의 테스트 최적화

CI에서 테스트가 느리면 개발자가 CI를 무시하기 시작해요. 최적화는 필수예요.

#### 병렬 실행 (Parallelism)

```yaml
# GitHub Actions — 매트릭스 전략으로 병렬 실행
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]  # 4개 샤드로 분할
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: 테스트 실행 (샤드 ${{ matrix.shard }}/4)
        run: |
          npx jest --shard=${{ matrix.shard }}/4 --ci --coverage

      - name: 커버리지 업로드
        uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.shard }}
          path: coverage/

  # 커버리지 병합
  coverage-merge:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          merge-multiple: true

      - name: 커버리지 리포트 병합 및 업로드
        run: npx istanbul-merge --out merged-coverage.json coverage-*/coverage-final.json
```

#### 테스트 분할 (Test Splitting)

```yaml
# CircleCI — 타이밍 기반 테스트 분할
jobs:
  test:
    parallelism: 4  # 4개 컨테이너
    steps:
      - checkout
      - run:
          name: 테스트 분할 및 실행
          command: |
            # 이전 실행 시간 기반으로 균등 분배
            TESTS=$(circleci tests glob "tests/**/*.test.js" \
              | circleci tests split --split-by=timings)
            npx jest $TESTS --ci
```

#### 캐싱 전략

```yaml
# GitHub Actions — 의존성 캐싱으로 설치 시간 절약
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: 'npm'  # node_modules 자동 캐싱

  # Python 의존성 캐싱
  - uses: actions/cache@v4
    with:
      path: ~/.cache/pip
      key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
      restore-keys: ${{ runner.os }}-pip-

  # Docker 레이어 캐싱 (Testcontainers용)
  - uses: actions/cache@v4
    with:
      path: /tmp/.buildx-cache
      key: ${{ runner.os }}-docker-${{ hashFiles('**/Dockerfile') }}
```

#### 변경된 파일만 테스트 (Affected Test Detection)

```yaml
# 변경된 파일에 영향받는 테스트만 실행
- name: 변경된 파일 감지
  id: changes
  run: |
    CHANGED=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(ts|js)$' || true)
    echo "changed_files=$CHANGED" >> $GITHUB_OUTPUT

- name: 영향받는 테스트만 실행
  run: |
    npx jest --changedSince=HEAD~1 --ci
    # 또는 nx affected:test (monorepo의 경우)
```

---

## 💻 직접 해보기

### 실습 1: Jest로 TDD 사이클 체험하기

```bash
# 프로젝트 초기화
mkdir tdd-practice && cd tdd-practice
npm init -y
npm install --save-dev jest

# package.json에 test 스크립트 추가
# "scripts": { "test": "jest --watchAll" }
```

**Step 1 — 장바구니 서비스 테스트 먼저 작성**

```javascript
// cart.test.js
const { Cart } = require('./cart');

describe('Cart (장바구니)', () => {
  let cart;

  beforeEach(() => {
    cart = new Cart();
  });

  test('빈 장바구니의 총액은 0이에요', () => {
    expect(cart.getTotal()).toBe(0);
  });

  test('상품을 추가하면 총액이 올라가요', () => {
    cart.addItem({ name: '커피', price: 4500, quantity: 2 });
    expect(cart.getTotal()).toBe(9000);
  });

  test('여러 상품을 추가할 수 있어요', () => {
    cart.addItem({ name: '커피', price: 4500, quantity: 2 });
    cart.addItem({ name: '케이크', price: 6000, quantity: 1 });
    expect(cart.getTotal()).toBe(15000);
  });

  test('상품을 제거할 수 있어요', () => {
    cart.addItem({ name: '커피', price: 4500, quantity: 2 });
    cart.addItem({ name: '케이크', price: 6000, quantity: 1 });
    cart.removeItem('커피');
    expect(cart.getTotal()).toBe(6000);
  });

  test('10만원 이상이면 10% 할인이에요', () => {
    cart.addItem({ name: '노트북', price: 120000, quantity: 1 });
    expect(cart.getTotal()).toBe(108000);  // 120000 * 0.9
  });

  test('상품 개수를 확인할 수 있어요', () => {
    cart.addItem({ name: '커피', price: 4500, quantity: 2 });
    cart.addItem({ name: '케이크', price: 6000, quantity: 1 });
    expect(cart.getItemCount()).toBe(3);  // 2 + 1
  });
});
```

**Step 2 — 테스트를 통과하는 코드 작성**

```javascript
// cart.js
class Cart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);
  }

  removeItem(name) {
    this.items = this.items.filter(item => item.name !== name);
  }

  getSubtotal() {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    // 10만원 이상이면 10% 할인
    if (subtotal >= 100000) {
      return subtotal * 0.9;
    }
    return subtotal;
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }
}

module.exports = { Cart };
```

### 실습 2: pytest로 통합 테스트 작성하기

```bash
# 프로젝트 초기화
mkdir integration-test-practice && cd integration-test-practice
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install pytest pytest-cov httpx
```

```python
# app.py — 간단한 API 서버 (FastAPI)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# 인메모리 "데이터베이스" (Fake)
db = {}

class Todo(BaseModel):
    title: str
    completed: bool = False

@app.post("/todos")
def create_todo(todo: Todo):
    todo_id = len(db) + 1
    db[todo_id] = todo.dict()
    db[todo_id]["id"] = todo_id
    return db[todo_id]

@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    if todo_id not in db:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db[todo_id]

@app.get("/todos")
def list_todos():
    return list(db.values())
```

```python
# test_app_integration.py
import pytest
from fastapi.testclient import TestClient
from app import app, db

@pytest.fixture(autouse=True)
def clear_db():
    """각 테스트 전에 DB 초기화"""
    db.clear()
    yield
    db.clear()

client = TestClient(app)

class TestTodoAPI:
    """Todo API 통합 테스트"""

    def test_todo_생성(self):
        response = client.post("/todos", json={
            "title": "pytest 배우기",
            "completed": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "pytest 배우기"
        assert data["id"] == 1

    def test_todo_조회(self):
        # 먼저 생성
        client.post("/todos", json={"title": "테스트 작성"})
        # 조회
        response = client.get("/todos/1")
        assert response.status_code == 200
        assert response.json()["title"] == "테스트 작성"

    def test_존재하지_않는_todo_조회(self):
        response = client.get("/todos/999")
        assert response.status_code == 404

    def test_todo_목록_조회(self):
        client.post("/todos", json={"title": "할 일 1"})
        client.post("/todos", json={"title": "할 일 2"})

        response = client.get("/todos")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_전체_플로우(self):
        """생성 → 조회 → 목록 전체 흐름 테스트"""
        # 생성
        create_res = client.post("/todos", json={
            "title": "E2E 플로우 테스트",
            "completed": False
        })
        todo_id = create_res.json()["id"]

        # 단건 조회
        get_res = client.get(f"/todos/{todo_id}")
        assert get_res.json()["title"] == "E2E 플로우 테스트"

        # 목록 조회
        list_res = client.get("/todos")
        assert len(list_res.json()) == 1
```

### 실습 3: CI 파이프라인에 테스트 통합하기

```yaml
# .github/workflows/test-pipeline.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20
  PYTHON_VERSION: '3.12'

jobs:
  # ───────────────────────────────
  # 1단계: 단위 테스트 (가장 빠름)
  # ───────────────────────────────
  unit-test:
    name: 단위 테스트
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci
      - name: 단위 테스트 (샤드 ${{ matrix.shard }}/3)
        run: npx jest --shard=${{ matrix.shard }}/3 --ci --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: unit-coverage-${{ matrix.shard }}
          path: coverage/

  # ───────────────────────────────
  # 2단계: 통합 테스트
  # ───────────────────────────────
  integration-test:
    name: 통합 테스트
    needs: unit-test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: 통합 테스트 실행
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
        run: npx jest --testPathPattern='integration' --ci --coverage

  # ───────────────────────────────
  # 3단계: E2E 테스트
  # ───────────────────────────────
  e2e-test:
    name: E2E 테스트
    needs: integration-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Playwright 설치
        run: npx playwright install --with-deps chromium
      - name: 앱 빌드 및 실행
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:3000 --timeout 30000
      - name: E2E 테스트 실행
        run: npx playwright test --reporter=html
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # ───────────────────────────────
  # 4단계: 보안 테스트
  # ───────────────────────────────
  security-test:
    name: 보안 테스트
    needs: unit-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SAST - Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: p/security-audit
      - name: SCA - npm audit
        run: npm audit --audit-level=high

  # ───────────────────────────────
  # 5단계: 커버리지 게이트
  # ───────────────────────────────
  coverage-gate:
    name: 커버리지 확인
    needs: [unit-test, integration-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: unit-coverage-*
          merge-multiple: true
      - name: 커버리지 기준 확인
        run: |
          echo "커버리지가 80% 이상인지 확인..."
          # 실제로는 커버리지 리포트 파싱 로직
```

테스트 파이프라인의 전체 흐름:

```mermaid
flowchart TD
    PUSH["git push"] --> UNIT["🟩 단위 테스트<br/>(3개 샤드 병렬)<br/>~2분"]
    UNIT -->|"통과"| INT["🟨 통합 테스트<br/>(DB, Redis 포함)<br/>~5분"]
    UNIT -->|"통과"| SEC["🟪 보안 테스트<br/>(SAST + SCA)<br/>~3분"]
    INT -->|"통과"| E2E["🟥 E2E 테스트<br/>(Playwright)<br/>~8분"]
    INT --> COV["📊 커버리지 게이트<br/>(80% 이상)"]
    E2E -->|"전부 통과"| DEPLOY["✅ 배포 가능"]
    SEC -->|"취약점 없음"| DEPLOY

    UNIT -->|"실패"| FAIL["❌ 즉시 알림<br/>빠른 피드백"]
    INT -->|"실패"| FAIL
    E2E -->|"실패"| FAIL_REPORT["❌ 실패 리포트<br/>스크린샷 첨부"]

    style UNIT fill:#27ae60,color:#fff
    style INT fill:#f39c12,color:#fff
    style E2E fill:#e74c3c,color:#fff
    style SEC fill:#9b59b6,color:#fff
    style DEPLOY fill:#2ecc71,color:#fff
    style FAIL fill:#e74c3c,color:#fff
    style FAIL_REPORT fill:#e74c3c,color:#fff
```

---

## 🏢 실무에서는?

### 실무 테스트 전략 예시

```
스타트업 (5~10명):
━━━━━━━━━━━━━━━━━
• 단위 테스트: 핵심 비즈니스 로직만 (결제, 인증)
• 통합 테스트: API 엔드포인트 기본 동작
• E2E 테스트: 핵심 사용자 플로우 2~3개만
• 커버리지 목표: 60~70%
• 보안 테스트: npm audit + Dependabot 정도
→ 속도 우선, 필수만 테스트

중견 기업 (50~100명):
━━━━━━━━━━━━━━━━━
• 단위 테스트: 모든 서비스 레이어
• 통합 테스트: Testcontainers로 실제 DB 테스트
• E2E 테스트: 주요 사용자 시나리오 10~20개
• 성능 테스트: 주요 API에 k6 부하 테스트
• 커버리지 목표: 80%
• 보안 테스트: SAST + SCA 필수
→ 균형 잡힌 전략

대기업 (500명 이상):
━━━━━━━━━━━━━━━━━
• 단위 테스트: 전 코드베이스
• 통합 테스트: 마이크로서비스 간 계약 테스트 (Contract Test)
• E2E 테스트: 전체 사용자 여정 + 크로스 브라우저
• 성능 테스트: 정기적 부하/스트레스 테스트
• 커버리지 목표: 85~90%
• 보안 테스트: SAST + DAST + SCA + 침투 테스트
→ 포괄적 품질 보증
```

### 마이크로서비스 환경의 테스트

```
마이크로서비스에서는 "계약 테스트(Contract Test)"가 중요해요:

┌──────────────┐     API 계약      ┌──────────────┐
│ 주문 서비스   │ ←──────────────→ │ 결제 서비스    │
│ (Consumer)   │   "이런 형태로    │ (Provider)   │
│              │    요청/응답"     │              │
└──────────────┘                   └──────────────┘

도구: Pact, Spring Cloud Contract

Consumer 쪽에서: "나는 이런 요청을 보내고 이런 응답을 기대해요"
Provider 쪽에서: "Consumer가 기대하는 응답을 정말 줄 수 있는지 검증"

→ 서비스 간 API 변경 시 계약이 깨지면 바로 알 수 있어요
```

### 테스트 코드 리뷰 체크리스트

```
PR 리뷰 시 테스트 코드 확인 사항:

✅ 새 기능에 대한 테스트가 있는가?
✅ 엣지 케이스가 커버되는가? (null, 빈 값, 경계값)
✅ 에러 케이스가 테스트되는가?
✅ 테스트 이름이 의도를 명확히 설명하는가?
✅ AAA 패턴(Arrange-Act-Assert)을 따르는가?
✅ 테스트가 독립적인가? (다른 테스트에 의존하지 않는가?)
✅ Flaky할 가능성이 있는 코드가 있는가?
✅ 테스트 더블이 적절히 사용되었는가?
✅ 커버리지가 기준을 충족하는가?
```

### 실무 팁: 테스트 작성 우선순위

```
모든 코드에 테스트를 작성할 시간이 없다면, 우선순위를 정해요:

🔴 반드시 테스트 (비즈니스 핵심):
  • 결제/정산 로직
  • 인증/인가 로직
  • 데이터 변환/계산 로직
  • 외부 API 연동 (에러 처리 포함)

🟡 가능하면 테스트 (중요도 높음):
  • CRUD API 엔드포인트
  • 데이터 검증 로직
  • 비즈니스 규칙 적용 로직

🟢 여유 있을 때 테스트 (있으면 좋음):
  • UI 컴포넌트 렌더링
  • 유틸리티 함수
  • 설정/초기화 로직
```

---

## ⚠️ 자주 하는 실수

### 실수 1: 구현 세부사항을 테스트하기

```javascript
// ❌ 나쁜 예: 내부 구현을 테스트
test('addItem이 items 배열에 push하는지 확인', () => {
  const cart = new Cart();
  cart.addItem({ name: '커피', price: 4500, quantity: 1 });
  // 내부 배열의 길이를 직접 확인 — 구현이 바뀌면 깨짐
  expect(cart.items.length).toBe(1);
  expect(cart.items[0].name).toBe('커피');
});

// ✅ 좋은 예: 동작(행위)을 테스트
test('상품을 추가하면 총액에 반영돼요', () => {
  const cart = new Cart();
  cart.addItem({ name: '커피', price: 4500, quantity: 1 });
  // 외부에서 관찰 가능한 동작을 확인
  expect(cart.getTotal()).toBe(4500);
  expect(cart.getItemCount()).toBe(1);
});
```

**왜 나쁜가요?** 내부 구현(배열)이 Map이나 Set으로 바뀌면 기능은 동일한데 테스트가 깨져요. 테스트는 **"무엇을 하는지"**를 검증해야지, **"어떻게 하는지"**를 검증하면 안 돼요.

### 실수 2: 테스트에 로직 넣기

```python
# ❌ 나쁜 예: 테스트 안에 계산 로직
def test_할인_계산():
    price = 10000
    discount = 0.2
    expected = price * (1 - discount)  # 테스트 안에서 계산!
    assert calculate_discount(price, discount) == expected

# ✅ 좋은 예: 하드코딩된 기대값
def test_할인_계산():
    assert calculate_discount(10000, 0.2) == 8000  # 명확한 기대값
```

**왜 나쁜가요?** 테스트에 로직을 넣으면 프로덕션 코드와 같은 버그를 가질 수 있어요. 테스트의 기대값은 **직접 계산해서 하드코딩**하는 게 안전해요.

### 실수 3: 너무 많은 것을 한 테스트에서 검증하기

```javascript
// ❌ 나쁜 예: 하나의 테스트에 여러 시나리오
test('장바구니 기능 전체 테스트', () => {
  const cart = new Cart();
  // 추가
  cart.addItem({ name: '커피', price: 4500, quantity: 1 });
  expect(cart.getTotal()).toBe(4500);
  // 또 추가
  cart.addItem({ name: '케이크', price: 6000, quantity: 2 });
  expect(cart.getTotal()).toBe(16500);
  // 제거
  cart.removeItem('커피');
  expect(cart.getTotal()).toBe(12000);
  // 할인
  cart.applyDiscount('VIP');
  expect(cart.getTotal()).toBe(9600);
});

// ✅ 좋은 예: 시나리오별 분리
test('상품 추가 시 총액 증가', () => { /* ... */ });
test('상품 제거 시 총액 감소', () => { /* ... */ });
test('VIP 할인 적용', () => { /* ... */ });
```

**왜 나쁜가요?** 테스트가 실패했을 때 **어떤 기능**이 깨졌는지 바로 알 수 없어요. 테스트 이름만 보고 문제를 파악할 수 있어야 해요.

### 실수 4: E2E 테스트에 타이밍 sleep 사용하기

```javascript
// ❌ 나쁜 예: 고정 시간 대기
test('로그인 후 대시보드로 이동', async () => {
  await page.click('#login-button');
  await page.waitForTimeout(3000);  // 3초 기다리기 — Flaky!
  expect(await page.url()).toContain('/dashboard');
});

// ✅ 좋은 예: 조건 기반 대기
test('로그인 후 대시보드로 이동', async () => {
  await page.click('#login-button');
  await page.waitForURL('**/dashboard', { timeout: 10000 });  // URL 변경까지 대기
  expect(await page.url()).toContain('/dashboard');
});
```

**왜 나쁜가요?** 네트워크가 느리면 3초로 부족하고, 빠르면 불필요한 대기 시간이에요. **조건 기반 대기**를 사용하면 필요한 만큼만 기다려요.

### 실수 5: 커버리지 숫자에만 집착하기

```python
# ❌ 나쁜 예: 커버리지 100%를 위한 무의미한 테스트
def test_toString():
    user = User("홍길동", "hong@example.com")
    assert str(user) is not None  # 그래서? 뭘 검증하는 건지?

def test_getter():
    user = User("홍길동", "hong@example.com")
    assert user.name == "홍길동"   # getter만 테스트... 의미 있나요?

# ✅ 좋은 예: 비즈니스 의미가 있는 테스트
def test_VIP_사용자는_추가_할인을_받는다():
    user = User("홍길동", "hong@example.com", tier="VIP")
    order = Order(items=[Item("노트북", 1000000)])
    discount = user.calculate_discount(order)
    assert discount == 100000  # VIP 10% 할인
```

### 실수 6: 테스트 환경 격리 안 하기

```python
# ❌ 나쁜 예: 전역 상태 공유
db = []  # 전역 변수

def test_사용자_추가():
    db.append({"name": "홍길동"})
    assert len(db) == 1

def test_사용자_목록():
    # 위 테스트의 데이터가 남아있어서 실패할 수 있어요!
    assert len(db) == 0  # 💥 1이 나옴!

# ✅ 좋은 예: 각 테스트 전에 초기화
@pytest.fixture(autouse=True)
def clean_db():
    db.clear()
    yield
    db.clear()
```

---

## 📝 마무리

### 핵심 요약

```
테스트 자동화의 핵심 포인트:

1. 테스트 피라미드를 지켜요
   → 단위(70%) > 통합(20%) > E2E(10%)
   → 빠르고 안정적인 테스트를 기반으로

2. TDD는 "설계 도구"예요
   → Red → Green → Refactor 사이클
   → 테스트가 설계를 이끌어요

3. 테스트 더블을 적절히 활용해요
   → Mock, Stub, Spy, Fake — 각각의 용도를 구분
   → 과도한 Mocking은 오히려 독

4. CI에서 테스트를 최적화해요
   → 병렬 실행, 테스트 분할, 캐싱
   → 피드백은 빠를수록 좋아요

5. 커버리지는 "최소 기준"이에요
   → 80%를 목표로, 100%에 집착하지 말기
   → 비즈니스 핵심 로직부터 테스트

6. Flaky test는 즉시 해결해요
   → 신뢰를 잃으면 테스트 문화가 무너져요
   → 격리, 재시도, 조건 기반 대기로 해결

7. 보안 테스트도 자동화해요
   → SAST + DAST + SCA를 CI에 통합
   → Shift Left — 일찍 발견할수록 저렴
```

### 테스트 전략 체크리스트

```
새 프로젝트 시작 시 확인 사항:

□ 테스트 프레임워크 선정 (Jest/pytest/JUnit)
□ 테스트 디렉토리 구조 설정
□ CI에 테스트 단계 추가
□ 커버리지 도구 설정 및 기준 설정 (80%)
□ 테스트 더블 라이브러리 선정
□ E2E 테스트 도구 선정 (Playwright 권장)
□ Flaky test 관리 정책 수립
□ 보안 테스트 도구 통합 (최소 SCA)
□ 성능 테스트 기준 설정 (SLO 기반)
□ 테스트 코드 리뷰 문화 정착
```

### 기술별 추천 도구 정리

```
┌─────────────┬────────────────────────────────────────┐
│ 카테고리      │ 추천 도구                               │
├─────────────┼────────────────────────────────────────┤
│ JS 단위      │ Jest, Vitest                            │
│ Python 단위  │ pytest                                  │
│ Java 단위    │ JUnit 5 + Mockito                       │
│ 통합 테스트   │ Testcontainers + 각 언어 프레임워크        │
│ E2E 테스트   │ Playwright (1순위), Cypress              │
│ 성능 테스트   │ k6 (1순위), Locust, JMeter              │
│ SAST        │ Semgrep, SonarQube, CodeQL              │
│ DAST        │ OWASP ZAP                               │
│ SCA         │ Snyk, Dependabot, Trivy                  │
│ JS 커버리지  │ Istanbul/NYC (Jest 내장)                  │
│ Python 커버리지│ coverage.py (pytest-cov)                │
│ Java 커버리지 │ JaCoCo                                  │
│ 계약 테스트   │ Pact                                    │
└─────────────┴────────────────────────────────────────┘
```

---

## 🔗 다음 단계

### 이전 문서

- [CI 파이프라인](./03-ci-pipeline) — 테스트가 CI에서 어떻게 실행되는지의 전체 그림

### 다음 문서

- [배포 전략](./10-deployment-strategy) — 테스트를 통과한 코드를 안전하게 배포하는 방법

### 더 깊이 학습하기

```
단계별 학습 로드맵:

1단계 (입문): 단위 테스트부터 시작
  → Jest/pytest 튜토리얼 따라하기
  → AAA 패턴 익히기
  → 테스트 더블 이해하기

2단계 (중급): TDD와 통합 테스트
  → TDD 사이클 연습 (작은 프로젝트)
  → Testcontainers로 통합 테스트
  → CI에 테스트 파이프라인 구축

3단계 (고급): E2E와 성능/보안 테스트
  → Playwright로 E2E 시나리오 작성
  → k6로 부하 테스트 설계
  → SAST/DAST/SCA 파이프라인 구축

4단계 (전문가): 테스트 아키텍처 설계
  → 마이크로서비스 계약 테스트
  → 카오스 엔지니어링 (Chaos Monkey)
  → 테스트 문화 및 조직 전략
```

### 추천 자료

```
도서:
  • "단위 테스트" — Vladimir Khorikov
  • "테스트 주도 개발" — Kent Beck
  • "Growing Object-Oriented Software, Guided by Tests" — Freeman & Pryce
  • "xUnit Test Patterns" — Gerard Meszaros

온라인:
  • Martin Fowler의 테스트 피라미드 글 (martinfowler.com)
  • Testing Trophy — Kent C. Dodds (React 생태계)
  • Google Testing Blog (testing.googleblog.com)
```
