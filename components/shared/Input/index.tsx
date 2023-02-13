import React from "react";

interface InputProps {
  placeholder: string;
  textarea?: boolean;
  className?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  disabled?: boolean;
  value?: string;
}

export default function Input({
  placeholder,
  textarea,
  onChange,
  className,
  disabled,
  value,
}: InputProps) {
  return (
    <div>
      {textarea ? (
        <textarea
          className={
            "bg-[#171717] rounded-xl text-gray-500 text-sm font-light p-4 w-full h-32 placeholder:text-gray-600 focus:outline-none "
          }
          placeholder={placeholder}
          disabled
          onChange={onChange}
          value={value}
        />
      ) : (
        <input
          className={
            className +
            " bg-[#171717] rounded-xl text-gray-500 text-sm font-light p-4 w-full  placeholder:text-gray-600 focus:outline-none"
          }
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
    </div>
  );
}
