"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

interface SlidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function SlidePanel({
  open,
  onOpenChange,
  title,
  children,
}: SlidePanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-[85vw] max-w-[320px] flex-col bg-white shadow-xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
          )}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <DialogPrimitive.Title className="text-sm font-bold text-gray-900">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XIcon className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface SlidePanelTriggerProps {
  onClick: () => void;
  label: string;
}

export function SlidePanelTrigger({ onClick, label }: SlidePanelTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg md:hidden"
    >
      {label}
    </button>
  );
}
