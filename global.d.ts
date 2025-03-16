/* eslint-disable no-var */
declare global {
  // Add types for global.fetch mock
  var fetch: jest.Mock;
  
  // Add types for STRIPE_PRICE_IDS
  var STRIPE_PRICE_IDS: {
    monthly: string;
    yearly: string;
  };
  
  // Add a minimal Request interface for tests
  interface Request {
    url: string;
    method: string;
    headers: Headers;
    body: any;
    json(): Promise<any>;
  }
  
  // Add a minimal Response interface for tests
  interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers;
    json(): Promise<any>;
    text(): Promise<string>;
  }
}

export {}; 