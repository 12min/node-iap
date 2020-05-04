import { mocked } from 'ts-jest/utils';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import request, { Options, FullResponse } from 'request-promise-native';
import { StatusCodeError } from 'request-promise-native/errors';
import verifyPayment from '.';
import {
  parseKeyFile, generateJWTToken, requestToken, generateURL,
} from './credentials';

jest.mock('fs');
jest.mock('request-promise-native');

const keyObject = {
  /* eslint-disable @typescript-eslint/camelcase */
  type: 'service_account',
  project_id: 'project-123',
  private_key_id: 'dbdf55fafd34331bf67133b68393b3641aa8450d',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKsTVVX6kzXfaJARo2ZDSzPA/R1mIhGeGbSjRMpf1YJRQEvqT+zU\nufGIen1ywN3u15ZXM/o9QtyALWM6GqYqNVkCAwEAAQJAbNwtljuQB1z1ZY/DwWQa\n64Dn0BhYn4tSYi7urDSVYYmV9Kx4JXJRNzb9MpqXA/D7OzYJp93eILMZ7ln2E/kx\ncQIhANj6OdfsZtf18vSTGJDkEVywKpz/w5qv1GfcwOiel9mlAiEAydfBOOQI/wPp\nt9/OsfPWR0QJ4GQePX/vJtHvvHf/1qUCICA2tlPKc1Jo35NUK3eHhNRgC1OX3XCf\n3kc1TSa8NQtJAiEAxueWIwEdGGl7vVaRMu4uoGYdMYKYBlT3kJLbpCfA930CIFCB\nMhGlC7E6N3lz/gqi+UCxi6ZY4zEiJuzIQsZrh+MH\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'test@project-123.iam.gserviceaccount.com',
  client_id: '12345678890',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test-s%40project-123.iam.gserviceaccount.com',
  /* eslint-enable @typescript-eslint/camelcase */
};
const pub = '-----BEGIN PUBLIC KEY-----\nMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKsTVVX6kzXfaJARo2ZDSzPA/R1mIhGe\nGbSjRMpf1YJRQEvqT+zUufGIen1ywN3u15ZXM/o9QtyALWM6GqYqNVkCAwEAAQ==\n-----END PUBLIC KEY-----\n';

it('should validate payment object', async () => {
  await expect(verifyPayment({
    packageName: 0 as unknown as string,
    productId: 'com.company.product.in_app',
    receipt: 'abc123',
    keyFile: '',
  }))
    .rejects
    .toThrow(/Package name must be a string/);

  await expect(verifyPayment({
    packageName: 'com.company.product',
    productId: 0 as unknown as string,
    receipt: 'abc123',
    keyFile: '',
  }))
    .rejects
    .toThrow(/Product ID must be a string/);

  await expect(verifyPayment({
    packageName: 'com.company.product',
    productId: 'com.company.product.in_app',
    receipt: 0 as unknown as string,
    keyFile: '',
  }))
    .rejects
    .toThrow(/Receipt must be a string/);

  await expect(verifyPayment({
    packageName: 'com.company.product',
    productId: 'com.company.product.in_app',
    receipt: 'abc123',
    keyFile: null as unknown as string,
  }))
    .rejects
    .toThrow(/Key file must be present/);
});

it('should parse key file properly', async () => {
  const readFile = mocked(fs.readFile, true);
  readFile.mockImplementationOnce((path, cb) => {
    cb(null, Buffer.from('{"type": "service_account","project_id": "abc123","private_key_id": "abc123","private_key": "-----BEGIN PRIVATE KEY-----\\nLOreMIPsUM\\n-----END PRIVATE KEY-----\\n","client_email": "123@abc.com","client_id": "123456","auth_uri": "https://accounts.google.com/o/oauth2/auth","token_uri": "https://oauth2.googleapis.com/token","auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/---"}'));
  });

  await expect(parseKeyFile('./service-account.json'))
    .resolves
    .toMatchObject({
      /* eslint-disable @typescript-eslint/camelcase */
      type: 'service_account',
      project_id: 'abc123',
      private_key_id: 'abc123',
      private_key: '-----BEGIN PRIVATE KEY-----\nLOreMIPsUM\n-----END PRIVATE KEY-----\n',
      client_email: '123@abc.com',
      client_id: '123456',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/---',
      /* eslint-enable @typescript-eslint/camelcase */
    });
});

it('should generate a valid JWT token', () => {
  const token = generateJWTToken(keyObject);

  expect(typeof token).toBe('string');
  expect(jwt.verify(token, pub)).toMatchObject({
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    iss: keyObject.client_email,
  });
});

it('should request token', async () => {
  const requestMock = mocked(request.post, true);
  requestMock.mockResolvedValue({
    /* eslint-disable-next-line @typescript-eslint/camelcase */
    access_token: 'abc123',
  });

  const token = await requestToken(keyObject, 'abc123-jwt');
  expect(token).toBe('abc123');
  expect(requestMock).toHaveBeenCalledWith(keyObject.token_uri, {
    json: {
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'abc123-jwt',
    },
  });
});

it('should generate proper URL', () => {
  const paymentProduct = {
    packageName: 'com.company.product',
    productId: 'com.company.product.in_app',
    receipt: 'abc123',
    keyFile: '',
  };
  const paymentSubscription = {
    ...paymentProduct,
    subscription: true,
  };
  const token = 'abc.123';

  expect(generateURL(paymentProduct, token))
    .toBe('https://www.googleapis.com/androidpublisher/v3/applications/com.company.product/purchases/product/com.company.product.in_app/tokens/abc123?access_token=abc.123');
  expect(generateURL(paymentSubscription, token))
    .toBe('https://www.googleapis.com/androidpublisher/v3/applications/com.company.product/purchases/subscriptions/com.company.product.in_app/tokens/abc123?access_token=abc.123');
});

it('shoud parse the receipt properly', async () => {
  const payment = {
    packageName: 'com.company.product',
    productId: 'com.company.product.in_app',
    receipt: 'abc123',
    subscription: true,
    keyFile: '',
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
  mocked(fs.readFile, true)
    .mockImplementationOnce((path, cb) => cb(null, Buffer.from(JSON.stringify(keyObject))));
  mocked(request.post, true)
    .mockResolvedValueOnce({
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      access_token: 'abc.123',
    });
  mocked(request.get, true)
    .mockResolvedValueOnce(receipt);

  await expect(verifyPayment(payment))
    .resolves
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
  mocked(fs.readFile, true)
    .mockImplementationOnce((path, cb) => cb(null, Buffer.from(JSON.stringify(keyObject))));
  mocked(request.post, true)
    .mockResolvedValueOnce({
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      access_token: 'abc.123',
    });
  mocked(request.get, true).mockRejectedValueOnce(error);
  const payment = {
    packageName: 'com.company.product',
    productId: 'com.company.product.in_app',
    receipt: 'abc123',
    subscription: true,
    keyFile: '',
  };

  await expect(verifyPayment(payment))
    .rejects
    .toThrow(expect.objectContaining({
      type: 'GOOGLEPLAY_ERROR',
      message: error.message,
      meta: { error },
    }));
});
