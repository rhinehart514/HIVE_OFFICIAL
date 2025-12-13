import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * # IDE Layout
 *
 * The complete HiveLab workspace - three-pane layout that feels like
 * Figma meets VS Code. Technical, efficient, purposeful.
 *
 * ## Layout Structure
 * - **Left Panel (240px)**: Element palette
 * - **Center**: Canvas (flexible)
 * - **Right Panel (280px)**: Properties inspector
 * - **Bottom**: Status bar (32px)
 * - **Floating**: Toolbar, AI palette
 *
 * ## Visual Identity
 * - Cool navy-black backgrounds
 * - Sharper corners (4-8px)
 * - Technical monospace for IDs and values
 * - Gold accent for AI and active states
 *
 * ## States
 * - **Default**: All panels visible
 * - **Focused Canvas**: Panels collapsed
 * - **AI Active**: Command palette open
 * - **Preview Mode**: Split view
 */
const meta: Meta = {
  title: 'HiveLab/IDE/Layout',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'lab-canvas' },
    docs: {
      description: {
        component:
          'Complete IDE layout with three-pane structure. The workshop where tools are built.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Mock Toolbar
function Toolbar({ onToggleAI }: { onToggleAI: () => void }) {
  return (
    <div className="h-12 bg-[#15151F] border-b border-[#333] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FFD700] flex items-center justify-center">
            <span className="text-black text-xs font-bold">H</span>
          </div>
          <span className="text-sm font-medium text-white">HiveLab</span>
        </div>
        <div className="h-6 w-px bg-[#333]" />
        <nav className="flex items-center gap-1">
          {['File', 'Edit', 'View', 'Tools'].map((item) => (
            <button
              key={item}
              className="px-3 py-1.5 text-xs text-[#999] hover:text-white hover:bg-[#252525] rounded transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAI}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] rounded-lg transition-colors"
        >
          <span className="text-sm">✨</span>
          <span className="text-xs font-medium">AI</span>
          <kbd className="px-1.5 py-0.5 bg-[#FFD700]/20 rounded text-[10px]">⌘K</kbd>
        </button>
        <button className="px-3 py-1.5 bg-[#FFD700] hover:bg-[#E5C200] text-black text-xs font-medium rounded-lg transition-colors">
          Deploy
        </button>
      </div>
    </div>
  );
}

// Mock Element Palette (simplified)
function ElementPalette() {
  const categories = [
    { name: 'Input', color: 'blue', items: ['Search', 'Form', 'Date Picker'] },
    { name: 'Display', color: 'green', items: ['List', 'Chart', 'Timer'] },
    { name: 'Action', color: 'orange', items: ['Poll', 'RSVP', 'Button'] },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white mb-2">Elements</h3>
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[#555] outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {categories.map((cat) => (
          <div key={cat.name}>
            <p className={`text-xs font-medium text-${cat.color}-400 uppercase tracking-wider px-2 mb-2`}>
              {cat.name}
            </p>
            <div className="space-y-1">
              {cat.items.map((item) => (
                <div
                  key={item}
                  className="p-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-white cursor-grab hover:border-[#444] transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-[#333] text-xs text-[#666]">
        Drag to canvas
      </div>
    </div>
  );
}

// Mock Properties Panel (simplified)
function PropertiesPanel({ element }: { element: { name: string; id: string } | null }) {
  if (!element) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <div className="w-12 h-12 rounded-xl bg-[#333] mx-auto mb-3 flex items-center justify-center">
            <span className="text-[#666]">⚙️</span>
          </div>
          <p className="text-sm font-medium text-white mb-1">No Selection</p>
          <p className="text-xs text-[#666]">Select an element to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 border-b border-[#333]">
        <h3 className="text-sm font-medium text-white">{element.name}</h3>
        <p className="text-xs text-[#666] font-mono">{element.id}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 space-y-3 border-b border-[#333]">
          <p className="text-xs font-medium text-[#888] uppercase tracking-wider">Transform</p>
          <div className="grid grid-cols-2 gap-2">
            {['X: 120', 'Y: 80', 'W: 320', 'H: 240'].map((val) => (
              <div key={val} className="bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white font-mono">
                {val}
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-3 space-y-3">
          <p className="text-xs font-medium text-[#888] uppercase tracking-wider">Configuration</p>
          <div>
            <label className="text-xs text-[#666] mb-1 block">Question</label>
            <input
              defaultValue="What's for lunch?"
              className="w-full bg-[#252525] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock Status Bar
function StatusBar() {
  return (
    <div className="h-8 bg-[#15151F] border-t border-[#333] flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <span className="text-[#666]">my-poll-tool</span>
        <span className="text-green-400">● Saved</span>
      </div>
      <div className="flex items-center gap-4 text-[#666]">
        <span>100%</span>
        <span>3 elements</span>
      </div>
    </div>
  );
}

// Canvas with elements
function Canvas({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div
      className="h-full relative"
      style={{
        background: '#0A0A12',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Search element */}
      <div
        onClick={() => onSelect('search')}
        className={`absolute cursor-pointer p-3 bg-[#1a1a1a] border rounded-lg shadow-lg transition-all ${
          selectedId === 'search'
            ? 'border-[#FFD700] shadow-[0_0_0_2px_rgba(255,215,0,0.3)]'
            : 'border-[#333] hover:border-[#444]'
        }`}
        style={{ left: 80, top: 60, width: 240, height: 80 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full border-2 border-blue-400/50" />
          <span className="text-[10px] font-mono text-[#666]">search-input</span>
        </div>
        <div className="bg-[#252525] rounded px-2 py-1 text-xs text-[#999]">
          Search events...
        </div>
      </div>

      {/* Poll element */}
      <div
        onClick={() => onSelect('poll')}
        className={`absolute cursor-pointer p-3 bg-[#1a1a1a] border rounded-lg shadow-lg transition-all ${
          selectedId === 'poll'
            ? 'border-[#FFD700] shadow-[0_0_0_2px_rgba(255,215,0,0.3)]'
            : 'border-[#333] hover:border-[#444]'
        }`}
        style={{ left: 80, top: 180, width: 280, height: 160 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full border-2 border-orange-400/50" />
          <span className="text-[10px] font-mono text-[#666]">poll-element</span>
        </div>
        <p className="text-sm text-white mb-2">What's for lunch?</p>
        <div className="space-y-1">
          {['Pizza', 'Sushi', 'Tacos'].map((opt, i) => (
            <div key={opt} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border-2 ${i === 0 ? 'border-[#FFD700] bg-[#FFD700]' : 'border-[#444]'}`} />
              <span className="text-xs text-[#999]">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection line */}
      <svg className="absolute inset-0 pointer-events-none">
        <path
          d="M 320 100 C 380 100, 380 260, 80 260"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function DefaultIDELayoutStory() {
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('poll');

  const elements = {
    poll: { name: 'Poll / Vote', id: 'poll-element' },
    search: { name: 'Search Input', id: 'search-input' },
  };

  return (
    <div className="h-screen flex flex-col bg-[#0A0A12]">
      <Toolbar onToggleAI={() => setAiOpen(!aiOpen)} />

      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Elements */}
        <div className="w-[240px] bg-[#15151F] border-r border-[#333] flex-shrink-0">
          <ElementPalette />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-0">
          <Canvas selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Right Panel - Properties */}
        <div className="w-[280px] bg-[#15151F] border-l border-[#333] flex-shrink-0">
          <PropertiesPanel
            element={selectedId ? elements[selectedId as keyof typeof elements] : null}
          />
        </div>
      </div>

      <StatusBar />

      {/* AI Command Palette Overlay */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setAiOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
            >
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#333]">
                  <span className="text-[#FFD700]">✨</span>
                  <input
                    type="text"
                    placeholder="Ask AI anything..."
                    autoFocus
                    className="flex-1 bg-transparent text-white text-lg placeholder:text-[#666] outline-none"
                  />
                </div>
                <div className="p-4 text-xs text-[#666]">
                  1 element selected • Try: "Make this poll anonymous"
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Default IDE layout with all panels
 */
export const Default: Story = {
  render: () => <DefaultIDELayoutStory />,
};

/**
 * Canvas focused mode - panels collapsed
 */
export const FocusedCanvas: Story = {
  render: () => (
    <div className="h-screen flex flex-col bg-[#0A0A12]">
      {/* Minimal toolbar */}
      <div className="h-12 bg-[#15151F] border-b border-[#333] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="p-2 text-[#666] hover:text-white transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <span className="text-sm text-[#999]">Focus Mode</span>
        </div>
        <button className="text-xs text-[#666] hover:text-white">
          Press <kbd className="px-1 bg-[#333] rounded">Esc</kbd> to exit
        </button>
      </div>

      {/* Full canvas */}
      <div
        className="flex-1 relative"
        style={{
          background: '#0A0A12',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Element */}
        <div
          className="absolute p-4 bg-[#1a1a1a] border border-[#FFD700] rounded-lg shadow-[0_0_0_2px_rgba(255,215,0,0.3)]"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 320, height: 200 }}
        >
          <div className="text-xs font-mono text-[#666] mb-2">poll-element</div>
          <p className="text-white mb-3">What's for lunch today?</p>
          <div className="space-y-2">
            {['Pizza', 'Sushi', 'Tacos'].map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#444]" />
                <span className="text-sm text-[#999]">{opt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating mini-palette */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#333] rounded-lg p-2 space-y-1 shadow-xl"
        >
          {['📝', '📊', '⏱️', '🗳️'].map((icon) => (
            <button
              key={icon}
              className="w-10 h-10 rounded-lg hover:bg-[#252525] flex items-center justify-center text-lg transition-colors"
            >
              {icon}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  ),
};

/**
 * Split preview mode
 */
export const SplitPreview: Story = {
  render: () => (
    <div className="h-screen flex flex-col bg-[#0A0A12]">
      {/* Toolbar with preview toggle */}
      <div className="h-12 bg-[#15151F] border-b border-[#333] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">HiveLab</span>
          <div className="flex items-center bg-[#252525] rounded-lg p-0.5">
            <button className="px-3 py-1 text-xs bg-[#333] text-white rounded">Canvas</button>
            <button className="px-3 py-1 text-xs text-[#666]">Preview</button>
            <button className="px-3 py-1 text-xs bg-[#FFD700] text-black rounded">Split</button>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-[#FFD700] text-black text-xs font-medium rounded-lg">
          Deploy
        </button>
      </div>

      {/* Split view */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas (60%) */}
        <div
          className="w-[60%] relative border-r border-[#333]"
          style={{
            background: '#0A0A12',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="absolute p-3 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg"
            style={{ left: 60, top: 60, width: 260, height: 160 }}
          >
            <div className="text-xs font-mono text-[#666] mb-2">poll-element</div>
            <p className="text-sm text-white mb-2">What's for lunch?</p>
            <div className="space-y-1">
              {['Pizza', 'Sushi'].map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-[#444]" />
                  <span className="text-xs text-[#999]">{opt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-xs text-[#666]">Canvas</div>
        </div>

        {/* Preview (40%) */}
        <div className="w-[40%] bg-[#1a1a1a] p-8">
          <div className="max-w-sm mx-auto">
            <div className="bg-[#252525] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-medium text-white mb-4">What's for lunch?</h3>
              <div className="space-y-3">
                {['Pizza', 'Sushi', 'Tacos'].map((opt, i) => (
                  <button
                    key={opt}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      i === 0
                        ? 'bg-[#FFD700] text-black'
                        : 'bg-[#333] text-white hover:bg-[#444]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button className="w-full mt-4 py-2 bg-[#FFD700] text-black font-medium rounded-lg">
                Vote
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-[#666]">Live Preview</div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Mobile responsive view
 */
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
  render: () => (
    <div className="h-screen flex flex-col bg-[#0A0A12]">
      {/* Mobile toolbar */}
      <div className="h-14 bg-[#15151F] border-b border-[#333] flex items-center justify-between px-4">
        <button className="p-2 text-[#999]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-medium text-white">my-poll-tool</span>
        <button className="p-2 text-[#FFD700]">✨</button>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-auto"
        style={{
          background: '#0A0A12',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          className="absolute p-3 bg-[#1a1a1a] border border-[#FFD700] rounded-lg"
          style={{ left: 20, top: 20, width: 280, height: 180 }}
        >
          <p className="text-sm text-white mb-2">What's for lunch?</p>
          <div className="space-y-2">
            {['Pizza', 'Sushi', 'Tacos'].map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#444]" />
                <span className="text-xs text-[#999]">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="h-16 bg-[#15151F] border-t border-[#333] flex items-center justify-around">
        <button className="flex flex-col items-center gap-1 text-[#FFD700]">
          <span>📦</span>
          <span className="text-[10px]">Elements</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#999]">
          <span>⚙️</span>
          <span className="text-[10px]">Properties</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#999]">
          <span>👁️</span>
          <span className="text-[10px]">Preview</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#999]">
          <span>🚀</span>
          <span className="text-[10px]">Deploy</span>
        </button>
      </div>
    </div>
  ),
};
