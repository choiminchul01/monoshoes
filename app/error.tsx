"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="bg-red-50 p-4 rounded-full mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                Something went wrong!
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
                We apologize for the inconvenience. An unexpected error has occurred.
                Please try again later.
            </p>
            <div className="flex items-center justify-center gap-4">
                <Button
                    onClick={reset}
                    variant="default"
                    className="h-12 px-8 bg-black hover:bg-gray-800 text-white"
                >
                    Try Again
                </Button>
                <Button
                    onClick={() => window.location.href = "/"}
                    variant="outline"
                    className="h-12 px-8"
                >
                    Go to Home
                </Button>
            </div>
        </div>
    );
}
