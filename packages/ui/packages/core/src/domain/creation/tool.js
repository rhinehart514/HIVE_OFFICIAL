"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareToolSchema = exports.UpdateToolSchema = exports.CreateToolSchema = exports.ToolSchema = exports.ToolVersionSchema = exports.ToolConfigSchema = exports.ToolMetadataSchema = exports.ToolStatus = void 0;
exports.createToolDefaults = createToolDefaults;
exports.generateShareToken = generateShareToken;
exports.canUserEditTool = canUserEditTool;
exports.canUserViewTool = canUserViewTool;
exports.getNextVersion = getNextVersion;
exports.determineChangeType = determineChangeType;
exports.validateToolStructure = validateToolStructure;
var zod_1 = require("zod");
var elements_1 = require("./elements");
var TimestampSchema = zod_1.z.preprocess(function (value) {
    if (value instanceof Date)
        return value;
    if (value && typeof value.toDate === 'function') {
        try {
            return value.toDate();
        }
        catch (_a) {
            return value;
        }
    }
    return value;
}, zod_1.z.date());
exports.ToolStatus = zod_1.z.enum(['draft', 'preview', 'published']);
exports.ToolMetadataSchema = zod_1.z.object({
    tags: zod_1.z.array(zod_1.z.string().max(32)).max(10).default([]),
    difficulty: zod_1.z.enum(['beginner', 'advanced']).default('beginner'),
    estimatedMinutes: zod_1.z.number().min(1).max(240).default(10),
    surface: zod_1.z.enum(['pinned', 'posts', 'events', 'tools']).default('tools'),
});
exports.ToolConfigSchema = zod_1.z.object({
    layout: zod_1.z.enum(['stack', 'flow']).default('stack'),
    allowMultipleResponses: zod_1.z.boolean().default(false),
    showProgress: zod_1.z.boolean().default(false),
    dataStorage: zod_1.z.enum(['space', 'profile']).default('space'),
    autoSave: zod_1.z.boolean().default(true),
});
exports.ToolVersionSchema = zod_1.z.object({
    version: zod_1.z.string().regex(/^\d+\.\d+\.\d+$/),
    changelog: zod_1.z.string().max(500).optional(),
    createdAt: TimestampSchema,
    createdBy: zod_1.z.string(),
    isStable: zod_1.z.boolean().default(false),
});
exports.ToolSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(3).max(80),
    description: zod_1.z.string().max(500).default(''),
    ownerId: zod_1.z.string(),
    collaborators: zod_1.z.array(zod_1.z.string()).default([]),
    status: exports.ToolStatus.default('draft'),
    currentVersion: zod_1.z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0.0'),
    versions: zod_1.z.array(exports.ToolVersionSchema).default([]),
    elements: zod_1.z.array(elements_1.ElementInstanceSchema).max(50),
    config: exports.ToolConfigSchema.default({}),
    metadata: exports.ToolMetadataSchema.default({}),
    isPublic: zod_1.z.boolean().default(false),
    shareToken: zod_1.z.string().optional(),
    forkCount: zod_1.z.number().min(0).default(0),
    viewCount: zod_1.z.number().min(0).default(0),
    useCount: zod_1.z.number().min(0).default(0),
    ratingCount: zod_1.z.number().min(0).default(0),
    spaceId: zod_1.z.string().optional(),
    isSpaceTool: zod_1.z.boolean().default(false),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    publishedAt: TimestampSchema.optional(),
    lastUsedAt: TimestampSchema.optional(),
});
exports.CreateToolSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(80),
    description: zod_1.z.string().max(500).optional(),
    spaceId: zod_1.z.string().optional(),
    isSpaceTool: zod_1.z.boolean().default(false),
    config: exports.ToolConfigSchema.partial().optional(),
    metadata: exports.ToolMetadataSchema.partial().optional(),
});
exports.UpdateToolSchema = exports.CreateToolSchema.extend({
    elements: zod_1.z.array(elements_1.ElementInstanceSchema).max(50).optional(),
    changelog: zod_1.z.string().max(500).optional(),
    status: exports.ToolStatus.optional(),
}).partial();
exports.ShareToolSchema = zod_1.z.object({
    permission: zod_1.z.enum(['view', 'edit']).default('view'),
    expiresAt: zod_1.z.date().optional(),
    requiresApproval: zod_1.z.boolean().default(false),
});
function createToolDefaults(opts) {
    var _a, _b, _c, _d, _e, _f;
    if (opts === void 0) { opts = {}; }
    return {
        name: (_a = opts.name) !== null && _a !== void 0 ? _a : 'Untitled Tool',
        description: (_b = opts.description) !== null && _b !== void 0 ? _b : '',
        ownerId: (_c = opts.ownerId) !== null && _c !== void 0 ? _c : '',
        collaborators: [],
        status: 'draft',
        currentVersion: '1.0.0',
        versions: [],
        elements: [],
        config: exports.ToolConfigSchema.parse((_d = opts.config) !== null && _d !== void 0 ? _d : {}),
        metadata: exports.ToolMetadataSchema.parse((_e = opts.metadata) !== null && _e !== void 0 ? _e : {}),
        isPublic: false,
        shareToken: undefined,
        forkCount: 0,
        viewCount: 0,
        useCount: 0,
        ratingCount: 0,
        spaceId: opts.spaceId,
        isSpaceTool: (_f = opts.isSpaceTool) !== null && _f !== void 0 ? _f : false,
    };
}
function generateShareToken(toolId, userId) {
    return Buffer.from("".concat(toolId, ":").concat(userId, ":").concat(Date.now())).toString('base64url');
}
function canUserEditTool(tool, userId) {
    return tool.ownerId === userId || tool.collaborators.includes(userId);
}
function canUserViewTool(tool, userId) {
    return tool.isPublic || tool.ownerId === userId || tool.collaborators.includes(userId);
}
function getNextVersion(current, type) {
    if (type === void 0) { type = 'patch'; }
    var _a = current.split('.').map(function (segment) { return Number(segment) || 0; }), major = _a[0], minor = _a[1], patch = _a[2];
    if (type === 'major')
        return "".concat(major + 1, ".0.0");
    if (type === 'minor')
        return "".concat(major, ".").concat(minor + 1, ".0");
    return "".concat(major, ".").concat(minor, ".").concat(patch + 1);
}
function determineChangeType(previous, next) {
    if (next.length < previous.length)
        return 'major';
    var prevIds = new Set(previous.map(function (el) { return el.id; }));
    var nextIds = new Set(next.map(function (el) { return el.id; }));
    for (var _i = 0, prevIds_1 = prevIds; _i < prevIds_1.length; _i++) {
        var id = prevIds_1[_i];
        if (!nextIds.has(id)) {
            return 'major';
        }
    }
    if (next.length > previous.length)
        return 'minor';
    return 'patch';
}
function validateToolStructure(elements) {
    var ids = new Set();
    for (var _i = 0, elements_2 = elements; _i < elements_2.length; _i++) {
        var element = elements_2[_i];
        if (ids.has(element.id)) {
            return false;
        }
        ids.add(element.id);
    }
    return true;
}
