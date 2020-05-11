/* eslint-disable @typescript-eslint/camelcase */

import { mocked } from 'ts-jest/utils';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import request, { Options, FullResponse } from 'request-promise-native';
import { StatusCodeError } from 'request-promise-native/errors';

import verifyPayment from '.';
import {
  parseKeyFile,
  generateJWTToken,
  requestToken,
  GoogleKeyObject,
} from './credentials';

jest.mock('request-promise-native');

const keyFilePath = path.join(__dirname, 'tests', 'keyfile.json');
const pubKeyFile = path.join(__dirname, 'tests', 'key.pub');

const payment = {
  packageName: 'com.company.product',
  productId: 'com.company.product.in_app',
  receipt: 'abc123',
  keyFile: keyFilePath,
};

const receipt = {
  kind: 'androidpublisher#subscriptionPurchase',
  startTimeMillis: '1560175955894',
  expiryTimeMillis: '1591798294146',
  autoRenewing: true,
  priceCurrencyCode: 'BRL',
  priceAmountMicros: '199990000',
  countryCode: 'BR',
  developerPayload: '',
  paymentState: 1,
  orderId: 'GAA.1234-5678-9012-34567',
  purchaseType: 0,
  acknowledgementState: 1,
};

const mockResponse = {
  post(response: object) {
    mocked(request.post, true)
      .mockResolvedValueOnce(response);

    return this;
  },
  get(response: object) {
    mocked(request.get, true)
      .mockResolvedValueOnce(response);

    return this;
  },
};

describe('diferent invalid input types should throw an exception', () => {
  it('should validate package name', async () => {
    await expect(verifyPayment({
      ...payment,
      packageName: 0 as unknown as string,
    }))
      .rejects
      .toThrow(/Package name must be a string/);
  });

  it('should validate product id', async () => {
    await expect(verifyPayment({
      ...payment,
      productId: 0 as unknown as string,
    }))
      .rejects
      .toThrow(/Product ID must be a string/);
  });

  it('should validate receipt', async () => {
    await expect(verifyPayment({
      ...payment,
      receipt: 0 as unknown as string,
    }))
      .rejects
      .toThrow(/Receipt must be a string/);
  });

  it('should validate key file', async () => {
    await expect(verifyPayment({
      ...payment,
      keyFile: null as unknown as string,
    }))
      .rejects
      .toThrow(/Key file must be present/);
  });
});

describe('test authentication token retrieval', () => {
  let keyObject: GoogleKeyObject;

  beforeAll(async () => {
    keyObject = await parseKeyFile(keyFilePath);
  });

  it('should generate a valid JWT token', async () => {
    const pub = fs.readFileSync(pubKeyFile);

    const token = generateJWTToken(keyObject);

    expect(typeof token).toBe('string');
    expect(jwt.verify(token, pub))
      .toMatchObject({
        scope: 'https://www.googleapis.com/auth/androidpublisher',
        iss: keyObject.client_email,
      });
  });

  it('should request token', async () => {
    mockResponse.post({ access_token: 'abc123' });

    const token = await requestToken(keyObject, 'abc123-jwt');

    expect(token).toBe('abc123');
    expect(request.post)
      .toHaveBeenCalledWith(keyObject.token_uri, {
        json: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: 'abc123-jwt',
        },
      });
  });
});

describe('test google api response handling', () => {
  it('shoud parse the receipt properly', async () => {
    mockResponse
      .post({ access_token: 'abc.123' })
      .get(receipt);

    const verification = await verifyPayment(payment);

    expect(verification)
      .toMatchObject({
        packageName: 'com.company.product',
        productId: 'com.company.product.in_app',
        transactionId: 'GAA.1234-5678-9012-34567',
        purchaseDate: new Date(1560175955894),
        expirationDate: new Date(1591798294146),
        originalReceiptObject: receipt,
      });
  });

  it('should throw 4** errors with IapError', async () => {
    const error = new StatusCodeError(
      400,
      'Bad Request',
      {} as unknown as Options,
      {} as unknown as FullResponse,
    );
    mockResponse.post({ access_token: 'abc.123' });
    mocked(request.get, true)
      .mockRejectedValueOnce(error);

    await expect(verifyPayment({
      ...payment,
      subscription: true,
    }))
      .rejects
      .toThrow(expect.objectContaining({
        type: 'GOOGLEPLAY_ERROR',
        message: error.message,
        meta: { error },
      }));
  });
});
