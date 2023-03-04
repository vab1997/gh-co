import { outro } from '@clack/prompts'
import colors from 'picocolors'

export function exitProgram ({ code = 0, message = 'Have not been created commit' } = {}) {
  outro(colors.yellow(message))
  process.exit(code)
}
