import { HueLightConfig } from './models/hue/light-config';
import { normalize } from './utils';

let v3 = require('node-hue-api').v3;
let discovery = v3.discovery;
let LightState = v3.lightStates.LightState;

let config = require("../config/app.json");

const BRIGTHNESS_STEP_SIZE = 20;

export class Hue {

	private username: string = "";
	private api: any;

	constructor() {
		this.username = config.hue_username;
		this.getApiConnection();
	};

	private async getApiConnection(): Promise<any> {
		let ipAddress = await this.getBridgeIp();
		v3.api.createLocal(ipAddress).connect(this.username).then((api: any) => {
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

	async increaseLightBrightness(lightId: number) {
		let light = await this.api.lights.getLight(lightId);
		// Get current brightness (1-254) and normalize this value
		let normalizedBrightness = Math.round(normalize(light._data.state.bri, 1, 254));
		this.api.lights.setLightState(lightId, new LightState()
			.on()
			.brightness(normalizedBrightness + BRIGTHNESS_STEP_SIZE > 100 ? 100 : normalizedBrightness + BRIGTHNESS_STEP_SIZE)
		);
	}

	async decreaseLightBrightness(lightId: number) {
		let light = await this.api.lights.getLight(lightId);
		// Get current brightness (1-254) and normalize this value
		let normalizedBrightness = Math.round(normalize(light._data.state.bri, 1, 254));
		this.api.lights.setLightState(lightId, new LightState()
			.on()
			.brightness(normalizedBrightness - BRIGTHNESS_STEP_SIZE < 0 ? 1 : normalizedBrightness - BRIGTHNESS_STEP_SIZE)
		);
	}
}	