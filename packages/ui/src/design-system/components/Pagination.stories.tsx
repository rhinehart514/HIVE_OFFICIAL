'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Pagination, SimplePagination, CompactPagination } from './Pagination';
import * as React from 'react';

const meta: Meta<typeof Pagination> = {
  title: 'Design System/Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/**
 * Default pagination with numbers.
 */
export const Default: StoryObj = {
  render: function PaginationDemo() {
    const [page, setPage] = React.useState(1);
    return (
      <Pagination
        totalPages={20}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * Pagination sizes.
 */
export const Sizes: StoryObj = {
  render: () => {
    const [pages, setPages] = React.useState({ sm: 1, md: 1, lg: 1 });
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Small</p>
          <Pagination
            size="sm"
            totalPages={10}
            currentPage={pages.sm}
            onPageChange={(p) => setPages({ ...pages, sm: p })}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium (default)</p>
          <Pagination
            size="md"
            totalPages={10}
            currentPage={pages.md}
            onPageChange={(p) => setPages({ ...pages, md: p })}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Large</p>
          <Pagination
            size="lg"
            totalPages={10}
            currentPage={pages.lg}
            onPageChange={(p) => setPages({ ...pages, lg: p })}
          />
        </div>
      </div>
    );
  },
};

/**
 * Outline variant.
 */
export const Outline: StoryObj = {
  render: function OutlineDemo() {
    const [page, setPage] = React.useState(5);
    return (
      <Pagination
        variant="outline"
        totalPages={10}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * With first/last buttons.
 */
export const WithFirstLast: StoryObj = {
  render: function FirstLastDemo() {
    const [page, setPage] = React.useState(10);
    return (
      <Pagination
        totalPages={50}
        currentPage={page}
        onPageChange={setPage}
        showFirstLast
      />
    );
  },
};

/**
 * With text prev/next buttons.
 */
export const WithTextButtons: StoryObj = {
  render: function TextButtonsDemo() {
    const [page, setPage] = React.useState(3);
    return (
      <Pagination
        totalPages={10}
        currentPage={page}
        onPageChange={setPage}
        prevText="Previous"
        nextText="Next"
      />
    );
  },
};

/**
 * Different boundary and sibling counts.
 */
export const CustomCounts: StoryObj = {
  render: function CustomCountsDemo() {
    const [page, setPage] = React.useState(25);
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">siblingCount=2, boundaryCount=1</p>
          <Pagination
            totalPages={50}
            currentPage={page}
            onPageChange={setPage}
            siblingCount={2}
            boundaryCount={1}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">siblingCount=1, boundaryCount=2</p>
          <Pagination
            totalPages={50}
            currentPage={page}
            onPageChange={setPage}
            siblingCount={1}
            boundaryCount={2}
          />
        </div>
      </div>
    );
  },
};

/**
 * First page (prev disabled).
 */
export const FirstPage: StoryObj = {
  render: function FirstPageDemo() {
    const [page, setPage] = React.useState(1);
    return (
      <Pagination
        totalPages={20}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * Last page (next disabled).
 */
export const LastPage: StoryObj = {
  render: function LastPageDemo() {
    const [page, setPage] = React.useState(20);
    return (
      <Pagination
        totalPages={20}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * Few pages (no ellipsis).
 */
export const FewPages: StoryObj = {
  render: function FewPagesDemo() {
    const [page, setPage] = React.useState(2);
    return (
      <Pagination
        totalPages={5}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * Without prev/next buttons.
 */
export const NoPrevNext: StoryObj = {
  render: function NoPrevNextDemo() {
    const [page, setPage] = React.useState(5);
    return (
      <Pagination
        totalPages={10}
        currentPage={page}
        onPageChange={setPage}
        showPrevNext={false}
      />
    );
  },
};

/**
 * SimplePagination - prev/next only.
 */
export const Simple: StoryObj = {
  render: function SimplePaginationDemo() {
    const [page, setPage] = React.useState(1);
    const totalPages = 10;
    return (
      <div className="space-y-4">
        <SimplePagination
          hasPrev={page > 1}
          hasNext={page < totalPages}
          onPrev={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          Page {page} of {totalPages}
        </p>
      </div>
    );
  },
};

/**
 * SimplePagination with custom text.
 */
export const SimpleCustomText: StoryObj = {
  render: function SimpleCustomDemo() {
    const [page, setPage] = React.useState(3);
    const totalPages = 10;
    return (
      <SimplePagination
        hasPrev={page > 1}
        hasNext={page < totalPages}
        onPrev={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
        prevText="← Older"
        nextText="Newer →"
      />
    );
  },
};

/**
 * CompactPagination - shows current/total.
 */
export const Compact: StoryObj = {
  render: function CompactDemo() {
    const [page, setPage] = React.useState(5);
    return (
      <CompactPagination
        totalPages={20}
        currentPage={page}
        onPageChange={setPage}
      />
    );
  },
};

/**
 * CompactPagination sizes.
 */
export const CompactSizes: StoryObj = {
  render: () => {
    const [pages, setPages] = React.useState({ sm: 3, md: 5, lg: 7 });
    return (
      <div className="space-y-4">
        <CompactPagination
          size="sm"
          totalPages={10}
          currentPage={pages.sm}
          onPageChange={(p) => setPages({ ...pages, sm: p })}
        />
        <CompactPagination
          size="md"
          totalPages={10}
          currentPage={pages.md}
          onPageChange={(p) => setPages({ ...pages, md: p })}
        />
        <CompactPagination
          size="lg"
          totalPages={10}
          currentPage={pages.lg}
          onPageChange={(p) => setPages({ ...pages, lg: p })}
        />
      </div>
    );
  },
};

/**
 * Pagination in data table context.
 */
export const InContext: StoryObj = {
  render: function InContextDemo() {
    const [page, setPage] = React.useState(1);
    const itemsPerPage = 10;
    const totalItems = 247;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, totalItems);

    return (
      <div className="space-y-4 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <div className="h-40 flex items-center justify-center text-[var(--color-text-muted)]">
          Data table content
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing {startItem}-{endItem} of {totalItems}
          </p>
          <Pagination
            size="sm"
            totalPages={totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    );
  },
};

/**
 * Controlled pagination state.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [page, setPage] = React.useState(5);

    return (
      <div className="space-y-4">
        <Pagination
          totalPages={10}
          currentPage={page}
          onPageChange={setPage}
        />
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setPage(1)}
            className="px-2 py-1 rounded bg-white/10 text-xs text-white"
          >
            Go to 1
          </button>
          <button
            onClick={() => setPage(5)}
            className="px-2 py-1 rounded bg-white/10 text-xs text-white"
          >
            Go to 5
          </button>
          <button
            onClick={() => setPage(10)}
            className="px-2 py-1 rounded bg-white/10 text-xs text-white"
          >
            Go to 10
          </button>
        </div>
      </div>
    );
  },
};
