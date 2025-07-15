import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToastType = "success" | "error";
type ActionType = "create" | "update" | "delete";

interface ShowToastOptions {
  type: ToastType;
  action: ActionType;
  itemName: string;
  locale?: string;
  error?: Error;
}

export const showActionToast = ({ type, action, itemName, locale = "en", error }: ShowToastOptions) => {
  const actionText = {
    create: {
      en: "created",
      fr: "créé",
      it: "creato",
      nl: "gemaakt",
    },
    update: {
      en: "updated",
      fr: "mis à jour",
      it: "aggiornato",
      nl: "bijgewerkt",
    },
    delete: {
      en: "deleted",
      fr: "supprimé",
      it: "eliminato",
      nl: "verwijderd",
    },
  };

  if (type === "success") {
    toast.success(`${itemName} ${actionText[action][locale as keyof (typeof actionText)["create"]]}`);
  } else {
    toast.error(`Failed to ${action} ${itemName}${error ? `: ${error.message}` : ""}`);
  }
};
