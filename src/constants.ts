import os from 'node:os'
import path from 'node:path'
// Change this to bump to a newer version of Onu studio
export const TARGET_STUDIO_VERSION = 'v0.1.1'

// Change this to bump to a newer version of @onuhq/node for the starter files
export const TARGET_ONU_NODE_VERSION = '^0.2.0'

export const HOME_DIR = os.homedir()

export const DOT_ONU = path.join(HOME_DIR, '.onu')
export const VERSION_PATH = path.join(DOT_ONU, 'studio', 'onu-studio-version.txt')
export const CLIENT_PATH = path.join(DOT_ONU, 'studio', 'client')
export const TS_FILES_DIST_PATH = path.join(CLIENT_PATH, 'dist')
export const STUDIO_PATH = path.join(DOT_ONU, 'studio')
// command execution location
export const CMD_EXEC_PATH = process.cwd()
export const ONU_DEV_JSON_PATH = path.join(CMD_EXEC_PATH, 'onu.dev.json')

export const DEV_CACHE_PATH = path.join(CLIENT_PATH, 'devCache')
