import { SonosDevice } from './models/sonos/device';
import { SonosState } from './models/sonos/state';
import { clamp } from './utils';

let { Sonos } = require('sonos')
let DeviceDiscovery = require('sonos').AsyncDeviceDiscovery;

export class SonosHandler {

  private sonos: any;

  constructor(host?: string) {
    if (host) {
      this.sonos = new Sonos(host);
    } else {
      this.getSonos();
    }
  }

  private getSonos() {
    let discovery = new DeviceDiscovery();
    discovery.discover().then((device: SonosDevice) => {
      this.sonos = new Sonos(device.host);
    }).catch((error: any) => {
      this.sonos = undefined;
    });
  }

  getSonosState(): Promise<SonosState> {
    return new Promise((resolve: any, reject: any) => {
      if (!this.sonos) resolve({
        isActive: false,
        isRestricted: true
      });
      this.sonos.getCurrentState().then((result: string) => {
        resolve(
          {
            isActive: result === 'playing' ? true : false,
            isRestricted: false
          }
        );
      });
    });
  }

  previous(): void {
    if (!this.sonos) return;
    this.sonos.previous();
  }

  next(): void {
    if (!this.sonos) return;
    this.sonos.next();
  }

  pause(): void {
    if (!this.sonos) return;
    this.sonos.pause();
  }

  resume(): void {
    if (!this.sonos) return;
    this.sonos.play();
  }

  adjustVolume(amount: number): void {
    if (!this.sonos) return;
    this.sonos.getVolume().then((currentVolume: number) => {
      this.sonos.setVolume(clamp(currentVolume + +amount, 1, 100));
    });
  }

  setVolume(amount: number): void {
    if (!this.sonos) return;
    this.sonos.setVolume(clamp(+amount, 1, 100));
  }
}