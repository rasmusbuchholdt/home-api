import { HueLightConfig } from './models/hue/light-config';
import { normalize } from './utils';

let v3 = require('node-hue-api').v3;
let discovery = v3.discovery;
let LightState = v3.lightStates.LightState;

let config = require("../config/app.json");

export class Hue {

	private username: string = "";
	private bridgeIp: string = "";
	private api: any;

	constructor() {
		this.username = config.hue_username;
		this.getBridgeIp().then(ip => {
			this.bridgeIp = ip;
			this.getApiConnection();
		});
	};

	private async getApiConnection(): Promise<any> {
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

	async toggleLight(lightId: number) {
		let light = await this.api.lights.getLight(lightId);
		light._data.state.on ? this.disableLight(lightId) : this.enableLight(lightId);
	}

	enableLight(lightId: number) {
		this.api.lights.setLightState(lightId, new LightState().on());
	}

	disableLight(lightId: number) {
		this.api.lights.setLightState(lightId, new LightState().off());
	}

	setCustomLightState(lightConfig: HueLightConfig) {
		if (!lightConfig.enabled) return this.disableLight(lightConfig.id);
		let normalizedBrightness = Math.round(normalize(lightConfig.brightness, 1, 254));
		this.api.lights.setLightState(lightConfig.id, new LightState()
			.on()
			.hue(lightConfig.hue)
			.sat(lightConfig.saturation)
			.brightness(normalizedBrightness)
		);
	}

	adjustLightBrightness(lightId: number, amount: number) {
		this.api.lights.getLight(lightId).then((light: any) => {
			// Get current brightness (1-254) and normalize this value
			let normalizedBrightness = Math.round(normalize(light._data.state.bri, 1, 254));
			this.api.lights.setLightState(lightId, new LightState()
				.on()
				.brightness(normalizedBrightness + amount > 100 ? 100 : normalizedBrightness + amount)
			);
		});
	}
}	