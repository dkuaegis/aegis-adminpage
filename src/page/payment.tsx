import { AdminPageHeader } from "@/components/admin";

import { usePaymentPageState } from "./payment/hooks/usePaymentPageState";
import { PaymentManagementSection } from "./payment/sections/PaymentManagementSection";
import { TransactionManagementSection } from "./payment/sections/TransactionManagementSection";

const PaymentPage: React.FC = () => {
  const {
    yearSemesterOptions,
    paymentState,
    paymentActions,
    transactionState,
    transactionActions,
  } = usePaymentPageState();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="결제 관리"
        description="Payment 조회/강제 완료, Transaction 조회 기능을 제공합니다."
      />

      <PaymentManagementSection
        yearSemesterOptions={yearSemesterOptions}
        state={paymentState}
        actions={paymentActions}
      />
      <TransactionManagementSection
        yearSemesterOptions={yearSemesterOptions}
        state={transactionState}
        actions={transactionActions}
      />
    </div>
  );
};

export default PaymentPage;
