import { Button } from "@/components/ui/button";

const LANGUAGES = ["ASL", "BSL", "ISL"];

export default function LanguageFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (language: string | null) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selected === null ? "default" : "outline"}
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {LANGUAGES.map((lang) => (
        <Button
          key={lang}
          variant={selected === lang ? "default" : "outline"}
          onClick={() => onSelect(lang)}
        >
          {lang}
        </Button>
      ))}
    </div>
  );
}
