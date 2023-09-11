#import "FFFastImagePreloaderManager.h"
#import "FFFastImageIgnoreURLParamsMapper.h"
#import "FFFastImagePreloader.h"
#import "FFFastImageSource.h"

#import <SDWebImage/SDWebImageDownloader.h>
#import <SDWebImage/SDImageCache.h>
#import <SDWebImage/SDWebImagePrefetcher.h>

@implementation FFFastImagePreloaderManager
{
    bool _hasListeners;
    NSMutableDictionary* _preloaders;
}

RCT_EXPORT_MODULE(FastImagePreloaderManager);

- (dispatch_queue_t)methodQueue
{
    return dispatch_queue_create("com.dylanvann.fastimage.FastImagePreloaderManager", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

-(instancetype) init {
    if (self = [super init]) {
        _preloaders = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[@"fffastimage-progress", @"fffastimage-complete"];
}

- (void) imagePrefetcher:(nonnull SDWebImagePrefetcher *)imagePrefetcher
 didFinishWithTotalCount:(NSUInteger)totalCount
            skippedCount:(NSUInteger)skippedCount
{
    NSNumber* id = ((FFFastImagePreloader*) imagePrefetcher).id;
    [_preloaders removeObjectForKey:id];
    [self sendEventWithName:@"fffastimage-complete"
                       body:@{ @"id": id, @"finished": [NSNumber numberWithLong:totalCount], @"skipped": [NSNumber numberWithLong:skippedCount]}
    ];
}

- (void) imagePrefetcher:(nonnull SDWebImagePrefetcher *)imagePrefetcher
          didPrefetchURL:(nullable NSURL *)imageURL
           finishedCount:(NSUInteger)finishedCount
              totalCount:(NSUInteger)totalCount
{
    NSNumber* id = ((FFFastImagePreloader*) imagePrefetcher).id;
    [self sendEventWithName:@"fffastimage-progress"
                       body:@{ @"id": id, @"finished": [NSNumber numberWithLong:finishedCount], @"total": [NSNumber numberWithLong:totalCount] }
    ];
}

RCT_EXPORT_METHOD(createPreloader:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    FFFastImagePreloader* preloader = [[FFFastImagePreloader alloc] init];
    preloader.delegate = self;
    _preloaders[preloader.id] = preloader;
    resolve(preloader.id);
}

RCT_EXPORT_METHOD(preload:(nonnull NSNumber*)preloaderId sources:(nonnull NSArray<FFFastImageSource *> *)sources) {
    // we init an empty list instead of using the sources index to exclude possible errors
    // passed in the sources (empty urls)
    NSMutableArray *urls = [[NSMutableArray alloc] init];
    
    [sources enumerateObjectsUsingBlock:^(FFFastImageSource * _Nonnull source, NSUInteger idx, BOOL * _Nonnull stop) {
        if (source.url) {
            // adds all the headers for the current source, if available
            [source.headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSString* header, BOOL *stop) {
                [[SDWebImageDownloader sharedDownloader] setValue:header forHTTPHeaderField:key];
            }];
            // once done, insert the url in the download queue
            [urls addObject: source.url];
        }
    }];
    
    FFFastImagePreloader* preloader = _preloaders[preloaderId];
    [preloader prefetchURLs:urls];
}

RCT_EXPORT_METHOD(clearMemoryCache:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    [SDImageCache.sharedImageCache clearMemory];
    resolve(NULL);
}

RCT_EXPORT_METHOD(clearDiskCache:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    [FFFastImageIgnoreURLParamsMapper.shared clear];
    [SDImageCache.sharedImageCache clearDiskOnCompletion:^(){
        resolve(NULL);
    }];
}

@end
