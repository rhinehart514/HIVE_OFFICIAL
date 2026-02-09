/**
 * Custom Block Renderer - Usage Examples
 *
 * This file shows how to use the CustomBlockRenderer component.
 * Not included in production builds - for documentation only.
 */

import { CustomBlockRenderer } from './CustomBlockRenderer';
import type { CustomBlockConfig } from '@hive/core';

// ============================================================
// Example 1: Simple Bingo Card
// ============================================================

const bingoCardConfig: CustomBlockConfig = {
  blockId: 'block_bingo_001',
  version: 1,
  metadata: {
    name: 'Bingo Card',
    description: 'Interactive 5x5 bingo card with tap-to-mark',
    createdBy: 'ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  code: {
    html: `
      <div class="bingo-grid">
        ${Array.from({ length: 25 }, (_, i) => `
          <div class="cell" data-index="${i}">
            <span class="number">${i + 1}</span>
          </div>
        `).join('')}
      </div>
    `,
    css: `
      .bingo-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--hive-spacing-sm);
        padding: var(--hive-spacing-md);
      }

      .cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hive-color-surface);
        border: 2px solid var(--hive-color-border);
        border-radius: var(--hive-radius-md);
        cursor: pointer;
        transition: all var(--hive-transition-fast);
      }

      .cell:hover {
        background: var(--hive-color-primary);
        transform: scale(1.05);
      }

      .cell.marked {
        background: var(--hive-color-primary);
        border-color: var(--hive-color-primary);
      }

      .number {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--hive-color-text);
      }
    `,
    js: `
      const cells = document.querySelectorAll('.cell');

      cells.forEach(cell => {
        cell.addEventListener('click', function() {
          const index = this.dataset.index;
          this.classList.toggle('marked');

          // Get current marked cells
          const marked = Array.from(document.querySelectorAll('.cell.marked'))
            .map(c => c.dataset.index);

          // Update state
          window.HIVE.setState({
            personal: { markedCells: marked }
          });

          // Check for bingo
          if (checkBingo(marked)) {
            window.HIVE.notify('BINGO! You won!', 'success');
          }
        });
      });

      function checkBingo(marked) {
        // Simple bingo check (horizontal, vertical, diagonal)
        const rows = [
          [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14],
          [15,16,17,18,19], [20,21,22,23,24]
        ];
        const cols = [
          [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22],
          [3,8,13,18,23], [4,9,14,19,24]
        ];
        const diags = [[0,6,12,18,24], [4,8,12,16,20]];

        const patterns = [...rows, ...cols, ...diags];

        return patterns.some(pattern =>
          pattern.every(i => marked.includes(String(i)))
        );
      }
    `,
    hash: 'abc123', // Would be computed SHA-256
  },
  manifest: {
    actions: [
      {
        id: 'mark_cell',
        label: 'Mark Cell',
        category: 'personal',
      },
      {
        id: 'reset',
        label: 'Reset Card',
        category: 'personal',
      },
    ],
    inputs: [],
    outputs: [
      {
        id: 'bingo',
        label: 'Bingo Achieved',
        type: 'boolean',
        description: 'True when user gets bingo',
      },
    ],
    stateSchema: {
      type: 'object',
      properties: {
        markedCells: {
          type: 'array',
          default: [],
          description: 'Indices of marked cells',
        },
      },
    },
  },
};

export function BingoCardExample() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Bingo Card Example</h2>
      <CustomBlockRenderer
        instanceId="bingo_001"
        config={bingoCardConfig}
        width={400}
        height={400}
      />
    </div>
  );
}

// ============================================================
// Example 2: Countdown Timer with Animation
// ============================================================

