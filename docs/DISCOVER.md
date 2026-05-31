# Discover 설계 — `/discover`, `/c/[category]`

> 근거 문서: `PRD.md` v2.0 (2-B절 루마 실측 패턴, 9-11절 DiscoverCategory 엔티티, 12절 MVP 화면, 13·21절 Phase 1 범위, 16·17절 Negative Spec)
> 이 문서는 PRD를 구현 가능한 화면·컴포넌트·라우트로 내린 Discover 영역 설계서다. PRD와 충돌하면 PRD가 우선한다.

---

## 0. 목적과 경계

Discover는 **참여자(2차 사용자)가 "내 취향·내 목적에 맞는 커뮤니티 여행 제안을 찾는" 진입면**이다. 마이리얼트립이 "개인이 여행상품을 찾는 곳"이라면, Discover는 "커뮤니티가 함께 갈 여행을 찾는 곳"의 입구다.

루마(luma.com)의 discover anatomy 3블록을 차용한다 (PRD 2-B절 실측):

| 루마 블록 | OurRealTrip 차용 | 도메인 재해석 |
|-----------|------------------|---------------|
| Browse by Category (아이콘 + 건수) | **카테고리 택소노미** | 이벤트 카테고리 → 커뮤니티/여행 의도 카테고리 (사진/빌더/러닝/웰니스/미식/서핑…) |
| Popular Events (도시별 커버카드 + 참여수) | **도시별 인기 트립** | 이벤트 → TripProposal. "N Going" → "N명 참여의향" (InterestSignal 집계) |
| Featured Calendars (커뮤니티 구독) | **커뮤니티 구독** | 캘린더 구독 → Community 구독 (다음 제안 알림 받기) |

### 경계 (Negative Spec 준수 — PRD 16·17절)
- **Luma UI 클론 금지**: anatomy/패턴만 차용. 색·간격·컴포넌트는 OurRealTrip 도메인에 맞춰 재구성.
- **상품 검색 UI가 아니다**: Discover는 항공/숙소/TNA를 나열하지 않는다. **TripProposal(여행 제안)**과 **Community**만 노출한다.
- **마이리얼트립 공식 오인 금지**: 마이리얼트립 브랜드를 전면에 쓰지 않는다.
- **결제·체크아웃 없음**: Discover에는 어떤 예약/결제 CTA도 없다. CTA는 "보러가기 / 구독" 뿐.
- **금지 문구**(PRD 17-2): "공식 추천 / 단독 특가 / 최저가 보장 / 예약 가능 보장 / 전체 예약하기 / 패키지 구매하기 / 이 일정 그대로 예약하기 / 예약하면 수익 보장 / 누구나 여행으로 돈 번다 / 방문자 캐시백" — 카피·라벨·메타에 절대 등장 금지.

---

## 1. 라우트

| 라우트 | 화면 | 비고 |
|--------|------|------|
| `/discover` | Discover 홈 (또는 `/`를 discover로 — PRD 12절) | 카테고리 + 도시별 인기 트립 + 커뮤니티 구독 |
| `/c/[category]` | 카테고리 상세 (해당 카테고리 트립·커뮤니티 모음) | `[category]` = `DiscoverCategory.key` (slug) |

### 라우트 규칙
- `/` 와 `/discover` 는 동일 화면을 렌더하거나, `/`에서 `/discover`로 rewrite/redirect (PRD 12절 "또는 `/`를 discover로"). **결정: `/`를 Discover로 렌더**(랜딩 = Discover), `/discover`도 동일 화면을 가리키는 canonical 보조 경로.
- `/c/[category]`의 `[category]`는 **`DiscoverCategory.key`** 를 slug로 사용 (예: `/c/photography`, `/c/builder`, `/c/surf`). DB에 없는 key는 404 또는 빈 상태(empty state).
- TripProposal 상세는 Discover 소관이 아니다 → `/trips/[slug]` (별도 설계). Discover의 트립 카드는 `/trips/[slug]`로 링크만 건다.
- 커뮤니티 상세 페이지는 Phase 1 범위 밖일 수 있음 → 카드 클릭 시 "구독" 액션만, 또는 해당 커뮤니티의 대표 trip으로 이동(아래 8절 결정 참조).

