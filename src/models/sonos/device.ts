export interface Endpoints {
  transport: string;
  rendering: string;
  device: string;
}

export interface Spotify {
  region: string;
}

export interface Options {
  endpoints: Endpoints;
  spotify: Spotify;
}

export interface Events {
}

export interface SonosDevice {
  host: string;
  port: number;
  options: Options;
  _events: Events;
  _eventsCount: number;
}