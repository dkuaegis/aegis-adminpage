// 쿠키 삭제 함수
function deleteCookie(name: string, path: string = "/", domain?: string) {
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};`;

  if (domain) {
    cookieString += ` domain=${domain};`;
  }

  const cookieSetter = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "cookie"
  )?.set;
  cookieSetter?.call(document, cookieString);
}

// 모든 쿠키 삭제 함수
function deleteAllCookies() {
  const cookies = document.cookie.split(";");

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

    if (name) {
      // 다양한 경로와 도메인으로 쿠키 삭제 시도
      deleteCookie(name, "/");
      deleteCookie(name, "/", window.location.hostname);
      deleteCookie(name, "/", `.${window.location.hostname}`);
    }
  });
}

export async function logout(): Promise<boolean> {
  try {
    // 모든 쿠키 삭제
    deleteAllCookies();

    // 세션 스토리지와 로컬 스토리지도 정리
    sessionStorage.clear(); // 환영 메시지 플래그도 함께 삭제됨
    localStorage.removeItem("currentActivityId"); // 기존에 사용된 로컬스토리지 항목만 삭제

    // console.log("로그아웃 완료 - 모든 쿠키와 세션 정보가 삭제되었습니다.");
    return true;
  } catch (err) {
    console.error("로그아웃 처리 실패:", err);
    return false;
  }
}

// 특정 쿠키만 삭제하고 싶을 때 사용
export function logoutWithSpecificCookie(cookieName: string): boolean {
  try {
    deleteCookie(cookieName);
    // console.log(`쿠키 '${cookieName}'이(가) 삭제되었습니다.`);
    return true;
  } catch (err) {
    console.error("쿠키 삭제 실패:", err);
    return false;
  }
}
