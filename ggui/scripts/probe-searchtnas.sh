#!/usr/bin/env bash
# GGUI agent 백엔드에 직접 prompt를 보내고 SSE 스트림을 캡처해
# searchTnas 호출/결과와 ggui_render 발생 여부를 검증하는 프로브.
# (브라우저 클릭 대신 결과를 정확히 잡기 위함)
set -uo pipefail

AGENT="http://localhost:6790"
PROMPT="${1:-서울 클래스, 서울 투어 같은 실제 마이리얼트립 액티비티 상품을 검색해서 후보 카드로 보여줘}"
OUT="/tmp/ggui_probe_$(date +%H%M%S).sse"

echo "=== 1) guest 토큰 발급 (POST /auth/guest) ==="
TOKEN=$(curl -s -m 10 -X POST "$AGENT/auth/guest" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("guestToken",""))' 2>/dev/null)
if [ -z "$TOKEN" ]; then echo "토큰 발급 실패"; exit 1; fi
echo "토큰 OK (len=${#TOKEN})"

echo ""
echo "=== 2) prompt 전송 + SSE 캡처 (최대 120s) ==="
echo "prompt: $PROMPT"
curl -sN -m 120 -X POST "$AGENT/agent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"kind":"chat","prompt":sys.argv[1]}))' "$PROMPT")" \
  > "$OUT"
echo "SSE 저장: $OUT ($(wc -l < "$OUT") lines)"

echo ""
echo "=== 3) 이벤트 타입 분포 ==="
grep -E '^event: ' "$OUT" | sort | uniq -c

echo ""
echo "=== 4) tool_use 호출된 도구 이름 ==="
python3 - "$OUT" <<'PY'
import sys,json
seen=[]
errs=[]
texts=[]
for raw in open(sys.argv[1]).read().split("\n\n"):
    data=None
    for line in raw.split("\n"):
        if line.startswith("data: "): data=line[6:]
    if not data: continue
    try: p=json.loads(data)
    except: continue
    # assistant tool_use
    msg=p.get("message",{})
    for b in (msg.get("content") or []):
        if isinstance(b,dict):
            if b.get("type")=="tool_use":
                seen.append(b.get("name"))
            if b.get("type")=="text" and b.get("text"):
                texts.append(b["text"][:300])
            if b.get("type")=="tool_result":
                ic=b.get("content")
                s=json.dumps(ic)[:500] if ic else ""
                if b.get("is_error"): errs.append(("RESULT_ERR",s))
print("tool_use 호출:", seen if seen else "(없음)")
print("---")
print("is_error 결과:", errs if errs else "(없음)")
print("---")
print("assistant 텍스트 일부:")
for t in texts[:6]:
    print("  >", t.replace("\n"," "))
PY

echo ""
echo "=== 5) searchTnas / ggui_render / 권한에러 키워드 grep ==="
echo "[searchTnas]"; grep -c "searchTnas" "$OUT"
echo "[ggui_render]"; grep -c "ggui_render" "$OUT"
echo "[permission/granted 에러]"; grep -ciE "haven't granted|requested permission|permission" "$OUT"
echo "[success:true]"; grep -c '"success":true' "$OUT"
echo ""
echo "프로브 완료. 원본: $OUT"
