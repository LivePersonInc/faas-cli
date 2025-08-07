export enum SDETypes {
    CART = 'cart',
    TRANSACTION = 'purchase',
    VIEWED_PRODUCT = 'prodView',
    CUSTOMER_INFO = 'ctmrinfo',
    MARKETING_SOURCE = 'mrktInfo',
    PERSONAL_INFO = 'personal',
    LEAD = 'lead',
    SERVICE_ACTIVITY = 'service',
    VISITOR_ERROR = 'error',
    SEARCHED_CONTENT = 'searchInfo',
    ORDER_ID = 'orderId',
}

type BaseSDE = {
    type: SDETypes | string;
};

export type SDE = BaseSDE & Record<string, unknown>;

export type SDEevent = { serverTimeStamp: string } & Record<string, unknown>;

export type SDEsResponse = {
    events: SDEevent[];
};

export type ConversationSDEs = { sdes?: SDEsResponse; unAuthSdes?: SDEsResponse };
