# @ggui/mcp-host-create

Domain MCP server for the **host-create** flow — a host (a person creating a community travel event) asks the agent to draft/refine an event, and the agent echoes a validated structured payload back for the human to apply to the create-event form.

The structured payload mirrors `HostCreateAgentPayload` in the Next app (`lib/host-create/agentPayload.ts`). This server only **accepts + echoes + lints** data — no side effects, no merchant/booking behavior.

## Safety invariants (aworrealtrip is NOT a merchant)

- `product_links` are **display-only**: `price_hint` is a reference figure, booking happens per-seller on the external `source_url`.
- The agent only **drafts**: publishing / `booking_open` / external sharing are **human-approved**.
- Never use payment/booking-confirmation language; never set any `externally_confirmed_booked` state.

## Run

```bash
pnpm --filter @ggui/mcp-host-create start
```

Listens on `http://localhost:6783/mcp` by default (todo sample owns 6782). Override with `PORT` env or `--port`.

## Tools

| Tool                       | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `host_create_apply`        | Accept + echo a validated draft payload for the host to apply. No side effects. |
| `host_recommend_products`  | Return 1-4 display-only MyRealTrip-style product suggestions. No checkout. |
| `host_safety_check`        | Flag risky merchant/booking phrasing and suggest neutral rewrites.      |

## Validation

- Invalid `product_type` → coerced to `"tna"`.
- `product_links` capped at 10.
- `recruit_capacity` must be a positive integer.

Not published. Stateless, single-process. Domain MCP for the host-create demo.
