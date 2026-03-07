export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-sm text-gray-700 dark:text-gray-300">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">개인정보처리방침</h1>
      <p className="mb-4">최종 수정일: 2026년 3월 7일</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">1. 수집하는 개인정보</h2>
        <p>본 서비스는 Google 로그인 시 다음 정보를 수집합니다:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>이름</li>
          <li>이메일 주소</li>
          <li>프로필 이미지</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">2. 수집 목적</h2>
        <p>수집된 정보는 다음 목적으로만 사용됩니다:</p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li>사용자 식별 및 로그인 처리</li>
          <li>아키텍처 설계 히스토리 저장</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">3. 개인정보 보관 및 파기</h2>
        <p>수집된 개인정보는 회원 탈퇴 시 즉시 파기됩니다. 별도의 보관 기간은 없습니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">4. 제3자 제공</h2>
        <p>수집된 개인정보는 제3자에게 제공되지 않습니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">5. 문의</h2>
        <p>개인정보 관련 문의는 GitHub 리포지토리 이슈를 통해 접수할 수 있습니다.</p>
      </section>
    </main>
  );
}
