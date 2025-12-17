"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null); // New state

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (newItem: CartItem) => {
        setCartItems((prevItems) => {
            const existingItemIndex = prevItems.findIndex(
                (item) =>
                    item.id === newItem.id &&
                    item.color === newItem.color &&
                    item.size === newItem.size
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                // Create a shallow copy of the item to update to avoid direct mutation
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + newItem.quantity,
                    selected: true
                };
                return newItems;
            } else {
                return [...prevItems, { ...newItem, selected: true }]; // Default selected
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
