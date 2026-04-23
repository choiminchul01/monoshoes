"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SiteSettings {
    company_name: string;
    owner_name: string;
    business_license: string;
    mail_order_license: string;
    address: string;
    cs_phone: string;
    cs_hours: string;
    cs_email: string;
    // Visibility toggles
    show_owner_name: boolean;
    show_business_license: boolean;
    show_mail_order_license: boolean;
    show_address: boolean;
    show_cs_phone: boolean;
    show_cs_hours: boolean;
    show_cs_email: boolean;
}

export function Footer() {
    const [settings, setSettings] = useState<SiteSettings>({
        company_name: 'MONO SHOES',
        owner_name: '',
        business_license: '',
        mail_order_license: '',
        address: '',
        cs_phone: '',
        cs_hours: '',
        cs_email: '',
        show_owner_name: true,
        show_business_license: true,
        show_mail_order_license: true,
        show_address: true,
        show_cs_phone: true,
        show_cs_hours: true,
        show_cs_email: true,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (data && !error) {
                setSettings({
                    company_name: data.company_name || 'MONO SHOES',
                    owner_name: data.owner_name || '',
                    business_license: data.business_license || '',
                    mail_order_license: data.mail_order_license || '',
                    address: data.address || '',
                    cs_phone: data.cs_phone || '',
                    cs_hours: data.cs_hours || '',
                    cs_email: data.cs_email || '',
                    show_owner_name: data.show_owner_name ?? true,
                    show_business_license: data.show_business_license ?? true,
                    show_mail_order_license: data.show_mail_order_license ?? true,
                    show_address: data.show_address ?? true,
                    show_cs_phone: data.show_cs_phone ?? true,
                    show_cs_hours: data.show_cs_hours ?? true,
                    show_cs_email: data.show_cs_email ?? true,
                });
            }
        } catch (error) {
            console.error("Failed to fetch site settings:", error);
        }
    };

    // Check if any business info is visible
    const hasVisibleInfo = settings.show_owner_name ||
        settings.show_business_license ||
        settings.show_mail_order_license ||
        settings.show_address ||
        settings.show_cs_phone ||
        settings.show_cs_hours ||
        settings.show_cs_email;

    return (
        <footer className="border-t border-gray-200 bg-white py-12 text-sm text-gray-500">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                    {/* Company Info - Left Side */}
                    <div className="space-y-2 flex-1">
                        <h3 className="font-bold text-black tracking-[0.15em] text-lg mb-3">{settings.company_name}</h3>

                        {/* Business Info - Only show enabled items */}
                        {hasVisibleInfo && (
                            <div className="space-y-1 text-gray-500 text-sm">
                                {(settings.show_owner_name && settings.owner_name) || (settings.show_business_license && settings.business_license) ? (
                                    <p>
                                        {settings.show_owner_name && settings.owner_name && `대표: ${settings.owner_name}`}
                                        {settings.show_owner_name && settings.owner_name && settings.show_business_license && settings.business_license && ' | '}
                                        {settings.show_business_license && settings.business_license && `사업자등록번호: ${settings.business_license}`}
                                    </p>
                                ) : null}

                                {settings.show_mail_order_license && settings.mail_order_license && (
                                    <p>통신판매업신고: {settings.mail_order_license}</p>
                                )}

                                {settings.show_address && settings.address && (
                                    <p>주소: {settings.address}</p>
                                )}

                                {(settings.show_cs_phone && settings.cs_phone) || (settings.show_cs_hours && settings.cs_hours) ? (
                                    <p>
                                        {settings.show_cs_phone && settings.cs_phone && `고객센터: ${settings.cs_phone}`}
                                        {settings.show_cs_phone && settings.cs_phone && settings.show_cs_hours && settings.cs_hours && ` (${settings.cs_hours})`}
                                        {!settings.show_cs_phone && settings.show_cs_hours && settings.cs_hours && `운영시간: ${settings.cs_hours}`}
                                    </p>
                                ) : null}

                                {settings.show_cs_email && settings.cs_email && (
                                    <p>이메일: {settings.cs_email}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Links & Logo - Right Side */}
                    <div className="flex flex-col items-end gap-6">
                        {/* Navigation Links */}
                        <div className="flex gap-6 text-sm">
                            <Link href="/privacy" className="hover:text-black font-bold transition-colors">
                                PRIVACY POLICY
                            </Link>
                            <Link href="/guide" className="hover:text-black transition-colors">
                                GUIDE
                            </Link>
                        </div>

                        <div className="mt-2">
                            <Link href="/home" className="text-xl md:text-2xl font-black tracking-[0.2em] text-black opacity-80 hover:opacity-100 transition-opacity" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
                                MONO SHOES
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t text-xs text-center md:text-left">
                    © 2025~ MONO SHOES. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

