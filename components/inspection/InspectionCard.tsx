import Link from "next/link";
import Image from "next/image";

interface InspectionCardProps {
    id: string;
    imageUrl: string;
    date: string;
    customerName: string;
}

export function InspectionCard({ id, imageUrl, date, customerName }: InspectionCardProps) {
    return (
        <Link href={`/about/inspection/${id}`} className="group block">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                    src={imageUrl}
                    alt={`Inspection ${customerName}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">{date}</p>
                <p className="text-sm font-medium text-gray-900">{customerName} 검수확인</p>
            </div>
        </Link>
    );
}
