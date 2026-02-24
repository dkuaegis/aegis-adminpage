import { Route, Routes } from "react-router-dom";

import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { Toaster } from "@/components/ui/sonner";
import Coupon from "@/page/coupon";
import Event from "@/page/event";
import FeatureFlagsPage from "@/page/feature-flags";
import Home from "@/page/home";
import Login from "@/page/login";
import MemberDemotionPage from "@/page/member-demotion";
import MemberManagementPage from "@/page/member-management";
import NotFound from "@/page/notfound";
import PaymentPage from "@/page/payment";
import PointPage from "@/page/point";

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/event" element={<Event />} />
          <Route path="/coupon" element={<Coupon />} />
          <Route path="/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="/member-demotion" element={<MemberDemotionPage />} />
          <Route path="/member-management" element={<MemberManagementPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/point" element={<PointPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default App;
