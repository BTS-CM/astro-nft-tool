import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";

interface HoverInfoProps {
  header: string;
  content: string;
}

export default function HoverInfo({ header, content }: HoverInfoProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <span className="flex">
          <span className="flex-grow">
            <Label>{header}</Label>
          </span>
          <span className="flex-shrink mr-2 text-gray-400">
            <Label>ℹ️</Label>
          </span>
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 mt-1" align="start">
        <h4 className="scroll-m-20 text-md font-semibold tracking-tight">About the {header}</h4>
        <p className="leading-6 text-sm [&:not(:first-child)]:mt-1">{content}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
