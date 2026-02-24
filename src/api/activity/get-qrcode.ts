import { requestApi } from './request';
import type { ApiResult, MemberInfo } from './types';

export async function GetQRCode(uuid: string): Promise<ApiResult<MemberInfo>> {
  return requestApi<MemberInfo>(`/admin/qrcode/${uuid}`, {
    method: 'GET',
  });
}
