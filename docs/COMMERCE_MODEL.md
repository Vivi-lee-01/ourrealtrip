# OurRealTrip / 아워리얼트립 — Commerce Model (공동 여행 장바구니)

> 이 문서는 `PRD.md`(단일 진실 원천) v2.0의 2-A·6·9·16·17·21절을 **구현 가능한 커머스 모델 사양**으로 내린 것이다.
> 충돌 시 PRD가 우선이며, 본 문서는 PRD를 플로우·계약으로 구체화한 것이다.
> 대상 단계: **Phase 1 (Static / Manual MVP + 공동 장바구니 core UX)**. Phase 2~4 진입점은 각 절 말미에 표시한다.

---

## 0. 한 줄 정의

아워리얼트립의 커머스는 **"공동 여행 장바구니(코디네이션 뷰) + 각자 예약 가이드 + 그룹 진행현황"**이다.
장바구니는 **함께 보기 surface**이지 체크아웃이 아니며, **아워리얼트립은 어떤 경우에도 결제를 받지 않는다.**

```
그룹이 한 옵션으로 수렴
        ↓
수렴 옵션의 ProductLink 묶음 = "우리 여행 장바구니" (함께 보기 뷰)
        ↓
멤버 전원이 동일 장바구니를 봄 (1인 예상총액 / 포함내역 / "N명이 담음")
        ↓
항목별 "내 예약" → /go/[product_link_id] (제휴 redirect) → 판매처에서 각자 결제
        ↓
복귀 후 "예약 완료" 자가표시 → BookingProgress 갱신 → 그룹 진행현황
```

---

## 1. no-merchant 경계 (가장 중요 — 절대 침범 금지)

### 1-1. 왜 merchant가 아닌가

마이리얼트립은 **affiliate(상품검색 + `/v1/mylink` 제휴 딥링크)만** 제공한다. 장바구니/주문생성/묶음결제 API가 **없다**(PRD 18절 실측 기준). 따라서:

- 아워리얼트립이 결제를 받으면 → **여행업 등록 + PG 계약 + 배상책임**이 필요한 다른 회사가 된다.
- 호스트가 멤버 돈을 받아 대신 결제하면 → **타인 돈 수취(정산)** = 동일한 규제 영역 진입.
- 여러 상품을 한 번에 결제하는 버튼을 만들면 → 마이리얼트립에 그런 API가 없으므로 **구현 불가능할 뿐 아니라**, 만든다면 우리가 merchant를 자처하는 셈이 된다.

### 1-2. 경계선 표 (DO / DON'T)

| 영역 | DO (Phase 1~4 모두 허용) | DON'T (절대 금지) |
|------|--------------------------|-------------------|
| 결제 | 판매처에서 **각자·상품별**로 결제 | 아워리얼트립이 결제 수취 / PG 연동 |
| 묶음 | ProductLink 묶음을 **함께 보기 뷰**로 표시 | **단일 묶음결제 / 묶음 단일결제 버튼** |
| 정산 | 없음 (돈이 우리/호스트를 거치지 않음) | **호스트 정산**(멤버 돈을 호스트가 수취·대납) |
| 주문 | 없음 (cart는 파생 뷰, 별도 테이블 없음) | 별도 cart 테이블 / 체크아웃 / 주문(order) 엔티티 |
| 진행 | **자가보고 + 클릭추적**으로 추적 | "예약 확정"·"결제 완료"를 **시스템이 보증** |
| 표기 | 마이리얼트립을 **출처/판매처**로 명시 | 마이리얼트립 **공식 서비스로 오인**되는 UI/문구 |
| 편성 | "참고용 편성(A/B/C 운영안)" | **패키지 상품 판매**로 오인되는 표현 |

### 1-3. 구조적 보장 (코드 레벨)

PRD/ARCHITECTURE의 negative-spec은 "주의해서 작성"이 아니라 **구조적으로 불가능**하게 막는다.

