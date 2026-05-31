"use client";

// @ggui-ai/react 의 useMcpAppsChat 은 @tanstack/react-query 를 peer 로 요구한다.
// 작업대 컴포넌트를 이 Provider 로 감싸 QueryClient 컨텍스트를 제공한다.
// create 화면 한정 client 경계 — 전역 layout 을 건드리지 않는다.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  // 컴포넌트 수명 동안 단일 인스턴스 유지(리렌더마다 새로 만들지 않음)
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
