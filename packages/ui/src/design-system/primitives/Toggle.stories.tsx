import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox, RadioGroup, RadioGroupItem, Switch } from './Toggle';

const meta: Meta = {
  title: 'Design System/Primitives/Inputs/Toggle',
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'centered',
  },
};
export default meta;

// ============================================
// CHECKBOX
// ============================================

export const CheckboxDefault: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 text-white text-sm">
        <Checkbox />
        Default checkbox
      </label>
      <label className="flex items-center gap-3 text-white text-sm">
        <Checkbox defaultChecked />
        Checked (gold fill)
      </label>
      <label className="flex items-center gap-3 text-white/40 text-sm">
        <Checkbox disabled />
        Disabled
      </label>
    </div>
  ),
};

export const CheckboxSizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-white text-xs">
        <Checkbox size="sm" defaultChecked /> Small
      </label>
      <label className="flex items-center gap-2 text-white text-sm">
        <Checkbox size="default" defaultChecked /> Default
      </label>
      <label className="flex items-center gap-2 text-white text-base">
        <Checkbox size="lg" defaultChecked /> Large
      </label>
    </div>
  ),
};

// ============================================
// RADIO GROUP
// ============================================

export const RadioDefault: StoryObj = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex flex-col gap-3">
        {['option-1', 'option-2', 'option-3'].map((val) => (
          <label key={val} className="flex items-center gap-3 text-white text-sm">
            <RadioGroupItem value={val} />
            {val === 'option-1' ? 'First option' : val === 'option-2' ? 'Second option' : 'Third option'}
          </label>
        ))}
      </div>
    </RadioGroup>
  ),
};

// ============================================
// SWITCH
// ============================================

export const SwitchDefault: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 text-white text-sm">
        <Switch /> Off state (white/0.06 track)
      </label>
      <label className="flex items-center gap-3 text-white text-sm">
        <Switch defaultChecked /> On state (gold track)
      </label>
      <label className="flex items-center gap-3 text-white/40 text-sm">
        <Switch disabled /> Disabled
      </label>
    </div>
  ),
};

export const SwitchSizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-white text-xs">
        <Switch size="sm" defaultChecked /> Sm
      </label>
      <label className="flex items-center gap-2 text-white text-sm">
        <Switch size="default" defaultChecked /> Default
      </label>
      <label className="flex items-center gap-2 text-white text-base">
        <Switch size="lg" defaultChecked /> Lg
      </label>
    </div>
  ),
};

// ============================================
// ALL VARIANTS
// ============================================

export const AllVariants: StoryObj = {
  name: '🎨 All Toggle Variants',
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <p className="text-[11px] font-sans text-white/30 uppercase tracking-wider mb-3">Checkbox</p>
        <div className="flex items-center gap-4">
          <Checkbox />
          <Checkbox defaultChecked />
          <Checkbox disabled />
          <Checkbox size="sm" defaultChecked />
          <Checkbox size="lg" defaultChecked />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-sans text-white/30 uppercase tracking-wider mb-3">Radio</p>
        <RadioGroup defaultValue="a" className="flex items-center gap-4">
          <RadioGroupItem value="a" />
          <RadioGroupItem value="b" />
          <RadioGroupItem value="c" />
        </RadioGroup>
      </div>

      <div>
        <p className="text-[11px] font-sans text-white/30 uppercase tracking-wider mb-3">Switch</p>
        <div className="flex items-center gap-4">
          <Switch />
          <Switch defaultChecked />
          <Switch disabled />
          <Switch size="sm" defaultChecked />
          <Switch size="lg" defaultChecked />
        </div>
      </div>
    </div>
  ),
};
