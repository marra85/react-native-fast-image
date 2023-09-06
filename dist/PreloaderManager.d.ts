import type { EmitterSubscription } from 'react-native';
import type { Source, PreloadProgressHandler, PreloadCompletionHandler } from './index';
type PreloadCallbacks = {
    onProgress?: PreloadProgressHandler;
    onComplete?: PreloadCompletionHandler;
};
type OnProgressParams = {
    id: number;
    finished: number;
    total: number;
};
type OnCompleteParams = {
    id: number;
    finished: number;
    skipped: number;
};
declare class PreloaderManager {
    _instances: Map<number, PreloadCallbacks>;
    _subProgress: EmitterSubscription;
    _subComplete: EmitterSubscription;
    preload(sources: Source[], onProgress?: PreloadProgressHandler, onComplete?: PreloadCompletionHandler): void;
    onProgress({ id, finished, total }: OnProgressParams): void;
    onComplete({ id, finished, skipped }: OnCompleteParams): void;
}
declare const preloaderManager: PreloaderManager;
export default preloaderManager;
//# sourceMappingURL=PreloaderManager.d.ts.map