export declare enum NodeEnv {
    Development = "development",
    Production = "production"
}
declare const _default: {
    env: {
        NODE_ENV: NodeEnv;
        PORT: number;
        DATABASE_URL: string;
        PHAJAY_SECRET: string;
    };
};
export default _default;
