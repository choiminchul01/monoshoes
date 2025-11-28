/**
 * AddressSearchModal - 주소 검색 모달
 * 
 * Daum 우편번호 서비스를 사용하여 주소를 검색하는 모달입니다.
 * react-daum-postcode 라이브러리를 사용합니다.
 */

'use client';

import React from 'react';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any) => void;
}

export function AddressSearchModal({ isOpen, onClose, onComplete }: AddressSearchModalProps) {
    const handleComplete = (data: any) => {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '') {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            fullAddress += (extraAddress !== '' ? ` (${extraAddress})` : '');
        }

        onComplete({
            zonecode: data.zonecode,
            address: fullAddress,
            // 필요한 경우 추가 데이터 전달
        });

        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden relative"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h3 className="font-bold text-lg">주소 검색</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Daum Postcode Embed */}
                            <div className="h-[400px] w-full">
                                <DaumPostcodeEmbed
                                    onComplete={handleComplete}
                                    style={{ width: '100%', height: '100%' }}
                                    autoClose={false}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