const countdownConfig: CustomBlockConfig = {
  blockId: 'block_countdown_001',
  version: 1,
  metadata: {
    name: 'Animated Countdown',
    description: 'Countdown timer with flip animation',
    createdBy: 'ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  code: {
    html: `
      <div class="countdown-container">
        <h3 class="title">Event Starts In</h3>
        <div class="timer">
          <div class="time-unit">
            <span class="value" id="days">00</span>
            <span class="label">Days</span>
          </div>
          <div class="time-unit">
            <span class="value" id="hours">00</span>
            <span class="label">Hours</span>
          </div>
          <div class="time-unit">
            <span class="value" id="minutes">00</span>
            <span class="label">Minutes</span>
          </div>
          <div class="time-unit">
            <span class="value" id="seconds">00</span>
            <span class="label">Seconds</span>
          </div>
        </div>
      </div>
    `,
    css: `
      .countdown-container {
        text-align: center;
        padding: var(--hive-spacing-lg);
      }

      .title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: var(--hive-spacing-lg);
        color: var(--hive-color-text);
      }

      .timer {
        display: flex;
        gap: var(--hive-spacing-md);
        justify-content: center;
      }

      .time-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--hive-spacing-sm);
      }

      .value {
        display: block;
        font-size: 3rem;
        font-weight: bold;
        font-variant-numeric: tabular-nums;
        color: var(--hive-color-primary);
        background: var(--hive-color-surface);
        padding: var(--hive-spacing-md);
        border-radius: var(--hive-radius-lg);
        min-width: 80px;
        border: 2px solid var(--hive-color-border);
      }

      .label {
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--hive-color-text-muted);
      }
    `,
    js: `
      // Target date (example: 30 days from now)
      const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
          document.querySelector('.title').textContent = 'Event Started!';
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
      }

      // Update every second
      updateCountdown();
      setInterval(updateCountdown, 1000);
    `,
    hash: 'def456',
  },
  manifest: {
    actions: [],
    inputs: [
      {
        id: 'targetDate',
        label: 'Target Date',
        type: 'string',
        description: 'ISO date string for countdown target',
      },
    ],
    outputs: [
      {
        id: 'isComplete',
        label: 'Is Complete',
        type: 'boolean',
        description: 'True when countdown reaches zero',
      },
    ],
  },
};

export function CountdownExample() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Countdown Timer Example</h2>
      <CustomBlockRenderer
        instanceId="countdown_001"
        config={countdownConfig}
        width={600}
        height={200}
      />
    </div>
  );
}

// ============================================================
// Example 3: Custom Data Visualization
// ============================================================

const dataVizConfig: CustomBlockConfig = {
  blockId: 'block_dataviz_001',
  version: 1,
  metadata: {
    name: 'Simple Bar Chart',
    description: 'Hand-drawn style bar chart',
    createdBy: 'ai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  code: {
    html: `
      <div class="chart-container">
        <div class="chart" id="chart"></div>
        <div class="legend" id="legend"></div>
      </div>
    `,
    css: `
      .chart-container {
        padding: var(--hive-spacing-md);
      }

      .chart {
        display: flex;
        align-items: flex-end;
        gap: var(--hive-spacing-sm);
        height: 200px;
        margin-bottom: var(--hive-spacing-md);
      }

      .bar {
        flex: 1;
        background: var(--hive-color-primary);
        border-radius: var(--hive-radius-sm) var(--hive-radius-sm) 0 0;
        transition: all var(--hive-transition-normal);
        cursor: pointer;
        position: relative;
      }

      .bar:hover {
        background: var(--hive-color-primary-hover);
        transform: scaleY(1.05);
      }

      .bar-value {
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.875rem;
        font-weight: bold;
        color: var(--hive-color-text);
      }

      .legend {
        display: flex;
        justify-content: center;
        gap: var(--hive-spacing-md);
        flex-wrap: wrap;
      }

      .legend-item {
        font-size: 0.875rem;
        color: var(--hive-color-text-muted);
      }
    `,
    js: `
      // Example data
      const data = [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 19 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 25 },
        { label: 'Fri', value: 22 },
        { label: 'Sat', value: 8 },
        { label: 'Sun', value: 5 },
      ];

      const max = Math.max(...data.map(d => d.value));
      const chart = document.getElementById('chart');
      const legend = document.getElementById('legend');

      data.forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const height = (item.value / max) * 100;
        bar.style.height = height + '%';

        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = item.value;
        bar.appendChild(value);

        bar.addEventListener('click', () => {
          window.HIVE.notify(\`\${item.label}: \${item.value}\`, 'info');
        });

        chart.appendChild(bar);

        const legendItem = document.createElement('span');
        legendItem.className = 'legend-item';
        legendItem.textContent = item.label;
        legend.appendChild(legendItem);
      });
    `,
    hash: 'ghi789',
  },
  manifest: {
    actions: [],
    inputs: [
      {
        id: 'data',
        label: 'Chart Data',
        type: 'array',
        description: 'Array of {label, value} objects',
      },
    ],
    outputs: [],
  },
};

export function DataVizExample() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Data Visualization Example</h2>
      <CustomBlockRenderer
        instanceId="dataviz_001"
        config={dataVizConfig}
        width={500}
        height={300}
      />
    </div>
  );
}
