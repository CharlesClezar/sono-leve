import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: string;
};

type AppSelectProps = {
  options: AppSelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
};

export function AppSelect({
  options,
  value,
  defaultValue,
  placeholder,
  className,
  onValueChange,
}: AppSelectProps) {
  return (
    <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger className={cn("bg-card", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
