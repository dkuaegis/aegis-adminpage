import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Flag,
  Home,
  Ticket,
  UserMinus,
  Users,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "홈 화면", icon: Home },
  { to: "/event", label: "행사", icon: CalendarDays },
  { to: "/coupon", label: "쿠폰", icon: Ticket },
  { to: "/member-management", label: "회원 관리", icon: Users },
  { to: "/feature-flags", label: "피처 플래그", icon: Flag },
  { to: "/member-demotion", label: "회원 강등", icon: UserMinus },
  { to: "/payment", label: "결제", icon: CreditCard },
  { to: "/point", label: "포인트", icon: BadgeDollarSign },
];
