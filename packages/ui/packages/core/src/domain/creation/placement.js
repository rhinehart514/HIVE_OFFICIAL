"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLACED_TOOL_COLLECTION_NAME = exports.PlacedToolSchema = exports.PlacementSettingsSchema = exports.PlacementPermissionsSchema = exports.PlacementTargetType = void 0;
exports.getPlacementCollectionPath = getPlacementCollectionPath;
exports.getPlacementDocPath = getPlacementDocPath;
exports.encodePlacementCompositeId = encodePlacementCompositeId;
exports.decodePlacementCompositeId = decodePlacementCompositeId;
exports.tryDecodePlacementCompositeId = tryDecodePlacementCompositeId;
var zod_1 = require("zod");
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
exports.PlacementTargetType = zod_1.z.enum(['space', 'profile']);
exports.PlacementPermissionsSchema = zod_1.z.object({
    canInteract: zod_1.z.boolean().default(true),
    canView: zod_1.z.boolean().default(true),
    canEdit: zod_1.z.boolean().default(false),
    allowedRoles: zod_1.z.array(zod_1.z.string()).default(['member', 'moderator', 'admin', 'builder']),
});
exports.PlacementSettingsSchema = zod_1.z.object({
    showInDirectory: zod_1.z.boolean().default(true),
    allowSharing: zod_1.z.boolean().default(true),
    collectAnalytics: zod_1.z.boolean().default(true),
    notifyOnInteraction: zod_1.z.boolean().default(false),
});
exports.PlacedToolSchema = zod_1.z.object({
    toolId: zod_1.z.string(),
    targetType: exports.PlacementTargetType,
    targetId: zod_1.z.string(),
    surface: zod_1.z.enum(['pinned', 'posts', 'events', 'tools', 'chat', 'members']).default('tools'),
    status: zod_1.z.enum(['active', 'paused', 'disabled']).default('active'),
    position: zod_1.z.number().min(0).default(0),
    config: zod_1.z.record(zod_1.z.unknown()).default({}),
    permissions: exports.PlacementPermissionsSchema.default({}),
    settings: exports.PlacementSettingsSchema.default({}),
    createdAt: TimestampSchema,
    createdBy: zod_1.z.string(),
    updatedAt: TimestampSchema,
    usageCount: zod_1.z.number().min(0).default(0),
    lastUsedAt: TimestampSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).default({}),
});
exports.PLACED_TOOL_COLLECTION_NAME = 'placed_tools';
function getPlacementCollectionPath(targetType, targetId) {
    return targetType === 'space'
        ? "spaces/".concat(targetId, "/").concat(exports.PLACED_TOOL_COLLECTION_NAME)
        : "profiles/".concat(targetId, "/").concat(exports.PLACED_TOOL_COLLECTION_NAME);
}
function getPlacementDocPath(targetType, targetId, placementId) {
    return "".concat(getPlacementCollectionPath(targetType, targetId), "/").concat(placementId);
}
function encodePlacementCompositeId(targetType, targetId, placementId) {
    return "".concat(targetType, ":").concat(targetId, ":").concat(placementId);
}
function decodePlacementCompositeId(compositeId) {
    var _a = compositeId.split(':'), targetType = _a[0], targetId = _a[1], placementId = _a[2];
    if (!targetType || !targetId || !placementId) {
        throw new Error('Invalid placement identifier');
    }
    if (targetType !== 'space' && targetType !== 'profile') {
        throw new Error('Invalid placement target type');
    }
    return {
        targetType: targetType,
        targetId: targetId,
        placementId: placementId,
    };
}
function tryDecodePlacementCompositeId(compositeId) {
    try {
        return decodePlacementCompositeId(compositeId);
    }
    catch (_a) {
        return null;
    }
}
