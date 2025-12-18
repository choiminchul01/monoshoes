"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export type CartItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    color?: string;
    size?: string;
    quantity: number;
    brand: string;
    selected?: boolean; // New: Selection state
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string, color?: string, size?: string) => void;
    updateQuantity: (itemId: string, quantity: number, color?: string, size?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    // New Selection Logic
    toggleItemSelection: (itemId: string, color?: string, size?: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    deleteSelected: () => void; // Optional but good to have
    // Buy Now Logic
    buyNowItem: CartItem | null;
    setBuyNowItem: (item: CartItem | null) => void;
    // Auth status
    isAuthenticated: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Get localStorage key for the current user
    const getCartKey = (userId: string | undefined) => {
        return userId ? `cart_${userId}` : null;
    };

    // Load cart from localStorage when user changes
    useEffect(() => {
        // Clear old non-user-specific cart on first load
        if (!isInitialized) {
            localStorage.removeItem("cart"); // Remove legacy cart data
            setIsInitialized(true);
        }

        const cartKey = getCartKey(user?.id);

        if (!cartKey) {
            // No user logged in - clear cart
            setCartItems([]);
            return;
        }

        // Load user-specific cart
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // Ensure all items have selected property
                const cartWithSelection = parsedCart.map((item: CartItem) => ({
                    ...item,
                    selected: item.selected !== undefined ? item.selected : true
                }));
                setCartItems(cartWithSelection);
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
                setCartItems([]);
            }
        } else {
            setCartItems([]);
        }
    }, [user?.id, isInitialized]);

    // Save cart to localStorage whenever it changes (only if user is logged in)
    useEffect(() => {
        const cartKey = getCartKey(user?.id);
        if (cartKey && isInitialized) {
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
        }
    }, [cartItems, user?.id, isInitialized]);

    const addToCart = (newItem: CartItem) => {
        // Only allow adding to cart if user is logged in
        if (!user) {
            console.warn("Cannot add to cart: User not authenticated");
            return;
        }

        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (item) =>
                    item.id === newItem.id &&
                    item.color === newItem.color &&
                    item.size === newItem.size
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + newItem.quantity,
                    selected: true
                };
                return newItems;
            } else {
                return [...prevItems, { ...newItem, selected: true }];
            }
        });
    };

    const removeFromCart = (itemId: string, color?: string, size?: string) => {
        setCartItems((prevItems) =>
            prevItems.filter(
                (item) => !(item.id === itemId && item.color === color && item.size === size)
            )
        );
    };

    const updateQuantity = (itemId: string, quantity: number, color?: string, size?: string) => {
        if (quantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId && item.color === color && item.size === size
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const toggleItemSelection = (itemId: string, color?: string, size?: string) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId && item.color === color && item.size === size
                    ? { ...item, selected: !item.selected }
                    : item
            )
        );
    };

    const selectAll = () => {
        setCartItems((prevItems) => prevItems.map((item) => ({ ...item, selected: true })));
    };

    const deselectAll = () => {
        setCartItems((prevItems) => prevItems.map((item) => ({ ...item, selected: false })));
    };

    const deleteSelected = () => {
        setCartItems((prevItems) => prevItems.filter((item) => !item.selected));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    // Calculate total ONLY for selected items
    const cartTotal = cartItems
        .filter(item => item.selected)
        .reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                toggleItemSelection,
                selectAll,
                deselectAll,
                deleteSelected,
                buyNowItem,
                setBuyNowItem,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

