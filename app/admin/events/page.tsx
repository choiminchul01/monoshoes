"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit, X, Upload, Check, Calendar, Eye, EyeOff, Megaphone } from "lucide-react";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";

type Event = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    is_popup: boolean;
    is_active: boolean;
    created_at: string;
};

export default function AdminEventsPage() {
    const toast = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image_url: "",
        is_popup: false,
        is_active: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast.error("이벤트 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                description: event.description || "",
                image_url: event.image_url || "",
                is_popup: event.is_popup,
                is_active: event.is_active,
            });
            setImagePreview(event.image_url || null);
        } else {
            setEditingEvent(null);
            setFormData({
                title: "",
                description: "",
                image_url: "",
                is_popup: false,
                is_active: true,
            });
            setImagePreview(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("파일 크기는 10MB를 초과할 수 없습니다.");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `event_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from("events")
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabaseAdmin.storage.from("events").getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error("제목을 입력해주세요.");
            return;
        }

        setSaving(true);

        try {
            let imageUrl = formData.image_url;

            // Upload new image if selected
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const eventData = {
                title: formData.title,
                description: formData.description,
                image_url: imageUrl,
                is_popup: formData.is_popup,
                is_active: formData.is_active,
            };

            if (editingEvent) {
                // Update
                const { error } = await supabaseAdmin
                    .from("events")
                    .update(eventData)
                    .eq("id", editingEvent.id);

                if (error) throw error;
                toast.success("이벤트가 수정되었습니다.");
            } else {
                // Create
                const { error } = await supabaseAdmin
                    .from("events")
                    .insert([eventData]);

                if (error) throw error;
                toast.success("이벤트가 등록되었습니다.");
            }

            closeModal();
            fetchEvents();
        } catch (error: any) {
            console.error("Error saving event:", error);
            toast.error(`저장 실패: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 이벤트를 삭제하시겠습니까?")) return;

        try {
            const { error } = await supabaseAdmin
                .from("events")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("이벤트가 삭제되었습니다.");
            fetchEvents();
        } catch (error: any) {
            console.error("Error deleting event:", error);
            toast.error(`삭제 실패: ${error.message}`);
        }
    };

    const togglePopup = async (event: Event) => {
        try {
            const { error } = await supabaseAdmin
                .from("events")
                .update({ is_popup: !event.is_popup })
                .eq("id", event.id);

            if (error) throw error;
            toast.success(event.is_popup ? "팝업 노출이 해제되었습니다." : "팝업 노출이 설정되었습니다.");
            fetchEvents();
        } catch (error: any) {
            console.error("Error toggling popup:", error);
            toast.error("팝업 설정 변경에 실패했습니다.");
        }
    };

    const toggleActive = async (event: Event) => {
        try {
            const { error } = await supabaseAdmin
                .from("events")
                .update({ is_active: !event.is_active })
                .eq("id", event.id);

            if (error) throw error;
            toast.success(event.is_active ? "이벤트가 비활성화되었습니다." : "이벤트가 활성화되었습니다.");
            fetchEvents();
        } catch (error: any) {
            console.error("Error toggling active:", error);
            toast.error("상태 변경에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-20 text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">이벤트 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">이벤트 등록 및 팝업 노출 관리</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    이벤트 등록
                </button>
            </div>

            {/* Event List */}
            {events.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">등록된 이벤트가 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-xl border overflow-hidden ${!event.is_active ? "opacity-60" : ""}`}
                        >
                            {/* Image */}
                            <div className="relative aspect-[16/9] bg-gray-100">
                                {event.image_url ? (
                                    <Image
                                        src={event.image_url}
                                        alt={event.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Calendar className="w-10 h-10 text-gray-300" />
                                    </div>
                                )}
                                {/* Popup Badge */}
                                {event.is_popup && (
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                        <Megaphone className="w-3 h-3" />
                                        팝업 노출 중
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{event.title}</h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    {new Date(event.created_at).toLocaleDateString("ko-KR")}
                                </p>

                                {/* Toggle Buttons */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => togglePopup(event)}
                                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${event.is_popup
                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        <Megaphone className="w-3 h-3" />
                                        {event.is_popup ? "팝업 ON" : "팝업 OFF"}
                                    </button>
                                    <button
                                        onClick={() => toggleActive(event)}
                                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${event.is_active
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {event.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {event.is_active ? "활성화" : "비활성화"}
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(event)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                                    >
                                        <Edit className="w-3 h-3" />
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-lg font-bold">
                                    {editingEvent ? "이벤트 수정" : "이벤트 등록"}
                                </h2>
                                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        제목 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="이벤트 제목"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        설명
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                                        rows={4}
                                        placeholder="이벤트 설명"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        이미지
                                    </label>
                                    {imagePreview ? (
                                        <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-2">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                    setFormData({ ...formData, image_url: "" });
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full aspect-[16/9] border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-500">클릭하여 이미지 업로드</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Toggle Options */}
                                <div className="space-y-4">
                                    {/* Popup Toggle */}
                                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Megaphone className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">팝업 노출</p>
                                                <p className="text-xs text-gray-500">홈페이지에 팝업으로 표시됩니다</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_popup}
                                            onChange={(e) => setFormData({ ...formData, is_popup: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                    </label>

                                    {/* Active Toggle */}
                                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Eye className="w-5 h-5 text-green-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">이벤트 활성화</p>
                                                <p className="text-xs text-gray-500">이벤트 페이지에 표시됩니다</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            저장 중...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            {editingEvent ? "수정하기" : "등록하기"}
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
