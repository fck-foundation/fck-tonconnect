/// <reference types="node" />
import { TonProofItemReplySuccess } from "@tonconnect/protocol";
interface Domain {
    LengthBytes: number;
    Value: string;
}
interface ParsedMessage {
    Workchain: number;
    Address: Buffer;
    Timstamp: number;
    Domain: Domain;
    Signature: Buffer;
    Payload: string;
    StateInit: string;
}
export declare function SignatureVerify(pubkey: Buffer, message: Buffer, signature: Buffer): boolean;
export declare function CreateMessage(message: ParsedMessage): Promise<Buffer>;
export declare function ConvertTonProofMessage(walletInfo: any, tp: TonProofItemReplySuccess): ParsedMessage;
export {};
