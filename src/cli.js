#!/usr/bin/env node

import { program } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { extract } from './extract.js';

program.name(pkg.name).version(pkg.version, '-v, --version').addCommand(extract);
program.parse();
