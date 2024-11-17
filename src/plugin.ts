import { BasePlugin } from '@appium/base-plugin'
import { logger } from 'appium/support';
const log = logger.getLogger('MyPluginAppium');

class MyPluginAppium extends BasePlugin {
   
    constructor(pluginName: string) {
        super(pluginName);
    }

    async findElement(next: Function, driver: any, ...args: any[]): Promise<any> {
        log.info('Good job Anil! You have successfully called the findElement method');
        return await next();
    }
 
   
}

export default MyPluginAppium;