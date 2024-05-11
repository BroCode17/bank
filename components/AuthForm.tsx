"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";

import { boolean, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import CustomerInput from "./CustomerInput";
import { authFormSchema } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/user.actions";
import PlaidLink from "./PlaidLink";
import Error from "next/error";
import { error } from "console";

const AuthForm = ({ signType }: { signType: string }) => {
  const [user, setUser] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState();
  const [message, setMessage] = useState();

  const router = useRouter();
 
  // 1. Define your form.

  const formSchema = authFormSchema(signType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsLoading(true);
    try {
      const userData = {
        firstName: data.firstName!,
        lastName: data.lastName!,
        address1: data.address1!,
        city: data.city!,
        state: data.state!,
        postalCode: data.postalCode!,
        dateOfBirth: data.dateOfBirth!,
        ssn: data.ssn!,
        email: data.email,
        password: data.password,
      }
      
      //sign up with app write & create plaid link token


      if (signType === "sign-up") {
        const newUser = await signUp(userData);

        setUser(newUser);
      }

      if (signType == "sign-in") {
          const response = await signIn({
          email: data.email,
          password: data.password,
        });
        //console.log("response: ---- ",response)
        if(response?.error){
         setIsError(response?.error)
          //console.log(isError)
        }
        if (response) {
          router.push("/");
        }
      }
    } catch (error) {
      //console.log("Error ----->: ", error)
    } finally {
      setIsLoading(false);
    }
    //console.log(isError)
  };
  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href={"/"} className=" flex cursor-pointer items-center gap-1">
          {/* Logo */}
          <Image
            src={"/icons/logo.svg"}
            height={34}
            width={34}
            alt="Fast Login"
            className="size-[24px] max-lg:size-14"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
            Fast
          </h1>
        </Link>
        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 text-gray-900 font-semibold">
            {user
              ? "Link Account"
              : signType === "sign-in"
              ? "Sign In"
              : "Sign Up"}
            <p className="text-16 font-normal text-gray-600">
              {user
                ? "Link your account to get started"
                : "Please enter your details"}
            </p>
          </h1>
        </div>
      </header>
      {user ? (
        <div className="flex flex-col gap-4">
          <PlaidLink user={user} variant="primary" />
        </div>
       ) : ( 
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {signType === "sign-up" && (
                <>
                  <div className="flex gap-4">
                    <CustomerInput
                      name="firstName"
                      labelName="First Name"
                      form={form}
                      placehoder={"Enter your first name"}
                    />
                    <CustomerInput
                      name="lastName"
                      labelName="Last Name"
                      form={form}
                      placehoder={"Enter your last name"}
                    />
                  </div>
                  <CustomerInput
                    name="address1"
                    labelName="Address"
                    form={form}
                    placehoder={"Enter your specific address"}
                  />
                  <CustomerInput
                    name="city"
                    labelName="City"
                    form={form}
                    placehoder={"Enter your city"}
                  />
                  <div className="flex gap-4">
                    <CustomerInput
                      name="state"
                      labelName="State"
                      form={form}
                      placehoder={"Example: NY"}
                    />
                    <CustomerInput
                      name="postalCode"
                      labelName="Postal Code"
                      form={form}
                      placehoder={"Example: 11111"}
                    />
                  </div>
                  <div className="flex gap-4">
                    <CustomerInput
                      name="dateOfBirth"
                      labelName="Date of Birth"
                      form={form}
                      placehoder={"YYYY-MM-DD"}
                    />
                    <CustomerInput
                      name="ssn"
                      labelName="SSN"
                      form={form}
                      placehoder={"Example: 1234"}
                    />
                  </div>
                </>
              )}

              <CustomerInput
                name="email"
                labelName="Email"
                form={form}
                placehoder={"Enter your email"}
              />
              <CustomerInput
                name="password"
                type="password"
                labelName="Password"
                form={form}
                placehoder={"Enter you password"}
              />
              <div className="flex flex-col gap-4">
                <Button type="submit" className="form-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> &nbsp;
                      Loading...
                    </>
                  ) : signType === "sign-in" ? (
                    "Sign In"
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <footer className="flex justify-center gap-1">
            <p className="text-14 font-normal text-gray-600">
              {signType === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={signType === "sign-in" ? "/sign-up" : "/sign-in"}
              className="form-link"
            >
              {signType === "sign-in" ? "Sign up" : "Sign in"}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
