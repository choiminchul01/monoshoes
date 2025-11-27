'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface ProductCardProps {
    id: string;
    brand: string;
    name: string;
    price: number;
    imageUrl: string;
    aspectRatio?: string;
    originalPrice?: number;
    index?: number; // For stagger animation
}

export function ProductCard({ id, brand, name, price, imageUrl, aspectRatio = "aspect-[1000/1618]", originalPrice, index = 0 }: ProductCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1, // Stagger delay based on index
                ease: [0.22, 1, 0.36, 1] // Custom easing
            }}
        >
            <Link href={`/shop/${id}`} className="group block">
                <div className={`relative ${aspectRatio} w-full overflow-hidden bg-gray-100`}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            No Image
                        </div>
                    )}
                </div>
                <div className="mt-4 space-y-1">
                    <p className="text-xs text-[#C41E3A] uppercase">{brand}</p>
                    <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                            {price.toLocaleString()}
                        </p>
                        {originalPrice && (
                            <p className="text-xs font-normal text-gray-400 line-through">
                                {originalPrice.toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
