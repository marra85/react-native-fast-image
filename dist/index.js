import _extends from '@babel/runtime/helpers/extends';
import React, { forwardRef, memo } from 'react';
import { NativeModules, NativeEventEmitter, Platform, StyleSheet, requireNativeComponent, Image, View } from 'react-native';

const nativeManager = NativeModules.FastImagePreloaderManager;
const nativeEmitter = new NativeEventEmitter(nativeManager);
class PreloaderManager {
  constructor() {
    this._instances = new Map();
    this._subProgress = void 0;
    this._subComplete = void 0;
  }
  preload(sources, onProgress, onComplete) {
    nativeManager.createPreloader().then(id => {
      if (this._instances.size === 0) {
        this._subProgress = nativeEmitter.addListener('fffastimage-progress', this.onProgress.bind(this));
        this._subComplete = nativeEmitter.addListener('fffastimage-complete', this.onComplete.bind(this));
      }
      this._instances.set(id, {
        onProgress,
        onComplete
      });
      nativeManager.preload(id, sources);
    });
  }
  onProgress({
    id,
    finished,
    total
  }) {
    const instance = this._instances.get(id);
    if (instance && instance.onProgress) instance.onProgress(finished, total);
  }
  onComplete({
    id,
    finished,
    skipped
  }) {
    const instance = this._instances.get(id);
    if (instance && instance.onComplete) instance.onComplete(finished, skipped);
    this._instances.delete(id);
    if (this._instances.size === 0 && this._subProgress && this._subComplete) {
      this._subProgress.remove();
      this._subComplete.remove();
    }
  }
  async clearMemoryCache() {
    nativeManager.clearMemoryCache();
  }
  async clearDiskCache() {
    nativeManager.clearDiskCache();
  }
}
const preloaderManager = new PreloaderManager();

const FastImageViewNativeModule = Platform.OS === 'ios' ? preloaderManager : NativeModules.FastImageView;
const resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center'
};
const priority = {
  low: 'low',
  normal: 'normal',
  high: 'high'
};
const cacheControl = {
  // Ignore headers, use uri as cache key, fetch only if not in cache.
  immutable: 'immutable',
  // Respect http headers, no aggressive caching.
  web: 'web',
  // Only load from cache.
  cacheOnly: 'cacheOnly'
};
const resolveDefaultSource = defaultSource => {
  if (!defaultSource) {
    return null;
  }
  if (Platform.OS === 'android') {
    // Android receives a URI string, and resolves into a Drawable using RN's methods.
    const resolved = Image.resolveAssetSource(defaultSource);
    if (resolved) {
      return resolved.uri;
    }
    return null;
  }
  // iOS or other number mapped assets
  // In iOS the number is passed, and bridged automatically into a UIImage
  return defaultSource;
};
function FastImageBase({
  source,
  defaultSource,
  tintColor,
  blurRadius,
  onLoadStart,
  onProgress,
  onLoad,
  onError,
  onLoadEnd,
  style,
  fallback,
  children,
  // eslint-disable-next-line no-shadow
  resizeMode = 'cover',
  forwardedRef,
  ...props
}) {
  if (fallback) {
    const cleanedSource = {
      ...source
    };
    delete cleanedSource.cache;
    const resolvedSource = Image.resolveAssetSource(cleanedSource);
    return /*#__PURE__*/React.createElement(View, {
      style: [styles.imageContainer, style],
      ref: forwardedRef
    }, /*#__PURE__*/React.createElement(Image, _extends({}, props, {
      style: [StyleSheet.absoluteFill, {
        tintColor
      }],
      source: resolvedSource,
      defaultSource: defaultSource,
      onLoadStart: onLoadStart,
      onProgress: onProgress,
      onLoad: onLoad,
      onError: onError,
      onLoadEnd: onLoadEnd,
      resizeMode: resizeMode,
      blurRadius: blurRadius
    })), children);
  }
  const resolvedSource = Image.resolveAssetSource(source);
  const resolvedDefaultSource = resolveDefaultSource(defaultSource);
  return /*#__PURE__*/React.createElement(View, {
    style: [styles.imageContainer, style],
    ref: forwardedRef
  }, /*#__PURE__*/React.createElement(FastImageView, _extends({}, props, {
    tintColor: tintColor,
    style: StyleSheet.absoluteFill,
    source: resolvedSource,
    defaultSource: resolvedDefaultSource,
    onFastImageLoadStart: onLoadStart,
    onFastImageProgress: onProgress,
    onFastImageLoad: onLoad,
    onFastImageError: onError,
    onFastImageLoadEnd: onLoadEnd,
    resizeMode: resizeMode,
    blurRadius: blurRadius
  })), children);
}
const FastImageMemo = /*#__PURE__*/memo(FastImageBase);
const FastImageComponent = /*#__PURE__*/forwardRef((props, ref) => /*#__PURE__*/React.createElement(FastImageMemo, _extends({
  forwardedRef: ref
}, props)));
FastImageComponent.displayName = 'FastImage';
const FastImage = FastImageComponent;
FastImage.resizeMode = resizeMode;
FastImage.cacheControl = cacheControl;
FastImage.priority = priority;
FastImage.preload = (sources, onProgress, onComplete) => FastImageViewNativeModule.preload(sources, onProgress, onComplete);
FastImage.clearMemoryCache = () => FastImageViewNativeModule.clearMemoryCache();
FastImage.clearDiskCache = () => FastImageViewNativeModule.clearDiskCache();
const styles = StyleSheet.create({
  imageContainer: {
    overflow: 'hidden'
  }
});

// Types of requireNativeComponent are not correct.
const FastImageView = requireNativeComponent('FastImageView', FastImage, {
  nativeOnly: {
    onFastImageLoadStart: true,
    onFastImageProgress: true,
    onFastImageLoad: true,
    onFastImageError: true,
    onFastImageLoadEnd: true
  }
});

export { FastImage as default };