---

## 2. 데이터 소스 매핑 (PRD 9절 엔티티 기준)

Discover는 신규 엔티티를 만들지 않는다. 기존 엔티티를 읽어 구성한다.

| Discover 요소 | 소스 엔티티 | 파생/집계 |
|---------------|-------------|-----------|
| 카테고리 칩(아이콘+건수) | `DiscoverCategory` (9-11) | 건수 = 해당 카테고리 community에 연결된 공개 가능 TripProposal 수 집계 |
| 도시별 인기 트립 카드 | `TripProposal` (9-3) + `Host` (9-1) | 커버=`cover_image_url`, 도시=`destination_candidates`, 참여수=InterestSignal 집계 |
| "N명 참여의향" | `InterestSignal` (9-6) | `response_type IN (interested, date_dependent, price_dependent, voted_option)` 카운트 (PRD 6절 4번 소셜프루프와 동일 정의) |
| 커뮤니티 구독 카드 | `Community` (9-2) + `Host` (9-1) | category=`Community.category`, 노출=`visibility=public` |

### DiscoverCategory 엔티티 (PRD 9-11 그대로)
| 필드 | 타입 | 설명 |
|------|------|------|
| `category_id` | uuid PK | |
| `key` | text | 카테고리 키 = `/c/[category]` slug (사진/빌더/러닝/웰니스/미식/서핑 등) |
| `label` | text | 표시 라벨 |
| `icon` | text? | 아이콘 (이모지 또는 아이콘셋 key) |
| `sort_order` | int | 정렬 순서 |

### 카테고리 ↔ Community 연결
- `Community.category`(text?, 9-2)와 `DiscoverCategory.key`/`label`를 매핑한다.
- ⚠️ **config-데이터 키 정합 주의**: `Community.category`는 자유 text이고 `DiscoverCategory.key`는 고정 키다. 둘이 silent하게 어긋나면 특정 커뮤니티가 카테고리 집계에서 조용히 누락된다. **시드/입력 시 `Community.category`를 `DiscoverCategory.key`와 동일 표기로 정규화**하거나, 매핑 테이블(label↔key normalize)을 단일 진입점으로 둔다.

### 카테고리 건수(`count`) 정의
- `count` = 해당 카테고리에 속한 community의 TripProposal 중 **Discover 노출 대상** 상태인 것의 수.
- Discover 노출 대상 상태: `interest_check`, `option_refining`, `booking_open` (draft/closed/cancelled/archived 제외).
- `visibility=public`인 것만 카운트. `unlisted`(slug 비공개)는 Discover 집계·노출에서 제외 (PRD 확정결정 5: Phase 1 접근 제어는 unlisted slug). **이것이 Discover 노출의 핵심 게이트다.**

---

## 3. 카테고리 택소노미 (초기 시드)

PRD 본문에 명시된 카테고리(사진/빌더/러닝/웰니스/미식/서핑)를 시드로 둔다. 아이콘·건수는 루마 Browse by Category 패턴 차용.

| sort | key | label | icon | 비고 |
|------|-----|-------|------|------|
| 1 | `photography` | 사진 | 📷 | 데모 커뮤니티(교토) 연결 |
| 2 | `builder` | 빌더 | 🛠️ | 데모 커뮤니티(발리). PRD 2-B "AI 해커하우스" 수요 검증 |
| 3 | `run` | 러닝 | 🏃 | PRD 2-B "BD RUN(런클럽)" 수요 검증 |
| 4 | `wellness` | 웰니스 | 🧘 | 발리 리트릿의 명상/회복 결 |
| 5 | `food` | 미식 | 🍜 | |
| 6 | `surf` | 서핑 | 🏄 | 데모 커뮤니티(하와이) 연결 |

