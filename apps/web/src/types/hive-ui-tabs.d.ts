declare module "@hive/ui/atomic/00-Global/atoms/tabs" {
  import type * as React from "react";

  export interface TabsProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children?: React.ReactNode;
    className?: string;
  }

  export const Tabs: React.FC<TabsProps>;

  export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const TabsList: React.FC<TabsListProps>;

  export interface TabsTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
  }
  export const TabsTrigger: React.FC<TabsTriggerProps>;

  export interface TabsContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
  }
  export const TabsContent: React.FC<TabsContentProps>;
}

