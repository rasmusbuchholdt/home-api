import { SonosDevice } from './models/sonos/sonos-device';
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
    })
  }

  previous(): void {
    this.sonos.previous();
  }

  next(): void {
    this.sonos.next();
  }

  pause(): void {
    this.sonos.pause();
  }

  resume(): void {
    this.sonos.play();
  }

  adjustVolume(amount: number): void {
    this.sonos.getVolume().then((currentVolume: number) => {      
      this.sonos.setVolume(clamp(currentVolume + +amount, 1, 100));
    });
  }
}