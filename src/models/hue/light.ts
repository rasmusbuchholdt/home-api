export interface Id {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min: number;
  max: number;
}

export interface Name {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min: number;
  max: number;
}

export interface Type {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Modelid {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Manufacturername {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Uniqueid {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Productname {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Productid {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface State {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  _types?: any;
  _childRequiredKeys: any[];
}

export interface Capabilities {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  _types?: any;
  _childRequiredKeys: any[];
}

export interface Config {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  _types?: any;
  _childRequiredKeys: any[];
}

export interface Type2 {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Swupdate {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  _types: Type2[];
  _childRequiredKeys: any[];
}

export interface Swversion {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Swconfigid {
  _name: string;
  _type: string;
  _optional: boolean;
  _defaultValue?: any;
  min?: any;
  max?: any;
}

export interface Attributes {
  id: Id;
  name: Name;
  type: Type;
  modelid: Modelid;
  manufacturername: Manufacturername;
  uniqueid: Uniqueid;
  productname: Productname;
  productid: Productid;
  state: State;
  capabilities: Capabilities;
  config: Config;
  swupdate: Swupdate;
  swversion: Swversion;
  swconfigid: Swconfigid;
}

export interface State2 {
  on: boolean;
  bri: number;
  hue: number;
  sat: number;
  effect: string;
  xy: number[];
  ct: number;
  alert: string;
  colormode: string;
  mode: string;
  reachable: boolean;
}

export interface Swupdate2 {
  state: string;
  lastinstall: Date;
}

export interface Ct {
  min: number;
  max: number;
}

export interface Control {
  mindimlevel: number;
  maxlumen: number;
  colorgamuttype: string;
  colorgamut: number[][];
  ct: Ct;
}

export interface Streaming {
  renderer: boolean;
  proxy: boolean;
}

export interface Capabilities2 {
  certified: boolean;
  control: Control;
  streaming: Streaming;
}

export interface Startup {
  mode: string;
  configured: boolean;
}

export interface Config2 {
  archetype: string;
  function: string;
  direction: string;
  startup: Startup;
}

export interface Data {
  id: number;
  state: State2;
  swupdate: Swupdate2;
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname: string;
  capabilities: Capabilities2;
  config: Config2;
  uniqueid: string;
  swversion: string;
  swconfigid: string;
  productid: string;
}

export interface State3 {
  on: boolean;
  bri: number;
  hue: number;
  sat: number;
  effect: string;
  xy: number[];
  ct: number;
  alert: string;
  colormode: string;
  mode: string;
  reachable: boolean;
}

export interface Swupdate3 {
  state: string;
  lastinstall: Date;
}

export interface Ct2 {
  min: number;
  max: number;
}

export interface Control2 {
  mindimlevel: number;
  maxlumen: number;
  colorgamuttype: string;
  colorgamut: number[][];
  ct: Ct2;
}

export interface Streaming2 {
  renderer: boolean;
  proxy: boolean;
}

export interface Capabilities3 {
  certified: boolean;
  control: Control2;
  streaming: Streaming2;
}

export interface Startup2 {
  mode: string;
  configured: boolean;
}

export interface Config3 {
  archetype: string;
  function: string;
  direction: string;
  startup: Startup2;
}

export interface PopulationData {
  state: State3;
  swupdate: Swupdate3;
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname: string;
  capabilities: Capabilities3;
  config: Config3;
  uniqueid: string;
  swversion: string;
  swconfigid: string;
  productid: string;
}

export interface Light {
  _attributes: Attributes;
  _data: Data;
  mappedColorGamut: string;
  _populationData: PopulationData;
}
