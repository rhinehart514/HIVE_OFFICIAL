"use client";

/**
 * Create Event Modal - Full implementation for MVP
 * Provides form for creating new events with validation
 */

import React, { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  toast,
} from "@hive/ui";
import {
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import {
  BookOpen,
  PartyPopper,
  Gamepad2,
  Drama,
  Users,
  Monitor,
} from "lucide-react";

export interface CreateEventData {
  title: string;
  description: string;
  type: string;
  datetime: { start: string; end: string; timezone?: string };
  location: { name: string; type?: string; address?: string; virtualLink?: string };
}

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent?: (data: CreateEventData) => void | Promise<void>;
  spaceId?: string;
  spaceName?: string;
}

const EVENT_TYPES = [
  { value: "academic", label: "Academic", icon: BookOpen },
  { value: "social", label: "Social", icon: PartyPopper },
  { value: "recreational", label: "Recreational", icon: Gamepad2 },
  { value: "cultural", label: "Cultural", icon: Drama },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "virtual", label: "Virtual", icon: Monitor },
] as const;

const LOCATION_TYPES = [
  { value: "physical", label: "In Person", icon: BuildingOfficeIcon },
  { value: "virtual", label: "Virtual", icon: VideoCameraIcon },
  { value: "hybrid", label: "Hybrid", icon: GlobeAltIcon },
] as const;

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
  spaceId: _spaceId,
  spaceName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "social",
    locationType: "physical",
    locationName: "",
    locationAddress: "",
    virtualLink: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user types
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (!formData.locationName.trim()) {
      newErrors.locationName = "Location is required";
    }

    if (formData.locationType === "virtual" && !formData.virtualLink.trim()) {
      newErrors.virtualLink = "Virtual link is required for online events";
    }

    // Validate start is before end
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors", "Check the form for missing fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData: CreateEventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        datetime: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: {
          name: formData.locationName.trim(),
          type: formData.locationType,
          address: formData.locationAddress.trim() || undefined,
          virtualLink: formData.virtualLink.trim() || undefined,
        },
      };

      await onCreateEvent?.(eventData);
      toast.success("Event created!", "Your event has been scheduled.");

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "social",
        locationType: "physical",
        locationName: "",
        locationAddress: "",
        virtualLink: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
      });

      onClose();
    } catch {
      toast.error("Failed to create event", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ModalContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle className="text-xl">Create Event</ModalTitle>
            <ModalDescription>
              {spaceName
                ? `Create a new event for ${spaceName}`
                : "Share an event with your campus community"}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-6">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-white/80">
                Event Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("title", e.target.value)
                }
                placeholder="What's the event called?"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Event Type</Label>
              <div className="grid grid-cols-5 gap-2">
                {EVENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange("type", type.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        formData.type === type.value
                          ? "border-[var(--hive-brand-primary)] bg-[var(--hive-brand-primary)]/10"
                          : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-white/80" />
                      <span className="text-xs text-white/60">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date & Time *
              </Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Start */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Starts</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={formData.startDate}
                      min={today}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className={`flex-1 ${errors.startDate ? "border-red-500" : ""}`}
                    />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      className={`w-28 ${errors.startTime ? "border-red-500" : ""}`}
                    />
                  </div>
                  {(errors.startDate || errors.startTime) && (
                    <p className="text-xs text-red-400">
                      {errors.startDate || errors.startTime}
                    </p>
                  )}
                </div>

                {/* End */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Ends</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate || today}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className={`flex-1 ${errors.endDate ? "border-red-500" : ""}`}
                    />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      className={`w-28 ${errors.endTime ? "border-red-500" : ""}`}
                    />
                  </div>
                  {(errors.endDate || errors.endTime) && (
                    <p className="text-xs text-red-400">
                      {errors.endDate || errors.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                Location *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {LOCATION_TYPES.map((loc) => {
                  const Icon = loc.icon;
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => handleInputChange("locationType", loc.value)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        formData.locationType === loc.value
                          ? "border-[var(--hive-brand-primary)] bg-[var(--hive-brand-primary)]/10"
                          : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{loc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-3">
              <Input
                value={formData.locationName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("locationName", e.target.value)
                }
                placeholder={
                  formData.locationType === "virtual"
                    ? "e.g., Zoom Meeting, Discord Server"
                    : "e.g., Student Union Room 201"
                }
                className={errors.locationName ? "border-red-500" : ""}
              />
              {errors.locationName && (
                <p className="text-xs text-red-400">{errors.locationName}</p>
              )}

              {(formData.locationType === "physical" ||
                formData.locationType === "hybrid") && (
                <Input
                  value={formData.locationAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("locationAddress", e.target.value)
                  }
                  placeholder="Full address (optional)"
                />
              )}

              {(formData.locationType === "virtual" ||
                formData.locationType === "hybrid") && (
                <>
                  <Input
                    value={formData.virtualLink}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("virtualLink", e.target.value)
                    }
                    placeholder="https://zoom.us/j/... or meeting link"
                    className={errors.virtualLink ? "border-red-500" : ""}
                  />
                  {errors.virtualLink && (
                    <p className="text-xs text-red-400">{errors.virtualLink}</p>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-white/80 flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Description
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell people what this event is about..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
            </div>
          </ModalBody>

          <ModalFooter className="gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default CreateEventModal;
