#!/usr/bin/env node
"use strict";
/**
 * HIVE Storybook Kitchen Sink Rebuild
 * Complete systematic rebuild of all stories with correct imports
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanAndRebuildStories = cleanAndRebuildStories;
exports.discoverAllComponents = discoverAllComponents;
var fs_1 = require("fs");
var path_1 = require("path");
// Comprehensive component discovery
function discoverAllComponents() {
    return __awaiter(this, void 0, void 0, function () {
        var components, categories, _i, categories_1, category, categoryPath, files, _a, files_1, file, filePath, content, exports_1, componentName, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    components = [];
                    categories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
                    _i = 0, categories_1 = categories;
                    _b.label = 1;
                case 1:
                    if (!(_i < categories_1.length)) return [3 /*break*/, 10];
                    category = categories_1[_i];
                    categoryPath = path_1.default.join(__dirname, 'src/atomic', category);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 8, , 9]);
                    return [4 /*yield*/, fs_1.promises.readdir(categoryPath)];
                case 3:
                    files = _b.sent();
                    _a = 0, files_1 = files;
                    _b.label = 4;
                case 4:
                    if (!(_a < files_1.length)) return [3 /*break*/, 7];
                    file = files_1[_a];
                    if (!(file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.test.'))) return [3 /*break*/, 6];
                    filePath = path_1.default.join(categoryPath, file);
                    return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                case 5:
                    content = _b.sent();
                    exports_1 = extractExports(content);
                    componentName = path_1.default.basename(file, '.tsx');
                    components.push({
                        filePath: path_1.default.relative(path_1.default.join(__dirname, 'src'), filePath),
                        componentName: componentName,
                        category: category,
                        exports: exports_1
                    });
                    _b.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    console.warn("Could not scan ".concat(category, ":"), error_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/, components];
            }
        });
    });
}
function extractExports(content) {
    var exports = [];
    // Match export const/function/class ComponentName
    var exportMatches = content.match(/export\s+(const|function|class)\s+([A-Z][A-Za-z0-9]+)/g);
    if (exportMatches) {
        exportMatches.forEach(function (match) {
            var name = match.split(/\s+/).pop();
            if (name)
                exports.push(name);
        });
    }
    // Match export { ComponentName }
    var namedExports = content.match(/export\s*\{\s*([^}]+)\s*\}/g);
    if (namedExports) {
        namedExports.forEach(function (match) {
            var names = match.replace(/export\s*\{\s*/, '').replace(/\s*\}/, '').split(',');
            names.forEach(function (name) {
                var cleanName = name.trim().split(/\s+as\s+/)[0].trim();
                if (cleanName && /^[A-Z]/.test(cleanName)) {
                    exports.push(cleanName);
                }
            });
        });
    }
    return exports;
}
function generateStoryContent(component) {
    var componentName = component.componentName, category = component.category, componentExports = component.exports, filePath = component.filePath;
    var importPath = "../../".concat(filePath.replace('.tsx', ''));
    var mainExport = componentExports[0] || componentName;
    var categoryMap = {
        atoms: '01-Atoms',
        molecules: '02-Molecules',
        organisms: '03-Organisms',
        templates: '04-Templates',
        pages: '05-Pages'
    };
    var storyTitle = "".concat(categoryMap[category], "/").concat(componentName.replace(/([A-Z])/g, ' $1').trim());
    return "import type { Meta, StoryObj } from '@storybook/react';\nimport { ".concat(componentExports.join(', '), " } from '").concat(importPath, "';\n\nconst meta: Meta<typeof ").concat(mainExport, "> = {\n  title: '").concat(storyTitle, "',\n  component: ").concat(mainExport, ",\n  parameters: {\n    layout: 'centered',\n    docs: {\n      description: {\n        component: 'HIVE ").concat(componentName, " component - comprehensive documentation with all variants and states.',\n      },\n    },\n  },\n  tags: ['autodocs'],\n  argTypes: {\n    className: {\n      control: 'text',\n      description: 'Additional CSS classes',\n    },\n    children: {\n      control: 'text',\n      description: 'Content to display',\n    },\n  },\n};\n\nexport default meta;\ntype Story = StoryObj<typeof meta>;\n\n// Default state\nexport const Default: Story = {\n  args: {\n    children: '").concat(componentName, "',\n  },\n};\n\n// Interactive example\nexport const Interactive: Story = {\n  args: {\n    children: '").concat(componentName, "',\n  },\n};\n\n// Kitchen sink - all variants\nexport const KitchenSink: Story = {\n  render: () => (\n    <div className=\"p-6 space-y-6 bg-hive-background-primary\">\n      <h3 className=\"text-lg font-semibold text-hive-text-primary\">").concat(componentName, " Variants</h3>\n      <div className=\"grid gap-4\">\n        <").concat(mainExport, ">Default ").concat(componentName, "</").concat(mainExport, ">\n        <").concat(mainExport, " className=\"border-hive-gold\">With Custom Styling</").concat(mainExport, ">\n      </div>\n    </div>\n  ),\n};\n\n// Campus scenarios\nexport const CampusScenarios: Story = {\n  render: () => (\n    <div className=\"p-6 space-y-6 bg-hive-background-primary\">\n      <h3 className=\"text-lg font-semibold text-hive-text-primary\">Campus Use Cases</h3>\n      <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n        <div className=\"space-y-2\">\n          <h4 className=\"font-medium text-hive-text-primary\">Student View</h4>\n          <").concat(mainExport, ">Student ").concat(componentName, "</").concat(mainExport, ">\n        </div>\n        <div className=\"space-y-2\">\n          <h4 className=\"font-medium text-hive-text-primary\">Builder View</h4>\n          <").concat(mainExport, ">Builder ").concat(componentName, "</").concat(mainExport, ">\n        </div>\n      </div>\n    </div>\n  ),\n};\n\n// Responsive showcase\nexport const Responsive: Story = {\n  parameters: {\n    viewport: {\n      defaultViewport: 'mobile',\n    },\n  },\n  render: () => (\n    <div className=\"p-4\">\n      <").concat(mainExport, " className=\"w-full\">Mobile ").concat(componentName, "</").concat(mainExport, ">\n    </div>\n  ),\n};\n");
}
function cleanAndRebuildStories() {
    return __awaiter(this, void 0, void 0, function () {
        var storiesPath, categories, _i, categories_2, category, categoryPath, files, _a, files_2, file, _b, components, _c, components_1, component, storyContent, categoryMap, storyPath;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🧹 Cleaning existing stories...');
                    storiesPath = path_1.default.join(__dirname, 'src/stories');
                    categories = ['01-atoms', '02-molecules', '03-organisms', '04-templates', '05-pages'];
                    _i = 0, categories_2 = categories;
                    _d.label = 1;
                case 1:
                    if (!(_i < categories_2.length)) return [3 /*break*/, 11];
                    category = categories_2[_i];
                    categoryPath = path_1.default.join(storiesPath, category);
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 8, , 10]);
                    return [4 /*yield*/, fs_1.promises.readdir(categoryPath)];
                case 3:
                    files = _d.sent();
                    _a = 0, files_2 = files;
                    _d.label = 4;
                case 4:
                    if (!(_a < files_2.length)) return [3 /*break*/, 7];
                    file = files_2[_a];
                    if (!file.endsWith('.stories.tsx')) return [3 /*break*/, 6];
                    return [4 /*yield*/, fs_1.promises.unlink(path_1.default.join(categoryPath, file))];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 10];
                case 8:
                    _b = _d.sent();
                    // Directory might not exist
                    return [4 /*yield*/, fs_1.promises.mkdir(categoryPath, { recursive: true })];
                case 9:
                    // Directory might not exist
                    _d.sent();
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11:
                    console.log('🔍 Discovering all components...');
                    return [4 /*yield*/, discoverAllComponents()];
                case 12:
                    components = _d.sent();
                    console.log("\uD83D\uDCDD Generating stories for ".concat(components.length, " components..."));
                    _c = 0, components_1 = components;
                    _d.label = 13;
                case 13:
                    if (!(_c < components_1.length)) return [3 /*break*/, 16];
                    component = components_1[_c];
                    storyContent = generateStoryContent(component);
                    categoryMap = {
                        atoms: '01-atoms',
                        molecules: '02-molecules',
                        organisms: '03-organisms',
                        templates: '04-templates',
                        pages: '05-pages'
                    };
                    storyPath = path_1.default.join(storiesPath, categoryMap[component.category], "".concat(component.componentName, ".stories.tsx"));
                    return [4 /*yield*/, fs_1.promises.writeFile(storyPath, storyContent)];
                case 14:
                    _d.sent();
                    console.log("\u2705 Generated: ".concat(component.category, "/").concat(component.componentName));
                    _d.label = 15;
                case 15:
                    _c++;
                    return [3 /*break*/, 13];
                case 16:
                    console.log('🎉 Storybook rebuild complete!');
                    console.log("\uD83D\uDCCA Generated ".concat(components.length, " comprehensive stories"));
                    return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    cleanAndRebuildStories().catch(console.error);
}
