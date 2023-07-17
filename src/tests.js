import palette from 'image-palette';
import pixels from 'image-pixels';
import {
  launchBrowser,
  hasElementBySelectors,
  getStyle,
} from 'lib-verstka-tests';
import {
  sortColors,
  compareColors,
} from './utils.js';

const colorScheme = async (page) => {
  const isFound = await hasElementBySelectors(page, 'meta[name=color-scheme]:is([content~="dark"]):is([content~="light"])');

  if (!isFound) {
    return {
      id: 'notColorScheme',
    };
  }

  return false;
};

const switchScheme = async (url) => {
  const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  const viewport = { width: 1024, height: 768 };
  const { browser, page } = await launchBrowser(url, { launchOptions, viewport });
  const buttonSelector = '.header__theme-menu-button.header__theme-menu-button_type_dark';
  const hasButton = await hasElementBySelectors(page, buttonSelector);

  if (!hasButton) {
    return {
      id: 'switchButtonsChanged',
    };
  }

  await page.click(buttonSelector);
  await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => img.remove());
  });
  await page.evaluate(() => window.scrollTo(0, Number.MAX_SAFE_INTEGER));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'layout-dark.jpg', fullPage: true });
  const { colors: canonicalColors } = palette(await pixels('./layout-canonical-dark.jpg'), 4);
  const { colors: studentColors } = palette(await pixels('./layout-dark.jpg'), 4);
  const canonicalColorsSorted = sortColors(canonicalColors);
  const studentColorsSorted = sortColors(studentColors);
  const isSame = canonicalColorsSorted
    .every((color, index) => compareColors(color, studentColorsSorted[index], 20));

  await browser.close();

  if (!isSame) {
    return {
      id: 'notDarkColorScheme',
    };
  }

  return false;
};

const blockFullScreen = async (page, selector) => {
  const isFound = await hasElementBySelectors(page, selector);

  if (!isFound) {
    return false;
  }

  const diff = await page.evaluate((slctrs) => {
    const element = document.querySelector(slctrs);
    return window.innerHeight - element.clientHeight;
  }, selector);

  if (diff !== 0) {
    return {
      id: 'blockNotFullScreen',
      values: {
        name: selector,
      },
    };
  }

  return false;
};

const semanticTags = async (page, tags) => {
  const tagsAfterSearch = await Promise.all(tags.map(async (tagName) => {
    const isFound = await hasElementBySelectors(page, tagName);

    return {
      tagName,
      isMissing: !isFound,
    };
  }));
  const missingTags = tagsAfterSearch.filter(({ isMissing }) => isMissing);
  const missingTagNames = missingTags.map(({ tagName }) => tagName);

  if (missingTagNames.length) {
    return [{
      id: 'semanticTagsMissing',
      values: {
        tagNames: missingTagNames.join(', '),
      },
    }];
  }

  return [];
};

const resetMargins = async (page, tags) => {
  const properties = ['margin', 'padding'];

  const elementsProperties = await Promise.all(tags.map(async (tagName) => {
    const elementProperties = await getStyle(page, tagName, properties);

    return {
      tagName,
      isNotReset: elementProperties.some((property) => property !== '0px'),
    };
  }));

  const notResetTags = elementsProperties.filter(({ isNotReset }) => isNotReset);
  const notResetTagNames = notResetTags.map(({ tagName }) => tagName);

  if (notResetTagNames.length) {
    return [{
      id: 'notResetMargins',
      values: {
        tagNames: notResetTagNames.join(', '),
      },
    }];
  }

  return [];
};

export {
  colorScheme,
  switchScheme,
  blockFullScreen,
  semanticTags,
  resetMargins,
};
