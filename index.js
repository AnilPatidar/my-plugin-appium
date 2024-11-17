"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyPluginAppium = void 0;
const plugin_1 = __importDefault(require("./src/plugin"));
exports.MyPluginAppium = plugin_1.default;
exports.default = plugin_1.default;