> 아이콘은 placeholder(이모지). 디자인 단계에서 아이콘셋으로 교체 가능 — `DiscoverCategory.icon`이 nullable이라 변경 안전.
> ⚠️ PRD 원문(E절·12절)이 "미식"을 두 번 나열한 표기 흔적이 있으나 **중복 없이 6종**으로 확정한다. 추가 카테고리(등산/와인/책/음악 등 — PRD 4-1 커뮤니티 예시)는 운영 중 `DiscoverCategory` INSERT로 확장.

### 카테고리 정렬·노출 규칙
- 기본 정렬: `sort_order ASC`.
- 건수 0인 카테고리도 **노출은 한다**(택소노미는 수요 신호용) — 단 칩에 건수 배지를 흐리게 처리하거나 "준비 중" 톤. (루마는 건수 있는 것만 강조하는 패턴 — 우리는 빈 카테고리도 "이런 모임 여행이 열릴 수 있다"는 시그널로 유지.)

---

## 4. `/discover` 페이지 구조 (위→아래)

모바일 우선(PRD 13절). 루마 discover anatomy 순서를 따른다.

```
┌─────────────────────────────────────────┐
│ 1. Hero / 인트로 (DiscoverHero)           │  ← "우리 모임이 같이 갈 여행을 찾는 곳"
├─────────────────────────────────────────┤
│ 2. 카테고리 브라우즈 (CategoryRail)        │  ← 가로 스크롤 칩, 아이콘+라벨+건수
├─────────────────────────────────────────┤
│ 3. 도시별 인기 트립 (PopularTripsByCity)   │  ← 도시 섹션별 TripCard 그리드
│    ├ 도시 섹션: 교토                       │
│    ├ 도시 섹션: 발리                       │
│    └ 도시 섹션: 하와이 …                   │
├─────────────────────────────────────────┤
│ 4. 커뮤니티 구독 (FeaturedCommunities)     │  ← CommunityCard + 구독 버튼
├─────────────────────────────────────────┤
│ 5. 신뢰 고지 푸터 (DisclosureFooter)       │  ← 17절 고지 + /disclosure 링크
└─────────────────────────────────────────┘
```

### 각 블록 사양

#### 1. DiscoverHero
- 카피: 내부 전략어 금지(PRD 17-4). 사용자 언어로 번역. 예: "우리 모임이 같이 움직일 이유를 여행으로." / "관심부터 먼저, 예약은 나중에."
- CTA 없음 또는 "내 모임 여행 만들기"(→ `/host/trips/new`) 보조 링크 1개. (호스트 유입 보조 — 결제·예약 CTA 아님.)

#### 2. CategoryRail
- 가로 스크롤(모바일) / wrap 그리드(데스크탑).
- 각 칩 = `CategoryChip`: `icon` + `label` + `count` 배지.
- 클릭 → `/c/[key]`.

#### 3. PopularTripsByCity
- **도시 단위로 그룹핑**한 TripProposal 카드 그리드 (루마 Popular Events 차용 — 단 도시별 섹션 구조).
- 도시 = `TripProposal.destination_candidates`의 대표 도시 (배열이면 첫 항목 또는 별도 `primary_destination` 파생).
- 정렬: 도시 섹션 내 인기순(= "N명 참여의향" 내림차순), 동률이면 최근 생성순.
- Phase 1 시드 도시: 교토 / 발리 / 하와이 (PRD 확정결정 2).
- 각 카드 = `TripCard` (아래 5절).

#### 4. FeaturedCommunities
- `visibility=public`인 Community 카드 + 구독 버튼.
- 루마 Featured Calendars 차용 — "캘린더 구독" → "이 커뮤니티 다음 제안 알림 받기".
- 구독 = 익명 세션 기반 가벼운 follow (이름/이메일 미수집 — PRD 확정결정 4). Phase 1 구현 깊이는 8절 결정 참조.