- ProductLink는 `product_type`(flight/stay/tna)별 **독립 카드 + 독립 CTA**로만 렌더 → 단일 "전체 예약" 버튼을 둘 자리 자체가 없음.
- 공통 `ui/Button`에 "전체 예약"·"패키지 구매"·"묶음결제" variant **자체가 존재하지 않음**.
- 결제 입력(카드/PG) UI·필드가 **코드베이스 어디에도 없음**. redirect 대상은 **항상 외부 판매처**.
- 금지 문구(`lib/copy/banned-phrases.ts`)에 `전체 예약하기`·`패키지 구매하기`·`이 일정 그대로 예약하기` 등 포함 → 빌드/테스트 가드(`assertNoBanned`)가 카피·OG·메타에 등장하면 실패시킴.
- BookingProgress는 `self_reported_booked`를 "참여자 **자가표시**"로만 기록 → 시스템이 결제를 확인했다고 주장하지 않음. 외부 검증(`externally_confirmed_booked`)은 MyRealTrip 전환 API 연결 전까지 코드상 도달 불가(PRD 9-9-3·18-5).

---

## 2. 공동 여행 장바구니 — 코디네이션 뷰 (체크아웃 아님)

### 2-1. 무엇인가

그룹이 한 `TravelOption`(A/B/C)으로 **수렴**하면, 그 옵션의 `ProductLink` 묶음이 **"우리 여행 장바구니"**로 표시된다. 이 장바구니는:

- **코디네이션 / 함께 보기 뷰**다 — "우리가 이 안으로 간다"를 한 화면에서 같이 보는 것.
- **체크아웃이 아니다** — 담기/결제/주문 버튼이 없다.
- **멤버 전원이 동일한 내용을 본다** — 개인별 cart가 아니라 그룹 공용 뷰.

### 2-2. 장바구니가 보여주는 것

| 표시 항목 | 출처 | 비고 |
|-----------|------|------|
| 1인 예상총액 | 수렴 옵션 ProductLink들의 `price_hint` 합산(범위) | "예상"이며 확정가 아님. `checked_at` 병기 |
| 포함내역 (항공/숙소/TNA) | 옵션의 ProductLink들을 `product_type`별 그룹 | 각 항목은 독립 — 묶음 상품이 아님 |
| "N명이 이 안을 담음" | `InterestSignal(voted_option)` 집계 | 소셜프루프. "N Going" 차용 |
| 각 상품 카드 | ProductLink(source/title/price_hint/caution/checked_at) | 항목별 "내 예약" CTA → `/go` |
| 진행현황 요약 | BookingProgress 집계 | "자가보고 + 클릭추적 기준" 명시 |
| 고지 | 7번째 고지 (장바구니 함께보기용, 4절) | 장바구니 뷰 안에 항상 노출 |

### 2-3. Cart는 파생 뷰 (별도 테이블 아님)

> PRD 9-12 / 14절: **별도 cart 테이블·체크아웃·주문 엔티티를 만들지 않는다(merchant 아님).**

Cart는 다음 3개로 **계산되는 파생 뷰**다:

```
Cart(proposal) = 수렴된 option_id
               + InterestSignal(response_type='voted_option') 집계   ← "N명이 담음"
               + BookingProgress(option_id 기준) 집계                ← 항목별 진행 상태
```

- "수렴된 option_id"는 별도 컬럼이 아니라 **vote 집계 1위 옵션** 또는 호스트가 `booking_open`에서 지정한 옵션으로 정의한다(Phase 1: 호스트 지정 우선, 미지정 시 vote 1위 폴백).
- 별도 cart 테이블이 없으므로 "cart에 담기" 같은 mutation도 없다. "담음"은 **그 옵션에 vote(`voted_option`)**한 것과 동치다.

---

## 3. 각자 예약 가이드 (Shared cart, individual booking)

### 3-1. 항목별 플로우 (참여자 관점)

```
1. 멤버가 장바구니에서 항목(예: 항공)의 "내 예약" 버튼 클릭
2. /go/[product_link_id] 로 이동
      → ClickEvent INSERT (best-effort)
      → BookingProgress.status = 'clicked' 로 upsert (해당 세션·항목)
      → 302 redirect (mylink_url 우선, 없으면 source_url = 외부 판매처)
3. 멤버가 판매처에서 각자 결제 (아워리얼트립은 관여하지 않음)
4. 멤버가 장바구니로 복귀 → 해당 항목 "예약 완료" 자가표시
      → BookingProgress.status = 'self_reported_booked' 로 upsert
5. 그룹 진행현황(BookingProgress 집계)이 갱신됨
```

- 항공/숙소/TNA는 **각각 독립 CTA**다. 한 번에 모두 예약하는 단일 버튼은 없다(1-3절 구조적 보장).
- 결제·예약은 **상품별·각자·판매처에서**만 일어난다.
- "예약 완료"는 **참여자 자가표시**일 뿐 — 시스템이 실제 결제를 확인한 것이 아니다(affiliate 한계).

