export interface AdminCoupon {
  couponId: number;
  couponName: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponCode {
  codeCouponId: number;
  couponId: number;
  couponName: string;
  code: string;
  description: string | null;
  isValid: boolean;
  issuedCouponId: number | null;
  usedAt: string | null;
  createdAt: string;
}

export interface AdminIssuedCoupon {
  issuedCouponId: number;
  couponId: number;
  couponName: string;
  discountAmount: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  isValid: boolean;
  paymentId: number | null;
  usedAt: string | null;
  createdAt: string;
}

export interface AdminMemberSummary {
  memberId: number;
  studentId: string | null;
  name: string;
  email: string;
  role: string;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  errorName?: string;
}
