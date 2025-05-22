import { Skeleton } from "@/components/ui/skeleton";

interface PlaceholderSectionProps {
  title: string;
  height: string;
  bgColor?: string;
}

export function PlaceholderSection({ title, height, bgColor = "bg-white" }: PlaceholderSectionProps) {
  return (
    <section className={`py-12 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold mb-8">{title}</h2>
        <div className={`w-full animate-pulse`} style={{ height }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="w-full h-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}