#### 5. DisclosureFooter
- 필수 고지(PRD 17-1) 요약 1~2줄 + `/disclosure` 전체 고지 링크.
- 최소 노출: "아워리얼트립은 마이리얼트립 공식 서비스가 아닙니다. 결제·예약은 각 판매처에서 개별 진행됩니다." (1·6·7번 고지 핵심.)
- ⚠️ Discover에는 상품·장바구니가 없으므로 7번(장바구니 함께보기) 고지는 trip 상세에서, Discover는 공식 오인 방지(1번) 중심.

---

## 5. `/c/[category]` 페이지 구조

```
┌─────────────────────────────────────────┐
│ 1. 카테고리 헤더 (CategoryHeader)          │  ← icon + label + 한 줄 설명 + 건수
├─────────────────────────────────────────┤
│ 2. 이 카테고리 인기 트립 (TripGrid)        │  ← 도시 구분 없이 인기순 TripCard 그리드
├─────────────────────────────────────────┤
│ 3. 이 카테고리 커뮤니티 (CommunityGrid)    │  ← 해당 카테고리 Community + 구독
├─────────────────────────────────────────┤
│ 4. 다른 카테고리 (CategoryRail)            │  ← 재탐색용, /discover 재사용
├─────────────────────────────────────────┤
│ 5. 신뢰 고지 푸터 (DisclosureFooter)       │
└─────────────────────────────────────────┘
```

- `[category]` → `DiscoverCategory where key = [category]`. 없으면 404.
- TripGrid: 해당 카테고리 community의 공개 TripProposal을 인기순(참여의향 내림차순)으로. 빈 상태면 EmptyState("아직 이 카테고리의 여행 제안이 없어요").
- CommunityGrid: 해당 카테고리 + `visibility=public` Community.

---

## 6. 컴포넌트 카탈로그

> 모든 컴포넌트는 모바일 우선. 결제/예약 관련 prop·CTA를 갖지 않는다.

| 컴포넌트 | 용도 | 주요 props | 노출 데이터 |
|----------|------|-----------|-------------|
| `DiscoverHero` | Discover 인트로 | `title`, `subtitle`, `hostCtaHref?` | 번역된 인트로 카피 |
| `CategoryRail` | 카테고리 칩 가로 스크롤 | `categories: DiscoverCategory[]`, `activeKey?` | `/discover`·`/c/[category]` 공용 |
| `CategoryChip` | 단일 카테고리 칩 | `icon`, `label`, `count`, `href` | icon + label + count 배지 |
| `CategoryHeader` | `/c/[category]` 상단 | `icon`, `label`, `description?`, `count` | |
| `PopularTripsByCity` | 도시별 섹션 묶음 | `cities: { city, trips: TripCardData[] }[]` | 도시 섹션 헤더 + 그리드 |
| `CitySection` | 단일 도시 섹션 | `city`, `trips` | 도시명 + TripCard 목록 |
| `TripGrid` | 트립 카드 그리드(도시 구분 없음) | `trips: TripCardData[]`, `emptyText` | `/c/[category]`용 |
| `TripCard` | 여행 제안 카드 | `slug`, `coverImageUrl?`, `title`, `concept`, `city`, `hostName`, `interestCount`, `status` | 커버/제목/컨셉/도시/호스트/참여의향 |
| `InterestCountBadge` | "N명 참여의향" | `count`, `avatars?` | "N명 참여의향" + 아바타(선택). 루마 "N Going" 차용 |
| `FeaturedCommunities` | 커뮤니티 구독 섹션 | `communities: CommunityCardData[]` | |
| `CommunityCard` | 커뮤니티 + 구독 | `communityId`, `name`, `category`, `hostName`, `description?`, `isSubscribed` | |
| `SubscribeButton` | 커뮤니티 구독 토글 | `communityId`, `isSubscribed`, `onToggle` | 익명 세션 기반 |
| `StatusBadge` | proposal 상태 표시 | `status` | interest_check/option_refining/booking_open만 노출(나머지는 Discover 미노출) |
| `EmptyState` | 빈 카테고리/도시 | `text`, `ctaHref?` | |
| `DisclosureFooter` | 신뢰 고지 | `variant: 'discover'` | 공식 오인 방지 고지 + `/disclosure` 링크 |

