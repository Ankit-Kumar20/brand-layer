import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Custom type roles set font-size; keep them out of the text-* color group.
      "font-size": [
        "text-label",
        "text-body",
        "text-prose",
        "text-title",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
