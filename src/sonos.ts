import { SonosDevice } from './models/sonos/sonos-device';

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

  pause(): void {
    this.sonos.pause();
  }

  resume(): void {
    this.sonos.play();
  }
}