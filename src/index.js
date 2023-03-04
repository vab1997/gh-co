import { COMMIT_TYPES } from './commit-types.js'
import { getChangedFiles, getStagedFiles, gitAdd, gitCommit } from './git.js'
import { intro, outro, select, text, confirm, multiselect } from '@clack/prompts'
import { trytm } from '@bdsqqq/try'
import colors from 'picocolors'

const messageIntro = colors.yellow(' Asistant create commit 🔩 ')
intro(colors.inverse(messageIntro))

const [changedFiles, errorChangedFiles] = await trytm(getChangedFiles())
const [stagedFiles, errorStagedFiles] = await trytm(getStagedFiles())

if (errorChangedFiles ?? errorStagedFiles) {
  const messageError = colors.red('! Error: Check if you are in a git repository')
  outro(messageError)
  process.exit(1)
}

if (stagedFiles.length === 0 && changedFiles.length > 0) {
  const files = await multiselect({
    message: colors.cyan('you do not have anythings prepared to commit. Select files to commit:'),
    options: changedFiles.map(file => ({
      value: file,
      label: file
    }))
  })

  await gitAdd({ files })
}

const commitType = await select({
  message: colors.cyan('Pick a commit type:'),
  options: Object.entries(COMMIT_TYPES).map(([key, { description }]) => ({
    value: key,
    label: description
  }))
})

const { description } = COMMIT_TYPES[commitType]
const isRelease = description.startsWith('release')

const breakingChange = isRelease
  ? `${colors.yellow('¡¡ A commit "BREAKING CHANGE" will be created and will increase the major version when released !!')}`
  : ''

const commitMessage = await text({
  message: `${colors.cyan('Introduce commit message:')}
  ${breakingChange}`,
  validate (value) {
    if (value.length === 0) return colors.red('! Error: You must enter a commit message')
    if (value.length > 50) return colors.yellow('! Warning: The commit message is too long. It should be less than 50 characters')
  }
})

let commit = `${commitType}: ${commitMessage}`
commit = breakingChange ? `[Breaking change] ${commit}` : commit

const shouldContinue = await confirm({
  message: `${colors.cyan('Are you sure you want to commit with this message?')}

  ${colors.green(colors.bold(commit))}
  
  ${colors.cyan('confirm?')}`
})

if (!shouldContinue) {
  outro('Commit canceled')
  process.exit(0)
}

await gitCommit({ commit })

outro(colors.green('✔ Commit created successfully'))
