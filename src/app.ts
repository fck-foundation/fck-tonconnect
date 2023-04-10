import express, { Express, Request, Response } from "express";
import dotenv from 'dotenv';
import { TonProofItemReplySuccess, Wallet } from "@tonconnect/sdk";
import HttpStatus from "http-status-codes";
import axios from 'axios';
import { ConvertTonProofMessage, CreateMessage, SignatureVerify } from "./ton-connect/TonProof.js";
import bodyParser from "body-parser";


dotenv.config();

const port = process.env.PORT;
const app: Express = express();

app.use(bodyParser.json());

app.post("/proof", async (request: Request, response: Response) => {
    try {
        const walletInfo = request.body;

        const proof = walletInfo as TonProofItemReplySuccess
        if (!proof) {
            return response.status(HttpStatus.BAD_REQUEST).send({ ok: false, message: "Invalid request" })
        }

        if(walletInfo.network === '-3' && !process.env.TESTNET_ALLOWED) {
            return response.status(HttpStatus.BAD_REQUEST).send({ ok: false, message: "Testnet is not allowed!" });
        }
        
        const { data } = await axios (
            `https://${
                walletInfo.network === '-3' ? 'testnet.' : ''
            }tonapi.io/v1/wallet/getWalletPublicKey?account=${encodeURI(walletInfo.address)}`
            )
        const pubkey = Buffer.from(data.publicKey, 'hex')
        
        
        const parsedMessage = ConvertTonProofMessage(walletInfo, proof)
        const checkMessage = await CreateMessage(parsedMessage)
    
        const verifyRes = SignatureVerify(pubkey, checkMessage, parsedMessage.Signature)
        if (!verifyRes) {
            return response.status(HttpStatus.BAD_REQUEST).send({ ok: false, message: "Signature is not verified" });
        }
    
        return response.send({ok: true, message: "Ok!"});
    } catch (exception) {
        return response.status(HttpStatus.BAD_REQUEST).send({ ok: false, message: "Invalid request" })
    }
});

app.listen(port, () => {
    console.log(`⚡️ [FCK-TONCONNECT]: Server is running at http://localhost:${port}`);
})