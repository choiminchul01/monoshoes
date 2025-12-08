"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/home");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse text-gray-400 tracking-widest">LOADING...</div>
        </div>
    );
}
