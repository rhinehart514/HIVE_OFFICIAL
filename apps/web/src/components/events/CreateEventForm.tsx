'use client';

/**
 * CreateEventForm — Used by leaders inside their Space to create events.
 * After creation, event card drops into Space stream.
 *
 * Fields: title, date, time, end time (optional), location, description, capacity (optional).
 * POSTs to /api/spaces/[spaceId]/events.
 */

import * as React from 'react';
import { Calendar, MapPin, AlignLeft, Users } from 'lucide-react';
import { Button, Input, Label, toast } from '@hive/ui';

interface CreateEventFormProps {
  spaceId: string;
  spaceName?: string;
  onSuccess?: (event: { id: string; title: string }) => void;
  onCancel?: () => void;
}

export function CreateEventForm({
  spaceId,
  spaceName,
  onSuccess,
  onCancel,
}: CreateEventFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    capacity: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const today = new Date().toISOString().split('T')[0];

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.startDate) e.startDate = 'Date is required';
    if (!form.startTime) e.startTime = 'Time is required';
    if (!form.location.trim()) e.location = 'Location is required';

    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const start = new Date(`${form.startDate}T${form.startTime}`);
      const end = new Date(`${form.endDate}T${form.endTime}`);
      if (end <= start) e.endTime = 'End must be after start';
    }

    if (form.capacity && (isNaN(Number(form.capacity)) || Number(form.capacity) < 1)) {
      e.capacity = 'Must be a positive number';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);

      // Default end: 1 hour after start if not provided
      let endDateTime: Date;
      if (form.endDate && form.endTime) {
        endDateTime = new Date(`${form.endDate}T${form.endTime}`);
      } else if (form.endTime) {
        endDateTime = new Date(`${form.startDate}T${form.endTime}`);
      } else {
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      }

      const body = {
        title: form.title.trim(),
        description: form.description.trim() || 'No description provided',
        type: 'social' as const,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: form.location.trim(),
        ...(form.capacity ? { maxAttendees: Number(form.capacity) } : {}),
        tags: [],
      };

      const res = await fetch(`/api/spaces/${spaceId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? json?.message ?? 'Failed to create event');
      }

      const data = json?.data ?? json;
      const eventId = data?.event?.id;

      toast.success('Event created!', 'Your event is now live.');
      onSuccess?.({ id: eventId, title: form.title.trim() });

      // Reset
      setForm({
        title: '', description: '', startDate: '', startTime: '',
        endDate: '', endTime: '', location: '', capacity: '',
      });
    } catch (err) {
      toast.error(
        'Failed to create event',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {spaceName && (
        <p className="text-sm text-white/50">Creating event for {spaceName}</p>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="evt-title" className="text-sm font-medium text-white">
          Event Title *
        </Label>
        <Input
          id="evt-title"
          value={form.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value)}
          placeholder="What's the event called?"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Date & Time */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-white flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Date & Time *
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/40">Starts</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                value={form.startDate}
                min={today}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('startDate', e.target.value)}
                className={`flex-1 ${errors.startDate ? 'border-red-500' : ''}`}
              />
              <Input
                type="time"
                value={form.startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('startTime', e.target.value)}
                className={`w-28 ${errors.startTime ? 'border-red-500' : ''}`}
              />
            </div>
            {(errors.startDate || errors.startTime) && (
              <p className="text-xs text-red-400 mt-1">{errors.startDate || errors.startTime}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-white/40">Ends (optional)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate || today}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('endDate', e.target.value)}
                className="flex-1"
              />
              <Input
                type="time"
                value={form.endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('endTime', e.target.value)}
                className={`w-28 ${errors.endTime ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.endTime && <p className="text-xs text-red-400 mt-1">{errors.endTime}</p>}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="evt-location" className="text-sm font-medium text-white flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Location *
        </Label>
        <Input
          id="evt-location"
          value={form.location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('location', e.target.value)}
          placeholder="e.g., Student Union Room 201"
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="evt-desc" className="text-sm font-medium text-white flex items-center gap-2">
          <AlignLeft className="w-3.5 h-3.5" />
          Description
        </Label>
        <textarea
          id="evt-desc"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Tell people what this event is about..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none text-sm"
        />
      </div>

      {/* Capacity */}
      <div className="space-y-1.5">
        <Label htmlFor="evt-capacity" className="text-sm font-medium text-white flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Capacity (optional)
        </Label>
        <Input
          id="evt-capacity"
          type="number"
          value={form.capacity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('capacity', e.target.value)}
          placeholder="Max attendees"
          min={1}
          className={errors.capacity ? 'border-red-500' : ''}
        />
        {errors.capacity && <p className="text-xs text-red-400">{errors.capacity}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="brand"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}

CreateEventForm.displayName = 'CreateEventForm';
export default CreateEventForm;
