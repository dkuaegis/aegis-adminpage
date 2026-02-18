import { Routes, Route } from 'react-router-dom';
import { ToastContainer, Bounce } from 'react-toastify';
import Home from './page/home';
import Login from './page/login';
import Event from './page/event';
import Coupon from './page/coupon';
import FeatureFlagsPage from './page/feature-flags';
import MemberDemotionPage from './page/member-demotion';
import MemberManagementPage from './page/member-management';
import PointPage from './page/point';
import NotFound from './page/notfound';

const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/event' element={<Event />} />
        <Route path='/coupon' element={<Coupon />} />
        <Route path='/feature-flags' element={<FeatureFlagsPage />} />
        <Route path='/member-demotion' element={<MemberDemotionPage />} />
        <Route path='/member-management' element={<MemberManagementPage />} />
        <Route path='/point' element={<PointPage />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
    </>
  );
};

export default App;
