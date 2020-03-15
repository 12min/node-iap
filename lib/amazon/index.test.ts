import request from 'request-promise-native';
import { mocked } from 'ts-jest/utils';
import verifyPayment from '.';

jest.mock('request-promise-native');

it('should validate the payment object', async () => {
  await expect(verifyPayment({
    receipt: 0 as unknown as string,
    userId: 'abc123',
    secret: 'abc123',
  }))
    .rejects
    .toThrow(/Receipt must be a string/);

  await expect(verifyPayment({
    receipt: 'abc123',
    userId: 0 as unknown as string,
    secret: 'abc123',
  }))
    .rejects
    .toThrow(/User ID must be a string/);

  await expect(verifyPayment({
    receipt: 'abc123',
    userId: 'abc123',
    secret: 0 as unknown as string,
  }))
    .rejects
    .toThrow(/Secret must be a string/);
});

it('should call the API with the receipt, userId and secret', async () => {
  const payment = {
    receipt: 'abc123',
    userId: 'user-123',
    secret: 'sshh-123',
  };
  const requestMock = mocked(request.get, true);
  requestMock.mockResolvedValueOnce({
    statusCode: 200,
    body: {
      purchaseDate: '1584232340334',
      productId: 'lorem-ipsum-amazon',
      renewalDate: '1584235003908',
      receiptId: 'abc123',
    },
  });

  await expect(verifyPayment(payment))
    .resolves
    .toMatchObject({
      productId: 'lorem-ipsum-amazon',
      transactionId: 'abc123',
      purchaseDate: new Date(1584232340334),
      expirationDate: new Date(1584235003908),
    });

  expect(requestMock)
    .toHaveBeenCalledWith(
      'https://appstore-sdk.amazon.com/version/1.0/verifyReceiptId/developer/sshh-123/user/user-123/receiptId/abc123',
      expect.anything(),
    );

  requestMock.mockResolvedValueOnce({
    statusCode: 200,
    body: {
      purchaseDate: '1584232340334',
      productId: 'lorem-ipsum-amazon',
      cancelDate: '1584235003908',
      receiptId: 'abc123',
    },
  });
  await expect(verifyPayment(payment))
    .resolves
    .toMatchObject({
      productId: 'lorem-ipsum-amazon',
      transactionId: 'abc123',
      purchaseDate: new Date(1584232340334),
      expirationDate: new Date(1584235003908),
    });
});

it('should handle the error messages', async () => {
  const payment = {
    receipt: 'abc123',
    userId: 'user-123',
    secret: 'sshh-123',
  };
  const requestMock = mocked(request.get, true);
  const mockStatus = (status: number): typeof requestMock => requestMock.mockResolvedValueOnce({
    statusCode: status,
  });

  mockStatus(400);
  await expect(verifyPayment(payment))
    .rejects
    .toThrow(/receipt is invalid, or no transaction was found for this receipt/);

  mockStatus(496);
  await expect(verifyPayment(payment))
    .rejects
    .toThrow(/Invalid secret/);

  mockStatus(497);
  await expect(verifyPayment(payment))
    .rejects
    .toThrow(/Invalid userId/);
});