### TripCard 표기 규칙 (Negative Spec 연동)
- 카드에 **가격을 단정 표기하지 않는다**. trip 상세의 옵션이 "예상 가격대"이고 Discover 카드는 제안 단위라 가격 미표기 또는 "예상 ○○만원대" 정도의 힌트만. **"최저가/특가/단독" 류 표기 금지**(17-2).
- ⚠️ 제3자 상품 제목의 프로모션·특가 강조 문구는 **Discover 카드에 끌어오지 않는다**(중립화 — PRD 17-2 말미). Discover 카드는 TripProposal.title/concept만 노출.
- `interestCount`는 "N명 참여의향" 라벨로만 표기. "N명 예약" 같은 표현 금지(예약 확정 오인 방지).
- `status=booking_open`이어도 Discover 카드에는 예약 CTA를 두지 않는다 — 카드 클릭 → `/trips/[slug]` 이동만.

---

## 7. 데이터 페칭 / 쿼리 개요

> 스택: Next.js App Router + Supabase (PRD 22절). Discover는 읽기 전용 + 익명 세션 구독.

| 화면 | 쿼리 | 캐시 |
|------|------|------|
| `/discover` 카테고리 | `DiscoverCategory` 전체 + 카테고리별 노출-대상 proposal count | 서버 컴포넌트, ISR/revalidate |
| `/discover` 인기 트립 | 노출-대상 `TripProposal` + InterestSignal 집계 → 도시 그룹핑 | 서버, 짧은 revalidate |
| `/discover` 커뮤니티 | `Community where visibility=public` + Host join | 서버 |
| `/c/[category]` | category join → trips + communities | 서버 |
| 구독 토글 | `participant_session_id` 기반 upsert | route handler / server action |

### 노출 게이트 (재확인)
- **Discover 노출 = `visibility=public` AND `status IN (interest_check, option_refining, booking_open)`**.
- `unlisted` proposal은 slug를 아는 사람만(PRD 확정결정 5) → Discover·카테고리 집계 모두 제외.
- 데모 커뮤니티 3건(교토/발리/하와이)이 Discover에 뜨려면 시드 시 `visibility=public`으로 넣어야 한다.

### "N명 참여의향" 집계
```
interestCount(proposal) =
  count(InterestSignal where proposal_id = X
        and response_type in (interested, date_dependent, price_dependent, voted_option))
```
(question/not_interested 제외 — 참여 의향 신호만. PRD 6절 4번 소셜프루프 정의와 일치.)

---

## 8. 결정 사항 (자율 결정 + 보류)

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| D1 | `/` vs `/discover` | `/`를 Discover로 렌더, `/discover`는 동일 화면 canonical | PRD 12절 "또는 `/`를 discover로" |
| D2 | `/c/[category]`의 slug | `DiscoverCategory.key` 사용 | PRD 9-11 key가 자연스러운 slug. label은 한글이라 URL 부적합 |
| D3 | 카테고리 6종 확정 | 사진/빌더/러닝/웰니스/미식/서핑 (PRD "미식" 중복 표기 → 1개로) | PRD E·12절 본문, 데모 3커뮤니티 커버 |
| D4 | 카드 가격 표기 | Discover 카드는 가격 단정 미표기 (힌트만) | 17-2 금지문구 + 확정결정 3(가격 변동) |
| D5 | 빈 카테고리 노출 | 건수 0이어도 칩 노출(수요 시그널) | 루마 패턴 변형 — 수요 검증 목적 |
| D6 | 인기 정렬 기준 | 참여의향(InterestSignal) 내림차순, 동률 시 최신순 | PRD 소셜프루프 정의 재사용 |
| **B1** | **커뮤니티 구독 구현 깊이** | **Phase 1 범위 확인 필요** — PRD 12·13·21절 MVP 화면/범위에 "커뮤니티 구독" 화면은 있으나 **구독 데이터 모델(구독 엔티티)이 9절에 정의돼 있지 않음** | 아래 [열린 질문] 참조 |
| **B2** | **커뮤니티 상세 페이지 유무** | **보류** — CommunityCard 클릭 시 (a) 구독만 (b) 커뮤니티 상세로 이동 (c) 대표 trip으로 이동 중 미결 | PRD에 `/c/[community]` 같은 커뮤니티 상세 라우트 명시 없음 |

