import fs from 'fs';
import jwt from 'jsonwebtoken';
import request from 'request-promise-native';
import { Payment } from '../..';

export interface GoogleKeyObject {
  /* eslint-disable camelcase */
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  /* eslint-enable camelcase */
}

export function parseKeyFile(keyFile: string): Promise<GoogleKeyObject> {
  return new Promise((resolve, reject) => {
    fs.readFile(keyFile, (err, data) => {
      if (err !== null) {
        return reject(err);
      }

      try {
        const keyObject = JSON.parse(data.toString());
        return resolve(keyObject);
      } catch (e) {
        return reject(e);
      }
    });
  });
}

export function generateJWTToken(keyObject: GoogleKeyObject): string {
  const iss = keyObject.client_email;
  const key = keyObject.private_key;
  const aud = keyObject.token_uri;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60;
  const scope = 'https://www.googleapis.com/auth/androidpublisher';

  return jwt.sign({
    iss, scope, aud, exp, iat,
  }, key, { algorithm: 'RS256' });
}

export async function requestToken(keyObject: GoogleKeyObject, token: string): Promise<string> {
  const response = await request.post(keyObject.token_uri, {
    json: {
      /* eslint-disable-next-line @typescript-eslint/camelcase */
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    },
  });

  return response.access_token;
}

export function generateURL(payment: Payment, token: string): string {
  const packageName = encodeURIComponent(payment.packageName!);
  const productId = encodeURIComponent(payment.productId!);
  const receipt = encodeURIComponent(payment.receipt);
  const purchaseType = payment.subscription ? 'subscriptions' : 'product';
  const accessToken = encodeURIComponent(token);

  return `https://www.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/${purchaseType}/${productId}/tokens/${receipt}?access_token=${accessToken}`;
}
