/**
 * Dialog Component - Compatibility layer for components expecting Dialog
 * Maps to our Modal components for consistency
 */

import React from 'react';

import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter
} from '../primitives';

// Dialog is just an alias for Modal
export const Dialog = Modal;

// DialogContent wraps the entire modal content
export const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const props: { className?: string } = {}
  if (className !== undefined) props.className = className
  return <ModalContent {...props}>{children}</ModalContent>;
};

// DialogHeader maps to ModalHeader
export const DialogHeader = ModalHeader;

// DialogTitle maps to ModalTitle
export const DialogTitle = ModalTitle;

// DialogDescription maps to ModalDescription
export const DialogDescription = ModalDescription;

// DialogFooter maps to ModalFooter
export const DialogFooter = ModalFooter;

// DialogTrigger is a button that opens the dialog
export const DialogTrigger = ({ children, asChild: _asChild, ..._props }: {
  children: React.ReactNode;
  asChild?: boolean;
  [key: string]: unknown;
}) => {
  // In a real implementation, this would integrate with Dialog state
  // For now, it's just a passthrough
  return <>{children}</>;
};
