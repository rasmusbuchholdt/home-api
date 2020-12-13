export interface RGB {
  R: number;
  G: number;
  B: number;
  change: boolean;
}

export interface HueLightConfig {
  id: number;
  enabled: boolean;
  rgb: RGB;
  saturation: number;
  brightness: number;
}