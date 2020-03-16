import request from 'request-promise-native';
import { mocked } from 'ts-jest/utils';
import verifyPayment from '.';

jest.mock('request-promise-native');

const validAPIResponse = {
  errorCode: null,
  errorDetails: null,
  errorMessage: '',
  status: 0,
  OriginalTransactionId: '6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
  amount: 1.99,
  cancelled: false,
  channelId: 251682,
  channelName: 'Pizzazzy Channel',
  couponCode: null,
  creditsApplied: null,
  currency: 'usd',
  expirationDate: '/Date(1581033062000+0000)/',
  isEntitled: true,
  originalPurchaseDate: '/Date(1573084262000+0000)/',
  partnerReferenceId: null,
  productId: 'CAkJPWMldSfISZbs2sE3_MonthlySub',
  productName: 'Pizzazzy',
  purchaseDate: '/Date(1573084394000+0000)/',
  quantity: 1,
  rokuCustomerId: '1f529e15cb15426be4ddb23a4933be2d',
  tax: 0,
  total: 0.13,
  transactionId: '09898ffd-7d2a-49bc-94b1-aafd0189a6fa',
};

it('should validate payment object', async () => {
  await expect(verifyPayment({
    devToken: 0 as unknown as string,
    receipt: '6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
  }))
    .rejects
    .toThrow(/devToken must be a string/);

  await expect(verifyPayment({
    devToken: 'abc123',
    receipt: 0 as unknown as string,
  }))
    .rejects
    .toThrow(/receipt must be a string/);

  await expect(verifyPayment({
    devToken: 'abc123',
    receipt: 'abc123',
  }))
    .rejects
    .toThrow(/receipt does not follow the expected format, eg \(6ccb40bf-bd7a-49dc-9846-aafd01890ba5\)/);
});

it('should call the API with the right URL', async () => {
  const requestMock = mocked(request.get, true);
  requestMock.mockResolvedValueOnce(validAPIResponse);

  await expect(verifyPayment({
    devToken: 'abc123',
    receipt: '6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
  }))
    .resolves
    .toMatchObject({
      transactionId: '09898ffd-7d2a-49bc-94b1-aafd0189a6fa',
      productId: 'CAkJPWMldSfISZbs2sE3_MonthlySub',
      purchaseDate: new Date(1573084394000),
      expirationDate: new Date(1581033062000),
      originalReceiptObject: validAPIResponse,
    });
  expect(requestMock).toHaveBeenCalledWith(
    'https://apipub.roku.com/listen/transaction-service.svc/validate-transaction/abc123/6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
    { json: true },
  );
});

it('should raise an error message if present', async () => {
  const requestMock = mocked(request.get, true);
  requestMock.mockResolvedValueOnce({
    ...validAPIResponse,
    errorMessage: 'Lorem Ipsum Dolor Sit Amet',
  });

  await expect(verifyPayment({
    devToken: 'abc123',
    receipt: '6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
  }))
    .rejects
    .toThrow(/Lorem Ipsum Dolor Sit Amet/);
});
