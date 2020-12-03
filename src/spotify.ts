import { Buffer } from 'buffer';

import { SpotifyPlayback } from './models/spotify/playback';
import { SpotifyTokenReponse } from './models/spotify/token-response';

let request = require('request-promise');
let querystring = require('querystring');
let config = require("../config/app.json");

export class Spotify {

	private accessToken: string = "";
	private refreshToken: string = "";

	constructor(token?: SpotifyTokenReponse) {
		if (token) {
			this.handleNewAuthentication(token)
		} else {
			this.refreshToken = config.spotify_refresh_token;
			this.refreshAccessToken();
		}
	};

	private handleNewAuthentication(token: SpotifyTokenReponse) {
		this.accessToken = token.access_token;
		this.refreshToken = token.refresh_token;
	}

	private refreshAccessToken() {
		this.getAccessToken().then(token => {
			this.accessToken = token;
			setTimeout(() => {
				this.refreshAccessToken()
			}, 59 * 1000);
		})
	}

	public getAuthURL(stateSecret: string) {
		return "https://accounts.spotify.com/authorize?" +
			querystring.stringify({
				response_type: "code",
				client_id: config.spotify_client_id,
				scope: "user-modify-playback-state user-read-playback-state",
				redirect_uri: config.spotify_call_back_uri,
				state: stateSecret
			});
	}

	public getToken(code: string): Promise<SpotifyTokenReponse> {
		let options = {
			method: "POST",
			url: "https://accounts.spotify.com/api/token",
			headers: { "Authorization": 'Basic ' + (Buffer.from(`${config.spotify_client_id}:${config.spotify_client_secret}`).toString("base64")) },
			form: {
				code: code,
				redirect_uri: config.spotify_call_back_uri,
				grant_type: "authorization_code"
			},
			json: true
		};
		return new Promise((resolve: any, reject: any) => {
			request(options)
				.then((result: any) => {
					resolve(Object.assign({}, result as SpotifyTokenReponse));
				});
		});
	}

	private getAccessToken(): Promise<string> {
		let options = {
			method: "POST",
			url: 'https://accounts.spotify.com/api/token',
			headers: { 'Authorization': 'Basic ' + (Buffer.from(`${config.spotify_client_id}:${config.spotify_client_secret}`).toString('base64')) },
			form: {
				grant_type: 'refresh_token',
				refresh_token: this.refreshToken
			},
			json: true
		};
		return new Promise((resolve: any, reject: any) => {
			request(options)
				.then((result: any) => {
					resolve(result.access_token);
				});
		});
	}

	public togglePlayPause() {
		this.getPlayback().then(playback => {
			playback.is_playing ? this.pause() : this.resume();
		});
	}

	public previous() {
		let options: {} = {
			method: "POST",
			uri: "https://api.spotify.com/v1/me/player/previous",
			headers: {
				Authorization: ` Bearer ${this.accessToken}`
			}
		};
		request(options);
	}

	public next() {
		let options: {} = {
			method: "POST",
			uri: "https://api.spotify.com/v1/me/player/next",
			headers: {
				Authorization: ` Bearer ${this.accessToken}`
			}
		};
		request(options);
	}

	public resume() {
		let options: {} = {
			method: "PUT",
			uri: "https://api.spotify.com/v1/me/player/play",
			headers: {
				Authorization: ` Bearer ${this.accessToken}`
			}
		};
		request(options);
	}

	public pause() {
		let options: {} = {
			method: "PUT",
			uri: "https://api.spotify.com/v1/me/player/pause",
			headers: {
				Authorization: ` Bearer ${this.accessToken}`
			}
		};
		request(options);
	}

	public getPlayback(): Promise<SpotifyPlayback> {
		let options: {} = {
			method: "GET",
			uri: "https://api.spotify.com/v1/me/player",
			json: true,
			headers: {
				Authorization: ` Bearer ${this.accessToken}`
			}
		};

		return new Promise((resolve: any, reject: any) => {
			request(options)
				.then((result: any) => {
					resolve(Object.assign({}, result as SpotifyPlayback));
				});
		});
	}

	public volumeUp(amount: number = 10) {
		this.getPlayback().then(playback => {
			let options: {} = {
				method: "PUT",
				uri: `https://api.spotify.com/v1/me/player/volume?volume_percent=${playback.device.volume_percent + amount}`,
				headers: {
					Authorization: ` Bearer ${this.accessToken}`
				}
			};
			request(options);
		});
	}

	public volumeDown(amount: number = 10) {
		this.getPlayback().then(playback => {
			let options: {} = {
				method: "PUT",
				uri: `https://api.spotify.com/v1/me/player/volume?volume_percent=${playback.device.volume_percent - amount}`,
				headers: {
					Authorization: ` Bearer ${this.accessToken}`
				}
			};
			request(options);
		});
	}
}