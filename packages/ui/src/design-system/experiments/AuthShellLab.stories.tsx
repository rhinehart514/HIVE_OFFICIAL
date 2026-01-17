/**
 * AuthShell Lab - Storybook Experiments
 *
 * Testing the auth shell layout for design compliance.
 * Uses LOCKED primitives as building blocks.
 *
 * STATUS: IN LAB - Awaiting selection
 *
 * Variables to test:
 * 1. Background Treatment - How we create atmosphere
 * 2. Content Container - How content is contained
 * 3. Logo Presentation - Size and position
 * 4. Button Variant - Which button style for auth CTA
 * 5. Input Style - Email field appearance
 * 6. Focus Ring - Validate WHITE focus (locked decision)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight } from 'lucide-react';

// ============================================
// IMPORT LOCKED PRIMITIVES
// ============================================
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';

const meta: Meta = {
  title: 'Experiments/AuthShell Lab',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// MOCK CONTENT - Using locked primitives
// ============================================

function MockLoginContent({ variant = 'default' }: { variant?: 'default' | 'cta' | 'secondary' }) {
  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <Heading level={2}>Sign in to HIVE</Heading>
        <Text size="sm" tone="secondary">Use your UB email</Text>
      </div>

      <div className="space-y-4">
        {/* Email Input - Using locked Input primitive */}
        <div className="flex items-center gap-0">
          <Input
            placeholder="you"
            className="rounded-r-none flex-1"
          />
          <div
            className="h-11 px-4 flex items-center rounded-r-xl text-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              color: 'var(--color-text-muted)',
            }}
          >
            @buffalo.edu
          </div>
        </div>

        {/* Button - Testing different variants */}
        <Button
          variant={variant}
          size="lg"
          className="w-full"
          trailingIcon={<ArrowRight />}
        >
          Continue
        </Button>
      </div>

      <Text size="xs" tone="muted" className="text-center">
        By continuing, you agree to our Terms and Privacy Policy
      </Text>
    </div>
  );
}

function MockOTPContent() {
  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <Heading level={2}>Check your email</Heading>
        <Text size="sm" tone="secondary">Enter the 6-digit code</Text>
      </div>

      {/* OTP Inputs using Input primitive styling */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Input
            key={i}
            maxLength={1}
            className="w-11 h-14 text-center text-xl font-semibold p-0"
            defaultValue={i < 3 ? '•' : ''}
          />
        ))}
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm">
          Resend code
        </Button>
      </div>
    </div>
  );
}

// ============================================
// VARIABLE 1: Background Treatment
// ============================================
/**
 * How we create atmosphere for the auth pages.
 *
 * A: Plain Dark - Pure #0A0A09
 * B: Subtle Gradient - Top-to-bottom fade
 * C: Radial Gradient - Center glow
 * D: Ambient Gold Orb - Current implementation
 * E: Warm Vignette - Edge darkening with warmth
 */
