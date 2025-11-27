import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white py-12 text-sm text-gray-500">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                    {/* Company Info */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-black tracking-[0.15em]">ESSENTIA</h3>
                        <p>Owner: Hong Gil Dong | Business License: 123-45-67890</p>
                        <p>Address: Seoul, Korea</p>
                        <p>CS Center: 010-1234-5678 (Mon-Fri 10:00-18:00)</p>
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
                    © ESSENTIA. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
