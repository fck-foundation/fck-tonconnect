import express from "express";
import dotenv from "dotenv";
import HttpStatus from "http-status-codes";
import axios from "axios";
import { ConvertTonProofMessage, CreateMessage, SignatureVerify, } from "./ton-connect/TonProof.js";
import bodyParser from "body-parser";
import cors from "cors";
dotenv.config();
const port = process.env.PORT;
const app = express();
const jsonParser = bodyParser.json();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));
//@todo payload generator
app.post("/proof", jsonParser, async (request, response) => {
    try {
        const walletInfo = request.body;
        const proof = walletInfo;
        console.log(walletInfo);
        if (!proof) {
            return response
                .status(HttpStatus.BAD_REQUEST)
                .send({ ok: false, message: "Invalid request1" });
        }
        if (walletInfo.network === "-3" && !process.env.TESTNET_ALLOWED) {
            return response
                .status(HttpStatus.BAD_REQUEST)
                .send({ ok: false, message: "Testnet is not allowed!" });
        }
        const { data } = await axios(`https://${walletInfo.network === "-3" ? "testnet." : ""}tonapi.io/v1/wallet/getWalletPublicKey?account=${encodeURI(walletInfo.address)}`);
        const pubkey = Buffer.from(data.publicKey, "hex");
        const parsedMessage = ConvertTonProofMessage(walletInfo, proof);
        const checkMessage = await CreateMessage(parsedMessage);
        const verifyRes = SignatureVerify(pubkey, checkMessage, parsedMessage.Signature);
        if (!verifyRes) {
            return response
                .status(HttpStatus.BAD_REQUEST)
                .send({ ok: false, message: "Signature is not verified" });
        }
        return response.send({ ok: true, message: "Ok!" });
    }
    catch (exception) {
        return response
            .status(HttpStatus.BAD_REQUEST)
            .send({ ok: false, message: JSON.stringify(exception) });
    }
});
app.listen(port, () => {
    console.log(`⚡️ [FCK-TONCONNECT]: Server is running at http://localhost:${port}`);
});
