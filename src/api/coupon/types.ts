export interface AdminCoupon {
  couponId: number
  couponName: string
  discountAmount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCouponCode {
  codeCouponId: number
  couponId: number
  couponName: string
  code: string
  description: string | null
  isValid: boolean
  issuedCouponId: number | null
  usedAt: string | null
  createdAt: string
}

export interface AdminIssuedCoupon {
  issuedCouponId: number
  couponId: number
  couponName: string
  discountAmount: number
  memberId: number
  memberName: string
  memberEmail: string
  isValid: boolean
  paymentId: number | null
  usedAt: string | null
  createdAt: string
}

export interface AdminMemberSummary {
  memberId: number
  studentId: string | null
  name: string
  email: string
  role: string
}

export interface AdminCouponPageResponse {
  content: AdminCoupon[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface AdminCouponCodePageResponse {
  content: AdminCouponCode[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface AdminIssuedCouponPageResponse {
  content: AdminIssuedCoupon[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export type { ApiResult } from "@/lib/http/types"
