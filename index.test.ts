import { mocked } from 'ts-jest/utils';
import apple from './lib/apple';
import google from './lib/google';
import verifyPayment from '.';

jest.mock('./lib/apple');
jest.mock('./lib/google');

it('should call proper platform', async () => {
  const payment = {
    packageName: 'com.company.product',
    productId: 'com.compant.product.in_app',
    receipt: 'abc123',
    secret: 'abc123',
    keyFile: '',
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

  await verifyPayment('google', payment);
  expect(googleMock).toHaveBeenCalled();

  await verifyPayment('apple', payment);
  expect(appleMock).toHaveBeenCalled();
});
