// config.js — Compiler configuration (ported from goboscript/config.py)

export class Config {
  constructor(opts = {}) {
    this.pre_build = opts.pre_build ?? null;
    this.post_build = opts.post_build ?? null;
    this.layers = opts.layers ?? null;
    this.std = opts.std ?? null;
    this.bitmap_resolution = opts.bitmap_resolution ?? 1;
    this.frame_rate = opts.frame_rate ?? 30;
    // Upstream default is 300 clones (TurbowarpConfig::default);
    // explicit `max_clones = inf` in goboscript.toml still yields Infinity.
    this.max_clones = opts.max_clones ?? 300;
    this.no_miscellaneous_limits = opts.no_miscellaneous_limits ?? false;
    this.no_sprite_fencing = opts.no_sprite_fencing ?? false;
    this.frame_interpolation = opts.frame_interpolation ?? false;
    this.high_quality_pen = opts.high_quality_pen ?? false;
    this.stage_width = opts.stage_width ?? 480;
    this.stage_height = opts.stage_height ?? 360;
  }
}

/**
 * Parse a TOML string into a Config object.
 * Minimal TOML parser: key = value pairs, strings, numbers, booleans, arrays.
 */
export function parseConfig(tomlStr) {
  if (!tomlStr) return new Config();
  const data = {};
  const lines = tomlStr.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    // [section] — ignore sections for now
    if (line.startsWith('[') && line.endsWith(']')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    // Strip inline comments
    if (!val.startsWith('"') && !val.startsWith("'")) {
      const hashIdx = val.indexOf('#');
      if (hashIdx !== -1) val = val.slice(0, hashIdx).trim();
    }
    // String
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      data[key] = val.slice(1, -1);
    }
    // Boolean
    else if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
    // Infinity
    else if (val === 'inf' || val === 'infinity') data[key] = Infinity;
    // Number
    else if (/^-?\d+$/.test(val)) data[key] = parseInt(val, 10);
    else if (/^-?\d+\.\d+$/.test(val)) data[key] = parseFloat(val);
    // Array
    else if (val.startsWith('[') && val.endsWith(']')) {
      const items = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      data[key] = items;
    }
    // Fallback: raw string
    else data[key] = val;
  }
  return new Config({
    pre_build: data.pre_build,
    post_build: data.post_build,
    layers: data.layers,
    std: data.std,
    bitmap_resolution: data.bitmap_resolution ?? 1,
    frame_rate: data.frame_rate ?? 30,
    max_clones: data.max_clones ?? 300,
    no_miscellaneous_limits: data.no_miscellaneous_limits ?? false,
    no_sprite_fencing: data.no_sprite_fencing ?? false,
    frame_interpolation: data.frame_interpolation ?? false,
    high_quality_pen: data.high_quality_pen ?? false,
    stage_width: data.stage_width ?? 480,
    stage_height: data.stage_height ?? 360,
  });
}
