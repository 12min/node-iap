import { mocked } from 'ts-jest/utils';
import request, { RequestPromise } from 'request-promise-native';
import IapError from '../../iap-error';
import sampleReceipt from './sample-receipt.json';
import verifyPayment from '.';

const fakeReceipt = {
  valid: sampleReceipt,
  expired: {
    ...sampleReceipt,
    status: 21006,
  },
  invalid: {
    ...sampleReceipt,
    status: 21000,
  },
};

jest.mock('request-promise-native');

function mockResponse(response: object): jest.MockInstance<RequestPromise, any[]> {
  return mocked(request.post, true)
    .mockResolvedValueOnce(response);
}

beforeAll(() => {
  mocked(request.post, true)
    .mockResolvedValue(fakeReceipt.valid);
});

it('should resolve the receipt when the status is 0', async () => {
  const payment = {
    receipt: 'lorem-ipsum',
    secret: 'pwd-anything',
  };

  await expect(verifyPayment(payment)).resolves.toBeDefined();
  expect(request.post)
    .toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      json: {
        'receipt-data': 'lorem-ipsum',
        password: 'pwd-anything',
      },
    }));
});

it('should resolve the receipt when the status is 21006', async () => {
  mockResponse(fakeReceipt.expired);
  const payment = {
    receipt: 'lorem-ipsum',
    secret: 'pwd-anything',
  };

  const receipt = await verifyPayment(payment);

  expect(receipt).toBeDefined();
  expect(request.post)
    .toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      json: {
        'receipt-data': 'lorem-ipsum',
        password: 'pwd-anything',
      },
    }));
});

it('should raise an error when status is not 0', async () => {
  mockResponse(fakeReceipt.invalid);
  const payment = {
    receipt: 'lorem-ipsum',
    secret: 'pwd-anything',
  };


  await expect(verifyPayment(payment))
    .rejects
    .toThrow(expect.objectContaining({
      type: 'APPSTORE_ERROR',
      message: 'The App Store could not read the JSON object you provided.',
      meta: { appleStatus: 21000 },
    }));
});

it('should validate receipt and secret as a string', async () => {
  mockResponse(fakeReceipt.valid);

  await expect(verifyPayment({ receipt: 0 as unknown as string, secret: 'abc123' }))
    .rejects
    .toThrow(/Receipt must be a string/);
  await expect(verifyPayment({ receipt: 'abc123', secret: 0 as unknown as string }))
    .rejects
    .toThrow(/Secret must be a string/);
});

it('should validate exclude old transactions', async () => {
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
    excludeOldTransactions: 0 as unknown as boolean,
  };

  await expect(verifyPayment(payment))
    .rejects
    .toThrow(/excludeOldTransactions must be a boolean/);
});

it('should send exclude old transactions on the request', async () => {
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
    excludeOldTransactions: true,
  };

  const receipt = await verifyPayment(payment);

  expect(receipt).toBeDefined();
  expect(request.post).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
    json: {
      'receipt-data': 'abc123',
      password: '123abc',
      'exclude-old-transactions': true,
    },
  }));
});

it('should call the sandbox api in case of the receipt is a sandbox one', async () => {
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
  };
  mockResponse({
    ...sampleReceipt,
    status: 21007,
  });

  const receipt = await verifyPayment(payment);

  expect(receipt).toBeDefined();
  expect(request.post)
    .toHaveBeenCalledWith(
      'https://sandbox.itunes.apple.com/verifyReceipt',
      expect.anything()
    );
});

it('should check the product id against the receipt', async () => {
  mockResponse({
    status: 0,
    receipt: {
      /* eslint-disable @typescript-eslint/camelcase */
      in_app: [{
        product_id: 'com.company.product_0',
      }],
      /* eslint-enable @typescript-eslint/camelcase */
    },
  });
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
    productId: 'com.company.product',
  };

  await expect(verifyPayment(payment))
    .rejects
    .toThrow(expect.objectContaining({
      type: 'INVALID_INPUT',
      message: 'Wrong product id: com.company.product, expected: com.company.product_0',
      meta: { field: 'productId' },
    }));
});

it('should check the bundle id against the receipt', async () => {
  mockResponse({
    status: 0,
    receipt: {
      ...sampleReceipt.receipt,
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      bundle_id: 'com.company.app_0',
    },
  });
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
    packageName: 'com.company.app_1',
  };

  await expect(verifyPayment(payment))
    .rejects
    .toThrow(expect.objectContaining({
      type: 'INVALID_INPUT',
      message: 'Wrong package name: com.company.app_1, expected: com.company.app_0',
      meta: { field: 'packageName' },
    }));
});

it('should parse the receipt properly', async () => {
  mockResponse(sampleReceipt);
  const payment = {
    receipt: 'abc123',
    secret: '123abc',
  };

  const receipt = await verifyPayment(payment);

  expect(receipt)
    .toMatchObject({
      productId: 'com.company.product.in_app',
      packageName: 'com.company.product',
      transactionId: '0',
      purchaseDate: new Date(1581985860000),
      expirationDate: new Date(1613608260000),
      originalReceiptObject: sampleReceipt,
    });
});
