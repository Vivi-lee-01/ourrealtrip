import type { NextConfig } from "next";

// 아워리얼트립 Next 설정
//
// transpilePackages: @ggui-ai/* 와 @mcp-ui/client 는 (Vite 생태계 출신) 트랜스파일
// 안 된 모던 ESM 으로 배포된다. Next 번들러가 직접 컴파일하도록 명시해야
// `next build` 가 깨지지 않는다. (설치 안 된 패키지를 넣어도 무해 — 매칭만 안 됨)
//
// NOTE: Vercel 서버리스(ESM) 런타임의 "__dirname is not defined" 500 은
//   여기(webpack config)서 고칠 수 없다. 원인 청크(ua-parser-js 등 ncc 사전번들)는
//   Next 가 vendored 한 별도 컴파일 산출물이라 webpack config 의 plugins·node 옵션·
//   serverExternalPackages 가 닿지 않는다(실측 확인). 대신 빌드 직후 `.next/server` 의
//   방출 파일을 직접 패치한다 → scripts/patch-dirname.mjs (package.json build 에 연결).
const nextConfig: NextConfig = {
  transpilePackages: [
    "@ggui-ai/react",
    "@ggui-ai/protocol",
    "@ggui-ai/iframe-runtime",
    "@ggui-ai/shared",
    "@ggui-ai/wire",
    "@ggui-ai/preview-a2ui",
    "@mcp-ui/client",
  ],
};

export default nextConfig;
