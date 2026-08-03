import * as React from "react";

/**
 * Minimal `asChild` primitive — merges props onto the single child element,
 * mirroring the radix-ui Slot API used by shadcn/ui (without the dependency).
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const child = React.Children.only(children) as React.ReactElement<{
    className?: string;
  }>;
  return React.cloneElement(child, {
    ...props,
    className: [className, child.props.className].filter(Boolean).join(" "),
  });
}
