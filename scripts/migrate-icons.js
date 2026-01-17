#!/usr/bin/env node
/**
 * Migration script: lucide-react → @heroicons/react
 *
 * Run with: node scripts/migrate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon name mapping: lucide-react → heroicons
// Heroicons uses PascalCase with "Icon" suffix
const ICON_MAP = {
  // Navigation & Arrows
  'ArrowLeft': 'ArrowLeftIcon',
  'ArrowRight': 'ArrowRightIcon',
  'ArrowUp': 'ArrowUpIcon',
  'ArrowDown': 'ArrowDownIcon',
  'ArrowUpRight': 'ArrowUpRightIcon',
  'ChevronDown': 'ChevronDownIcon',
  'ChevronUp': 'ChevronUpIcon',
  'ChevronLeft': 'ChevronLeftIcon',
  'ChevronRight': 'ChevronRightIcon',
  'ChevronsUpDown': 'ChevronUpDownIcon',
  'ExternalLink': 'ArrowTopRightOnSquareIcon',

  // Actions
  'X': 'XMarkIcon',
  'Check': 'CheckIcon',
  'Plus': 'PlusIcon',
  'Minus': 'MinusIcon',
  'Search': 'MagnifyingGlassIcon',
  'Edit': 'PencilIcon',
  'Edit2': 'PencilIcon',
  'Edit3': 'PencilSquareIcon',
  'Trash': 'TrashIcon',
  'Trash2': 'TrashIcon',
  'Copy': 'ClipboardDocumentIcon',
  'Save': 'BookmarkIcon',
  'Download': 'ArrowDownTrayIcon',
  'Upload': 'ArrowUpTrayIcon',
  'Share': 'ShareIcon',
  'Share2': 'ShareIcon',
  'Send': 'PaperAirplaneIcon',
  'Refresh': 'ArrowPathIcon',
  'RefreshCw': 'ArrowPathIcon',
  'RotateCcw': 'ArrowUturnLeftIcon',
  'Play': 'PlayIcon',
  'Pause': 'PauseIcon',
  'Stop': 'StopIcon',

  // UI Elements
  'Menu': 'Bars3Icon',
  'MoreHorizontal': 'EllipsisHorizontalIcon',
  'MoreVertical': 'EllipsisVerticalIcon',
  'GripVertical': 'Bars3Icon',
  'Maximize': 'ArrowsPointingOutIcon',
  'Maximize2': 'ArrowsPointingOutIcon',
  'Minimize': 'ArrowsPointingInIcon',
  'Minimize2': 'ArrowsPointingInIcon',
  'Eye': 'EyeIcon',
  'EyeOff': 'EyeSlashIcon',
  'Filter': 'FunnelIcon',
  'SlidersHorizontal': 'AdjustmentsHorizontalIcon',
  'Settings': 'Cog6ToothIcon',
  'Settings2': 'Cog8ToothIcon',

  // Status & Alerts
  'AlertCircle': 'ExclamationCircleIcon',
  'AlertTriangle': 'ExclamationTriangleIcon',
  'Info': 'InformationCircleIcon',
  'HelpCircle': 'QuestionMarkCircleIcon',
  'CheckCircle': 'CheckCircleIcon',
  'CheckCircle2': 'CheckCircleIcon',
  'XCircle': 'XCircleIcon',
  'Ban': 'NoSymbolIcon',
  'ShieldCheck': 'ShieldCheckIcon',
  'Shield': 'ShieldCheckIcon',

  // People & Users
  'User': 'UserIcon',
  'Users': 'UsersIcon',
  'UserPlus': 'UserPlusIcon',
  'UserMinus': 'UserMinusIcon',
  'UserCheck': 'UserIcon',
  'UserCircle': 'UserCircleIcon',
  'UserCircle2': 'UserCircleIcon',

  // Communication
  'Mail': 'EnvelopeIcon',
  'MessageSquare': 'ChatBubbleLeftIcon',
  'MessageCircle': 'ChatBubbleOvalLeftIcon',
  'Bell': 'BellIcon',
  'BellOff': 'BellSlashIcon',
  'Phone': 'PhoneIcon',
  'Video': 'VideoCameraIcon',

  // Content & Media
  'Image': 'PhotoIcon',
  'FileText': 'DocumentTextIcon',
  'File': 'DocumentIcon',
  'Folder': 'FolderIcon',
  'FolderOpen': 'FolderOpenIcon',
  'Link': 'LinkIcon',
  'Link2': 'LinkIcon',
  'Paperclip': 'PaperClipIcon',
  'Bookmark': 'BookmarkIcon',
  'Heart': 'HeartIcon',
  'Star': 'StarIcon',
  'Flag': 'FlagIcon',
  'Tag': 'TagIcon',

  // Time & Calendar
  'Clock': 'ClockIcon',
  'Calendar': 'CalendarIcon',
  'CalendarDays': 'CalendarDaysIcon',
  'Timer': 'ClockIcon',

  // Location
  'MapPin': 'MapPinIcon',
  'Map': 'MapIcon',
  'Globe': 'GlobeAltIcon',
  'Globe2': 'GlobeAltIcon',
  'Home': 'HomeIcon',
  'Building': 'BuildingOfficeIcon',
  'Building2': 'BuildingOffice2Icon',

  // Commerce
  'ShoppingCart': 'ShoppingCartIcon',
  'ShoppingBag': 'ShoppingBagIcon',
  'CreditCard': 'CreditCardIcon',
  'DollarSign': 'CurrencyDollarIcon',
  'Gift': 'GiftIcon',
  'Receipt': 'ReceiptPercentIcon',

  // Tech & Devices
  'Laptop': 'ComputerDesktopIcon',
  'Monitor': 'ComputerDesktopIcon',
  'Smartphone': 'DevicePhoneMobileIcon',
  'Tablet': 'DeviceTabletIcon',
  'Wifi': 'WifiIcon',
  'WifiOff': 'WifiIcon',
  'Bluetooth': 'SignalIcon',
  'Server': 'ServerIcon',
  'Database': 'CircleStackIcon',
  'Cloud': 'CloudIcon',
  'CloudUpload': 'CloudArrowUpIcon',
  'CloudDownload': 'CloudArrowDownIcon',

  // Development
  'Code': 'CodeBracketIcon',
  'Code2': 'CodeBracketSquareIcon',
  'Terminal': 'CommandLineIcon',
  'Bug': 'BugAntIcon',
  'Wrench': 'WrenchIcon',
  'Hammer': 'WrenchScrewdriverIcon',
  'Cog': 'CogIcon',
  'Puzzle': 'PuzzlePieceIcon',
  'Zap': 'BoltIcon',
  'Lightning': 'BoltIcon',

  // Analytics & Charts
  'BarChart': 'ChartBarIcon',
  'BarChart2': 'ChartBarIcon',
  'BarChart3': 'ChartBarIcon',
  'PieChart': 'ChartPieIcon',
  'TrendingUp': 'ArrowTrendingUpIcon',
  'TrendingDown': 'ArrowTrendingDownIcon',
  'Activity': 'ChartBarIcon',
  'Target': 'ViewfinderCircleIcon',

  // Social & Fun
  'ThumbsUp': 'HandThumbUpIcon',
  'ThumbsDown': 'HandThumbDownIcon',
  'Smile': 'FaceSmileIcon',
  'Frown': 'FaceFrownIcon',
  'Meh': 'FaceSmileIcon',
  'Award': 'TrophyIcon',
  'Trophy': 'TrophyIcon',
  'Medal': 'TrophyIcon',
  'Crown': 'TrophyIcon',
  'Flame': 'FireIcon',
  'Rocket': 'RocketLaunchIcon',
  'Sparkles': 'SparklesIcon',
  'Wand2': 'SparklesIcon',
  'GraduationCap': 'AcademicCapIcon',

  // Grid & Layout
  'Grid': 'Squares2X2Icon',
  'Grid3x3': 'Squares2X2Icon',
  'LayoutGrid': 'Squares2X2Icon',
  'Columns': 'ViewColumnsIcon',
  'Rows': 'Bars3BottomLeftIcon',
  'List': 'ListBulletIcon',
  'Square': 'StopIcon',

  // Misc
  'Loader': 'ArrowPathIcon',
  'Loader2': 'ArrowPathIcon',
  'Circle': 'StopIcon',
  'Lock': 'LockClosedIcon',
  'Unlock': 'LockOpenIcon',
  'Key': 'KeyIcon',
  'LogOut': 'ArrowRightOnRectangleIcon',
  'LogIn': 'ArrowLeftOnRectangleIcon',
  'PanelLeftClose': 'ChevronDoubleLeftIcon',
  'PanelLeftOpen': 'ChevronDoubleRightIcon',
  'PanelLeft': 'Bars3BottomLeftIcon',
  'SidebarClose': 'ChevronDoubleLeftIcon',
  'Hash': 'HashtagIcon',
  'AtSign': 'AtSymbolIcon',
  'Percent': 'ReceiptPercentIcon',
};

// Get all files that import from lucide-react
function findFilesWithLucide(dir) {
  const result = execSync(
    `grep -rl "from 'lucide-react'" --include="*.tsx" --include="*.ts" "${dir}" 2>/dev/null || true`,
    { encoding: 'utf8' }
  );
  return result.trim().split('\n').filter(f => f);
}

// Parse imports from a file
function parseLucideImports(content) {
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const iconNames = match[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('type ') && s !== 'LucideIcon');
    imports.push(...iconNames);
  }

  return [...new Set(imports)];
}

// Generate heroicon import statement
function generateHeroImport(icons, variant = '24/outline') {
  const mappedIcons = icons
    .map(icon => ICON_MAP[icon])
    .filter(Boolean);

  if (mappedIcons.length === 0) return '';

  return `import { ${mappedIcons.join(', ')} } from '@heroicons/react/${variant}'`;
}

// Migrate a single file
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Find lucide imports
  const lucideIcons = parseLucideImports(content);
  if (lucideIcons.length === 0) return { changed: false };

  // Track unmapped icons
  const unmapped = lucideIcons.filter(icon => !ICON_MAP[icon]);

  // Replace import statement
  const heroImport = generateHeroImport(lucideIcons);
  content = content.replace(
    /import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"]/g,
    heroImport || '// TODO: heroicons import'
  );

  // Replace icon usages in JSX
  lucideIcons.forEach(lucideIcon => {
    const heroIcon = ICON_MAP[lucideIcon];
    if (heroIcon) {
      // Replace component usage: <IconName ... /> → <HeroIconName ... />
      const usageRegex = new RegExp(`<${lucideIcon}(\\s|\\/)`, 'g');
      content = content.replace(usageRegex, `<${heroIcon}$1`);

      // Replace closing tags if any
      const closingRegex = new RegExp(`</${lucideIcon}>`, 'g');
      content = content.replace(closingRegex, `</${heroIcon}>`);

      // Replace references in code (not JSX)
      const refRegex = new RegExp(`\\b${lucideIcon}\\b`, 'g');
      content = content.replace(refRegex, heroIcon);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return { changed: true, unmapped, icons: lucideIcons };
  }

  return { changed: false, unmapped, icons: lucideIcons };
}

// Main migration
async function main() {
  const dirs = [
    '/Users/laneyfraass/Desktop/HIVE/packages/ui',
    '/Users/laneyfraass/Desktop/HIVE/apps/web',
    '/Users/laneyfraass/Desktop/HIVE/apps/admin',
  ];

  let totalFiles = 0;
  let changedFiles = 0;
  const allUnmapped = new Set();

  for (const dir of dirs) {
    console.log(`\nScanning ${dir}...`);
    const files = findFilesWithLucide(dir);

    for (const file of files) {
      totalFiles++;
      const result = migrateFile(file);

      if (result.changed) {
        changedFiles++;
        console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
      }

      if (result.unmapped) {
        result.unmapped.forEach(u => allUnmapped.add(u));
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Migration complete: ${changedFiles}/${totalFiles} files updated`);

  if (allUnmapped.size > 0) {
    console.log(`\nUnmapped icons (need manual review):`);
    [...allUnmapped].forEach(u => console.log(`  - ${u}`));
  }
}

main().catch(console.error);
