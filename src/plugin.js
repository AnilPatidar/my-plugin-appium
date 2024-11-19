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
Object.defineProperty(exports, "__esModule", { value: true });
const base_plugin_1 = require("@appium/base-plugin");
const support_1 = require("appium/support");
const influxdb_client_1 = require("@influxdata/influxdb-client");
const log = support_1.logger.getLogger('command-viz-plugin');
const influxDBClient = new influxdb_client_1.InfluxDB({ url: 'http://localhost:8086', token: 'P3C_za5tXhvXR_y93U0sFazzebFx-xr1WiUDdeUZYZGEQBYFwNEmiKcqHvwNFKyQCAZmNnsH-8EZaAJCmOQBXQ==' });
function logLocatorPerformance(locatorType, timeTaken, commandName, commmand) {
    return __awaiter(this, void 0, void 0, function* () {
        const writeApi = influxDBClient.getWriteApi('games24x7', 'locator_performance');
        const point = new influxdb_client_1.Point('locator_performance')
            .tag('locator_type', locatorType) // XPath, Accessibility ID, etc.
            .tag('commandName', commandName)
            .tag('commmand', commmand)
            .floatField('time_taken', timeTaken); // Time in milliseconds
        writeApi.writePoint(point);
        // Commit data to InfluxDB
        writeApi.flush().catch(err => console.error('Error writing data:', err));
        return true;
    });
}
function logActivity(testName, activityName, timeTaken) {
    return __awaiter(this, void 0, void 0, function* () {
        const writeApi = influxDBClient.getWriteApi('games24x7', 'locator_performance');
        const point = new influxdb_client_1.Point('locator_performance')
            .tag('testName', testName) // contestCreation, matchCreation, etc.
            .tag('activityName', activityName) // contestCreation, matchCreation, etc.
            .floatField('time_taken', timeTaken); // Time in milliseconds
        writeApi.writePoint(point);
        log.info(`Activity logged for ${testName} with activityName: ${activityName} and timeTaken: ${timeTaken}`);
        // Commit data to InfluxDB
        writeApi.flush().catch(err => console.error('Error writing data:', err));
        return true;
    });
}
const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/logActivity');
// Example usage
class CommandViz extends base_plugin_1.BasePlugin {
    constructor(pluginName) {
        super(pluginName);
    }
    shouldAvoidProxy(_method, route, _body) {
        return SOURCE_URL_REGEX.test(route);
    }
    setActivityDetails(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            log.info(`command-viz-plugin : setActivityDetails called`);
            log.info(`Arguments: ${JSON.stringify(args)}`);
            const timeTaken = args[0];
            const functionalityName = args[1];
            const testName = args[2];
            //const [timeTaken, functionalityName, testName, sessionId] = args;
            yield logActivity(testName, functionalityName, timeTaken);
        });
    }
    findElement(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.getTimeDifference(next, 'findElement', ...args);
            return result;
        });
    }
    findElements(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.getTimeDifference(next, 'findElements', ...args);
            return result;
        });
    }
    getTimeDifference(next, commandName, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            log.info('command-viz-plugin is handing the command');
            const startTime = Date.now();
            var result = () => { };
            try {
                result = yield next();
            }
            catch (e) {
                log.info(`Error in ${commandName} command: ${e}`);
            }
            const endTime = Date.now();
            const durationInSeconds = (endTime - startTime) / 1000;
            log.info(`${commandName} took ${durationInSeconds} seconds for Arguments: ${JSON.stringify(args)} to complete`);
            const locatorType = JSON.stringify(args).includes('xpath') ? 'xpath' : 'accessibility';
            yield logLocatorPerformance(locatorType, durationInSeconds, commandName, JSON.stringify(args));
            return result;
        });
    }
}
CommandViz.newMethodMap = {
    '/session/:sessionId/plugin/logActivity': {
        POST: { command: 'setActivityDetails',
            payloadParams: { required: ['timeTaken', 'functionalityName', 'testName'] },
        }
    }
};
exports.default = CommandViz;
