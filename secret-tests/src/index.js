import path from 'path';
import {
  launchBrowser,
  compareLayout,
  runTests,
  mkdir,
  mkfile,
  structure,
  stylelint,
  w3c,
  orderStyles,
  lang,
  titleEmmet,
  horizontalScroll,
} from 'lib-verstka-tests';
import ru from './locales/ru.js';
import {
  colorScheme,
  switchScheme,
  blockFullScreen,
  semanticTags,
  resetMargins,
} from './tests.js';

const [, , PROJECT_PATH, LANG = 'ru'] = process.argv;

const app = async (projectPath, lng) => {
  const options = {
    projectPath,
    lang: lng,
    resource: ru,
  };

  const check = async () => {
    const tree = mkdir('project', [
      mkfile('index.html'),
      mkdir('scripts', [
        mkfile('script.js'),
      ]),
      mkdir('styles', [
        mkfile('dark.css'),
        mkfile('globals.css'),
        mkfile('light.css'),
        mkfile('style.css'),
        mkfile('variables.css'),
      ]),
      mkdir('fonts', [
        mkfile('fonts.css'),
      ]),
    ]);
    const structureErrors = structure(projectPath, tree);

    if (structureErrors.length) {
      return structureErrors;
    }

    const indexPath = path.join(projectPath, 'index.html');
    const viewport = { width: 1024, height: 768 };
    const { browser, page } = await launchBrowser(indexPath, { viewport });
    const errors = (await Promise.all([
      w3c(projectPath, 'index.html'),
      stylelint(projectPath),
      orderStyles(page, ['globals.css', 'fonts.css']),
      lang(page, lng),
      titleEmmet(page),
      colorScheme(page),
      switchScheme(indexPath),
      blockFullScreen(page, 'header'),
      blockFullScreen(page, 'footer'),
      semanticTags(page, ['header', 'main', 'section', 'footer', 'nav']),
      resetMargins(page, ['body']),
      horizontalScroll(page),
      compareLayout(indexPath, {
        canonicalImage: 'layout-canonical-1024.jpg',
        pageImage: 'layout-1024.jpg',
        outputImage: 'output-1024.jpg',
        browserOptions: { viewport: { width: 1024, height: 768 } },
      }),
      compareLayout(indexPath, {
        canonicalImage: 'layout-canonical-768.jpg',
        pageImage: 'layout-768.jpg',
        outputImage: 'output-768.jpg',
        browserOptions: { viewport: { width: 768, height: 1024 } },
      }),
      compareLayout(indexPath, {
        canonicalImage: 'layout-canonical-375.jpg',
        pageImage: 'layout-375.jpg',
        outputImage: 'output-375.jpg',
        browserOptions: { viewport: { width: 375, height: 668 } },
      }),
    ]))
      .filter(Boolean)
      .flat();

    await browser.close();

    return errors;
  };

  await runTests(options, check);
};

app(PROJECT_PATH, LANG);
