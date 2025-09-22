import { useEffect } from 'react';
import { Members } from '../api/auth/members';

interface UseSessionKeepAliveOptions {
  enabled?: boolean;
  intervalMs?: number; // 기본 10초 (검증용)
  immediate?: boolean; // 마운트 시 즉시 1회 호출
  onUnauthorized?: () => void; // 401/403 등 인증 실패 시 핸들러
}

/**
 * 세션 유지(Keep-Alive)를 위해 주기적으로 `/members`를 호출합니다.
 * QR 스캐너 모달이 열려있는 동안만 활성화하도록 컴포넌트에서 `enabled`를 제어하세요.
 */
export function useSessionKeepAlive({
  enabled = true,
  intervalMs = 10_000,
  immediate = true,
  onUnauthorized,
}: UseSessionKeepAliveOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let inFlight = false;

    const ping = async () => {
      if (inFlight || !active) return;
      inFlight = true;
      try {
        const ok = await Members();
        if (active && ok === false) {
          onUnauthorized?.();
        }
      } catch {
        // 네트워크 오류 등은 조용히 무시하고 다음 틱에 재시도
      } finally {
        inFlight = false;
      }
    };

    if (immediate) {
      // 즉시 1회 호출로 세션을 빠르게 연장
      void ping();
    }

    const timer = window.setInterval(ping, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs, immediate, onUnauthorized]);
}
