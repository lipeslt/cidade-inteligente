import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from '@tamagui/core'

export type Conf = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

const config = createTamagui(defaultConfig)

export default config
