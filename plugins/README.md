# Native Plugins

Each plugin is a stable shell capability, selected through `ShellConfig.plugins` and implemented by both generated platforms. Plugin implementations must enforce their declared permissions at request time; detection enables a configuration suggestion, never an unconditional grant.

The registry documents the supported contract. Generated Android and iOS shells receive the enabled plugin map and expose only configured bridge methods.
