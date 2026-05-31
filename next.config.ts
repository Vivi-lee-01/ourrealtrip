import type { NextConfig } from "next";

// 아워리얼트립 Next 설정
//
// transpilePackages: @ggui-ai/* 와 @mcp-ui/client 는 (Vite 생태계 출신) 트랜스파일
// 안 된 모던 ESM 으로 배포된다. Next 번들러가 직접 컴파일하도록 명시해야
// `next build` 가 깨지지 않는다. (설치 안 된 패키지를 넣어도 무해 — 매칭만 안 됨)
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
  // Vercel 서버리스(ESM) 런타임 대응 — "__dirname is not defined" 500 fix.
  //
  // 근본 원인: Next 가 자체 vendored 한 ncc 사전번들 모듈(특히
  // next/dist/compiled/ua-parser-js)이 서버 청크 안에서 모듈 로드 시점에
  // `<local>.ab=__dirname+"/"` 를 **무조건 실행**한다. Vercel 서버 함수는 ESM
  // 컨텍스트라 CJS 전역 __dirname 이 없어 ReferenceError(500)가 전 라우트에서 난다.
  // (로컬 `next start` 는 CJS 라 __dirname 이 정의돼 있어 통과 → 로컬만 OK.)
  //
  // config.node = { __dirname: true } 와 serverExternalPackages 는 둘 다 실패한다:
  // 해당 __dirname 은 webpack 이 소스로 파싱하는 모듈이 아니라 이미 컴파일된
  // ncc 번들 문자열 안에 박혀 있어 webpack node polyfill 의 식별자 치환이 닿지 않는다.
  //
  // 해결: BannerPlugin(raw, entryOnly:false)로 모든 서버 청크 **최상단**에
  // __dirname/__filename 정의를 주입한다. 배너는 모듈 IIFE 보다 먼저 파일 스코프에
  // 실행되므로, 안쪽의 `.ab=__dirname` 참조가 이 var 바인딩으로 해소되어 더는 던지지 않는다.
  // 두 번째 인자의 `webpack` 은 Next 가 내부 번들한 webpack 인스턴스다.
  // 별도 'webpack' 패키지를 설치/import 하지 않아도 BannerPlugin 을 쓸 수 있다.
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.BannerPlugin({
          // 주석이 아닌 실행 코드로 삽입
          raw: true,
          // 엔트리뿐 아니라 모든 청크(shared chunks 포함)에 주입 — ua-parser 등은
          // 전 라우트 공유 청크에 들어가므로 entryOnly:false 가 필수.
          entryOnly: false,
          // 서버 .js 청크에만 (CSS/소스맵 제외)
          test: /\.js$/,
          // 이미 정의돼 있으면(CJS 실행) 그대로 두고, ESM 컨텍스트면 globalThis 기반으로 polyfill.
          banner:
            "if(typeof __dirname==='undefined'){var __dirname='/var/task';}" +
            "if(typeof __filename==='undefined'){var __filename='/var/task/index.js';}",
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