### 3-2. 상태 전이 (BookingProgress.status — Booking Signal Sync 7-state)

> 전체 정의·source/confidence·외부검증 게이트는 **PRD 9-9**가 SSOT. 여기서는 커머스 플로우 관점의 전이만 다룬다.

```
pending ──(/go 클릭)──▶ clicked_booking_link ──(예약하러 감)──▶ booking_intent
   │                          │                                    │
   │                          └────────(참여자 "예약했어요" 자가표시)────────┐
   │                                                                         ▼
   └─────────────(클릭/의사 없이 바로 자가표시도 허용)──────────▶ self_reported_booked
                                                                             │
                                              (호스트가 수동 확인)──────────▶ host_confirmed_booked
                                                                             │
                          (MyRealTrip 전환 API/postback — 현재 미연결)──────▶ externally_confirmed_booked
   (어느 상태에서든 분기) ──────────────────────────────────────────▶ cancelled_or_refunded
```

| status | 의미 | 트리거 | source / confidence |
|--------|------|--------|---------------------|
| `pending` | 미진행 (행 미존재도 pending 간주) | 기본값 | internal / low |
| `clicked_booking_link` | `/go/[product_link_id]` redirect 발생 | `/go` Route Handler | redirect_tracking / medium |
| `booking_intent` | 예약하러 감/예약 예정 자가표시 | `POST /api/booking-progress` | participant_self_report / medium |
| `self_reported_booked` | 참여자 "예약했어요" 자가표시 | `POST /api/booking-progress` | participant_self_report / medium |
| `host_confirmed_booked` | 호스트가 참여자 예약완료 수동 확인 | host 액션(dashboard) | host_manual / high |
| `externally_confirmed_booked` | MyRealTrip 전환 API로 검증된 결제완료 | **외부 ingestion 전용(PRD 18-5, 현재 stub)** | external_api / verified |
| `cancelled_or_refunded` | 취소/환불 확인 | 자가/호스트/외부 | (출처별) |

전이 규칙:
- 단조 전진이 기본. `clicked_booking_link`·`booking_intent` 없이 바로 `self_reported_booked`도 허용(다른 기기/직접 검색 케이스).
- 완료·검증된 상위 상태(`self_reported_booked`/`host_confirmed_booked`/`externally_confirmed_booked`)는 `/go` 자동 `clicked_booking_link` 기록으로 **되돌리지 않는다**(updated_at만 갱신).
- 자가표시 취소(`self_reported_booked → booking_intent` 또는 `clicked_booking_link` 역행)는 참여자가 잘못 눌렀을 때 허용. `pending` 직접 역행은 두지 않는다.
- `cancelled_or_refunded`는 어느 상태에서든 분기 가능.
- ⚠️ **`externally_confirmed_booked`는 자가표시 API·`/go`·호스트 확인 어디서도 세팅 불가**. 외부 ingestion(PRD 18-5)을 통해서만 도달. 시스템은 외부 검증 전에 "결제완료"를 단정하지 않는다.
- ⚠️ **`host_confirmed_booked`도 외부 검증이 아니다** — 호스트의 사람 판단이며, 화면에 "호스트 확인(자가보고 기반)"으로 출처를 표시한다.

---

## 4. 7번째 고지 (장바구니 함께보기용 — v2 신규)

### 4-1. 정식 문구 (단일 출처에 추가할 텍스트)

PRD 17-1의 **7번째 필수 고지**:

```
장바구니는 함께 보기용입니다. 결제·예약은 각 판매처에서 개별적으로 진행되며,
아워리얼트립은 결제를 받지 않습니다.
```

### 4-2. 구현 지시 (lib/copy 단일 출처 원칙)

> 본 문서는 사양이며 코드를 직접 수정하지 않는다. 아래는 Phase 1 구현 시 따라야 할 지시다.

- `lib/copy/disclosures.ts`의 `DISCLOSURES` 배열에 **`id: 7`** 항목으로 위 문구를 추가한다.
- 파일 상단 주석 "필수 고지 **6종**"을 "**7종**"으로 갱신한다(PRD 17-1과 정합).
- `/disclosure` 페이지는 이 배열을 그대로 렌더하므로 7종 전체가 자동 노출된다.
- **공동 장바구니 뷰 안에는 7번째 고지를 항상 노출**한다(배너의 `CORE_DISCLOSURE_IDS`와 별개로, 장바구니 섹션 전용 고지로 마운트).
- 문구는 이 단일 출처에서만 나온다 — 장바구니 컴포넌트에 하드코딩 금지.

