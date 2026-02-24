interface ResolveAdminErrorMessageOptions {
  overrides?: Record<string, string>;
  fallback?: string;
}

const DEFAULT_ADMIN_ERROR_MESSAGES: Record<string, string> = {
  BAD_REQUEST: "요청 값이 올바르지 않습니다.",
  INVALID_INPUT_VALUE: "입력값이 올바르지 않습니다.",
  INVALID_ENUM: "요청 값이 올바르지 않습니다.",
  MEMBER_NOT_FOUND: "회원을 찾을 수 없습니다.",
  UNAUTHORIZED: "인증이 필요합니다.",
  FORBIDDEN: "권한이 없습니다.",
};

export function resolveAdminErrorMessage(
  errorName?: string,
  options?: ResolveAdminErrorMessageOptions
): string {
  const fallback = options?.fallback ?? "요청 처리에 실패했습니다.";

  if (!errorName) {
    return fallback;
  }

  if (options?.overrides?.[errorName]) {
    return options.overrides[errorName];
  }

  return DEFAULT_ADMIN_ERROR_MESSAGES[errorName] ?? fallback;
}
