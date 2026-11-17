# 台灣磁磚建材行 LINE 智慧辨識與報價助手

FITI 2027-1 local demo for a tile shop employee. Customers send a photo and rough size in a **LINE simulator**. Staff review evidence, ask a follow-up, and send a quote. The simulator is not an official LINE account.

Node.js **22** (see `.nvmrc`). No API keys. Dates use Asia/Taipei. Money is integer TWD.

## Setup

```bash
cd fiti-line-tile
cp .env.example .env
# Use an absolute SQLite path so Prisma and Next share one file:
echo "DATABASE_URL=\"file:$(pwd)/data/demo.db\"" > .env
echo 'LINE_ENABLED="false"' >> .env
echo 'OCR_PROVIDER="none"' >> .env
npm install
npm run setup
npm run dev
```

Demo: http://127.0.0.1:3000

Reset only synthetic shop data from the home page, or `npm run db:seed`.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:restart
npm run test:e2e
npm run build
```

## What the pipeline does

1. Normalize Traditional Chinese dimensions (`30 × 30 公分`, `300x300 mm`). Approximate and unitless values stay approximate or unknown.
2. Extract markings, finish, and quantity from text. Image OCR is an interface only. With `OCR_PROVIDER=none` the demo never invents a marking.
3. Compare photos with a 4×4 average-color layout (cosine). This is a ranking signal, not an identity.
4. Rank at most three catalog tiles and list agreeing and conflicting signals. A conflicting confirmed attribute blocks exact verification.
5. Draft the next question from the gap that separates the leaders (marking when photos look alike, a ruler measurement when size is approximate).
6. Recompute when a reply, photo, or staff edit arrives. Earlier rankings stay in the audit log.

Seeded scenarios use that same code: exact replacement (`inq-exact`), substitute (`inq-sub`), unresolved (`inq-open`).

## Optional LINE Messaging API

Leave `LINE_ENABLED=false` for the class demo. Simulator sends never call LINE.

When you have a real channel:

1. Create a Messaging API channel and set a webhook to `https://<host>/api/line/webhook`.
2. Set `LINE_ENABLED=true`, `LINE_CHANNEL_SECRET`, and `LINE_CHANNEL_ACCESS_TOKEN` on the server only.
3. The webhook checks `X-Line-Signature` against the raw body, stores `webhookEventId` for deduplication, and accepts one-to-one text and jpeg/png up to 5 MB.
4. Staff sends use the push API. A failed push stays unsent so a retry can run once. The quote is marked sent only after the adapter returns success.
5. Inbound files go to `data/private` and are not served from `public/`. Demo reset deletes synthetic inquiries and that folder. It does not delete inquiries marked as non-demo LINE traffic. Do not log user IDs or media. Delete private files when a real inquiry is closed; this prototype does not run a retention job.

Verified locally: signature check, disabled webhook (503), simulator send path, duplicate-send lock. Not verified: a live LINE channel, media download, or push delivery.

Official reference: https://developers.line.biz/en/reference/messaging-api/

## 90-second demo

1. Open the home page and start the exact-replacement case. The photo looks like the gray lookalike, so that SKU is first. Say the score is not a probability.
2. Send the drafted follow-up. In the LINE simulator, send the one-click reply with 300×300 mm and marking FT-A30.
3. Return to the inquiry. The beige SKU is now first. Confirm size, marking, and quantity, verify it, approve the quote, and send it.
4. Show the quote back in the simulator. If time remains, open the substitute case (discontinued wood, in-stock lighter substitute, customer must accept) or the unresolved case (size and photo conflict, no exact quote).
