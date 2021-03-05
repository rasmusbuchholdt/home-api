import { HueLightConfig } from './models/hue/light-config';
import { clamp, normalize } from './utils';

let request = require('request-promise');
let v3 = require('node-hue-api').v3;
let discovery = v3.discovery;
let LightState = v3.lightStates.LightState;

let config = require("../config/app.json");

export class HueHandler {

  private username = "";
  private bridgeIp = "";
  private api: any;

  constructor() {
    this.username = config.hue_username;
    this.getBridgeIp().then(ip => {
      this.bridgeIp = ip;
      this.getApiConnection();
    });
  };

  private getApiConnection(): void {
    v3.api.createLocal(this.bridgeIp).connect(this.username).then((api: any) => {
      this.api = api;
    });
  }

  private getBridgeIp(): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      discovery.nupnpSearch().then((bridges: any) => {
        if (bridges.length === 0) return null;
        // TODO: Maybe add multi bridge support in the future?
        resolve(bridges[0].ipaddress);
      });
    });
  }

  getLights(): Promise<any[]> {
    return new Promise((resolve: any, reject: any) => {
      this.api.lights.getAll().then((lights: any) => {
        resolve(lights.map((e: any) => e._data));
      });
    });
  }

  getLight(lightId: number): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      this.api.lights.getLight(lightId).then((light: any) => {
        resolve(light._data);
      });
    });
  }

  toggleLight(lightId: number): void {
    this.api.lights.getLight(lightId).then((light: any) => {
      light._data.state.on ? this.disableLight(lightId) : this.enableLight(lightId);
    });
  }

  enableLight(lightId: number): void {
    this.api.lights.setLightState(lightId, new LightState().on());
  }

  disableLight(lightId: number): void {
    this.api.lights.setLightState(lightId, new LightState().off());
  }

  setCustomLightState(lightConfig: HueLightConfig): void {
    if (!lightConfig.enabled) return this.disableLight(lightConfig.id);
    let newLight = new LightState()
      .on()
      .brightness(clamp(lightConfig.brightness, 1, 100));
    if (lightConfig.rgb.change) {
      newLight
        .rgb([lightConfig.rgb.R, lightConfig.rgb.G, lightConfig.rgb.B])
        .saturation(clamp(lightConfig.saturation, 1, 100));
    }
    this.api.lights.setLightState(lightConfig.id, newLight);
  }

  adjustLightBrightness(lightId: number, amount: number): void {
    this.api.lights.getLight(lightId).then((light: any) => {
      // Get current brightness (1-254) and normalize this value
      let normalizedBrightness = Math.round(normalize(light._data.state.bri, 1, 254));
      this.api.lights.setLightState(lightId, new LightState()
        .on()
        .brightness(clamp(normalizedBrightness + amount, 1, 100))
      );
    });
  }

  toggleMovieMode(enabled: boolean): void {
    let movieLightIds: number[] = config.movie_mode_lights.map((e: number) => e);
    movieLightIds.forEach(lightId => {
      enabled ? this.disableLight(lightId) : this.enableLight(lightId);
    });
  }

  async discoverAndCreateUser() {
    const ipAddress = await this.getBridgeIp();

    // Create an unauthenticated instance of the Hue API so that we can create a new user
    const unauthenticatedApi = await v3.api.createLocal(ipAddress).connect();

    let createdUser;
    try {
      createdUser = await unauthenticatedApi.users.createUser('home-api', 'pi');
      console.log('*******************************************************************************\n');
      console.log('User has been created on the Hue Bridge. The following username can be used to\n' +
        'authenticate with the Bridge and provide full local access to the Hue Bridge.\n' +
        'YOU SHOULD TREAT THIS LIKE A PASSWORD\n');
      console.log(`Hue Bridge User: ${createdUser.username}`);
      console.log(`Hue Bridge User Client Key: ${createdUser.clientkey}`);
      console.log('*******************************************************************************\n');

      // Create a new API instance that is authenticated with the new user we created
      const authenticatedApi = await v3.api.createLocal(ipAddress).connect(createdUser.username);

      // Do something with the authenticated user/api
      const bridgeConfig = await authenticatedApi.configuration.getConfiguration();
      console.log(`Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`);

    } catch (err) {
      if (err.getHueErrorType() === 101) {
        console.error('The Link button on the bridge was not pressed. Please press the Link button and try again.');
      } else {
        console.error(`Unexpected Error: ${err.message}`);
      }
    }
  }
}