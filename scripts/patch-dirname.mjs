#!/usr/bin/env node
// 아워리얼트립 — Vercel 서버리스(ESM) "__dirname is not defined" 500 fix (post-build patch)
//
// 왜 필요한가
//   Next 는 ua-parser-js 등 일부 의존성을 @vercel/ncc 로 사전번들해 자체 vendored 한다.
//   그 ncc 청크 안의 nested IIFE 가 모듈 팩토리 실행 시점에 `<v>.ab=__dirname+"/"` 를
//   **무조건 실행**한다. Vercel 서버 함수는 ESM 컨텍스트라 CJS 전역 __dirname 이 없어
//   요청 처리 중(=ua-parser 가 require 되는 시점) ReferenceError 가 나고 전 라우트가 500 이 된다.
//   (로컬 `next start` 는 CJS 라 __dirname 이 정의돼 통과 → 로컬만 OK 인 이유.)
//
// 왜 next.config webpack 으로 못 고치나 (실측)
//   해당 청크는 빌드 그래프 밖에서 복사되는 vendored 산출물이라 BannerPlugin /
//   config.node={__dirname:true} / serverExternalPackages 가 닿지 않는다. processAssets 훅도
//   이 청크를 못 본다. → 빌드가 .next 를 방출한 "뒤"에 파일을 직접 패치하는 것이 유일하게 닿는 지점.
//
// 무엇을 하나
//   .next/server 하위의 .js 파일 중 위험 패턴(`.ab=__dirname`)을 가진 파일 맨 앞에
//   __dirname/__filename polyfill 을 prepend 한다. typeof 가드라 CJS 실행(이미 정의됨)에는 무해.
//   멱등(idempotent) — 이미 패치된 파일은 건너뛴다. 빌드마다 새로 방출되므로 매 빌드 후 실행한다.

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const SERVER_DIR = path.join(process.cwd(), ".next", "server");

// 파일 스코프 최상단에 들어가는 polyfill. ESM 에서 bare __dirname 참조가
// 이 var 바인딩으로 해소되어 더는 throw 하지 않는다. CJS 에선 typeof 가드로 skip.
const MARKER = "/*__ort_dirname_polyfill__*/";
const PREPEND =
  MARKER +
  "if(typeof __dirname==='undefined'){var __dirname='/var/task';}" +
  "if(typeof __filename==='undefined'){var __filename='/var/task/index.js';}\n";

// 위험 패턴: ncc nested IIFE 의 무조건 실행 `<var>.ab=__dirname`
const RISK = /\.ab=__dirname/;

/** SERVER_DIR 아래 모든 .js 파일 경로 수집 */
async function collectJs(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await collectJs(full)));
    } else if (e.isFile() && e.name.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  // .next/server 가 없으면 (빌드 안 됨) 조용히 종료 — 빌드 파이프라인을 막지 않는다.
  try {
    await fs.access(SERVER_DIR);
  } catch {
    console.log("[patch-dirname] .next/server not found — skip");
    return;
  }

  const files = await collectJs(SERVER_DIR);
  let patched = 0;
  let skippedAlready = 0;
  const patchedNames = [];

  for (const file of files) {
    const src = await fs.readFile(file, "utf8");
    if (!RISK.test(src)) continue; // 위험 패턴 없으면 건드리지 않음
    if (src.startsWith(MARKER)) {
      skippedAlready += 1;
      continue; // 멱등
    }
    await fs.writeFile(file, PREPEND + src);
    patched += 1;
    patchedNames.push(path.relative(SERVER_DIR, file));
  }

  console.log(
    `[patch-dirname] patched ${patched} chunk(s)` +
      (skippedAlready ? `, ${skippedAlready} already patched` : "") +
      (patchedNames.length
        ? `\n[patch-dirname] files: ${patchedNames.join(", ")}`
        : ""),
  );
}

main().catch((err) => {
  // 빌드를 막지 않되, 실패는 분명히 표시
  console.error("[patch-dirname] FAILED:", err);
  process.exitCode = 1;
});