### 4-3. 고지 7종 전체 (참고)

| # | 고지 |
|---|------|
| 1 | 아워리얼트립은 마이리얼트립 공식 서비스가 아닙니다. |
| 2 | 일부 링크를 통해 예약이 발생할 경우 운영자에게 수익이 발생할 수 있습니다. |
| 3 | 상품 가격과 예약 가능 여부는 확인 시점 이후 변경될 수 있습니다. |
| 4 | 아워리얼트립은 항공·숙소·투어 상품을 직접 판매하거나 예약을 대행하지 않습니다. |
| 5 | 조합형 여행안은 참고용 편성이며 패키지 상품이 아닙니다. |
| 6 | 각 상품은 판매처에서 독립적으로 확인하고 구매합니다. |
| **7** | **장바구니는 함께 보기용입니다. 결제·예약은 각 판매처에서 개별적으로 진행되며, 아워리얼트립은 결제를 받지 않습니다.** |

---

## 5. BookingProgress 엔티티 (PRD 9-9)

> 그룹이 수렴한 옵션에 대해 각 참여자가 항목별로 어디까지 진행했는지 추적한다. affiliate 구조라 실제 결제확인 불가 → **자가보고 + 클릭추적** 기준.

| 필드 | 타입힌트 | 설명 |
|------|----------|------|
| `progress_id` | uuid PK | 진행 식별자 |
| `proposal_id` | uuid FK | 대상 제안 |
| `option_id` | uuid FK | 수렴된 옵션 |
| `product_link_id` | uuid FK | 대상 상품 링크 |
| `participant_session_id` | text | 익명 세션 식별자 (확정 결정 1·4) |
| `status` | enum(7-state, PRD 9-9-1) | 진행 상태 |
| `source` | enum(PRD 9-9-2) | 신호 출처 |
| `confidence` | enum(`low`/`medium`/`high`/`verified`) | 신뢰도. verified는 source=external_api에서만 |
| `note` | text? | host_confirmed/external 입력 근거(선택) |
| `updated_at` | timestamptz | 갱신 시각 |

### 5-1. 유니크 키 / upsert 단위

- 한 참여자의 한 상품 진행은 **(`participant_session_id`, `product_link_id`)** 단위로 유일하다.
- `/go` 클릭과 자가표시는 모두 이 키로 **upsert**한다(없으면 insert, 있으면 status·updated_at 갱신).
- `proposal_id`·`option_id`는 product_link로부터 파생 가능하지만, 집계/RLS 단순화를 위해 행에 함께 저장한다.

### 5-2. 집계 (그룹 진행현황 / Host dashboard)

- **항목별**: `product_link_id`별 status 분포 → "항공: 3명 예약 완료 / 2명 클릭 / 1명 미진행".
- **옵션별**: `option_id`별 self_reported_booked / host_confirmed_booked / externally_confirmed_booked 참여자 비율 → host dashboard 카트/예약 진행현황(PRD 11절). 각 비율은 출처/신뢰도와 함께 표시.
- 모든 집계 표시에 **"참여자 자가보고 + 클릭추적 기준"** 문구를 병기한다(실 결제확인 불가 명시).

---

## 6. `/api` 계약 — booking-progress

> 기존 계약과 정합: `/api/rsvp`(POST, `{ ok, signal_id }`), `/go/[product_link_id]`(GET, 302).
> 익명 세션은 `participant_session_id` HttpOnly 쿠키(없으면 `crypto.randomUUID()` 발급, body는 안전망).
> **Phase 1은 `lib/store/local`(로컬 JSON)에 기록** — Supabase 호출 없음(향후 anon insert/upsert로 swap).

### 6-1. `POST /api/booking-progress` — 자가표시(예약 완료/취소)

참여자가 장바구니에서 항목별 "예약 완료"를 자가표시할 때 호출한다.

**Request body (application/json)**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `proposal_id` | string | ✅ | 대상 제안 |
| `product_link_id` | string | ✅ | 대상 상품 링크 |
| `option_id` | string | ✅ | 수렴된 옵션 |
| `status` | `"booking_intent"` \| `"self_reported_booked"` \| `"clicked_booking_link"` \| `"cancelled_or_refunded"` | ✅ | 참여자 자가표시 상태. `pending`·`host_confirmed_booked`·`externally_confirmed_booked`는 이 API로 지정 불가(400) |
| `participant_session_id` | string | — | 쿠키 부재 시 안전망 (쿠키가 항상 우선) |

