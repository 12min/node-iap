import { Payment } from '../..';
export interface GoogleKeyObject {
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
}
export declare function parseKeyFile(keyFile: string): Promise<GoogleKeyObject>;
export declare function generateJWTToken(keyObject: GoogleKeyObject): string;
export declare function requestToken(keyObject: GoogleKeyObject, token: string): Promise<string>;
export declare function generateURL(payment: Payment, token: string): string;
