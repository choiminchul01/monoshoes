"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <h1 className="text-9xl font-black text-gray-200 select-none">404</h1>
            <div className="space-y-6 -mt-12 relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Page not found
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Button asChild variant="default" className="h-12 px-8 bg-black hover:bg-gray-800 text-white">
                        <Link href="/">
                            Go to Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 px-8">
                        <Link href="/shop">
                            Continue Shopping
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
