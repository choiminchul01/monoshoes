"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export type AdminPermissions = {
    dashboard: boolean;
    customers: boolean;
    orders: boolean;
    products: boolean;
    reviews: boolean;
    board: boolean;
    coupons: boolean;
    inquiries: boolean;
    settings: boolean;
};

export type AdminRole = "master" | "manager" | "staff";

export type AdminRoleData = {
    id: string;
    user_id: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermissions;
    created_at: string;
};

export function useAdminPermissions() {
    const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
    const [role, setRole] = useState<AdminRole | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in
                setLoading(false);
                return;
            }

            // 1. Try to fetch by user_id
            let { data, error } = await supabase
                .from('admin_roles')
                .select('role, permissions')
                .eq('user_id', user.id)
                .single();

            // 2. If not found by user_id, try by email (for initial master login)
            if (error && user.email) {
                const { data: emailData, error: emailError } = await supabase
                    .from('admin_roles')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (emailData) {
                    // Found by email, update user_id
                    await supabase
                        .from('admin_roles')
                        .update({ user_id: user.id })
                        .eq('email', user.email);

                    data = emailData;
                    error = null;
                }
            }

            if (error) {
                // PGRST116: JSON object requested, multiple (or no) rows returned
                // If code is PGRST116, it just means the user has no admin role, which is normal for customers.
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching admin permissions:', error);
                }
                return;
            }

            if (data) {
                setRole(data.role);
                setPermissions(data.permissions as AdminPermissions);
            }
        } catch (error) {
            console.error('Error in fetchPermissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (menu: keyof AdminPermissions): boolean => {
        if (role === 'master') return true;
        return permissions?.[menu] || false;
    };

    return {
        permissions,
        role,
        loading,
        isMaster: role === 'master',
        isManager: role === 'manager',
        isStaff: role === 'staff',
        hasPermission,
        refetch: fetchPermissions
    };
}
