'use server'
import { SignUpParams, signInProps } from "@/types";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { ID } from "node-appwrite";
import { parseStringify } from "../utils";

export const signIn = async ({email, password} : signInProps) => {
  try {
    //Mutation / Database / Make fetch
    const { account } = await createAdminClient();
    
    const response = await account.createEmailPasswordSession(email, password)

    return parseStringify(response)
    
  } catch (error) {
    console.log("Error", error);
  }
};
export const signUp = async (userData: SignUpParams) => {
  try {
    const {email, password, firstName, lastName} = userData;      
      //Mutation / Database / Make fetch using appwrite
      const { account } = await createAdminClient();
      
      const newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);

      const session = await account.createEmailPasswordSession(email, password);
      
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify(newUserAccount)
  } catch (error) {
    console.log("Error-->", error);
  }
};

// ... your initilization functions

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const user =  await account.get();
    return parseStringify(user)
  } catch (error) {
    return null;
  }
}


export const logoutAccount = async() => {
    try {
        const {account} = await createSessionClient()
        cookies().delete('appwrite-session')

        await account.deleteSession('current')
    } catch (error) {
        return null;
    }
}