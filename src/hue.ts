import { Data, Light } from './models/hue/light';
import { HueLightConfig } from './models/hue/light-config';
import { clamp, normalize } from './utils';

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
    return new Promise(async (resolve: any, reject: any) => {
      const bridges = await discovery.upnpSearch();
      if (bridges.length === 0) return null;
      // TODO: Maybe add multi bridge support in the future?
      resolve(bridges[0].ipaddress);
    });
  }

  getLights(): Promise<Data[]> {
    return new Promise((resolve: any, reject: any) => {
      this.api.lights.getAll().then((lights: Light[]) => {
        resolve(lights.map((e: Light) => Object.assign({}, e._data)) as Data[]);
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
}