import { mocked } from 'ts-jest/utils';
import apple from './lib/apple';
import google from './lib/google';
import verifyPayment from './index';

jest.mock('./lib/apple');
jest.mock('./lib/google');

const payment = {
  packageName: 'com.company.product',
  productId: 'com.compant.product.in_app',
  receipt: 'abc123',
  secret: 'abc123',
  keyFile: './service-account.json',
};

const receipt = {
  packageName: 'com.company.product',
  productId: 'com.compant.product.in_app',
  transactionId: 'abc123',
  purchaseDate: new Date(),
  expirationDate: new Date(),
};

it('should call proper platform', async () => {
  const appleMock = mocked(apple, true)
    .mockResolvedValueOnce(receipt);
  const googleMock = mocked(google, true)
    .mockResolvedValueOnce(receipt);

  await verifyPayment('google', payment);
  await verifyPayment('apple', payment);

  expect(googleMock).toHaveBeenCalled();
  expect(appleMock).toHaveBeenCalled();
});
