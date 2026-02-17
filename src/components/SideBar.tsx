import { NavLink } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { TbRosetteDiscount } from "react-icons/tb";
import { LuBadgeDollarSign } from "react-icons/lu";
import { MdOutlineToggleOn } from "react-icons/md";

const MENU = [
  { to: "/", label: "홈 화면", icon: <FiHome size={18} /> },
  { to: "/event", label: "행사", icon: <IoCalendarNumberOutline size={18} /> },
  { to: "/coupon", label: "쿠폰", icon: <TbRosetteDiscount size={18} /> },
  { to: "/feature-flags", label: "피처 플래그", icon: <MdOutlineToggleOn size={18} /> },
  { to: "/point", label: "포인트", icon: <LuBadgeDollarSign size={18} /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside
      className="fixed left-0 top-[85px] bottom-0 z-40 w-[220px] bg-white">
        <ul className="space-y-1">
          {MENU.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 w-full px-3 h-11
                  transition-colors
                  ${isActive
                    ? "bg-[#F2F3F8] text-black"
                    : "text-black hover:bg-gray-50"}
                `
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
    </aside>
  );
};

export default Sidebar;
