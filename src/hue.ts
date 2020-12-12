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
    this.api.lights.setLightState(lightConfig.id, new LightState()
      .on()
      .rgb([lightConfig.rgb.R, lightConfig.rgb.G, lightConfig.rgb.B])
      .saturation(clamp(lightConfig.saturation, 1, 100))
      .brightness(clamp(lightConfig.brightness, 1, 100))
    );
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

  toggleMovieMode(state: boolean): void {
    let movieLightIds: number[] = config.movie_mode.lights.map((e: any) => e.id);
    if (state) {
      let defaultConfig: HueLightConfig = config.light_default_values;
      movieLightIds.forEach(lightId => {
        defaultConfig.id = lightId
        this.setCustomLightState(defaultConfig);
      });
    } else {
      config.movie_mode.lights.forEach((lightConfig: HueLightConfig) => {
        this.setCustomLightState(lightConfig);
      });
    }
  }
}