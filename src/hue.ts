import { HueLightConfig } from './models/hue/light-config';
import { clamp, normalize } from './utils';

let v3 = require('node-hue-api').v3;
let discovery = v3.discovery;
let LightState = v3.lightStates.LightState;

let config = require("../config/app.json");

export class Hue {

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
		let normalizedBrightness = Math.round(normalize(lightConfig.brightness, 1, 254));
		this.api.lights.setLightState(lightConfig.id, new LightState()
			.on()
			.hue(lightConfig.hue)
			.sat(lightConfig.saturation)
			.brightness(normalizedBrightness)
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