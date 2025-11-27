"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

interface WishlistContextType {
    wishlist: string[];
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (productId: string) => Promise<void>;
    fetchWishlist: () => Promise<void>;
    isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const fetchWishlist = async () => {
        if (!user) {
            setWishlist([]);
            return;
        }

        setIsLoading(true);
        console.log("📋 Fetching wishlist for user:", user.id);
        try {
            const { data, error } = await supabase
                .from("wishlist")
                .select("product_id")
                .eq("user_id", user.id);

            if (error) throw error;

            const productIds = data.map((item) => item.product_id);
            setWishlist(productIds);
            console.log("✅ Wishlist fetched:", productIds);
        } catch (error) {
            console.error("❌ Error fetching wishlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isInWishlist = (productId: string): boolean => {
        return wishlist.includes(productId);
    };

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            throw new Error("User not authenticated");
        }

        const inWishlist = isInWishlist(productId);
        console.log("🔥 Toggle wishlist - Product ID:", productId, "Currently in wishlist:", inWishlist);
        console.log("👤 User ID:", user.id);

        try {
            if (inWishlist) {
                // Remove from wishlist
                console.log("🗑️ Removing from wishlist...");
                const { error } = await supabase
                    .from("wishlist")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", productId);

                if (error) {
                    console.error("❌ Supabase error details:", {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                    });
                    throw error;
                }

                setWishlist(wishlist.filter((id) => id !== productId));
                console.log("✅ Removed from wishlist");
            } else {
                // Add to wishlist
                console.log("➕ Adding to wishlist...");
                console.log("📝 Inserting:", { user_id: user.id, product_id: productId });

                const { error } = await supabase
                    .from("wishlist")
                    .insert({ user_id: user.id, product_id: productId });

                if (error) {
                    console.error("❌ Supabase error details:", {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                    });
                    throw error;
                }

                setWishlist([...wishlist, productId]);
                console.log("✅ Added to wishlist, new wishlist:", [...wishlist, productId]);
            }
        } catch (error) {
            console.error("❌ Error toggling wishlist:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (user) {
            fetchWishlist();
        }
    }, [user]);

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                isInWishlist,
                toggleWishlist,
                fetchWishlist,
                isLoading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}
