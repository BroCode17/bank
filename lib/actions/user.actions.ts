"use server";
import {
  SignUpParams,
  User,
  createBankAccountProps,
  exchangePublicTokenProps,
  getBankByAccountIdProps,
  getBankProps,
  getBanksProps,
  getUserInfoProps,
  signInProps,
} from "@/types";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { ID, Query } from "node-appwrite";
import {
  encryptId,
  extractCustomerIdFromUrl,
  log,
  parseStringify,
} from "../utils";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  ProcessorTokenCreateResponse,
  Products,
} from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { useState } from "react";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
 
  
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log("getUserInfo error: ",error)
  }
}

export const signIn = async ({ email, password }: signInProps) => {
  
  try {
    //Mutation / Database / Make fetch
    const { account } = await createAdminClient();

    //Save the session
    const session = await account.createEmailPasswordSession(email, password);
   
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    const user = await getUserInfo({userId: session.userId})

    return parseStringify(user);
  } catch (error) {
    return parseStringify({error: error})
  }
};

//Sign Up
export const signUp = async ({ password, ...userData }: SignUpParams) => {
  let newUserAccount;
  try {
    const { email, firstName, lastName } = userData;
    //Mutation / Database / Make fetch using appwrite
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );
    //This make the progamming atom
    if (!newUserAccount) throw new Error("Error creating user");

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: "personal",
    });
    if (!dwollaCustomerUrl) throw new Error("Error creating Dwolla customer");

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    );

    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUser);

    
  } catch (error) {
    return parseStringify({error: error})
    // console.log("Error-->", error);
  }
};

// ... your initilization functions

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();

    const result = await account.get();
    
    const user = await getUserInfo({ userId: result.$id });

    return parseStringify(user);
  } catch (error) {
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    cookies().delete("appwrite-session");

    await account.deleteSession("current");
  } catch (error) {
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },

      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.log("createLinkToken error: ",error);
  }
};

export const createBankAccout = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
      }
    );

    return parseStringify(bankAccount);
  } catch (error) {}
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    //Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    //Get account information from plaid using access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    //Create a processor toekn for dwolla using the access toekn and account ID
    const processorTokenResponse = await plaidClient.processorTokenCreate(
      request
    );

    const processorToken = processorTokenResponse.data.processor_token;

    //Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    //if the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and sharable ID
 
    await createBankAccout({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      sharableId: encryptId(accountData.account_id),
    });

    //Revalidate the path to reflect teh changes
    revalidatePath("/");

    return parseStringify({ publicTokenExchange: "complete" });
  } catch (error) {
    console.error("An error occurred while creating exchange token: ", error);
  }
};

//Get Banks
export const getBanks = async ({ userId }: getBanksProps) => {
  //Get the database from appwrite
  try {
    const { database } = await createAdminClient();

    //get banks
    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    return parseStringify(banks.documents);
  } catch (error) {
    log(error);
  }
};


//Get Bank
export const getBank = async ({ documentId }: getBankProps) => {
  //Get the database from appwrite
  
  try {
    const { database } = await createAdminClient();

    //get banks
    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("$id", [documentId])]
    );
    return parseStringify(bank.documents[0]);
  } catch (error) {
    log(error);
  }
};


export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  //Get the database from appwrite
  
  try {
    const { database } = await createAdminClient();

    //get banks
    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("accountId", [accountId])]
    );

    if(bank.total !== 1) return null;
    return parseStringify(bank.documents[0]);
  } catch (error) {
    log(error);
  }
};