export const Variable1_BackgroundTreatment: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="mb-6 text-center">
        <Text tone="muted" size="sm">Background Treatment - Which creates the right atmosphere?</Text>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* A: Plain Dark */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">A: Plain Dark</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <MockLoginContent />
          </div>
        </div>

        {/* B: Subtle Gradient */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">B: Subtle Gradient</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{
              background: 'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-page) 50%, #080808 100%)',
            }}
          >
            <MockLoginContent />
          </div>
        </div>

        {/* C: Radial Gradient */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">C: Radial Gradient</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{
              background: 'radial-gradient(circle at 50% 40%, var(--color-bg-elevated) 0%, var(--color-bg-page) 60%)',
            }}
          >
            <MockLoginContent />
          </div>
        </div>

        {/* D: Ambient Gold Orb (Current) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">D: Ambient Gold Orb (Current)</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(circle, var(--color-accent-gold) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            <MockLoginContent />
          </div>
        </div>

        {/* E: Warm Vignette */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">E: Warm Vignette</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{
              background: 'radial-gradient(circle at 50% 50%, var(--color-bg-page) 0%, #050504 100%)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 200px 100px rgba(255, 215, 0, 0.015)',
              }}
            />
            <MockLoginContent />
          </div>
        </div>

        {/* F: Noise + Gradient */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">F: Noise + Gradient</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{
              background: 'radial-gradient(circle at 50% 40%, var(--color-bg-elevated) 0%, var(--color-bg-page) 60%)',
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            <MockLoginContent />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 2: Content Container
// ============================================
/**
 * How the login content is contained/framed.
 * Using locked Card primitive for glass options.
 *
 * A: No Container - Floating content (current)
 * B: Glass Card - Using Card primitive
 * C: Card with Warmth - Gold edge glow
 * D: Border Only - Transparent with border
 */
export const Variable2_ContentContainer: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="mb-6 text-center">
        <Text tone="muted" size="sm">Content Container - Should the form be contained?</Text>
      </div>
      <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto">
        {/* A: No Container (Current) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">A: No Container (Current)</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <MockLoginContent />
          </div>
        </div>

        {/* B: Glass Card - Using Card primitive */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">B: Glass Card (Primitive)</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Card className="p-8">
              <MockLoginContent />
            </Card>
          </div>
        </div>

        {/* C: Card with Warmth */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">C: Card + Low Warmth</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Card warmth="low" className="p-8">
              <MockLoginContent />
            </Card>
          </div>
        </div>

        {/* D: Border Only */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">D: Border Only</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <div className="p-8 rounded-2xl border border-[var(--color-border)]">
              <MockLoginContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 3: Logo Presentation
// ============================================
/**
 * HIVE logo size and position.
 *
 * A: Large Centered (Current) - Above form
 * B: Small Top-Left - Corner placement
 * C: Small Top-Center - Above everything
 * D: Icon Only - Just the H mark
 * E: No Logo - Content only
 */
export const Variable3_LogoPresentation: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="mb-6 text-center">
        <Text tone="muted" size="sm">Logo Presentation - Size and position</Text>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
        {/* A: Large Centered (Current) */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">A: Large Centered (Current)</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Heading level={1} className="mb-12">HIVE</Heading>
            <MockLoginContent />
          </div>
        </div>

        {/* B: Small Top-Left */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">B: Small Top-Left</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Text weight="semibold" tone="secondary" className="absolute top-6 left-6">HIVE</Text>
            <MockLoginContent />
          </div>
        </div>

        {/* C: Small Top-Center */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">C: Small Top-Center</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Text weight="semibold" tone="secondary" className="absolute top-6 left-1/2 -translate-x-1/2">HIVE</Text>
            <MockLoginContent />
          </div>
        </div>

        {/* D: Icon Only */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">D: Icon Only (H Mark)</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <div
              className="w-12 h-12 rounded-xl mb-8 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-gold) 0%, #B8860B 100%)',
              }}
            >
              <span className="text-black font-bold text-lg">H</span>
            </div>
            <MockLoginContent />
          </div>
        </div>

        {/* E: No Logo */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">E: No Logo</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <MockLoginContent />
          </div>
        </div>

        {/* F: Small Top-Right */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">F: Small Top-Right</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Text weight="semibold" tone="secondary" className="absolute top-6 right-6">HIVE</Text>
            <MockLoginContent />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 4: Button Variant (CTA)
// ============================================
/**
 * Using locked Button primitive variants.
 *
 * A: default - White button, black text
 * B: cta - Gold gradient (1% rule)
 * C: secondary - Outlined
 * D: ghost - Transparent
 */
export const Variable4_ButtonVariant: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8 flex items-center justify-center">
      <div className="space-y-8 w-full max-w-4xl">
        <div className="text-center">
          <Text tone="muted" size="sm">Button Variant - Using locked Button primitive</Text>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {/* A: default */}
          <div className="flex flex-col items-center gap-4">
            <Text size="xs" tone="muted">A: default (Current)</Text>
            <Card className="p-6 w-full">
              <div className="space-y-4">
                <Input placeholder="you@buffalo.edu" />
                <Button variant="default" size="lg" className="w-full" trailingIcon={<ArrowRight />}>
                  Continue
                </Button>
              </div>
            </Card>
          </div>

          {/* B: cta (Gold) */}
          <div className="flex flex-col items-center gap-4">
            <Text size="xs" tone="muted">B: cta (Gold - 1% Rule)</Text>
            <Card className="p-6 w-full">
              <div className="space-y-4">
                <Input placeholder="you@buffalo.edu" />
                <Button variant="cta" size="lg" className="w-full" trailingIcon={<ArrowRight />}>
                  Continue
                </Button>
              </div>
            </Card>
          </div>

          {/* C: secondary */}
          <div className="flex flex-col items-center gap-4">
            <Text size="xs" tone="muted">C: secondary (Outlined)</Text>
            <Card className="p-6 w-full">
              <div className="space-y-4">
                <Input placeholder="you@buffalo.edu" />
                <Button variant="secondary" size="lg" className="w-full" trailingIcon={<ArrowRight />}>
                  Continue
                </Button>
              </div>
            </Card>
          </div>

          {/* D: ghost */}
          <div className="flex flex-col items-center gap-4">
            <Text size="xs" tone="muted">D: ghost (Transparent)</Text>
            <Card className="p-6 w-full">
              <div className="space-y-4">
                <Input placeholder="you@buffalo.edu" />
                <Button variant="ghost" size="lg" className="w-full" trailingIcon={<ArrowRight />}>
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Disabled states */}
        <div className="pt-8 border-t border-[var(--color-border)]">
          <Text size="xs" tone="muted" className="text-center mb-4">Disabled States</Text>
          <div className="grid grid-cols-4 gap-8">
            <Button variant="default" size="lg" className="w-full" disabled>Continue</Button>
            <Button variant="cta" size="lg" className="w-full" disabled>Continue</Button>
            <Button variant="secondary" size="lg" className="w-full" disabled>Continue</Button>
            <Button variant="ghost" size="lg" className="w-full" disabled>Continue</Button>
          </div>
        </div>

        {/* Loading states */}
        <div className="pt-8 border-t border-[var(--color-border)]">
          <Text size="xs" tone="muted" className="text-center mb-4">Loading States</Text>
          <div className="grid grid-cols-4 gap-8">
            <Button variant="default" size="lg" className="w-full" loading>Continue</Button>
            <Button variant="cta" size="lg" className="w-full" loading>Continue</Button>
            <Button variant="secondary" size="lg" className="w-full" loading>Continue</Button>
            <Button variant="ghost" size="lg" className="w-full" loading>Continue</Button>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 5: Focus Ring Validation
// ============================================
/**
 * LOCKED DECISION: Focus rings are WHITE, never gold.
 * This story validates that locked primitives have correct focus.
 */
export const Variable5_FocusRingValidation: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8 flex items-center justify-center">
      <div className="space-y-8 w-full max-w-2xl">
        <div className="text-center space-y-2">
          <Text tone="muted" size="sm">Focus Ring Validation - Tab through to test</Text>
          <Text size="xs" className="text-[var(--color-accent-gold)]">
            LOCKED: Focus rings are WHITE, never gold
          </Text>
        </div>

        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <Text size="xs" tone="muted">Input (Pure Float - shadow focus)</Text>
            <Input placeholder="Tab here to see focus state" />
          </div>

          <div className="space-y-2">
            <Text size="xs" tone="muted">Button default (white ring)</Text>
            <Button variant="default">Focus me</Button>
          </div>

          <div className="space-y-2">
            <Text size="xs" tone="muted">Button cta (white ring, NOT gold)</Text>
            <Button variant="cta">Focus me</Button>
          </div>

          <div className="space-y-2">
            <Text size="xs" tone="muted">Button secondary (white ring)</Text>
            <Button variant="secondary">Focus me</Button>
          </div>

          <div className="space-y-2">
            <Text size="xs" tone="muted">Card interactive (white ring)</Text>
            <Card interactive className="p-4 cursor-pointer" tabIndex={0}>
              <Text size="sm">Focus me (Card with interactive prop)</Text>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  ),
};

// ============================================
// VARIABLE 6: OTP Input Presentation
// ============================================
/**
 * OTP code entry screen presentation.
 * Tests how the 6-digit input should be styled.
 */
export const Variable6_OTPPresentation: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="mb-6 text-center">
        <Text tone="muted" size="sm">OTP Presentation - Code entry screen</Text>
      </div>
      <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* A: No Container */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">A: No Container</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <MockOTPContent />
          </div>
        </div>

        {/* B: Glass Card */}
        <div className="flex flex-col gap-2">
          <Text size="xs" tone="muted" className="text-center">B: Glass Card</Text>
          <div
            className="relative h-[500px] rounded-2xl overflow-hidden flex items-center justify-center px-6"
            style={{ backgroundColor: 'var(--color-bg-page)' }}
          >
            <Card className="p-8">
              <MockOTPContent />
            </Card>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// FULL COMPOSITION: All Locked Primitives
// ============================================
/**
 * Shows auth shell with all locked primitives applied.
 * This is a preview of the properly-aligned implementation.
 */
export const FullComposition_AllPrimitives: Story = {
  render: () => (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-page)' }}
    >
      {/* Subtle radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, var(--color-bg-elevated) 0%, var(--color-bg-page) 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <Heading level={1}>HIVE</Heading>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Heading level={2}>Sign in to HIVE</Heading>
            <Text size="sm" tone="secondary">Use your UB email</Text>
          </div>

          <div className="space-y-4">
            {/* Input with domain suffix */}
            <div className="flex items-center gap-0">
              <Input
                placeholder="you"
                className="rounded-r-none flex-1"
              />
              <div
                className="h-11 px-4 flex items-center rounded-r-xl text-sm"
                style={{
                  background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  color: 'var(--color-text-muted)',
                }}
              >
                @buffalo.edu
              </div>
            </div>

            {/* Default button (white) - matches current */}
            <Button
              variant="default"
              size="lg"
              className="w-full"
              trailingIcon={<ArrowRight />}
            >
              Continue
            </Button>
          </div>

          {/* Footer */}
          <Text size="xs" tone="muted" className="text-center">
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </div>
      </div>
    </div>
  ),
};
