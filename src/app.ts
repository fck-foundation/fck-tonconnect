import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { TonProofItemReplySuccess, Wallet } from "@tonconnect/sdk";
import HttpStatus from "http-status-codes";
import axios from "axios";
import {
  ConvertTonProofMessage,
  CreateMessage,
  SignatureVerify,
} from "./ton-connect/TonProof.js";
import bodyParser from "body-parser";
import cors from "cors";
import { Address } from "ton-core";
import {TonClient, WalletContractV3R2, WalletContractV4} from "ton";

dotenv.config();

const port = process.env.PORT;
const app = express();
const jsonParser = bodyParser.json();

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

//@todo payload generator

app.post("/proof", jsonParser, async (request: Request, response: Response) => {
  try {
    const walletInfo = request.body;

    const proof = walletInfo as TonProofItemReplySuccess;
    console.log(walletInfo);
    if (!proof) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send({ ok: false, message: "Invalid request" });
    }

    if (walletInfo.network === "-3" && !process.env.TESTNET_ALLOWED) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send({ ok: false, message: "Testnet is not allowed!" });
    }

    const client = new TonClient({
      endpoint: "http://ton.fck.foundation/jsonRPC"
    })
    const address = Address.parse(walletInfo.address);
    const publicKeyResult = await client.runMethod(address, "get_public_key");
    const pubkey = Buffer.from(publicKeyResult.stack.readBigNumber().toString(16), "hex");

    const parsedMessage = ConvertTonProofMessage(walletInfo, proof);
    const checkMessage = await CreateMessage(parsedMessage);

    const verifyRes = SignatureVerify(
      pubkey,
      checkMessage,
      parsedMessage.Signature
    );
    if (!verifyRes) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send({ ok: false, message: "Signature is not verified" });
    }

    return response.send({ ok: true, message: "Ok!", data: { address: Address.parse(walletInfo.address).toString() } });
  } catch (exception) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send({ ok: false, message: JSON.stringify(exception) });
  }
});

app.listen(port, () => {
  console.log(
    `⚡️ [FCK-TONCONNECT]: Server is running at http://localhost:${port}`
  );
});
