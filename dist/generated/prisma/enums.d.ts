export declare const OrderStatus: {
    readonly PENDING: 'PENDING';
    readonly PAID: 'PAID';
    readonly FAILED: 'FAILED';
};
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
