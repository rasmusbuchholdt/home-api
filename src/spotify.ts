import { Buffer } from 'buffer';

import { SpotifyAccessToken } from './models/spotify/access-token';
import { SpotifyPlayback } from './models/spotify/playback';
import { SpotifyTokenReponse } from './models/spotify/token-response';

let request = require('request-promise');
let querystring = require('querystring');
let config = require("../config/app.json");

export class Spotify {

	private accessToken: SpotifyAccessToken | undefined;
	private refreshToken: string = "";

	constructor(token?: SpotifyTokenReponse) {
		if (token) this.handleNewAuthentication(token);
		this.refreshToken = config.spotify_refresh_token;
		this.refreshAccessToken();
	};

	private checkAccessToken() {
		if (this.accessToken && this.accessToken?.expiry <= new Date()) {
			console.log("Refreshing access token");
			this.refreshAccessToken();
		}
	}

	private handleNewAuthentication(token: SpotifyTokenReponse) {
		var expiry = new Date();
		expiry.setHours(expiry.getHours() + 1);
		this.accessToken = {
			token: token.access_token,
			expiry
		};
		this.refreshToken = token.refresh_token;
	}

	private refreshAccessToken() {
		this.getAccessToken().then(token => {
			var expiry = new Date();
			expiry.setHours(expiry.getHours() + 1);
			this.accessToken = {
				token,
				expiry
			}
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
		this.checkAccessToken();
	}

	public previous() {
		let options: {} = {
			method: "POST",
			uri: "https://api.spotify.com/v1/me/player/previous",
			headers: {
				Authorization: ` Bearer ${this.accessToken?.token}`
			}
		};
		request(options);
		this.checkAccessToken();
	}

	public next() {
		let options: {} = {
			method: "POST",
			uri: "https://api.spotify.com/v1/me/player/next",
			headers: {
				Authorization: ` Bearer ${this.accessToken?.token}`
			}
		};
		request(options);
		this.checkAccessToken();
	}

	public resume() {
		let options: {} = {
			method: "PUT",
			uri: "https://api.spotify.com/v1/me/player/play",
			headers: {
				Authorization: ` Bearer ${this.accessToken?.token}`
			}
		};
		request(options);
		this.checkAccessToken();
	}

	public pause() {
		let options: {} = {
			method: "PUT",
			uri: "https://api.spotify.com/v1/me/player/pause",
			headers: {
				Authorization: ` Bearer ${this.accessToken?.token}`
			}
		};
		request(options);
		this.checkAccessToken();
	}

	public getPlayback(): Promise<SpotifyPlayback> {
		let options: {} = {
			method: "GET",
			uri: "https://api.spotify.com/v1/me/player",
			json: true,
			headers: {
				Authorization: ` Bearer ${this.accessToken?.token}`
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
					Authorization: ` Bearer ${this.accessToken?.token}`
				}
			};
			request(options);
		});
		this.checkAccessToken();
	}

	public volumeDown(amount: number = 10) {
		this.getPlayback().then(playback => {
			let options: {} = {
				method: "PUT",
				uri: `https://api.spotify.com/v1/me/player/volume?volume_percent=${playback.device.volume_percent - amount}`,
				headers: {
					Authorization: ` Bearer ${this.accessToken?.token}`
				}
			};
			request(options);
		});
		this.checkAccessToken();
	}
}