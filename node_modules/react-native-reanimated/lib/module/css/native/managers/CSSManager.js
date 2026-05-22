'use strict';

import { getCompoundComponentName, getPropsBuilder, IS_ANDROID } from '../../../common';
import { filterCSSAndStyleProperties } from '../../utils';
import { setViewStyle } from '../proxy';
import CSSAnimationsManager from './CSSAnimationsManager';
import CSSTransitionsManager from './CSSTransitionsManager';
export default class CSSManager {
  /**
   * True if the previous update had CSS transition props attached. On the next
   * update we still need to build `normalizedStyle` only on Android to revert
   * props applied during the transition to correct current values. (fixes
   * https://github.com/software-mansion/react-native-reanimated/issues/9218).
   */
  hadTransitionLastUpdate = false;
  constructor({
    shadowNodeWrapper,
    viewTag,
    reactViewName = 'RCTView'
  }, componentDisplayName = '') {
    const tag = this.viewTag = viewTag;
    const wrapper = shadowNodeWrapper;
    const compoundComponentName = getCompoundComponentName(reactViewName, componentDisplayName);
    this.propsBuilder = getPropsBuilder(compoundComponentName);
    this.cssAnimationsManager = new CSSAnimationsManager(wrapper, tag, compoundComponentName);
    this.cssTransitionsManager = new CSSTransitionsManager(wrapper, tag);
  }
  update(style) {
    const [animationProperties, transitionProperties, filteredStyle] = filterCSSAndStyleProperties(style);
    const hasAnimation = animationProperties !== null;
    const hasTransition = transitionProperties !== null;
    const normalizedStyle = hasAnimation || hasTransition || IS_ANDROID && this.hadTransitionLastUpdate ? this.propsBuilder.build(filteredStyle) : undefined;
    if (normalizedStyle && (hasAnimation ||
    // We also need to update the current style on Android when the
    // transition is detached.
    IS_ANDROID && !hasTransition && this.hadTransitionLastUpdate)) {
      setViewStyle(this.viewTag, normalizedStyle);
    }
    this.cssTransitionsManager.update(transitionProperties, normalizedStyle ?? {});
    this.cssAnimationsManager.update(animationProperties);
    this.hadTransitionLastUpdate = hasTransition;
  }
  unmountCleanup() {
    this.cssAnimationsManager.unmountCleanup();
    this.cssTransitionsManager.unmountCleanup();
  }
}
//# sourceMappingURL=CSSManager.js.map