import { useCallback, useEffect, useRef, useState } from "react"
import QrScanner from "qr-scanner"

import { GetQRCode } from "@/api/activity/get-qrcode"
import { PostMemberActivities } from "@/api/activity/post-memebr-activities"
import { Button } from "@/components/ui/button"
import { useSessionKeepAlive } from "@/hooks/useSessionKeepAlive"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showError, showSuccess } from "@/utils/alert"

interface QRScannerProps {
  onClose: () => void
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)

  const isProcessingRef = useRef(false)
  const lastProcessedQR = useRef("")
  const lastScanTime = useRef(0)
  const isThrottled = useRef(false)

  const resetProcessingState = useCallback((delayMs: number) => {
    window.setTimeout(() => {
      isProcessingRef.current = false
      isThrottled.current = false
      lastProcessedQR.current = ""
      lastScanTime.current = 0
      setIsProcessing(false)
    }, delayMs)
  }, [])

  const onScanResult = useCallback(
    async (result: QrScanner.ScanResult) => {
      const uuid = result.data
      const currentTime = Date.now()

      if (isProcessingRef.current || isThrottled.current) {
        return
      }

      if (lastProcessedQR.current === uuid || currentTime - lastScanTime.current < 1000) {
        return
      }

      isProcessingRef.current = true
      isThrottled.current = true
      lastProcessedQR.current = uuid
      lastScanTime.current = currentTime
      setIsProcessing(true)

      try {
        const storedActivityId = localStorage.getItem("currentActivityId")
        if (!storedActivityId) {
          showError("활동 ID를 찾을 수 없습니다.")
          resetProcessingState(0)
          return
        }

        const qrResult = await GetQRCode(uuid)
        if (!qrResult.ok || !qrResult.data) {
          showError(
            resolveAdminErrorMessage(qrResult.errorName, {
              fallback: "QR 코드를 새로고침 후 다시 시도하세요.",
            }),
          )
          resetProcessingState(0)
          return
        }

        const submitResponse = await PostMemberActivities(Number(storedActivityId), qrResult.data.memberId)
        if (!submitResponse.ok) {
          switch (submitResponse.status) {
            case 400:
              showError("잘못된 요청입니다. 관리자에게 문의해주세요.")
              break
            case 404:
              showError("해당 활동 또는 회원을 찾을 수 없습니다. 관리자에게 문의해주세요.")
              break
            case 409:
              showError("이미 참여한 활동입니다.")
              break
            default:
              showError(
                resolveAdminErrorMessage(submitResponse.errorName, {
                  fallback: "요청 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.",
                }),
              )
              break
          }
          resetProcessingState(0)
          return
        }

        showSuccess(`${qrResult.data.name}님이 참석했습니다.`)
        resetProcessingState(1000)
      } catch (error) {
        console.error("QR 코드 처리 중 오류 발생:", error)
        showError("QR 코드 처리 중 오류가 발생했습니다. 다시 시도해주세요.")
        resetProcessingState(0)
      }
    },
    [resetProcessingState],
  )

  useSessionKeepAlive({
    enabled: true,
    intervalMs: 60_000,
    immediate: true,
    onUnauthorized: () => {
      showError("세션이 만료되었습니다. 다시 로그인해주세요.")
      onClose()
      window.location.href = "/login"
    },
  })

  useEffect(() => {
    if (!videoRef.current) {
      return
    }

    const scanner = new QrScanner(videoRef.current, onScanResult, {
      highlightScanRegion: true,
      highlightCodeOutline: true,
      preferredCamera: "environment",
    })

    scannerRef.current = scanner

    scanner.start().catch((error) => {
      console.error("QR Scanner Error:", error)
      showError("카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.")
    })

    return () => {
      const activeScanner = scannerRef.current
      scannerRef.current = null
      if (!activeScanner) {
        return
      }
      activeScanner.stop()
      activeScanner.destroy()
    }
  }, [onScanResult])

  const handleRefreshCamera = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) {
      showError("카메라를 초기화하는 중입니다. 잠시 후 다시 시도하세요.")
      return
    }

    try {
      await scanner.stop()
      await scanner.start()
      showSuccess("카메라가 새로고침 되었습니다!")
    } catch (error) {
      console.error("Camera refresh error:", error)
      showError("카메라 새로고침 중 오류가 발생했습니다.")
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-muted">
        <video ref={videoRef} className="aspect-video w-full" />
      </div>

      <p className="text-sm text-muted-foreground">
        {isProcessing ? "처리 중..." : "QR 코드를 카메라에 비춰주세요."}
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handleRefreshCamera}>
          카메라 새로고침
        </Button>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  )
}

export default QRScannerComponent
