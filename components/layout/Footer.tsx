"use client";

import Link from "next/link";
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
}

export function Footer() {
    const [settings, setSettings] = useState<SiteSettings>({
        company_name: 'ESSENTIA',
        owner_name: 'Owner Name',
        business_license: '000-00-00000',
        mail_order_license: 'No. 0000-Seoul-00000',
        address: 'Seoul, Korea',
        cs_phone: '010-0000-0000',
        cs_hours: 'Mon-Fri 10:00-18:00',
        cs_email: 'info@example.com'
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
                    company_name: data.company_name || 'ESSENTIA',
                    owner_name: data.owner_name || 'Owner Name',
                    business_license: data.business_license || '000-00-00000',
                    mail_order_license: data.mail_order_license || 'No. 0000-Seoul-00000',
                    address: data.address || 'Seoul, Korea',
                    cs_phone: data.cs_phone || '010-0000-0000',
                    cs_hours: data.cs_hours || 'Mon-Fri 10:00-18:00',
                    cs_email: data.cs_email || 'info@example.com'
                });
            }
        } catch (error) {
            console.error("Failed to fetch site settings:", error);
        }
    };

    return (
        <footer className="border-t border-gray-200 bg-white py-12 text-sm text-gray-500">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                    {/* Company Info */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-black tracking-[0.15em]">{settings.company_name}</h3>
                        <p>Owner: {settings.owner_name} | Business License: {settings.business_license}</p>
                        <p>Mail Order License: {settings.mail_order_license}</p>
                        <p>Address: {settings.address}</p>
                        <p>CS Center: {settings.cs_phone} ({settings.cs_hours})</p>
                        <p>Email: {settings.cs_email}</p>
                    </div>

                    {/* Links */}
                    <div className="flex gap-6">
                        <Link href="/faq" className="hover:text-black">
                            FAQ
                        </Link>
                        <Link href="/about" className="hover:text-black">
                            COMPANY
                        </Link>
                        <Link href="/agreement" className="hover:text-black">
                            AGREEMENT
                        </Link>
                        <Link href="/privacy" className="hover:text-black font-bold">
                            PRIVACY POLICY
                        </Link>
                        <Link href="/guide" className="hover:text-black">
                            GUIDE
                        </Link>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t text-xs">
                    © {settings.company_name}. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