### 열린 질문 (Vivi/PRD 작성자 확인 필요 — 추측 단정 회피)
1. **구독 영속화 모델**: PRD 9절에 Subscription 엔티티가 없다. Phase 1 "커뮤니티 구독"을 (a) `participant_session_id` 기반 경량 follow 테이블 신설 (b) 알림 발송 없이 UI 토글만(로컬/세션) (c) Phase 2로 미룸 중 무엇으로 할지. → PRD 신규 엔티티는 BookingProgress/Itinerary/DiscoverCategory 3종만 명시돼 있어 Subscription은 **스코프 밖일 가능성**. 임의 테이블 신설은 보류하고 확인 권장.
2. **커뮤니티 상세 라우트**: `/c/[category]`는 PRD 작업 지시에 명시됐으나 커뮤니티 개별 상세 라우트는 미정. 본 설계는 Discover/카테고리 화면까지만 확정하고 커뮤니티 상세는 별도 설계로 분리.

---

## 9. Negative Spec 체크리스트 (Discover 구현 시 검수)

구현·리뷰 시 아래가 모두 만족돼야 한다 (PRD 16·17·19절 Trust 지표 = 모두 0건).

- [ ] Discover 어디에도 단일 "전체 예약하기"·"패키지 구매하기"·묶음결제 CTA 없음
- [ ] 결제/체크아웃 진입점 없음 (아워리얼트립은 결제 수취 안 함 — merchant 아님)
- [ ] 금지 문구(공식추천/단독특가/최저가보장/예약가능보장/전체예약하기/패키지구매하기/이일정그대로예약하기/예약하면수익보장/누구나여행으로돈번다/방문자캐시백) 0건
- [ ] 마이리얼트립 공식 서비스처럼 보이는 UI/브랜딩 없음 (공식 오인 0건)
- [ ] 카드의 "N명 참여의향"이 "N명 예약"으로 오인되지 않음
- [ ] 제3자 상품 제목의 특가·프로모션 강조 문구를 Discover 카드로 끌어오지 않음(중립화)
- [ ] 내부 전략어(대학 언번들링·AI 네이티브 탤런트 등) 사용자 노출 0건 → 번역 카피만
- [ ] Luma UI 클론 아님 (패턴 차용, 자체 디자인)
- [ ] `unlisted` proposal이 Discover 집계·노출에 새지 않음
- [ ] 신뢰 고지(최소 공식 오인 방지) 노출 + `/disclosure` 링크 존재

---

## 10. Phase 매핑 (PRD 21절)

| 요소 | Phase |
|------|-------|
| `/discover`·`/c/[category]` 화면 + 카테고리/인기트립/커뮤니티 블록 | **Phase 1** (Static/Manual MVP) |
| DiscoverCategory 시드(6종) + 데모 커뮤니티 3건 public 노출 | **Phase 1** |
| 참여의향 집계 기반 인기 정렬 | **Phase 1** (InterestSignal 수집이 Phase 1) |
| 커뮤니티 구독 영속화·알림 | **Phase 1 범위 확인 / 후순위 가능** (B1·열린질문 1) |
| 카테고리별 자동 추천·개인화 | **Phase 4** (Performance Learning — 커뮤니티별 의도/취향 패턴) |
