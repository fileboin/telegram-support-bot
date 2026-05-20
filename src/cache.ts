import { Cache, Config } from './interfaces';
import { applyEnvironmentOverrides, loadRootDotEnv } from './env-config';
import * as YAML from 'yaml';
import * as fs from 'fs';

const cache: Cache = {
  userId: '',
  ticketIDs: [],
  ticketStatus: {},
  ticketSent: [],
  html: '',
  noSound: '',
  markdown: '',
  io: {},
  config: {
    use_llm: false
  } as Config,
};

const fileEnv = loadRootDotEnv();
Object.entries(fileEnv).forEach(([key, value]) => {
  if (typeof process.env[key] === 'undefined') {
    process.env[key] = value;
  }
});

const configPath = fs.existsSync('./config/config.yaml')
  ? './config/config.yaml'
  : './config/config-sample.yaml';

cache.config = applyEnvironmentOverrides(
  YAML.parse(fs.readFileSync(configPath, 'utf8')),
  fileEnv
);

export default cache;
