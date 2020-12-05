import { Buffer } from 'buffer';

import { SpotifyPlayback } from './models/spotify/playback';
import { SpotifyTokenReponse } from './models/spotify/token-response';
import { SpotifyUser } from './models/spotify/user';
import { SonosHandler } from './sonos';
import { clamp, isSonos } from './utils';

let request = require('request-promise');
let querystring = require('querystring');
let config = require("../config/app.json");

export class SpotifyHandler {

  private accessToken = "";
  private refreshToken = "";
  private sonosHandler = new SonosHandler();

  constructor(token?: SpotifyTokenReponse) {
    if (token) {
      this.handleNewAuthentication(token)
    } else {
      this.refreshToken = config.spotify_refresh_token;
      this.refreshAccessToken();
    }
  };

  private handleNewAuthentication(token: SpotifyTokenReponse): void {
    this.accessToken = token.access_token;
    this.refreshToken = token.refresh_token;
    setTimeout(() => {
      this.refreshAccessToken()
    }, 59 * 1000);
  }

  private refreshAccessToken(): void {
    this.getAccessToken().then(token => {
      this.accessToken = token;
      setTimeout(() => {
        this.refreshAccessToken();
      }, 59 * 1000);
    })
  }

  getAuthURL(stateSecret: string): string {
    return "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: config.spotify_client_id,
        scope: "user-modify-playback-state user-read-playback-state",
        redirect_uri: config.spotify_call_back_uri,
        state: stateSecret
      });
  }

  getToken(code: string): Promise<SpotifyTokenReponse> {
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

  togglePlayPause(): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        playback.is_playing ? this.sonosHandler.pause() : this.sonosHandler.resume();
      } else {
        playback.is_playing ? this.pause() : this.resume();
      }
    });
  }

  previous(): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.previous();
      } else {
        let options: {} = {
          method: "POST",
          uri: "https://api.spotify.com/v1/me/player/previous",
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }

  next(): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.next();
      } else {
        let options: {} = {
          method: "POST",
          uri: "https://api.spotify.com/v1/me/player/next",
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }

  resume(): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.resume();
      } else {
        let options: {} = {
          method: "PUT",
          uri: "https://api.spotify.com/v1/me/player/play",
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }

  pause(): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.pause();
      } else {
        let options: {} = {
          method: "PUT",
          uri: "https://api.spotify.com/v1/me/player/pause",
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }

  getPlayback(): Promise<SpotifyPlayback> {
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

  getUser(): Promise<SpotifyUser> {
    let options: {} = {
      method: "GET",
      uri: "https://api.spotify.com/v1/me",
      json: true,
      headers: {
        Authorization: ` Bearer ${this.accessToken}`
      }
    };

    return new Promise((resolve: any, reject: any) => {
      request(options)
        .then((result: any) => {
          resolve(Object.assign({}, result as SpotifyUser));
        });
    });
  }

  adjustVolume(amount: number): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.adjustVolume(amount);
      } else {
        let options: {} = {
          method: "PUT",
          uri: `https://api.spotify.com/v1/me/player/volume?volume_percent=${clamp(playback.device.volume_percent + amount, 1, 100)}`,
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }

  setVolume(amount: number): void {
    this.getPlayback().then(playback => {
      if (isSonos(playback)) {
        this.sonosHandler.setVolume(amount);
      } else {
        let options: {} = {
          method: "PUT",
          uri: `https://api.spotify.com/v1/me/player/volume?volume_percent=${clamp(amount, 1, 100)}`,
          headers: {
            Authorization: ` Bearer ${this.accessToken}`
          }
        };
        request(options);
      }
    });
  }
}