"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementLibrary = exports.ElementPropsByType = exports.ElementInstanceSchema = exports.ElementType = exports.ElementIdSchema = void 0;
exports.validateElementConfig = validateElementConfig;
var zod_1 = require("zod");
/**
 * Canonical HiveLab element definitions.
 * These align with the vBETA element kit defined in the HiveLab system spec.
 */
exports.ElementIdSchema = zod_1.z
    .string()
    .regex(/^el_[A-Za-z0-9_-]+$/, 'Element ids must look like "el_xxx"');
exports.ElementType = zod_1.z.enum([
    'staticText',
    'staticImage',
    'divider',
    'shortTextInput',
    'longTextInput',
    'multipleChoice',
    'imagePicker',
    'submitButton',
    'linkButton',
]);
var StaticTextPropsSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content cannot be empty.'),
    align: zod_1.z.enum(['left', 'center', 'right']).default('left'),
    size: zod_1.z.enum(['small', 'medium', 'large']).default('medium'),
});
var StaticImagePropsSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url('Must be a valid URL'),
    altText: zod_1.z.string().max(160),
    caption: zod_1.z.string().max(160).optional(),
});
var DividerPropsSchema = zod_1.z.object({
    thickness: zod_1.z.enum(['thin', 'thick']).default('thin'),
});
var ShortTextInputPropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    placeholder: zod_1.z.string().max(120).optional(),
    maxLength: zod_1.z.number().min(1).max(280).default(140),
    required: zod_1.z.boolean().default(false),
});
var LongTextInputPropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    placeholder: zod_1.z.string().max(240).optional(),
    maxLength: zod_1.z.number().min(50).max(2000).default(500),
    required: zod_1.z.boolean().default(false),
});
var MultipleChoicePropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    options: zod_1.z.array(zod_1.z.string().min(1)).min(2).max(8),
    allowMultiple: zod_1.z.boolean().default(false),
    shuffleOptions: zod_1.z.boolean().default(false),
});
var ImagePickerPropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    helpText: zod_1.z.string().max(200).optional(),
    maxFileSizeMB: zod_1.z.number().min(1).max(10).default(5),
});
var SubmitButtonPropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    actionName: zod_1.z.string().min(1),
    style: zod_1.z.enum(['primary', 'secondary']).default('primary'),
    disabledUntilValid: zod_1.z.boolean().default(true),
});
var LinkButtonPropsSchema = zod_1.z.object({
    label: zod_1.z.string().min(1),
    url: zod_1.z.string().url('Must be a valid URL'),
    openInNewTab: zod_1.z.boolean().default(true),
});
var baseInstance = {
    id: exports.ElementIdSchema,
};
exports.ElementInstanceSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('staticText'), props: StaticTextPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('staticImage'), props: StaticImagePropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('divider'), props: DividerPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('shortTextInput'), props: ShortTextInputPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('longTextInput'), props: LongTextInputPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('multipleChoice'), props: MultipleChoicePropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('imagePicker'), props: ImagePickerPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('submitButton'), props: SubmitButtonPropsSchema })),
    zod_1.z.object(__assign(__assign({}, baseInstance), { type: zod_1.z.literal('linkButton'), props: LinkButtonPropsSchema })),
]);
var elementPropSchemas = {
    staticText: StaticTextPropsSchema,
    staticImage: StaticImagePropsSchema,
    divider: DividerPropsSchema,
    shortTextInput: ShortTextInputPropsSchema,
    longTextInput: LongTextInputPropsSchema,
    multipleChoice: MultipleChoicePropsSchema,
    imagePicker: ImagePickerPropsSchema,
    submitButton: SubmitButtonPropsSchema,
    linkButton: LinkButtonPropsSchema,
};
exports.ElementPropsByType = elementPropSchemas;
function validateElementConfig(type, props) {
    var schema = elementPropSchemas[type];
    var result = schema.safeParse(props);
    if (!result.success) {
        throw new Error(result.error.message);
    }
    return result.data;
}
exports.ElementLibrary = Object.entries(elementPropSchemas).map(function (_a) {
    var type = _a[0], schema = _a[1];
    return ({
        type: type,
        schema: schema,
    });
});
