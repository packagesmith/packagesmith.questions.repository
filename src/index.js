import ini from 'ini';
import { readFile } from 'fs-promise';
export function descriptionQuestion() {
  return {
    name: 'repository',
    message: 'What is the repository url?',
    async when(answers, directory) {
      if ('repository' in answers) {
        return false;
      }
      try {
        const packageJson = JSON.parse(await readFile(`${directory}/package.json`, 'utf8'));
        if (typeof packageJson.repository === 'object') {
          answers.repository = packageJson.repository.url;
          return false;
        } else if (typeof packageJson.repository === 'string') {
          answers.repository = packageJson.repository;
          return false;
        }
        throw new Error('Couldn\'t determine repository from pacakge.json');
      } catch (packageJsonError) {
        try {
          const iniContents = ini.parse(await readFile(`${directory}/.git/config`, 'utf8'));
          const origin = iniContents['remote "origin"'].url;
          if (origin) {
            answers.repository = origin;
            return false;
          }
          return true;
        } catch (error) {
          return true;
        }
      }
    },
  };
}
export default descriptionQuestion;
