"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

const fetcher = async <T,>(url: string): Promise<ApiResponse<T>> => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Failed to fetch" }));
    throw new Error(error.message || `HTTP Error ${res.status}`);
  }

  const data: ApiResponse<T> = await res.json();
  return data;
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: false,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        shouldRetryOnError: true,
        keepPreviousData: true,
        focusThrottleInterval: 5000,
        onError: (error) => {
          console.error("SWR Error:", error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