**검증 규칙**

- `proposal_id` / `product_link_id` / `option_id` 누락 → `400 { ok:false, error }`.
- `status`가 허용 4종(`booking_intent`/`self_reported_booked`/`clicked_booking_link`/`cancelled_or_refunded`) 외 값 → `400`. 특히 `pending`(미진행 강제 불가)·`host_confirmed_booked`(호스트 전용, 6-6)·`externally_confirmed_booked`(외부 ingestion 전용, PRD 18-5)는 이 API로 **절대 세팅 불가**.
- 익명 세션: 쿠키 우선 → body 안전망 → 신규 발급. 신규 발급 시 응답에 HttpOnly 쿠키 set(`/api/rsvp`와 동일 속성: `httpOnly`, `secure`(prod), `sameSite=lax`, `path=/`, maxAge 1년).

**동작**

- (`participant_session_id`, `product_link_id`) 키로 **upsert**. `updated_at = now()`. `source`는 자가표시이므로 항상 `participant_self_report`(`clicked_booking_link`만 redirect_tracking), `confidence`는 source 규칙으로 자동 산정(PRD 9-9-2).
- best-effort 아님 — 기록 실패 시 `500 { ok:false, error }`(자가표시는 사용자가 결과를 기대하는 명시적 행위).

**Response**

```json
// 200
{ "ok": true, "progress_id": "<uuid>", "status": "self_reported_booked", "source": "participant_self_report", "confidence": "medium" }
// 400 / 500
{ "ok": false, "error": "<메시지>" }
```

### 6-2. `GET /api/booking-progress?proposal_id=...` — 그룹 진행현황 조회

장바구니 뷰·host dashboard가 항목별 집계를 읽을 때 호출한다.

**Query**

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `proposal_id` | ✅ | 대상 제안 |
| `option_id` | — | 특정 수렴 옵션으로 필터 |

**Response (집계 형태 — 익명 보존, 세션 id 미노출)**

```json
// 200
{
  "ok": true,
  "basis": "참여자 자가보고 + 클릭추적 기준",
  "by_product_link": [
    {
      "product_link_id": "<uuid>",
      "product_type": "flight",
      "pending": 1,
      "clicked_booking_link": 2,
      "booking_intent": 1,
      "self_reported_booked": 3,
      "host_confirmed_booked": 1,
      "externally_confirmed_booked": 0,
      "cancelled_or_refunded": 0
    }
  ],
  "by_option": [
    { "option_id": "<uuid>", "self_reported_booked_participants": 4, "host_confirmed_participants": 2, "externally_confirmed_participants": 0, "total_participants": 6 }
  ]
}
```

- 응답에 **개별 `participant_session_id`를 노출하지 않는다**(집계 수치만). 참여자 익명성 보존(확정 결정 4).
- `basis` 필드를 항상 포함해 클라이언트가 "자가보고+클릭추적 기준" 문구를 강제로 함께 렌더하도록 한다. `externally_confirmed_*`가 0이 아닐 때만 "외부 검증" 문구를 추가로 노출한다.
- 본인의 항목별 상태(체크 표시 복원용)는 쿠키 세션 기준 **별도 조회**로 분리한다(아래 6-3).

### 6-3. `GET /api/booking-progress/me?proposal_id=...` — 내 진행 상태 (선택)

- 쿠키 `participant_session_id` 기준으로 **본인 행만** 반환(장바구니에서 내 체크 상태 복원용).
- 쿠키가 없으면 `{ ok:true, items: [] }`(아직 아무 진행 없음).

### 6-4. `/go`에서의 BookingProgress 갱신 (기존 라우트 확장)

> 새 API가 아니라 기존 `/go/[product_link_id]` 동작의 확장 지시.

- `/go` Route Handler는 ClickEvent INSERT에 더해, (`participant_session_id`, `product_link_id`) 키로 **BookingProgress upsert(status=`clicked_booking_link`, source=`redirect_tracking`)**를 best-effort로 수행한다.
- 단, **이미 더 진행된 상태(`booking_intent`/`self_reported_booked`/`host_confirmed_booked`/`externally_confirmed_booked`)인 행은 `clicked_booking_link`로 되돌리지 않는다**(재클릭 시 status 보존). `updated_at`만 갱신.
- 기존과 동일하게 기록 실패가 redirect를 막지 않는다(best-effort).

