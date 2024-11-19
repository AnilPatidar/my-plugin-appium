import { BasePlugin } from '@appium/base-plugin'
import { logger } from 'appium/support';
import { InfluxDB , Point} from '@influxdata/influxdb-client';
const log = logger.getLogger('command-viz-plugin');

const influxDBClient = new InfluxDB({ url: 'http://localhost:8086', token: 'P3C_za5tXhvXR_y93U0sFazzebFx-xr1WiUDdeUZYZGEQBYFwNEmiKcqHvwNFKyQCAZmNnsH-8EZaAJCmOQBXQ==' });
 
async function logLocatorPerformance(locatorType: string, timeTaken: number, commandName: string, commmand: string ): Promise<any> {
    const writeApi = influxDBClient.getWriteApi('games24x7', 'locator_performance');
    const point = new Point('locator_performance')
        .tag('locator_type', locatorType)  // XPath, Accessibility ID, etc.
        .tag('commandName', commandName)
        .tag('commmand', commmand)
        .floatField('time_taken', timeTaken);  // Time in milliseconds

    writeApi.writePoint(point);

    // Commit data to InfluxDB
    writeApi.flush().catch(err => console.error('Error writing data:', err));
    return true;
}

async function logActivity(testName: string, activityName: string, timeTaken: number ): Promise<any>  {
    const writeApi = influxDBClient.getWriteApi('games24x7', 'locator_performance');
    const point = new Point('locator_performance')
         .tag('testName', testName)  // contestCreation, matchCreation, etc.
        .tag('activityName', activityName)  // contestCreation, matchCreation, etc.
        .floatField('time_taken', timeTaken);  // Time in milliseconds
    writeApi.writePoint(point);

    log.info(`Activity logged for ${testName} with activityName: ${activityName} and timeTaken: ${timeTaken}`);
    // Commit data to InfluxDB
    writeApi.flush().catch(err => console.error('Error writing data:', err));
    return true;
}

const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/logActivity');
// Example usage
class CommandViz extends BasePlugin {
   
    constructor(pluginName: string) {
        super(pluginName);
    }

    shouldAvoidProxy(_method: any, route: string, _body: any): boolean {

        return SOURCE_URL_REGEX.test(route);
    }

    static newMethodMap = {
        '/session/:sessionId/plugin/logActivity': {
           POST:{  command: 'setActivityDetails',
            payloadParams: {required: ['timeTaken','functionalityName','testName']},
            }
        }
    };

    async setActivityDetails(next: Function, driver: any, ...args: any[]): Promise<any> {
        log.info(`command-viz-plugin : setActivityDetails called`);
        log.info(`Arguments: ${JSON.stringify(args)}`);
        const timeTaken = args[0];
        const functionalityName = args[1];
        const testName= args[2];
       //const [timeTaken, functionalityName, testName, sessionId] = args;
        await logActivity(testName, functionalityName, timeTaken);
    }

    async findElement(next: Function, driver: any, ...args: any[]): Promise<any> {
        const result = await this.getTimeDifference(next, 'findElement', ...args);
        return result;
    }

    async findElements(next: Function, driver: any, ...args: any[]): Promise<any> {
        const result = await this.getTimeDifference(next, 'findElements', ...args);
        return result;
    }

    async getTimeDifference(next: Function, commandName:string, ...args: any[]): Promise<any>{
        log.info('command-viz-plugin is handing the command');
        const startTime = Date.now();
        var result : Function = () => {};
        try{
         result = await next();
        }catch(e){
            log.info(`Error in ${commandName} command: ${e}`);
        }
        const endTime = Date.now();
        const durationInSeconds = (endTime - startTime) / 1000;
        log.info(`${commandName} took ${durationInSeconds} seconds for Arguments: ${JSON.stringify(args)} to complete`);
        const locatorType = JSON.stringify(args).includes('xpath') ? 'xpath' : 'accessibility';
        await logLocatorPerformance(locatorType, durationInSeconds, commandName,JSON.stringify(args));
        return result;
    }

    //add code for click, get text , etc.
 
   
}

export default CommandViz;