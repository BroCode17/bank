import { Input } from "@/components/ui/input";
import React from "react";
import { FormField, FormLabel, FormControl, FormMessage } from "./ui/form";
import { customForm } from "@/types";




const CustomerInput = ({name, labelName, type, form, placehoder}: customForm) => {

 
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <div className="form-item">
          <FormLabel className="form-label">{labelName}</FormLabel>
          <div className="flex w-full flex-col">
            <FormControl>
              <Input
                placeholder= {placehoder}
                className="input-class"
                type={type}
                id={name}
                {...field}
              />
            </FormControl>
            <FormMessage className="form-message mt-2" />
          </div>
        </div>
      )}
    />
  );
};

export default CustomerInput;
