import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker, DateRangePicker } from './DatePicker';
import { Card, Text } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATEPICKER VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Date selection component with calendar popup.
 *
 * TRIGGER: Input-like button with calendar icon and chevron/clear button
 * CALENDAR: Month view with day grid, navigation arrows
 *
 * CELL STATES:
 * - Selected: Gold (#FFD700) background, black text
 * - Today: Ring outline, font-medium
 * - Outside month: Faded text
 * - Disabled: Very faded, no hover
 *
 * FEATURES:
 * - Single date selection
 * - Date range selection (DateRangePicker)
 * - Optional time picker
 * - Min/max date constraints
 * - Custom date formatting
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof DatePicker> = {
  title: 'Design System/Components/Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Date selection component with calendar popup.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/**
 * Default — Uncontrolled
 */
export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          placeholder="Select a date"
        />
      </div>
    );
  },
};

/**
 * With selected date
 */
export const WithValue: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
        />
      </div>
    );
  },
};

/**
 * With time picker
 */
export const WithTime: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          showTime
          placeholder="Select date and time"
        />
      </div>
    );
  },
};

/**
 * With min/max dates
 */
export const WithConstraints: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

    return (
      <div className="w-72">
        <Text size="xs" tone="muted" className="mb-2">
          Only dates within -7 to +30 days are selectable
        </Text>
        <DatePicker
          value={date}
          onChange={setDate}
          minDate={minDate}
          maxDate={maxDate}
          placeholder="Select within range"
        />
      </div>
    );
  },
};

/**
 * Custom format
 */
export const CustomFormat: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-72">
        <DatePicker
          value={date}
          onChange={setDate}
          formatDate={(d) => d.toISOString().split('T')[0]}
        />
      </div>
    );
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div>
        <Text size="xs" tone="muted" className="mb-1">Small</Text>
        <DatePicker size="sm" placeholder="Small date picker" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Default</Text>
        <DatePicker size="default" placeholder="Default date picker" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-1">Large</Text>
        <DatePicker size="lg" placeholder="Large date picker" />
      </div>
    </div>
  ),
};

/**
 * Disabled
 */
export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker
        value={new Date()}
        disabled
      />
    </div>
  ),
};

/**
 * Date range picker
 */
export const DateRange: Story = {
  render: () => {
    const [range, setRange] = useState<{ start?: Date; end?: Date }>({});
    return (
      <div className="w-80">
        <DateRangePicker
          startDate={range.start}
          endDate={range.end}
          onChange={setRange}
          placeholder="Select date range"
        />
      </div>
    );
  },
};

/**
 * Date range with values
 */
export const DateRangeWithValues: Story = {
  render: () => {
    const today = new Date();
    const [range, setRange] = useState<{ start?: Date; end?: Date }>({
      start: today,
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
    });
    return (
      <div className="w-80">
        <DateRangePicker
          startDate={range.start}
          endDate={range.end}
          onChange={setRange}
        />
      </div>
    );
  },
};

/**
 * In context — Event form
 */
export const EventFormContext: Story = {
  render: () => {
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    return (
      <Card className="w-96 p-6 space-y-4">
        <div>
          <Text size="lg" weight="semibold">Create Event</Text>
          <Text size="sm" tone="muted">Schedule your next meetup</Text>
        </div>

        <div className="space-y-3">
          <div>
            <Text size="sm" weight="medium" className="mb-1">Event name</Text>
            <input
              type="text"
              placeholder="Enter event name"
              className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text size="sm" weight="medium" className="mb-1">Start</Text>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                showTime
                placeholder="Start date"
                size="sm"
              />
            </div>
            <div>
              <Text size="sm" weight="medium" className="mb-1">End</Text>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                showTime
                placeholder="End date"
                size="sm"
                minDate={startDate}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  },
};

/**
 * In context — Filter bar
 */
export const FilterBarContext: Story = {
  render: () => {
    const [range, setRange] = useState<{ start?: Date; end?: Date }>({});

    return (
      <Card className="w-[600px] p-4">
        <div className="flex items-center gap-4">
          <Text size="sm" weight="medium">Filter by date:</Text>
          <DateRangePicker
            startDate={range.start}
            endDate={range.end}
            onChange={setRange}
            placeholder="All time"
            size="sm"
          />
          <button className="px-3 h-8 text-sm rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            Apply
          </button>
        </div>
      </Card>
    );
  },
};
