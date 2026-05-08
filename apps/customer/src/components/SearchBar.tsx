import { Search } from "lucide-react";

interface Props {
  onClick: () => void;
}

export function SearchBar({ onClick }: Props) {
  return (
    <div className="px-3.5 pt-1.5 pb-2.5">
      <button
        onClick={onClick}
        style={{ backgroundColor: "#ffffff", borderColor: "#ebe6dd" }}
        className="w-full border rounded-xl px-3 py-2.5 flex items-center gap-2.5 hover:bg-muted/30 transition-colors"
      >
        <Search style={{ color: "#888" }} className="w-[18px] h-[18px] shrink-0" />
        <span
          style={{ color: "#999" }}
          className="text-sm"
        >
          Search dishes, drinks...
        </span>
      </button>
    </div>
  );
}
