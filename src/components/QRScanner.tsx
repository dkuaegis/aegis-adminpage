import { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { showSuccess, showError } from '../utils/alert';
import { GetQRCode } from '../api/activity/get-qrcode';
import { PostMemberActivities } from '../api/activity/post-memebr-activities';
import { useSessionKeepAlive } from '../hooks/useSessionKeepAlive';

interface QRScannerProps {
    onClose: () => void;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanner, setScanner] = useState<QrScanner | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const lastProcessedQR = useRef<string>('');
    const lastScanTime = useRef<number>(0);
    const isThrottled = useRef<boolean>(false);

    const handleClose = useCallback(() => {
        // 뒤로가기 버튼 클릭 시 카메라를 종료하지 않고 모달만 닫기
        onClose();
    }, [onClose]);

    // 세션 Keep-Alive: 60초마다 /members 호출로 세션 연장
    useSessionKeepAlive({
        enabled: true,
        intervalMs: 60_000,
        immediate: true,
        onUnauthorized: () => {
            showError('세션이 만료되었습니다. 다시 로그인해주세요.');
            onClose();
            window.location.href = '/login';
        },
    });


    const handleRefreshCamera = useCallback(async () => {
        try {
            // 기존 스캐너 정리
            if (scanner) {
                await scanner.stop();
                await scanner.start();
                showSuccess("카메라가 새로고침 되었습니다!");
                return;
            }
            
            // 잠시 대기 후 카메라 재시작
            setTimeout(() => {
                if (!videoRef.current) return;

                const qrScanner = new QrScanner(
                    videoRef.current,
                    async (result) => {
                        const uuid = result.data;
                        const currentTime = Date.now();
                        
                        // 이미 처리 중이거나 throttling 중이면 무시
                        if (isProcessing || isThrottled.current) {
                            return;
                        }
                        
                        // 같은 QR 코드거나 1초 이내 요청이면 무시
                        if (lastProcessedQR.current === uuid || 
                            (currentTime - lastScanTime.current < 1000)) {
                            return;
                        }
                        
                        // throttling 활성화
                        isThrottled.current = true;
                        lastProcessedQR.current = uuid;
                        lastScanTime.current = currentTime;
                        setIsProcessing(true);
                        
                        try {
                            // 로컬 저장소에서 활동 ID 가져오기
                            const storedActivityId = localStorage.getItem('currentActivityId');
                            if (!storedActivityId) {
                                showError('활동 ID를 찾을 수 없습니다.');
                                setIsProcessing(false);
                                isThrottled.current = false;
                                return;
                            }

                            // QR 코드 UUID로 멤버 정보 조회
                            const qrResult = await GetQRCode(uuid);
                            if (!qrResult.success || !qrResult.data) {
                                showError('QR 코드를 새로고침 후 다시 시도하세요.');
                                setIsProcessing(false);
                                isThrottled.current = false;
                                return;
                            }

                            // 멤버 활동 참여 등록
                            const success = await PostMemberActivities(parseInt(storedActivityId), qrResult.data.memberId);
                            if (success) {
                                showSuccess(`${qrResult.data.name}님이 참석했습니다.`);
                                // 성공 후 다시 스캔 가능하도록 설정
                                setTimeout(() => {
                                    setIsProcessing(false);
                                    isThrottled.current = false;
                                    lastProcessedQR.current = '';
                                    lastScanTime.current = 0;
                                }, 1000);
                            } else {
                                setIsProcessing(false);
                                isThrottled.current = false;
                            }

                        } catch (error) {
                            console.error('QR 코드 처리 중 오류 발생:', error);
                            showError('QR 코드 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
                            setIsProcessing(false);
                            isThrottled.current = false;
                        }
                    },
                    {
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        preferredCamera: 'environment',
                    }
                );

                setScanner(qrScanner);

                qrScanner.start().catch((err) => {
                    console.error('QR Scanner Refresh Error:', err);
                    showError('카메라를 새로고침할 수 없습니다. 카메라 권한을 확인해주세요.');
                });
            }, 200);
            
        } catch (error) {
            console.error('Camera refresh error:', error);
            showError('카메라 새로고침 중 오류가 발생했습니다.');
        }
    }, [scanner]);

    useEffect(() => {
        if (!videoRef.current) return;

        let isActive = true;
        const qrScanner = new QrScanner(
            videoRef.current,
            async (result) => {
                if (!isActive) return;
                
                const uuid = result.data;
                const currentTime = Date.now();
                
                // 이미 처리 중이거나 throttling 중이면 무시
                if (isProcessing || isThrottled.current) {
                    return;
                }
                
                // 같은 QR 코드거나 1초 이내 요청이면 무시
                if (lastProcessedQR.current === uuid || 
                    (currentTime - lastScanTime.current < 1000)) {
                    return;
                }
                
                // throttling 활성화
                isThrottled.current = true;
                lastProcessedQR.current = uuid;
                lastScanTime.current = currentTime;
                setIsProcessing(true);
                
                try {
                    // 로컬 저장소에서 활동 ID 가져오기
                    const storedActivityId = localStorage.getItem('currentActivityId');
                    if (!storedActivityId) {
                        showError('활동 ID를 찾을 수 없습니다.');
                        setIsProcessing(false);
                        isThrottled.current = false;
                        return;
                    }

                    // QR 코드 UUID로 멤버 정보 조회
                    const qrResult = await GetQRCode(uuid);
                    if (!qrResult.success || !qrResult.data) {
                        showError('QR 코드를 새로고침 후 다시 시도하세요.');
                        setIsProcessing(false);
                        isThrottled.current = false;
                        return;
                    }

                    // 멤버 활동 참여 등록
                    const success = await PostMemberActivities(parseInt(storedActivityId), qrResult.data.memberId);
                    if (success) {
                        showSuccess(`${qrResult.data.name}님이 참석했습니다.`);
                        // 성공 후 다시 스캔 가능하도록 설정
                        setTimeout(() => {
                            setIsProcessing(false);
                            isThrottled.current = false;
                            lastProcessedQR.current = '';
                            lastScanTime.current = 0;
                        }, 1000);
                    } else {
                        setIsProcessing(false);
                        isThrottled.current = false;
                    }

                } catch (error) {
                    console.error('QR 코드 처리 중 오류 발생:', error);
                    showError('QR 코드 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
                    setIsProcessing(false);
                    isThrottled.current = false;
                }
            },
            {
                highlightScanRegion: true,
                highlightCodeOutline: true,
                preferredCamera: 'environment',
            }
        );

        setScanner(qrScanner);

        qrScanner.start().catch((err) => {
            console.error('QR Scanner Error:', err);
            if (isActive) {
                showError('카메라에 접근할 수 없습니다. 카메라 권한을 확인해주세요.');
            }
        });

        return () => {
            isActive = false;
            qrScanner.stop();
            qrScanner.destroy();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-[10px] p-6 max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-size-20px font-weight-700 color-black">QR 코드 스캔</h3>
                    <button
                        onClick={handleClose}
                        className="color-gray-90 cursor-pointer hover:color-black"
                    >
                        ✕
                    </button>
                </div>

                {
                    <div className="relative">
                        <video
                            ref={videoRef}
                            className="w-full h-full bg-gray-30 rounded-[10px]"
                        />
                        <div className="text-center mt-2 font-weight-500 font-size-16px color-gray-90">
                            {isProcessing ? '처리 중...' : 'QR 코드를 카메라에 비춰주세요! 📷✨'}
                        </div>
                    </div>
                }
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleRefreshCamera}
                        className="px-4 py-2 bg-gray-30 text-black rounded-[10px] cursor-pointer"
                    >
                        🔄 카메라 새로고침
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRScannerComponent;
