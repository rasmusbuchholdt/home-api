import { PiholeSummary } from './models/pihole/summary';

let request = require('request-promise');
let config = require("../config/app.json");

export class PiholeHandler {

  private token = "";

  constructor() {
    this.token = config.pihole_token;
  }

  getSummary(): Promise<PiholeSummary> {
    let options: {} = {
      method: "GET",
      uri: `${config.pihole_uri}/admin/api.php?summary`,
      json: true
    };

    return new Promise((resolve: any, reject: any) => {
      request(options)
        .then((result: any) => {
          resolve(Object.assign({}, result as PiholeSummary));
        });
    });
  }

  toggle(): void {
    this.getSummary().then(summary => {
      summary.status === 'enabled' ? this.disable() : this.enable();
    });
  }

  private enable(): void {
    let options: {} = {
      method: "GET",
      uri: `${config.pihole_uri}/admin/api.php?enable&auth=${this.token}`,
      json: true
    };
    request(options);
  }

  private disable(): void {
    let options: {} = {
      method: "GET",
      uri: `${config.pihole_uri}/admin/api.php?disable&auth=${this.token}`,
      json: true
    };
    request(options);
  }
}