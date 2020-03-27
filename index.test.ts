import { mocked } from 'ts-jest/utils';
import apple from './lib/apple';
import google from './lib/google';
import amazon from './lib/amazon';
import roku from './lib/roku';
import verifyPayment from './index';

jest.mock('./lib/apple');
jest.mock('./lib/google');
jest.mock('./lib/amazon');
jest.mock('./lib/roku');

it('should call proper platform', async () => {
  const payment = {
    packageName: 'com.company.product',
    productId: 'com.compant.product.in_app',
    receipt: 'abc123',
    secret: 'abc123',
    keyFile: './service-account.json',
  };
  const appleMock = mocked(apple, true);
  appleMock.mockResolvedValueOnce({
    packageName: 'com.company.product',
    productId: 'com.compant.product.in_app',
    transactionId: 'abc123',
    purchaseDate: new Date(),
    expirationDate: new Date(),
  });
  const googleMock = mocked(google, true);
  googleMock.mockResolvedValueOnce({
    packageName: 'com.company.product',
    productId: 'com.compant.product.in_app',
    transactionId: 'abc123',
    purchaseDate: new Date(),
    expirationDate: new Date(),
  });
  const amazonMock = mocked(amazon, true);
  amazonMock.mockResolvedValueOnce({
    productId: 'amazon.product.123',
    transactionId: 'amazon.transaction.123',
    purchaseDate: new Date(),
    expirationDate: new Date(),
  });
  const rokuMock = mocked(roku, true);
  rokuMock.mockResolvedValueOnce({
    productId: 'abc123',
    transactionId: 'abc123',
    purchaseDate: new Date(),
    expirationDate: new Date()
  });

  await verifyPayment('google', payment);
  expect(googleMock).toHaveBeenCalled();

  await verifyPayment('apple', payment);
  expect(appleMock).toHaveBeenCalled();

  await verifyPayment('amazon', payment);
  expect(amazonMock).toHaveBeenCalled();

  await verifyPayment('roku', {
    devToken: 'abc123',
    receipt: '6ccb40bf-bd7a-49dc-9846-aafd01890ba5',
  });
  expect(rokuMock).toHaveBeenCalled();
});
