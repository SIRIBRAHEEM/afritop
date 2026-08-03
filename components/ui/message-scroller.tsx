"use client";

import * as React from "react";
import { ArrowDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lightweight MessageScroller — same API surface as the shadcn/ui
 * message-scroller (Provider / Root / Viewport / Content / Item / Button +
 * hooks), implemented here without the `@shadcn/react` dependency.
 *
 * Behavior:
 * - Tracks whether the viewport is scrolled to the end.
 * - Auto-scrolls to the end when content grows while the user is at the end.
 * - Exposes a scroll-to-end button that appears when scrolled away.
 */

type MessageScrollerContextValue = {
  atEnd: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scrollToEnd: (behavior?: ScrollBehavior) => void;
};

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null);

function useMessageScroller(): MessageScrollerContextValue {
  const ctx = React.useContext(MessageScrollerContext);
  if (!ctx) throw new Error("useMessageScroller must be used within <MessageScrollerProvider>");
  return ctx;
}

function useMessageScrollerScrollable(): boolean {
  return true;
}

function useMessageScrollerVisibility(): boolean {
  const { atEnd } = useMessageScroller();
  return !atEnd;
}

function MessageScrollerProvider({ children }: { children: React.ReactNode }) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [atEnd, setAtEnd] = React.useState(true);
  const atEndRef = React.useRef(true);

  const measure = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const distance = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
    const near = distance < 48;
    if (near !== atEndRef.current) {
      atEndRef.current = near;
      setAtEnd(near);
    }
  }, []);

  React.useEffect(() => {
    const vp = viewportRef.current;
    const content = contentRef.current;
    if (!vp) return;
    measure();
    vp.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(() => {
      measure();
      // Stick to the bottom while the user hasn't scrolled up.
      if (atEndRef.current) vp.scrollTop = vp.scrollHeight;
    });
    // Observe the content, not just the viewport: message growth changes
    // scrollHeight (which ResizeObserver doesn't report on the viewport itself).
    if (content) ro.observe(content);
    return () => {
      vp.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const scrollToEnd = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const vp = viewportRef.current;
    if (vp) vp.scrollTo({ top: vp.scrollHeight, behavior });
  }, []);

  const value = React.useMemo(
    () => ({ atEnd, viewportRef, contentRef, scrollToEnd }),
    [atEnd, scrollToEnd]
  );

  return (
    <MessageScrollerContext.Provider value={value}>
      {children}
    </MessageScrollerContext.Provider>
  );
}

function MessageScroller({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller"
      className={cn("group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)}
      {...props}
    />
  );
}

function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { viewportRef } = useMessageScroller();
  return (
    <div
      ref={viewportRef}
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 scrollbar-thin overflow-y-auto overscroll-contain contain-content",
        className
      )}
      {...props}
    />
  );
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { contentRef } = useMessageScroller();
  return (
    <div
      ref={contentRef}
      data-slot="message-scroller-content"
      className={cn("flex h-max min-h-full flex-col gap-8", className)}
      {...props}
    />
  );
}

function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<"div"> & { scrollAnchor?: boolean }) {
  return (
    <div
      data-slot="message-scroller-item"
      data-scroll-anchor={scrollAnchor || undefined}
      className={cn("min-w-0 shrink-0", className)}
      {...props}
    />
  );
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  direction?: "start" | "end";
}) {
  const { atEnd, scrollToEnd } = useMessageScroller();
  const visible = direction === "end" ? !atEnd : false;

  return (
    <button
      type="button"
      data-slot="message-scroller-button"
      data-direction={direction}
      data-active={visible}
      onClick={() => scrollToEnd()}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "absolute left-1/2 z-10 grid size-9 -translate-x-1/2 place-items-center border-2 border-ink-950 bg-surface text-ink-950 shadow-hard transition-all duration-300 hover:bg-ink-100",
        "bottom-4 data-[active=false]:pointer-events-none data-[active=false]:translate-y-3 data-[active=false]:scale-90 data-[active=false]:opacity-0",
        "data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100",
        direction === "start" && "top-4 bottom-auto [&_svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDownIcon className="size-4" />
          <span className="sr-only">
            {direction === "end" ? "Scroll to end" : "Scroll to start"}
          </span>
        </>
      )}
    </button>
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
