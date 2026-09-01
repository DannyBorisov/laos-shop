export declare const uploadVideo: (buffer: Buffer, filename: string, contentType: string) => Promise<string>;
export declare const getSignedUrl: (filename: string) => Promise<string>;
export declare const deleteVideo: (filename: string) => Promise<void>;
