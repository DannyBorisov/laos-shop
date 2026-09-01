type GenerateQrParams = {
    amount: number;
    description: string;
    tag1?: string;
    tag2?: string;
    tag3?: string;
};
type GenerateQrResponse = {
    message: string;
    transactionId: string;
    qrCode: string;
    link: string;
};
declare class Phajay {
    private baseUrl;
    private secretKey;
    constructor(secretKey: string, isSandbox?: boolean);
    private request;
    generateLBDQr(params: GenerateQrParams): Promise<GenerateQrResponse>;
}
declare const phajay: Phajay;
export default phajay;
