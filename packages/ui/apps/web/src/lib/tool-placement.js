"use strict";
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
exports.buildPlacementCompositeId = buildPlacementCompositeId;
exports.parsePlacementCompositeId = parsePlacementCompositeId;
exports.safeParsePlacementCompositeId = safeParsePlacementCompositeId;
exports.createPlacementDocument = createPlacementDocument;
exports.getPlacementDocRef = getPlacementDocRef;
exports.getPlacementFromDeploymentDoc = getPlacementFromDeploymentDoc;
exports.listPlacementsByTool = listPlacementsByTool;
exports.listPlacementsForUser = listPlacementsForUser;
var firebase_admin_1 = require("@/lib/firebase-admin");
var core_1 = require("@hive/core");
function buildPlacementCompositeId(targetType, targetId, placementId) {
    return (0, core_1.encodePlacementCompositeId)(targetType, targetId, placementId);
}
function parsePlacementCompositeId(compositeId) {
    return (0, core_1.decodePlacementCompositeId)(compositeId);
}
function safeParsePlacementCompositeId(compositeId) {
    return (0, core_1.tryDecodePlacementCompositeId)(compositeId);
}
function createPlacementDocument(targetType, targetId, data) {
    return __awaiter(this, void 0, void 0, function () {
        var parsed, collectionPath, ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsed = core_1.PlacedToolSchema.parse(data);
                    collectionPath = (0, core_1.getPlacementCollectionPath)(targetType, targetId);
                    ref = firebase_admin_1.dbAdmin.collection(collectionPath).doc();
                    return [4 /*yield*/, ref.set(parsed)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, {
                            ref: ref,
                            id: ref.id,
                            path: ref.path,
                        }];
            }
        });
    });
}
function getPlacementDocRef(targetType, targetId, placementId) {
    var path = (0, core_1.getPlacementDocPath)(targetType, targetId, placementId);
    return firebase_admin_1.dbAdmin.doc(path);
}
function getPlacementFromDeploymentDoc(deploymentDoc) {
    return __awaiter(this, void 0, void 0, function () {
        var data, placementRef, snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!deploymentDoc.exists) {
                        return [2 /*return*/, null];
                    }
                    data = deploymentDoc.data();
                    if (!(data === null || data === void 0 ? void 0 : data.placementPath) || !(data === null || data === void 0 ? void 0 : data.targetType) || !(data === null || data === void 0 ? void 0 : data.targetId)) {
                        return [2 /*return*/, null];
                    }
                    placementRef = firebase_admin_1.dbAdmin.doc(data.placementPath);
                    return [4 /*yield*/, placementRef.get()];
                case 1:
                    snapshot = _a.sent();
                    return [2 /*return*/, {
                            snapshot: snapshot,
                            ref: placementRef,
                            targetType: data.targetType,
                            targetId: data.targetId,
                            placementId: placementRef.id,
                            path: data.placementPath,
                        }];
            }
        });
    });
}
function listPlacementsByTool(toolId) {
    return __awaiter(this, void 0, void 0, function () {
        var snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, firebase_admin_1.dbAdmin
                        .collectionGroup('placed_tools')
                        .where('toolId', '==', toolId)
                        .get()];
                case 1:
                    snapshot = _a.sent();
                    return [2 /*return*/, snapshot.docs.map(function (doc) { return ({
                            ref: doc.ref,
                            data: doc.data(),
                            path: doc.ref.path,
                        }); })];
            }
        });
    });
}
function listPlacementsForUser(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var profilePlacements;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, firebase_admin_1.dbAdmin
                        .collection("profiles/".concat(userId, "/placed_tools"))
                        .get()];
                case 1:
                    profilePlacements = _a.sent();
                    return [2 /*return*/, profilePlacements.docs.map(function (doc) { return ({
                            ref: doc.ref,
                            data: doc.data(),
                            path: doc.ref.path,
                        }); })];
            }
        });
    });
}
