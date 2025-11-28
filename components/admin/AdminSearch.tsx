import { Search } from "lucide-react";

interface AdminSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function AdminSearch({ value, onChange, placeholder = "검색..." }: AdminSearchProps) {
    return (
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
            />
        </div>
    );
}