### 6-5. `POST /api/booking-progress/host-confirm` — 호스트 수동 확인 (host 전용)

> 호스트가 dashboard에서 특정 참여자/항목의 예약완료를 수동 확인할 때. **호스트 인증 영역**(Phase 1은 호스트 화면 한정, Phase 2는 Supabase Auth host RLS).

- body: `{ proposal_id, product_link_id, option_id, participant_session_id, status: "host_confirmed_booked" | "cancelled_or_refunded", note? }`.
- (`participant_session_id`, `product_link_id`) 키로 upsert, `source=host_manual`, `confidence=high`.
- ⚠️ `externally_confirmed_booked`는 이 엔드포인트로도 **세팅 불가**(외부 ingestion 전용, PRD 18-5). 호스트 확인은 "사람 판단"이며 외부 검증이 아니다 — 화면에 출처를 그렇게 표시한다.
- Phase 1은 미구현으로 둘 수 있으나(수동 확인 UI 후순위), 타입·스토어는 `host_manual` source 진입을 지원해야 한다.

### 6-6. Phase 진입점

- **Phase 1**: 위 계약을 `lib/store/local`(로컬 JSON)로 구현. RLS 없음.
- **Phase 2+**: 동일 계약을 유지한 채 backing을 Supabase로 swap. `booking_progress` 테이블 + RLS — anon은 **자기 세션 쿠키 값에 해당하는 행만** insert/upsert, select는 host(소유 proposal) + 집계 view. ClickEvent와 동일하게 위조 방지를 위해 집계 조회는 host 또는 익명화 view로 제한.

---

## 7. 핵심 루프에서의 위치 (PRD 5절 매핑)

| PRD 5절 단계 | 커머스 모델 대응 |
|--------------|------------------|
| 5. `booking_open` + 그룹이 한 옵션으로 수렴 | 수렴 옵션 결정(호스트 지정 / vote 1위) — Cart 파생 기준 확정 |
| 6. 수렴 옵션 ProductLink 묶음 = 공동 장바구니 | 2절 코디네이션 뷰 표시 (멤버 전원 동일) |
| 7. 각자 독립 예약 + "예약 완료" 자가표시 | 3절 각자 예약 가이드 + `/go` + `/api/booking-progress` |
| 8. 클릭/자가보고 성과가 다음 제안에 반영 | 5-2절 집계 → host dashboard → 다음 option set 조정 |

---

## 8. negative-spec 자가 점검 체크리스트

구현·리뷰 시 아래가 **모두 참**이어야 한다.

- [ ] 결제 입력(카드/PG) UI·필드가 코드베이스에 **없다**.
- [ ] "전체 예약"·"묶음결제"·"패키지 구매"·"이 일정 그대로 예약" 버튼/카피가 **없다**(banned-phrases 가드 통과).
- [ ] 항공/숙소/TNA가 **각각 독립 CTA**로만 렌더된다(단일 합산 CTA 없음).
- [ ] 별도 cart 테이블 / 체크아웃 / 주문(order) 엔티티가 **없다**(cart는 파생 뷰).
- [ ] 호스트가 멤버 돈을 받는 경로가 **없다**(정산 없음).
- [ ] `/go` redirect 대상이 **항상 외부 판매처**(mylink_url 우선, 없으면 source_url)다.
- [ ] BookingProgress의 `self_reported_booked`가 "**자가표시**"임이 화면에 명시된다(시스템 결제확인 주장 없음).
- [ ] `externally_confirmed_booked`(외부 검증)는 자가표시·`/go`·호스트 확인 어디서도 세팅되지 않는다(외부 ingestion 전용, PRD 18-5). 미연결 상태에서 "결제완료(검증)" 배지가 뜨지 않는다.
- [ ] 모든 진행 신호에 **source/confidence**가 함께 렌더된다("예약완료(자가보고)" vs "예약완료(외부검증)" 구분).
- [ ] 공동 장바구니 뷰·집계에 **"참여자 자가보고 + 클릭추적 기준"** 문구가 병기된다.
- [ ] 7번째 고지가 `lib/copy/disclosures.ts` 단일 출처에서 나오며 장바구니 뷰에 노출된다.
- [ ] 마이리얼트립이 **출처/판매처**로만 표기되고 공식 서비스로 오인되지 않는다.
- [ ] `/api/booking-progress` 집계 응답에 개별 `participant_session_id`가 노출되지 않는다.
