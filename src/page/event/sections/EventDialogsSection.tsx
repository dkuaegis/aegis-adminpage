import type { Dispatch, FormEvent, SetStateAction } from "react";

import QRScannerComponent from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventDialogsSectionProps {
  showEditDialog: boolean;
  onShowEditDialogChange: Dispatch<SetStateAction<boolean>>;
  editingActivityId: number | null;
  eventName: string;
  onEventNameChange: Dispatch<SetStateAction<string>>;
  pointAmount: string;
  onPointAmountChange: Dispatch<SetStateAction<string>>;
  onSubmitEvent: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  qrActivityId: number | null;
  onCloseQR: () => void;
}

export const EventDialogsSection = ({
  showEditDialog,
  onShowEditDialogChange,
  editingActivityId,
  eventName,
  onEventNameChange,
  pointAmount,
  onPointAmountChange,
  onSubmitEvent,
  qrActivityId,
  onCloseQR,
}: EventDialogsSectionProps) => {
  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={onShowEditDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivityId ? "행사 수정" : "행사 생성"}
            </DialogTitle>
            <DialogDescription>
              {editingActivityId
                ? "수정하고 싶은 행사 정보를 입력해주세요."
                : "생성하고 싶은 행사 정보를 입력해주세요."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onSubmitEvent}>
            <div className="space-y-2">
              <Label htmlFor="event-name">행사 이름</Label>
              <Input
                id="event-name"
                value={eventName}
                onChange={(event) => onEventNameChange(event.target.value)}
                placeholder="행사 이름을 입력하세요"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="point-amount">포인트</Label>
              <Input
                id="point-amount"
                type="number"
                min={0}
                value={pointAmount}
                onChange={(event) => onPointAmountChange(event.target.value)}
                placeholder="포인트를 입력하세요"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onShowEditDialogChange(false)}
              >
                취소
              </Button>
              <Button type="submit">
                {editingActivityId ? "수정하기" : "생성하기"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qrActivityId !== null}
        onOpenChange={(open) => !open && onCloseQR()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QR 코드 스캔</DialogTitle>
            <DialogDescription>
              활동 ID {qrActivityId ?? "-"} 출석 체크를 진행합니다.
            </DialogDescription>
          </DialogHeader>
          {qrActivityId !== null && (
            <QRScannerComponent activityId={qrActivityId} onClose={onCloseQR} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
